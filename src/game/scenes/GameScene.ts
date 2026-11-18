import { BlendModes, Input, Scene, type GameObjects } from "phaser";
import { createProceduralTextures, preloadArt } from "../art/textures";
import { audio, type Sfx } from "../audio";
import {
  ARENA_H,
  ARENA_W,
  CHEST_KILL_STEP,
  COLORS,
  DASH,
  DEPTH,
  DIFFICULTIES,
  LIMITS,
  PLAYER_HIT_IFRAMES,
  PLAYER_RADIUS,
  type DifficultyId,
} from "../config";
import { AFFIXES } from "../data/enemies";
import { RARITIES, computeStats, isEvolved, rollItem, rollTomeOffers, tomeById, tomeLevel } from "../data/upgrades";
import { buyUnlock, loadMeta, runCredits, saveMeta, unlockedItems, unlockedTomes, type Meta } from "../meta";
import { Starfield, arenaCenter, clampToArena, drawArena, generateArena, inNebula, pushOutOfAsteroids } from "../systems/arena";
import { Deployables } from "../systems/deployables";
import { Director } from "../systems/director";
import { destroyEnemy, spawnEnemy, updateEnemies } from "../systems/enemies";
import { Fx } from "../systems/fx";
import { activeChests, dropChestNearby, dropPickup, updatePickups } from "../systems/pickups";
import { Arsenal, clearEnemyBullets, fireEnemyBullet, updateBullets, updateEnemyBullets } from "../systems/weapons";
import type { Arena, Bullet, DamageSource, Enemy, EnemyBullet, EnemyId, ItemId, Pickup, ProjectileDef, Run, TomeOffer } from "../types";
import { Hints } from "../ui/hints";
import { Hud, banner, toast, type ToastTone } from "../ui/hud";
import { mountDevPanel } from "../ui/devPanel";
import { closeScreen, showGameOver, showLevelUp, showMenu, showPause, showShop } from "../ui/screens";
import type { IconId } from "../art/svg";
import { SpatialHash, dist2, pick } from "../utils";

type Mode = "menu" | "playing" | "levelup" | "paused" | "over";

const SOURCE_COLORS: Partial<Record<DamageSource, number>> = {
  drone: 0xc4b5fd,
  blade: 0x7dd3fc,
  arc: 0xddd6fe,
  turret: 0x67e8f9,
  mine: 0xfdba74,
  trail: 0x86efac,
  emp: 0xc4b5fd,
};

export class GameScene extends Scene {
  // Stato condiviso letto dai sistemi.
  run!: Run;
  meta!: Meta;
  arena!: Arena;
  now = 0;
  player!: GameObjects.Image;
  playerScale = 1;
  enemies: Enemy[] = [];
  enemyHash = new SpatialHash<Enemy>(96);
  bullets: Bullet[] = [];
  enemyBullets: EnemyBullet[] = [];
  pickups: Pickup[] = [];
  fx!: Fx;
  telegraph!: GameObjects.Graphics;
  deployables!: Deployables;
  hints!: Hints;

  private mode: Mode = "menu";
  private hud!: Hud;
  private starfield!: Starfield;
  private arsenal: Arsenal | null = null;
  private director: Director | null = null;
  private arenaObjects: GameObjects.GameObject[] = [];
  private engine!: GameObjects.Image;
  private keys!: Record<string, Input.Keyboard.Key>;
  private menuDrift = 0;
  private pendingLevels = 0;
  private offers: TomeOffer[] = [];
  private god = false;

  constructor() {
    super("Game");
  }

  preload() {
    preloadArt(this);
  }

  create() {
    createProceduralTextures(this);
    this.cameras.main.setBackgroundColor("#050816");
    this.starfield = new Starfield(this);
    this.fx = new Fx(this);
    this.telegraph = this.add.graphics().setDepth(DEPTH.telegraph);
    this.meta = loadMeta();
    this.hints = new Hints(this.meta);
    audio.setMuted(this.meta.muted);

    const kb = this.input.keyboard!;
    const K = Input.Keyboard.KeyCodes;
    this.keys = kb.addKeys({
      w: K.W, a: K.A, s: K.S, d: K.D,
      up: K.UP, left: K.LEFT, down: K.DOWN, right: K.RIGHT,
      dash: K.SPACE, shift: K.SHIFT, turret: K.Q, mine: K.E, pause: K.P, esc: K.ESC, mute: K.M,
    }) as Record<string, Input.Keyboard.Key>;

    const unlock = () => audio.unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);

