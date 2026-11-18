import { BlendModes, Input, Scene, type GameObjects } from "phaser";
import type { IconId } from "../art/svg";
import { createProceduralTextures, preloadArt } from "../art/textures";
import { audio, type Sfx } from "../audio";
import { CHEST_KILL_STEP, COLORS, DASH, DEPTH, LIMITS, PLAYER_HIT_IFRAMES, PLAYER_RADIUS, type DifficultyId } from "../config";
import { AFFIXES } from "../data/enemies";
import { computeStats, isEvolved } from "../data/upgrades";
import { buyUnlock, loadMeta, saveMeta, type Meta } from "../meta";
import { CampaignMode } from "../modes/campaign/campaignMode";
import { openCampaignHub } from "../modes/campaign/hub";
import type { GameMode, RunOutcome } from "../modes/mode";
import { SurvivalMode } from "../modes/survival";
import { Starfield, clampToArena, drawArena, hitsAsteroid, inNebula, pushOutOfAsteroids } from "../systems/arena";
import { Deployables } from "../systems/deployables";
import { clampToGap, terrainSolid } from "../systems/terrain";
import { destroyEnemy, spawnEnemy, updateEnemies } from "../systems/enemies";
import { Fx } from "../systems/fx";
import { activeChests, dropPickup, updatePickups } from "../systems/pickups";
import type { Armament } from "../systems/rack";
import { Arsenal, clearEnemyBullets, fireEnemyBullet, updateBullets, updateEnemyBullets } from "../systems/weapons";
import type { Arena, Bullet, DamageSource, Enemy, EnemyBullet, EnemyId, ItemId, Pickup, ProjectileDef, Run, Stats } from "../types";
import { mountDevPanel } from "../ui/devPanel";
import { Hints } from "../ui/hints";
import { Hud, banner, toast, type ToastTone } from "../ui/hud";
import { closeScreen, showMenu, showPause, showShop } from "../ui/screens";
import { SpatialHash, dist2 } from "../utils";

export type SceneState = "menu" | "playing" | "levelup" | "paused" | "over";

const SOURCE_COLORS: Partial<Record<DamageSource, number>> = {
  drone: 0xc4b5fd,
  blade: 0x7dd3fc,
  arc: 0xddd6fe,
  turret: 0x67e8f9,
  mine: 0xfdba74,
  trail: 0x86efac,
  emp: 0xc4b5fd,
};

/**
 * Nucleo di combattimento condiviso dalle modalità: nave, nemici, armi,
 * pickup, effetti, pausa. Arena, ritmo e ricompense li decide `mode`.
 */
export class GameScene extends Scene {
  // Stato condiviso letto dai sistemi.
  run!: Run;
  meta!: Meta;
  arena!: Arena;
  mode!: GameMode;
  state: SceneState = "menu";
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
  hud!: Hud;
  pendingLevels = 0;
  /** Input di combattimento letto a ogni frame (usato dal sistema d'arma della campagna). */
  controls = { firing: false, bomb: false };
  armament: Armament | null = null;

