import { BlendModes, TintModes } from "phaser";
import { DEPTH, DIFFICULTIES, LIMITS, PLAYER_RADIUS } from "../config";
import { AFFIXES, ENEMIES, waveScale } from "../data/enemies";
import type { GameScene } from "../scenes/GameScene";
import type { AffixId, Enemy, EnemyId } from "../types";
import { angleDiff, clamp, pick } from "../utils";
import { clampToArena, inNebula, pushOutOfAsteroids } from "./arena";

let nextUid = 1;
const neighbors: Enemy[] = [];

export const spawnEnemy = (
  g: GameScene,
  id: EnemyId,
  x: number,
  y: number,
  opts: { affix?: AffixId; small?: boolean } = {},
): Enemy => {
  const def = ENEMIES[id];
  const run = g.run;
  const ws = waveScale(run.wave);
  const diff = DIFFICULTIES[run.difficulty];
  const elite = Boolean(opts.affix);
  const isBoss = id === "boss";
  const bossTier = Math.floor(run.wave / 5);
  const scale = (elite ? 1.3 : 1) * (opts.small ? 0.7 : 1);

  const sprite = g.add.image(x, y, pick(def.textures)).setDepth(isBoss ? DEPTH.enemy + 2 : DEPTH.enemy);
  const baseScale = (def.size * scale) / Math.max(1, sprite.width, sprite.height);
  sprite.setScale(baseScale * 0.4).setAlpha(0);
  g.tweens.add({ targets: sprite, scale: baseScale, alpha: 1, duration: 260, ease: "Back.easeOut" });

  let hp = def.hp * ws.hp * diff.hp;
  if (isBoss) hp = def.hp * diff.hp * (1 + (bossTier - 1) * 0.9);
  if (opts.affix === "armored") hp *= 3;
  else if (elite) hp *= 2.2;
  if (opts.small) hp *= 0.5;

  const enemy: Enemy = {
    uid: nextUid++,
    def,
    sprite,
    x,
    y,
    vx: 0,
    vy: 0,
    hp,
    maxHp: hp,
    speed: (def.speed + (isBoss ? 0 : ws.speed)) * (opts.affix === "swift" ? 1.45 : 1),
    damage: def.damage * ws.damage * diff.damage,
    radius: def.radius * scale,
    scale: baseScale,
    state: "move",
    stateUntil: 0,
    lockAngle: 0,
    nextAttack: g.now + 800 + Math.random() * 900,
    seed: Math.random() * 1000,
    facing: Math.atan2(g.player.y - y, g.player.x - x),
    affix: opts.affix,
    flashUntil: 0,
    flashing: false,
    bossPhase: 1,
    spiral: 0,
    dead: false,
  };

  if (opts.affix) {
    enemy.aura = g.add
      .image(x, y, "glow")
      .setTint(AFFIXES[opts.affix].color)
      .setBlendMode(BlendModes.ADD)
      .setDepth(DEPTH.enemy - 1)
      .setDisplaySize(enemy.radius * 5, enemy.radius * 5);
  }

  if (id === "shielded") {
    enemy.shield = g.add.image(x, y, "shield-arc").setDepth(DEPTH.enemy + 1).setOrigin(0.5, 0.55);
    enemy.shield.setDisplaySize(enemy.radius * 3.4, enemy.radius * 3.4);
  }

  g.enemies.push(enemy);
  return enemy;
};

export const destroyEnemy = (enemy: Enemy) => {
  enemy.sprite.scene?.tweens.killTweensOf(enemy.sprite);
  enemy.sprite.destroy();
  enemy.aura?.destroy();
  enemy.shield?.destroy();
};

/** True se il colpo proveniente da `angle` (direzione di volo) è bloccato dallo scudo. */
export const shieldBlocks = (enemy: Enemy, bulletAngle: number) => {
  if (enemy.def.id !== "shielded") return false;
  // Il proiettile arriva "contro" la direzione di volo: confronto con il facing.
  return Math.abs(angleDiff(enemy.facing, bulletAngle + Math.PI)) < 1.0;
};