    this.hud = new Hud({ pause: () => this.togglePause(), toggleSound: () => this.toggleSound() });
    this.hud.setMuted(this.meta.muted);
    this.deployables = new Deployables(this);
    this.mountDev();
    this.showMenu();

    this.game.events.on("blur", () => this.mode === "playing" && this.pause());
  }

  // ---------- Loop ----------

  update(_time: number, rawDelta: number) {
    if (Input.Keyboard.JustDown(this.keys.mute)) this.toggleSound();

    if (this.mode === "menu") {
      this.menuDrift += rawDelta * 0.04;
      this.starfield.update(this.menuDrift);
      return;
    }

    if (Input.Keyboard.JustDown(this.keys.pause) || Input.Keyboard.JustDown(this.keys.esc)) {
      if (this.mode === "playing" || this.mode === "paused") this.togglePause();
    }
    this.starfield.update();
    if (this.mode !== "playing") return;

    const delta = Math.min(rawDelta, 50);
    const dt = delta / 1000;
    this.now += delta;
    this.run.time += delta;

    this.updatePlayer(dt);
    this.director!.update();
    updateEnemies(this, dt);
    this.arsenal!.update(dt);
    this.deployables.update();
    updateBullets(this, dt);
    updateEnemyBullets(this, dt);
    updatePickups(this, dt);
    this.fx.update(this.now);

    if (this.enemies.some((e) => e.dead)) this.enemies = this.enemies.filter((e) => !e.dead);

    const arrows = activeChests(this).map((c) => ({ x: c.x, y: c.y, color: 0xfbbf24, size: 1.1 }));
    this.enemies.forEach((e) => {
      if (e.def.id === "boss") arrows.push({ x: e.x, y: e.y, color: 0xf87171, size: 1.5 });
      else if (e.affix) arrows.push({ x: e.x, y: e.y, color: AFFIXES[e.affix].color, size: 0.7 });
    });
    this.fx.drawArrows(arrows);
    this.hud.update(this);

    if (this.pendingLevels > 0 && this.mode === "playing") this.openLevelUp();
  }

  private updatePlayer(dt: number) {
    const run = this.run;
    const k = this.keys;
    let mx = (k.d.isDown || k.right.isDown ? 1 : 0) - (k.a.isDown || k.left.isDown ? 1 : 0);
    let my = (k.s.isDown || k.down.isDown ? 1 : 0) - (k.w.isDown || k.up.isDown ? 1 : 0);
    const len = Math.hypot(mx, my);
    if (len > 0) {
      mx /= len;
      my /= len;
    }

    const wantsDash = Input.Keyboard.JustDown(k.dash) || Input.Keyboard.JustDown(k.shift);
    if (wantsDash && this.now >= run.dashReadyAt) {
      const dir = len > 0 ? { x: mx, y: my } : { x: Math.cos(this.player.rotation - Math.PI / 2), y: Math.sin(this.player.rotation - Math.PI / 2) };
      run.dashDir = dir;
      run.dashUntil = this.now + DASH.duration;
      run.dashReadyAt = this.now + run.stats.dashCooldown;
      run.invulnUntil = Math.max(run.invulnUntil, this.now + DASH.iframes);
      this.sfx("dash");
      this.fx.ring(this.player.x, this.player.y, COLORS.player, 50, 250);
      this.hints.trigger("dash");
    }

    let vx = mx * run.stats.speed;
    let vy = my * run.stats.speed;
    if (this.now < run.dashUntil) {
      vx = run.dashDir.x * run.stats.speed * DASH.speedMultiplier;
      vy = run.dashDir.y * run.stats.speed * DASH.speedMultiplier;
      this.fx.trailDot(this.player.x, this.player.y, COLORS.player);
    }
    if (inNebula(this.arena, this.player.x, this.player.y)) {
      vx *= 0.65;
      vy *= 0.65;
    }

    const pos = { x: this.player.x + vx * dt, y: this.player.y + vy * dt };
    pushOutOfAsteroids(this.arena, pos, PLAYER_RADIUS);
    clampToArena(pos, PLAYER_RADIUS);
    this.player.setPosition(pos.x, pos.y);

    if (len > 0) {
      const target = Math.atan2(my, mx) + Math.PI / 2;
      let diff = target - this.player.rotation;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.player.rotation += diff * Math.min(1, dt * 14);
      if (Math.random() < 0.5) {
        const back = this.player.rotation + Math.PI / 2;
        this.fx.trailDot(pos.x + Math.cos(back) * 18, pos.y + Math.sin(back) * 18, 0xfb923c);
      }
    }

    const back = this.player.rotation + Math.PI / 2;
    this.engine
      .setPosition(pos.x + Math.cos(back) * 16, pos.y + Math.sin(back) * 16)
      .setAlpha(len > 0 ? 0.8 : 0.4)
      .setScale((len > 0 ? 0.9 : 0.6) + Math.sin(this.now * 0.03) * 0.08);
    const blinking = this.now < run.invulnUntil && this.now > run.dashUntil;
    this.player.setAlpha(blinking ? (Math.floor(this.now / 70) % 2 ? 0.35 : 1) : 1);

    if (run.coins >= 8) this.hints.trigger("coins");
    if (Input.Keyboard.JustDown(k.turret)) this.deployables.placeTurret();
    if (Input.Keyboard.JustDown(k.mine)) this.deployables.placeMine();
  }

  // ---------- Run ----------

  private startRun(difficulty: DifficultyId = this.meta.difficulty) {
    this.cleanupRun();
    closeScreen();
    this.meta.difficulty = difficulty;
    saveMeta(this.meta);

    const seed = Math.floor(Math.random() * 0x7fffffff);
    this.arena = generateArena(seed);
    this.arenaObjects = drawArena(this, this.arena);
    this.now = 0;
    this.run = this.createRun(difficulty, seed);

    const c = arenaCenter();
    this.engine = this.add.image(c.x, c.y, "glow").setTint(0xfb923c).setBlendMode(BlendModes.ADD).setDepth(DEPTH.player - 1).setDisplaySize(34, 34);
    this.player = this.add.image(c.x, c.y, "player").setDepth(DEPTH.player);
    this.player.setDisplaySize(48, 48);
    this.playerScale = this.player.scaleX;

    const cam = this.cameras.main;
    cam.setBounds(-160, -160, ARENA_W + 320, ARENA_H + 320);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setZoom(1);

    this.arsenal = new Arsenal(this);
    this.director = new Director(this);
    this.mode = "playing";
    this.hud.show();
    this.hud.update(this, true);
    audio.playMusic("game");
    this.hints.trigger("move");
  }

  private createRun(difficulty: DifficultyId, seed: number): Run {
    const run: Run = {
      difficulty,
      seed,
      time: 0,
      wave: 0,
      waveEndsAt: 0,
      nextWaveAt: 1500,
      inBreak: true,
      event: "normal",
      level: 1,
      xp: 0,
      xpToNext: 6,
      coins: 0,
      kills: 0,
      hp: 0,
      tomes: {},
      items: {},
      freeRerolls: LIMITS.freeRerolls,
      paidRerolls: 0,
      invulnUntil: 0,
      dashUntil: 0,
      dashReadyAt: 0,
      dashDir: { x: 0, y: -1 },
      shieldReadyAt: 0,
      venomUntil: 0,
      magnetUntil: 0,
      nextChestKills: CHEST_KILL_STEP,
      volleys: 0,
      damageBySource: {},
      stats: undefined as never,
      over: false,
    };
    run.stats = computeStats(run);
    run.hp = run.stats.maxHp;
    return run;
  }

  private cleanupRun() {
    this.enemies.forEach(destroyEnemy);
    this.enemies = [];
    [...this.bullets, ...this.enemyBullets].forEach((b) => b.sprite.destroy());
    this.bullets = [];
    this.enemyBullets = [];
    this.pickups.forEach((p) => {
      p.sprite.destroy();
      p.glow?.destroy();
    });
    this.pickups = [];
    this.arenaObjects.forEach((o) => o.destroy());
    this.arenaObjects = [];
    this.arsenal?.destroy();
    this.arsenal = null;
    this.deployables.destroy();
    this.player?.destroy();
    this.engine?.destroy();
    this.telegraph.clear();
    this.fx.clearArrows();
    this.pendingLevels = 0;
    this.tweens.resumeAll();
    this.fx.pause(false);
    this.hud.setBoss(null);
    this.cameras.main.stopFollow();
  }

  private refreshStats() {
    const oldMax = this.run.stats.maxHp;
    this.run.stats = computeStats(this.run);
    const gained = this.run.stats.maxHp - oldMax;
    if (gained > 0) this.run.hp += gained;
    this.run.hp = Math.min(this.run.hp, this.run.stats.maxHp);
  }

  // ---------- Combattimento (API usata dai sistemi) ----------

  damageEnemy(e: Enemy, damage: number, source: DamageSource, angle = 0, knockback = 0) {
    if (e.dead) return;
    const dealt = Math.min(damage, e.hp);
    e.hp -= damage;
    this.run.damageBySource[source] = (this.run.damageBySource[source] ?? 0) + dealt;
    e.flashUntil = this.now + 70;
    if (knockback) {
      const k = knockback * (1 - e.def.knockbackResist);
      e.vx += Math.cos(angle) * k;
      e.vy += Math.sin(angle) * k;
    }
    if (source === "blaster" && this.run.stats.lifeSteal > 0) this.heal(dealt * this.run.stats.lifeSteal);
    this.fx.damageNumber(e.x, e.y - e.radius, damage, SOURCE_COLORS[source] ?? 0xffffff, damage >= 10);
    this.sfx("hit");
    if (e.hp <= 0) this.killEnemy(e, true);
  }

  private killEnemy(e: Enemy, rewards: boolean) {
    if (e.dead) return;
    e.dead = true;
    const run = this.run;
    const { x, y, def } = e;
    const isBoss = def.id === "boss";
    const size = Math.min(3.5, Math.max(0.7, e.radius / 20));
    this.fx.explosion(x, y, e.affix ? AFFIXES[e.affix].color : def.color, size);
    this.sfx(e.radius > 26 ? "boom" : "kill");
    if (e.radius > 26) this.shake(isBoss ? 500 : 120, isBoss ? 0.02 : 0.005);
    destroyEnemy(e);

    if (def.id === "kamikaze") this.blast(x, y, 90, 6, false);
    if (def.id === "brute") for (let i = 0; i < 2; i += 1) spawnEnemy(this, "swarm", x + (i ? 20 : -20), y);
    if (e.affix === "splitter" && !isBoss) {
      for (let i = 0; i < 3; i += 1) spawnEnemy(this, def.id, x + Math.cos(i * 2.1) * 26, y + Math.sin(i * 2.1) * 26, { small: true });
    }

    if (!rewards) return;
    const reward = DIFFICULTIES[run.difficulty].reward;
    const elite = Boolean(e.affix);
    run.kills += 1;

    dropPickup(this, "xp", x, y, Math.ceil(def.xp * (elite ? 3 : 1) * reward));
    if (elite || isBoss || Math.random() < 0.45) {
      dropPickup(this, "coin", x + 10, y + 6, Math.ceil(def.coins * (elite ? 2 : 1) * reward));
    }
    if (Math.random() < (elite ? 0.15 : 0.012)) dropPickup(this, "heart", x - 10, y + 4, 2);
    if (Math.random() < (elite ? 0.08 : 0.005)) dropPickup(this, pick(["magnet", "venom", "emp"] as const), x, y - 12);
    if (isBoss || (elite && Math.random() < 0.2)) dropPickup(this, "chest", x, y);

    if (run.kills >= run.nextChestKills) {
      run.nextChestKills += CHEST_KILL_STEP + run.wave * 4;
      dropChestNearby(this);
      this.hints.trigger("chest");
    }
    if (isEvolved(run, "vampirism")) this.heal(0.2);

    if (isBoss) {
      this.hud.setBoss(null);
      clearEnemyBullets(this);
      banner("BOSS ABBATTUTO", "Una chest ti aspetta nel relitto.", "epic");
      for (let i = 0; i < 8; i += 1) dropPickup(this, "coin", x + Math.cos(i) * 50, y + Math.sin(i) * 50, 3);
    }
  }

  explodeKamikaze(e: Enemy) {
    this.blast(e.x, e.y, 115, e.damage, true);
    this.killEnemy(e, false);
  }

  /** Esplosione ad area: danneggia i nemici e, se richiesto, anche la nave. */
  private blast(x: number, y: number, radius: number, damage: number, hurtsPlayer: boolean) {
    this.fx.explosion(x, y, 0xf97316, radius / 50);
    this.fx.ring(x, y, 0xfb923c, radius);
    this.sfx("boom");
    if (hurtsPlayer && dist2(x, y, this.player.x, this.player.y) < (radius + PLAYER_RADIUS) ** 2) this.hurtPlayer(damage);
    for (const o of this.enemies) {
      if (!o.dead && dist2(x, y, o.x, o.y) < (radius + o.radius) ** 2) {
        this.damageEnemy(o, hurtsPlayer ? damage * 2 : damage, "blast", Math.atan2(o.y - y, o.x - x), 400);
      }
    }
  }

  fireEnemyBullet(e: Enemy, angle: number, p: ProjectileDef, speedMul = 1) {
    fireEnemyBullet(this, e.x, e.y, angle, p, p.damage * (e.damage / e.def.damage), speedMul);
  }

  hurtPlayer(damage: number) {
    const run = this.run;
    if (run.over || this.god || this.now < run.invulnUntil) return;

    if (isEvolved(run, "vitality") && this.now >= run.shieldReadyAt) {
      run.shieldReadyAt = this.now + 12000;
      run.invulnUntil = this.now + 500;
      this.fx.ring(this.player.x, this.player.y, COLORS.shield, 90);
      this.sfx("shield");
      return;
    }

    run.hp -= damage;
    run.invulnUntil = this.now + PLAYER_HIT_IFRAMES;
    this.shake(160, 0.012);
    this.sfx("hurt");
    this.hud.hurt();
    this.fx.burst(this.player.x, this.player.y, COLORS.danger, 12);
    if (run.hp <= 0) this.gameOver();
  }

  private heal(amount: number) {
    this.run.hp = Math.min(this.run.stats.maxHp, this.run.hp + amount);
  }

  collect(p: Pickup) {
    const run = this.run;
    switch (p.kind) {
      case "xp":
        this.sfx("gem");
        this.hints.trigger("xp");
        run.xp += p.value * run.stats.xpMult;
        while (run.xp >= run.xpToNext) {
          run.xp -= run.xpToNext;
          run.level += 1;
          run.xpToNext = Math.round(run.xpToNext * 1.25 + 4);
          this.pendingLevels += 1;
        }
        break;
      case "coin":
        run.coins += p.value;
        this.sfx("coin");
        break;
      case "heart":
        this.heal(p.value);
        this.fx.ring(this.player.x, this.player.y, COLORS.heal, 50);
        this.toast(`+${p.value} HP`, "heart", "good");
        break;
      case "magnet":
        run.magnetUntil = this.now + 8000;
        this.toast("Magnet Overload: raccolta totale", "special-magnet", "good");
        break;
      case "venom":
        run.venomUntil = this.now + 20000;
        this.toast("Munizioni Venom: +25% danno", "special-venom", "good");
        break;
      case "emp": {
        this.fx.ring(this.player.x, this.player.y, 0xa78bfa, 650, 600);
        this.shake(200, 0.01);
        clearEnemyBullets(this);
        for (const e of this.enemies) {
          if (e.dead || dist2(e.x, e.y, this.player.x, this.player.y) > 650 * 650) continue;
          this.damageEnemy(e, e.def.id === "boss" ? e.maxHp * 0.08 : 25 * (run.stats.damage / 2), "emp", Math.atan2(e.y - this.player.y, e.x - this.player.x), 500);
        }
        this.toast("Impulso EMP", "special-emp", "good");
        this.sfx("zap");
        break;
      }
      case "chest":
        this.openChest(p.x, p.y);
        break;
    }
  }

  private openChest(x: number, y: number) {
    const item = rollItem(this.run, unlockedItems(this.meta));
    this.fx.explosion(x, y, 0xfbbf24, 1.4);
    this.fx.ring(x, y, 0xfbbf24, 140);
    this.sfx("reward");
    if (!item) {
      this.run.coins += 25;
      this.toast("Chest: +25 monete", "coin", "good");
      return;
    }
    const level = (this.run.items[item.id] ?? 0) + 1;
    this.run.items[item.id] = level;
    this.refreshStats();
    if (item.id === "bulkhead") this.heal(3);
    this.toast(`${item.title} ${level > 1 ? `Liv. ${level}` : ""} · ${item.perLevel}`, item.icon, "epic");
  }

  // ---------- Level-up ----------

  private openLevelUp() {
    this.offers = rollTomeOffers(this.run, unlockedTomes(this.meta));
    if (this.offers.length === 0) {
      this.pendingLevels = 0;
      this.run.coins += 10;
      this.toast("Tomi al massimo: +10 monete", "coin");
      return;
    }
    this.freeze("levelup");
    this.sfx("levelUp");
    this.renderLevelUp();
  }

  private renderLevelUp() {
    const run = this.run;
    const cost = this.rerollCost();
    const free = run.freeRerolls > 0;
    showLevelUp(
      run,
      this.offers,
      {
        label: free ? `Reroll gratis (${run.freeRerolls})` : `Reroll ${cost} monete (hai ${run.coins})`,
        enabled: free || run.coins >= cost,
      },
      { pick: (offer) => this.applyTome(offer), reroll: () => this.reroll() },
    );
  }

  private rerollCost() {
    return Math.round(15 * (this.run.paidRerolls + 1) ** 1.5);
  }

  private reroll() {
    const run = this.run;
    if (run.freeRerolls > 0) run.freeRerolls -= 1;
    else {
      const cost = this.rerollCost();
      if (run.coins < cost) return;
      run.coins -= cost;
      run.paidRerolls += 1;
    }
    this.offers = rollTomeOffers(run, unlockedTomes(this.meta));
    this.renderLevelUp();
  }

  private applyTome(offer: TomeOffer) {
    const run = this.run;
    const current = run.tomes[offer.tome.id] ?? { level: 0, bonus: 0 };
    run.tomes[offer.tome.id] = { level: current.level + 1, bonus: current.bonus + offer.value };
    this.refreshStats();

    const level = tomeLevel(run, offer.tome.id);
    if (level === LIMITS.tomeMaxLevel - 1) this.hints.trigger("evolve");
    if (level >= LIMITS.tomeMaxLevel) {
      const tome = tomeById(offer.tome.id);
      if (tome.id === "wisdom") run.freeRerolls += 1;
      banner(`EVOLUZIONE: ${tome.evolution.title.toUpperCase()}`, tome.evolution.description, "epic");
      this.sfx("reward");
    }
    if (offer.rarity === "legendary") this.fx.ring(this.player.x, this.player.y, RARITIES.legendary.color, 160);

    this.pendingLevels -= 1;
    closeScreen();
    this.unfreeze();
  }

  // ---------- Stati di gioco ----------

  private freeze(mode: Mode) {
    this.mode = mode;
    this.tweens.pauseAll();
    this.fx.pause(true);
  }

  private unfreeze() {
    this.mode = "playing";
    this.tweens.resumeAll();
    this.fx.pause(false);
  }

  private pause() {
    if (this.mode !== "playing") return;
    this.freeze("paused");
    audio.pauseMusic();
    showPause(this.run, this.meta.muted, {
      resume: () => this.togglePause(),
      quit: () => {
        closeScreen();
        this.unfreeze();
        this.gameOver();
      },
      toggleSound: () => this.toggleSound(),
    });
  }

  private togglePause() {
    if (this.mode === "playing") return this.pause();
    if (this.mode !== "paused") return;
    closeScreen();
    this.unfreeze();
    audio.resumeMusic();
  }

  private gameOver() {
    const run = this.run;
    if (run.over) return;
    run.over = true;
    run.hp = 0;
    this.mode = "over";
    this.fx.explosion(this.player.x, this.player.y, COLORS.player, 3);
    this.shake(400, 0.02);
    this.player.setVisible(false);
    this.engine.setVisible(false);
    this.fx.clearArrows();
    this.telegraph.clear();
    this.hud.hide();
    this.hints.clear();
    this.sfx("boom");

    const credits = runCredits(run, DIFFICULTIES[run.difficulty].reward);
    const record = run.wave > this.meta.bestWave;
    this.meta.credits += credits;
    this.meta.bestWave = Math.max(this.meta.bestWave, run.wave);
    this.meta.runs += 1;
    saveMeta(this.meta);

    this.time.delayedCall(900, () =>
      showGameOver(run, { credits, totalCredits: this.meta.credits, record }, {
        retry: () => this.startRun(run.difficulty),
        shop: () => this.showShop(),
        menu: () => this.showMenu(),
      }),
    );
  }

  private showMenu() {
    this.cleanupRun();
    this.mode = "menu";
    this.hud.hide();
    this.hints.clear();
    const cam = this.cameras.main;
    cam.setBounds(-100000, -100000, 200000, 200000);
    cam.setScroll(0, 0);
    audio.playMusic("menu");
    showMenu(this.meta, {
      play: (difficulty) => this.startRun(difficulty),
      shop: () => this.showShop(),
      toggleSound: () => this.toggleSound(),
    });
  }

  private showShop() {
    if (this.mode !== "menu") this.showMenu();
    showShop(this.meta, {
      buy: (key, cost) => buyUnlock(this.meta, key, cost),
      back: () => this.showMenu(),
    });
  }

  private toggleSound() {
    this.meta.muted = !this.meta.muted;
    audio.setMuted(this.meta.muted);
    saveMeta(this.meta);
    this.hud.setMuted(this.meta.muted);
    return this.meta.muted;
  }

  // ---------- Hook per regia e feedback ----------

  onBossSpawned(boss: Enemy) {
    this.hud.setBoss(boss);
    banner(`WAVE ${this.run.wave} · ALLERTA BOSS`, boss.def.hint, "warning");
    this.sfx("alarm");
    this.shake(300, 0.006);
    this.hints.enemy("boss");
  }

  onBossPhase(phase: number) {
    banner(`FASE ${phase}`, phase === 2 ? "Spirale di fuoco in arrivo" : "Cariche: muoviti di lato!", "warning");
    this.sfx("alarm");
    clearEnemyBullets(this);
  }

  shake(duration: number, intensity: number) {
    this.cameras.main.shake(duration, intensity);
  }

  sfx(name: Sfx) {
    audio.play(name);
  }

  toast(text: string, iconId: IconId = "star", tone: ToastTone = "info") {
    toast(text, iconId, tone);
  }

  banner(title: string, subtitle = "", tone: ToastTone = "info") {
    banner(title, subtitle, tone);
  }

  // ---------- Strumenti di sviluppo ----------

  private mountDev() {
    const playing = () => this.mode === "playing";
    mountDevPanel({
      "+1 livello": () => playing() && (this.pendingLevels += 1),
      "+100 monete": () => playing() && (this.run.coins += 100),
      "Oggetto casuale": () => playing() && this.openChest(this.player.x, this.player.y),
      "Wave +1": () => {
        if (!playing()) return;
        this.run.inBreak = true;
        this.run.nextWaveAt = this.now;
      },
      "Spawn boss": () => playing() && this.onBossSpawned(spawnEnemy(this, "boss", this.player.x + 400, this.player.y)),
      "Spawn tutti": () => {
        if (!playing()) return;
        (["chaser", "swarm", "charger", "shooter", "kamikaze", "brute", "shielded", "sniper", "carrier"] as EnemyId[]).forEach((id, i) =>
          spawnEnemy(this, id, this.player.x + Math.cos(i * 0.7) * 380, this.player.y + Math.sin(i * 0.7) * 380, { affix: i % 3 === 0 ? "swift" : undefined }),
        );
      },
      "Tutti gli oggetti": () => {
        if (!playing()) return;
        (["splitter", "bounce", "blades", "arc", "drone"] as ItemId[]).forEach((id) => (this.run.items[id] = (this.run.items[id] ?? 0) + 1));
        this.refreshStats();
      },
      "Invulnerabile": () => {
        this.god = !this.god;
        toast(`God mode ${this.god ? "ON" : "OFF"}`);
      },
      "+500 crediti": () => {
        this.meta.credits += 500;
        saveMeta(this.meta);
      },
    });
  }
}