  private starfield!: Starfield;
  private rightClick = false;
  private arenaObjects: GameObjects.GameObject[] = [];
  private engine!: GameObjects.Image;
  private keys!: Record<string, Input.Keyboard.Key>;
  private menuDrift = 0;
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
      dash: K.SPACE, shift: K.SHIFT, turret: K.Q, mine: K.E, bomb: K.B, pause: K.P, esc: K.ESC, mute: K.M,
    }) as Record<string, Input.Keyboard.Key>;
    this.input.mouse?.disableContextMenu();
    this.input.on("pointerdown", (pointer: Input.Pointer) => {
      if (pointer.rightButtonDown()) this.rightClick = true;
    });

    const unlock = () => audio.unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);

    this.hud = new Hud({ pause: () => this.togglePause(), toggleSound: () => this.toggleSound() });
    this.hud.setMuted(this.meta.muted);
    this.deployables = new Deployables(this);
    this.mountDev();
    this.showMenu();

    this.game.events.on("blur", () => this.state === "playing" && this.pause());
  }

  // ---------- Loop ----------

  update(_time: number, rawDelta: number) {
    if (Input.Keyboard.JustDown(this.keys.mute)) this.toggleSound();

    if (this.state === "menu") {
      this.menuDrift += rawDelta * 0.04;
      this.starfield.update(this.menuDrift);
      return;
    }

    if (Input.Keyboard.JustDown(this.keys.pause) || Input.Keyboard.JustDown(this.keys.esc)) {
      if (this.state === "playing" || this.state === "paused") this.togglePause();
    }
    this.starfield.update();
    if (this.state !== "playing") return;

    const delta = Math.min(rawDelta, 50);
    const dt = delta / 1000;
    this.now += delta;
    this.run.time += delta;

    const pointer = this.input.activePointer;
    this.controls.firing = this.keys.dash.isDown || (pointer.isDown && pointer.leftButtonDown());
    this.controls.bomb = Input.Keyboard.JustDown(this.keys.bomb) || this.rightClick;
    this.rightClick = false;

    this.mode.update(this, dt);
    if (this.state !== "playing") return;
    this.updatePlayer(dt);
    updateEnemies(this, dt);
    this.armament?.update(dt);
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

    if (this.pendingLevels > 0 && this.state === "playing") this.mode.onLevelUp?.(this);
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

    const wantsDash = this.mode.allowDash && (Input.Keyboard.JustDown(k.dash) || Input.Keyboard.JustDown(k.shift));
    if (wantsDash && this.now >= run.dashReadyAt) {
      const facing = this.player.rotation - Math.PI / 2;
      run.dashDir = len > 0 ? { x: mx, y: my } : { x: Math.cos(facing), y: Math.sin(facing) };
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

    // Terreno: si scivola lungo pareti e pendii invece di attraversarli.
    const terrain = this.arena.terrain;
    if (terrain && terrainSolid(terrain, pos.x, pos.y, PLAYER_RADIUS)) {
      const { x: ox, y: oy } = this.player;
      if (!terrainSolid(terrain, ox, pos.y, PLAYER_RADIUS)) pos.x = ox;
      else if (!terrainSolid(terrain, pos.x, oy, PLAYER_RADIUS)) pos.y = oy;
      else {
        pos.x = ox;
        pos.y = oy;
      }
    }
    this.mode.constrainPlayer?.(this, pos);
    // Spinti contro una parete dal bordo dello schermo: la nave si schiaccia.
    if (terrain && terrainSolid(terrain, pos.x, pos.y, PLAYER_RADIUS)) {
      pos.y = clampToGap(terrain, pos.x, pos.y, PLAYER_RADIUS);
      this.hurtPlayer(1);
    }
    clampToArena(this.arena, pos, PLAYER_RADIUS);
    this.player.setPosition(pos.x, pos.y);

    // Muso: segue il movimento, oppure resta fisso (campagna) con una leggera inclinazione.
    const heading = this.mode.heading;
    const target = heading !== null ? heading + Math.PI / 2 + my * 0.25 : len > 0 ? Math.atan2(my, mx) + Math.PI / 2 : null;
    if (target !== null) {
      let diff = target - this.player.rotation;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.player.rotation += diff * Math.min(1, dt * 14);
    }
    const back = this.player.rotation + Math.PI / 2;
    if (len > 0 && Math.random() < 0.5) {
      this.fx.trailDot(pos.x + Math.cos(back) * 18, pos.y + Math.sin(back) * 18, 0xfb923c);
    }
    this.engine
      .setPosition(pos.x + Math.cos(back) * 16, pos.y + Math.sin(back) * 16)
      .setAlpha(len > 0 ? 0.8 : 0.4)
      .setScale((len > 0 ? 0.9 : 0.6) + Math.sin(this.now * 0.03) * 0.08);
    const blinking = this.now < run.invulnUntil && this.now > run.dashUntil;
    this.player.setAlpha(blinking ? (Math.floor(this.now / 70) % 2 ? 0.35 : 1) : 1);

    if (run.coins >= 8 && run.stats.maxTurrets > 0) this.hints.trigger("coins");
    if (run.stats.maxTurrets > 0 && Input.Keyboard.JustDown(k.turret)) this.deployables.placeTurret();
    if (run.stats.maxMines > 0 && Input.Keyboard.JustDown(k.mine)) this.deployables.placeMine();
  }

  // ---------- Run ----------

  /** Avvia una run nella modalità indicata. */
  startMode(mode: GameMode) {
    this.cleanupRun();
    closeScreen();
    this.mode = mode;
    const setup = mode.setup(this);
    this.arena = setup.arena;
    this.arenaObjects = drawArena(this, this.arena);
    this.now = 0;
    this.run = this.createRun(setup.difficulty, setup.arena.seed, setup.base, setup.wave);

    const { x, y } = setup.start;
    this.engine = this.add.image(x, y, "glow").setTint(0xfb923c).setBlendMode(BlendModes.ADD).setDepth(DEPTH.player - 1).setDisplaySize(34, 34);
    this.player = this.add.image(x, y, "player").setDepth(DEPTH.player);
    this.player.setDisplaySize(48, 48);
    if (mode.heading !== null) this.player.setRotation(mode.heading + Math.PI / 2);
    this.playerScale = this.player.scaleX;

    const cam = this.cameras.main;
    cam.setBounds(-160, -160, this.arena.width + 320, this.arena.height + 320);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setZoom(1);

    this.armament = mode.createArmament?.(this) ?? new Arsenal(this);
    this.state = "playing";
    mode.begin(this);
    this.hud.show();
    this.hud.update(this, true);
    audio.playMusic("game");
  }

  private createRun(difficulty: DifficultyId, seed: number, base: Stats, wave: number): Run {
    const run: Run = {
      difficulty,
      seed,
      time: 0,
      wave,
      waveEndsAt: 0,
      nextWaveAt: 0,
      inBreak: false,
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
      base,
      stats: base,
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
    this.armament?.destroy();
    this.armament = null;
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

  /** Punto pieno per proiettili e collisioni: asteroidi e terreno. */
  solidAt(x: number, y: number, radius: number) {
    return hitsAsteroid(this.arena, x, y, radius) || terrainSolid(this.arena.terrain, x, y, radius);
  }

  /** Oggetti grafici legati alla run, distrutti a fine run (usato dalle modalità). */
  trackRunObject(object: GameObjects.GameObject) {
    this.arenaObjects.push(object);
  }

  refreshStats() {
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

  /** Rimuove un nemico. Con `rewards` la modalità assegna i drop. */
  killEnemy(e: Enemy, rewards: boolean, silent = false) {
    if (e.dead) return;
    e.dead = true;
    const { x, y, def } = e;
    const isBoss = def.id === "boss";
    if (!silent) {
      const size = Math.min(3.5, Math.max(0.7, e.radius / 20));
      this.fx.explosion(x, y, e.affix ? AFFIXES[e.affix].color : def.color, size);
      this.sfx(e.radius > 26 ? "boom" : "kill");
      if (e.radius > 26) this.shake(isBoss ? 500 : 120, isBoss ? 0.02 : 0.005);
    }
    destroyEnemy(e);
    if (silent) return;

    if (def.id === "kamikaze") this.blast(x, y, 90, 6, false);
    if (def.id === "brute") for (let i = 0; i < 2; i += 1) spawnEnemy(this, "swarm", x + (i ? 20 : -20), y);
    if (e.affix === "splitter" && !isBoss) {
      for (let i = 0; i < 3; i += 1) spawnEnemy(this, def.id, x + Math.cos(i * 2.1) * 26, y + Math.sin(i * 2.1) * 26, { small: true });
    }
    if (isBoss) {
      this.hud.setBoss(null);
      clearEnemyBullets(this);
    }
    if (!rewards) return;

    this.run.kills += 1;
    if (isEvolved(this.run, "vampirism")) this.heal(0.2);
    this.mode.onKill(this, e);
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
    if (run.hp <= 0) this.endRun("death");
  }

  heal(amount: number) {
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
        this.fx.explosion(p.x, p.y, 0xfbbf24, 1.4);
        this.fx.ring(p.x, p.y, 0xfbbf24, 140);
        this.sfx("reward");
        this.mode.onChest(this, p.x, p.y);
        break;
    }
  }

  // ---------- Stati di gioco ----------

  freeze(state: SceneState) {
    this.state = state;
    this.tweens.pauseAll();
    this.fx.pause(true);
  }

  unfreeze() {
    this.state = "playing";
    this.tweens.resumeAll();
    this.fx.pause(false);
  }

  private pause() {
    if (this.state !== "playing") return;
    this.freeze("paused");
    audio.pauseMusic();
    showPause(this.run, this.meta.muted, {
      resume: () => this.togglePause(),
      quit: () => {
        closeScreen();
        this.unfreeze();
        this.endRun("abandon");
      },
      toggleSound: () => this.toggleSound(),
    });
  }

  private togglePause() {
    if (this.state === "playing") return this.pause();
    if (this.state !== "paused") return;
    closeScreen();
    this.unfreeze();
    audio.resumeMusic();
  }

  /** Chiude la run: la modalità assegna le ricompense e mostra il riepilogo. */
  endRun(outcome: RunOutcome) {
    const run = this.run;
    if (run.over) return;
    run.over = true;
    this.state = "over";
    this.fx.clearArrows();
    this.telegraph.clear();
    this.hud.hide();
    this.hints.clear();
    if (outcome === "victory") {
      this.fx.ring(this.player.x, this.player.y, 0x4ade80, 260, 700);
      this.sfx("reward");
    } else {
      run.hp = 0;
      this.fx.explosion(this.player.x, this.player.y, COLORS.player, 3);
      this.shake(400, 0.02);
      this.player.setVisible(false);
      this.engine.setVisible(false);
      this.sfx("boom");
    }
    this.time.delayedCall(900, () => this.mode.end(this, outcome));
  }

  showMenu() {
    this.cleanupRun();
    this.state = "menu";
    this.hud.hide();
    this.hints.clear();
    const cam = this.cameras.main;
    cam.setBounds(-100000, -100000, 200000, 200000);
    cam.setScroll(0, 0);
    audio.playMusic("menu");
    showMenu(this.meta, {
      play: (difficulty) => this.startMode(new SurvivalMode(difficulty)),
      campaign: () => this.showCampaign(),
      shop: () => this.showShop(),
      toggleSound: () => this.toggleSound(),
    });
  }

  showShop() {
    if (this.state !== "menu") this.showMenu();
    showShop(this.meta, {
      buy: (key, cost) => buyUnlock(this.meta, key, cost),
      back: () => this.showMenu(),
    });
  }

  showCampaign() {
    if (this.state !== "menu") this.showMenu();
    openCampaignHub({
      launch: (missionId) => this.startMode(new CampaignMode(missionId)),
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
    banner(`ALLERTA BOSS · ${boss.def.label.toUpperCase()}`, boss.def.hint, "warning");
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
    const playing = () => this.state === "playing";
    mountDevPanel({
      "+1 livello": () => playing() && (this.pendingLevels += 1),
      "+100 monete": () => playing() && (this.run.coins += 100),
      "Chest qui": () => playing() && dropPickup(this, "chest", this.player.x + 60, this.player.y),
      "Wave +1": () => {
        if (!playing() || this.mode.id !== "survival") return;
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
      "Vittoria": () => playing() && this.endRun("victory"),
      "Invulnerabile": () => {
        this.god = !this.god;
        toast(`God mode ${this.god ? "ON" : "OFF"}`);
      },
      "+500 crediti/monete": () => {
        this.meta.credits += 500;
        saveMeta(this.meta);
        window.dispatchEvent(new CustomEvent("dev:coins", { detail: 500 }));
      },
    });
  }
}