export const updateEnemies = (g: GameScene, dt: number) => {
  const now = g.now;
  const player = g.player;
  const t = g.telegraph;
  t.clear();

  g.enemyHash.clear();
  for (const e of g.enemies) if (!e.dead) g.enemyHash.insert(e);

  for (const e of g.enemies) {
    if (e.dead) continue;
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const d = Math.hypot(dx, dy) || 0.001;
    const ux = dx / d;
    const uy = dy / d;
    const toPlayer = Math.atan2(dy, dx);
    let mx = ux;
    let my = uy;
    let speedMul = 1;
    const pref = e.def.preferredDistance ?? 0;

    const keepDistance = () => {
      if (d > pref * 1.15) return;
      const side = e.seed > 500 ? 1 : -1;
      if (d < pref * 0.8) {
        mx = -ux;
        my = -uy;
      } else {
        mx = -uy * side;
        my = ux * side;
        speedMul = 0.7;
      }
    };

    switch (e.def.id) {
      case "swarm": {
        const wobble = Math.sin(now * 0.004 + e.seed) * 0.9;
        mx = ux - uy * wobble;
        my = uy + ux * wobble;
        break;
      }
      case "kamikaze": {
        if (e.state === "move" && d < 100) {
          e.state = "arming";
          e.stateUntil = now + 650;
        }
        if (e.state === "arming") {
          speedMul = 0.3;
          const progress = 1 - (e.stateUntil - now) / 650;
          t.fillStyle(0xef4444, 0.12 + progress * 0.18);
          t.fillCircle(e.x, e.y, 115 * progress);
          t.lineStyle(3, 0xfca5a5, 0.9);
          t.strokeCircle(e.x, e.y, 115);
          e.sprite.setScale(e.scale * (1 + Math.sin(now * 0.05) * 0.12));
          if (now >= e.stateUntil) {
            g.explodeKamikaze(e);
            continue;
          }
        }
        break;
      }
      case "charger": {
        if (e.state === "move" && d < 340 && now > e.nextAttack) {
          e.state = "windup";
          e.stateUntil = now + 650;
          e.lockAngle = toPlayer;
        }
        if (e.state === "windup") {
          speedMul = 0;
          const progress = 1 - (e.stateUntil - now) / 650;
          t.lineStyle(14 * e.scale * 1.5 + 6, 0xef4444, 0.1 + progress * 0.25);
          t.lineBetween(e.x, e.y, e.x + Math.cos(e.lockAngle) * 420, e.y + Math.sin(e.lockAngle) * 420);
          if (now >= e.stateUntil) {
            e.state = "dash";
            e.stateUntil = now + 430;
          }
        } else if (e.state === "dash") {
          mx = Math.cos(e.lockAngle);
          my = Math.sin(e.lockAngle);
          speedMul = 4.3;
          if (Math.random() < 0.6) g.fx.trailDot(e.x, e.y, 0xf59e0b);
          if (now >= e.stateUntil) {
            e.state = "recover";
            e.stateUntil = now + 600;
          }
        } else if (e.state === "recover") {
          speedMul = 0.25;
          if (now >= e.stateUntil) {
            e.state = "move";
            e.nextAttack = now + 1700;
          }
        }
        break;
      }
      case "shooter": {
        keepDistance();
        const p = e.def.projectile!;
        if (now > e.nextAttack && d < p.range) {
          g.fireEnemyBullet(e, toPlayer, p);
          e.nextAttack = now + p.cooldown * (0.85 + Math.random() * 0.3);
        }
        break;
      }
      case "sniper": {
        const p = e.def.projectile!;
        if (e.state === "move") {
          keepDistance();
          if (now > e.nextAttack && d < p.range) {
            e.state = "aim";
            e.stateUntil = now + 1100;
          }
        } else if (e.state === "aim") {
          speedMul = 0;
          const left = e.stateUntil - now;
          if (left > 260) e.lockAngle = toPlayer;
          const blink = left < 260 && Math.floor(now / 60) % 2 === 0;
          t.lineStyle(blink ? 3 : 1.5, 0xf472b6, blink ? 1 : 0.55);
          t.lineBetween(e.x, e.y, e.x + Math.cos(e.lockAngle) * 900, e.y + Math.sin(e.lockAngle) * 900);
          if (left <= 0) {
            g.fireEnemyBullet(e, e.lockAngle, p);
            e.state = "move";
            e.nextAttack = now + p.cooldown;
          }
        }
        break;
      }
      case "shielded": {
        const turn = clamp(angleDiff(e.facing, toPlayer), -1.6 * dt, 1.6 * dt);
        e.facing += turn;
        break;
      }
      case "carrier": {
        keepDistance();
        if (now > e.nextAttack && g.enemies.length < LIMITS.maxEnemies) {
          for (let i = 0; i < 3; i += 1) {
            const a = e.seed + i * 2.1 + now * 0.001;
            spawnEnemy(g, "swarm", e.x + Math.cos(a) * e.radius, e.y + Math.sin(a) * e.radius);
          }
          g.fx.ring(e.x, e.y, 0x94a3b8, 90);
          e.nextAttack = now + 4200;
        }
        break;
      }
      case "boss":
        updateBoss(g, e, d, toPlayer, (x, y, mul) => {
          mx = x;
          my = y;
          speedMul = mul;
        });
        break;
      default:
        break;
    }

    if (inNebula(g.arena, e.x, e.y)) speedMul *= 0.6;

    const len = Math.hypot(mx, my) || 1;
    e.x += ((mx / len) * e.speed * speedMul + e.vx) * dt;
    e.y += ((my / len) * e.speed * speedMul + e.vy) * dt;
    const decay = Math.exp(-7 * dt);
    e.vx *= decay;
    e.vy *= decay;

    // Separazione: i nemici non si impilano in un unico blob.
    if (e.def.id !== "boss") {
      g.enemyHash.query(e.x, e.y, e.radius + 40, neighbors);
      for (const o of neighbors) {
        if (o === e || o.dead) continue;
        const ox = e.x - o.x;
        const oy = e.y - o.y;
        const min = (e.radius + o.radius) * 0.85;
        const d2 = ox * ox + oy * oy;
        if (d2 >= min * min || d2 === 0) continue;
        const od = Math.sqrt(d2);
        const push = (min - od) * (o.def.id === "boss" ? 1 : 0.5);
        e.x += (ox / od) * push;
        e.y += (oy / od) * push;
      }
    }

    pushOutOfAsteroids(g.arena, e, e.radius);
    clampToArena(g.arena, e, e.radius);

    // Rendering.
    const s = e.sprite;
    s.setPosition(e.x, e.y);
    if (e.def.id !== "boss" && e.def.id !== "kamikaze") s.rotation = clamp((mx / len) * speedMul, -1, 1) * 0.22;
    if (e.def.faces) s.setFlipX(e.def.faces === "left" ? dx > 0 : dx < 0);

    if (now < e.flashUntil) {
      if (!e.flashing) {
        s.setTint(0xffffff).setTintMode(TintModes.FILL);
        e.flashing = true;
      }
    } else if (e.flashing) {
      s.clearTint().setTintMode(TintModes.MULTIPLY);
      e.flashing = false;
    }

    if (e.aura) {
      e.aura.setPosition(e.x, e.y).setAlpha(0.45 + Math.sin(now * 0.006 + e.seed) * 0.2);
    }
    if (e.shield) {
      e.shield
        .setPosition(e.x + Math.cos(e.facing) * e.radius * 0.5, e.y + Math.sin(e.facing) * e.radius * 0.5)
        .setRotation(e.facing + Math.PI / 2);
    }

    if (d < e.radius + PLAYER_RADIUS - 4) g.hurtPlayer(e.damage);
  }
};

const updateBoss = (
  g: GameScene,
  e: Enemy,
  d: number,
  toPlayer: number,
  move: (x: number, y: number, mul: number) => void,
) => {
  const now = g.now;
  const ratio = e.hp / e.maxHp;
  const phase = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
  const p = e.def.projectile!;
  const ux = Math.cos(toPlayer);
  const uy = Math.sin(toPlayer);

  if (phase !== e.bossPhase) {
    e.bossPhase = phase;
    e.state = "move";
    e.nextAttack = now + 900;
    g.onBossPhase(phase);
  }

  const radial = (count: number, offset: number, speedMul = 1) => {
    for (let i = 0; i < count; i += 1) {
      g.fireEnemyBullet(e, offset + (i / count) * Math.PI * 2, p, speedMul);
    }
  };

  e.sprite.rotation = Math.sin(now * 0.0015) * 0.08;

  if (phase === 1) {
    move(d > 320 ? ux : -uy, d > 320 ? uy : ux, d > 320 ? 1 : 0.5);
    if (now > e.nextAttack) {
      radial(14, e.spiral);
      e.spiral += 0.22;
      e.nextAttack = now + 2100;
    }
    return;
  }

  if (phase === 2) {
    move(-uy, ux, 0.8);
    // Spirale: 2.6s di fuoco continuo, 1.4s di pausa.
    const cycle = (now - e.seed) % 4000;
    if (cycle < 2600 && now > e.stateUntil) {
      e.spiral += 0.33;
      g.fireEnemyBullet(e, e.spiral, p, 1.1);
      g.fireEnemyBullet(e, e.spiral + Math.PI, p, 1.1);
      e.stateUntil = now + 100;
    }
    if (now > e.nextAttack) {
      for (let i = 0; i < 4; i += 1) {
        spawnEnemy(g, "swarm", e.x + Math.cos(i * 1.57) * 70, e.y + Math.sin(i * 1.57) * 70);
      }
      e.nextAttack = now + 6500;
    }
    return;
  }

  // Fase 3: cariche telegrafate e raffiche all'impatto.
  if (e.state === "move") {
    move(ux, uy, 1.1);
    if (now > e.nextAttack) {
      e.state = "windup";
      e.stateUntil = now + 750;
      e.lockAngle = toPlayer;
    }
  } else if (e.state === "windup") {
    move(0, 0, 0);
    const progress = 1 - (e.stateUntil - now) / 750;
    g.telegraph.lineStyle(e.radius * 2, 0xef4444, 0.08 + progress * 0.22);
    g.telegraph.lineBetween(e.x, e.y, e.x + Math.cos(e.lockAngle) * 600, e.y + Math.sin(e.lockAngle) * 600);
    if (now >= e.stateUntil) {
      e.state = "dash";
      e.stateUntil = now + 520;
    }
  } else if (e.state === "dash") {
    move(Math.cos(e.lockAngle), Math.sin(e.lockAngle), 5.5);
    g.fx.trailDot(e.x, e.y, 0xf87171);
    if (now >= e.stateUntil) {
      e.state = "recover";
      e.stateUntil = now + 700;
      radial(18, Math.random() * Math.PI, 1.2);
      g.shake(160, 0.008);
    }
  } else {
    move(0, 0, 0);
    if (now >= e.stateUntil) {
      e.state = "move";
      e.nextAttack = now + 1500;
    }
  }
};
