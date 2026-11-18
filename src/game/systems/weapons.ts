import { BlendModes, type GameObjects } from "phaser";
import { COLORS, DEPTH, PLAYER_RADIUS } from "../config";
import { isEvolved, itemLevel } from "../data/upgrades";
import type { GameScene } from "../scenes/GameScene";
import type { Bullet, DamageSource, Enemy, ProjectileDef } from "../types";
import { dist2 } from "../utils";
import { hitsAsteroid, insideArena } from "./arena";
import { shieldBlocks } from "./enemies";

const near: Enemy[] = [];
const SHIELDABLE: DamageSource[] = ["blaster", "drone", "turret"];

export const nearestEnemy = (g: GameScene, x: number, y: number, range: number, exclude?: Set<number>) => {
  let best: Enemy | null = null;
  let bestD = range * range;
  for (const e of g.enemies) {
    if (e.dead || exclude?.has(e.uid)) continue;
    const d = dist2(x, y, e.x, e.y);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
};

// ---------- Proiettili della nave ----------

export const fireBullet = (
  g: GameScene,
  x: number,
  y: number,
  angle: number,
  opts: { damage: number; speed: number; range: number; source: DamageSource; color: number; pierce?: number; bounce?: number; scale?: number },
) => {
  let b = g.bullets.find((entry) => !entry.active);
  if (!b) {
    const sprite = g.add.image(0, 0, "bullet").setBlendMode(BlendModes.ADD).setDepth(DEPTH.bullet);
    b = { sprite, x: 0, y: 0, vx: 0, vy: 0, damage: 0, life: 0, radius: 6, pierce: 0, bounce: 0, hit: new Set(), source: "blaster", active: false };
    g.bullets.push(b);
  }
  b.x = x;
  b.y = y;
  b.vx = Math.cos(angle) * opts.speed;
  b.vy = Math.sin(angle) * opts.speed;
  b.damage = opts.damage;
  b.life = opts.range;
  b.pierce = opts.pierce ?? 0;
  b.bounce = opts.bounce ?? 0;
  b.source = opts.source;
  b.hit.clear();
  b.active = true;
  b.sprite
    .setActive(true)
    .setVisible(true)
    .setPosition(x, y)
    .setRotation(angle)
    .setTint(opts.color)
    .setScale(opts.scale ?? 1);
  return b;
};

const killBullet = (b: Bullet) => {
  b.active = false;
  b.sprite.setActive(false).setVisible(false);
};

export const updateBullets = (g: GameScene, dt: number) => {
  for (const b of g.bullets) {
    if (!b.active) continue;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= Math.hypot(b.vx, b.vy) * dt;
    b.sprite.setPosition(b.x, b.y);

    if (b.life <= 0 || !insideArena(b.x, b.y)) {
      killBullet(b);
      continue;
    }
    if (hitsAsteroid(g.arena, b.x, b.y, b.radius)) {
      g.fx.burst(b.x, b.y, 0x94a3b8, 4);
      killBullet(b);
      continue;
    }

    g.enemyHash.query(b.x, b.y, b.radius + 60, near);
    for (const e of near) {
      if (e.dead || b.hit.has(e.uid)) continue;
      if (dist2(b.x, b.y, e.x, e.y) > (e.radius + b.radius) ** 2) continue;
      const angle = Math.atan2(b.vy, b.vx);

      if (SHIELDABLE.includes(b.source) && shieldBlocks(e, angle)) {
        g.fx.burst(b.x, b.y, COLORS.shield, 6);
        g.sfx("shield");
        killBullet(b);
        break;
      }

      g.damageEnemy(e, b.damage, b.source, angle, b.source === "blaster" ? 150 : 90);
      b.hit.add(e.uid);

      if (b.pierce > 0) {
        b.pierce -= 1;
      } else if (b.bounce > 0) {
        const next = nearestEnemy(g, b.x, b.y, 340, b.hit);
        if (next) {
          b.bounce -= 1;
          const a = Math.atan2(next.y - b.y, next.x - b.x);
          const speed = Math.hypot(b.vx, b.vy);
          b.vx = Math.cos(a) * speed;
          b.vy = Math.sin(a) * speed;
          b.life = Math.max(b.life, 360);
          b.sprite.setRotation(a);
        } else {
          killBullet(b);
        }
      } else {
        killBullet(b);
      }
      break;
    }
  }
};

// ---------- Proiettili nemici ----------

export const fireEnemyBullet = (g: GameScene, x: number, y: number, angle: number, p: ProjectileDef, damage: number, speedMul = 1) => {
  let b = g.enemyBullets.find((entry) => !entry.active);
  if (!b) {
    const sprite = g.add.image(0, 0, "orb").setBlendMode(BlendModes.ADD).setDepth(DEPTH.enemyBullet);
    b = { sprite, x: 0, y: 0, vx: 0, vy: 0, damage: 0, radius: 6, life: 0, active: false };
    g.enemyBullets.push(b);
  }
  b.x = x;
  b.y = y;
  b.vx = Math.cos(angle) * p.speed * speedMul;
  b.vy = Math.sin(angle) * p.speed * speedMul;
  b.damage = damage;
  b.radius = p.radius;
  b.life = p.range;
  b.active = true;
  b.sprite.setActive(true).setVisible(true).setPosition(x, y).setTint(COLORS.enemyBullet).setDisplaySize(p.radius * 3.4, p.radius * 3.4);
};

export const updateEnemyBullets = (g: GameScene, dt: number) => {
  const px = g.player.x;
  const py = g.player.y;
  for (const b of g.enemyBullets) {
    if (!b.active) continue;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= Math.hypot(b.vx, b.vy) * dt;
    b.sprite.setPosition(b.x, b.y);
    const dead = b.life <= 0 || !insideArena(b.x, b.y) || hitsAsteroid(g.arena, b.x, b.y, b.radius);
    if (!dead && dist2(b.x, b.y, px, py) < (b.radius + PLAYER_RADIUS - 3) ** 2) {
      g.hurtPlayer(b.damage);
      g.fx.burst(b.x, b.y, COLORS.enemyBullet, 6);
    } else if (!dead) {
      continue;
    }
    b.active = false;
    b.sprite.setActive(false).setVisible(false);
  }
};

export const clearEnemyBullets = (g: GameScene) => {
  g.enemyBullets.forEach((b) => {
    if (!b.active) return;
    g.fx.burst(b.x, b.y, COLORS.enemyBullet, 2);
    b.active = false;
    b.sprite.setActive(false).setVisible(false);
  });
};

// ---------- Armi della nave ----------

export class Arsenal {
  private nextShot = 0;
  private drones: { sprite: GameObjects.Image; x: number; y: number; nextShot: number }[] = [];
  private blades: GameObjects.Image[] = [];
  private bladeHits = new Map<number, number>();
  private nextArc = 0;
  private nextPulse = 0;
  private trail: { x: number; y: number; until: number; sprite: GameObjects.Image }[] = [];
  private nextTrailDrop = 0;
  private nextTrailTick = 0;
  private shieldRing: GameObjects.Image;

  constructor(private readonly g: GameScene) {
    this.shieldRing = g.add
      .image(0, 0, "ring")
      .setTint(COLORS.shield)
      .setBlendMode(BlendModes.ADD)
      .setDepth(DEPTH.player + 1)
      .setDisplaySize(PLAYER_RADIUS * 3.6, PLAYER_RADIUS * 3.6)
      .setVisible(false);
  }

  destroy() {
    this.drones.forEach((d) => d.sprite.destroy());
    this.blades.forEach((b) => b.destroy());
    this.trail.forEach((t) => t.sprite.destroy());
    this.shieldRing.destroy();
  }

  update(dt: number) {
    const g = this.g;
    this.updateBlaster();
    this.updateDrones(dt);
    this.updateBlades();
    this.updateArc();
    this.updatePulse();
    this.updateTrail();
    const shieldUp = isEvolved(g.run, "vitality") && g.now >= g.run.shieldReadyAt;
    this.shieldRing.setVisible(shieldUp).setPosition(g.player.x, g.player.y).setAlpha(0.5 + Math.sin(g.now * 0.006) * 0.25);
  }

  private updateBlaster() {
    const g = this.g;
    const run = g.run;
    const stats = run.stats;
    if (g.now < this.nextShot) return;
    const target = nearestEnemy(g, g.player.x, g.player.y, stats.range);
    if (!target) return;

    const venom = g.now < run.venomUntil;
    const damage = stats.damage * (venom ? 1.25 : 1);
    const color = venom ? COLORS.bulletVenom : COLORS.bullet;
    const base = Math.atan2(target.y - g.player.y, target.x - g.player.x);
    const n = stats.projectiles;
    const spread = 0.15;

    for (let i = 0; i < n; i += 1) {
      const a = base + (i - (n - 1) / 2) * spread;
      fireBullet(g, g.player.x, g.player.y, a, {
        damage,
        speed: stats.bulletSpeed,
        range: stats.range + 60,
        source: "blaster",
        color,
        pierce: stats.pierce,
        bounce: stats.bounce,
      });
    }

    run.volleys += 1;
    if (isEvolved(run, "cadence") && run.volleys % 5 === 0) {
      for (let i = 0; i < 12; i += 1) {
        fireBullet(g, g.player.x, g.player.y, base + (i / 12) * Math.PI * 2, {
          damage: damage * 0.8,
          speed: stats.bulletSpeed * 0.85,
          range: 380,
          source: "blaster",
          color: 0xfef9c3,
          pierce: stats.pierce,
          scale: 0.85,
        });
      }
    }

    g.player.setScale(g.playerScale * 0.92);
    g.tweens.add({ targets: g.player, scale: g.playerScale, duration: 90 });
    g.sfx("shoot");
    this.nextShot = g.now + stats.fireInterval;
  }

  private updateDrones(dt: number) {
    const g = this.g;
    const count = itemLevel(g.run, "drone");
    while (this.drones.length < count) {
      const sprite = g.add.image(g.player.x, g.player.y, "drone").setDisplaySize(30, 30).setDepth(DEPTH.player - 1);
      this.drones.push({ sprite, x: g.player.x, y: g.player.y, nextShot: g.now + 400 });
      g.fx.ring(g.player.x, g.player.y, 0xa78bfa, 60);
    }
    this.drones.forEach((drone, i) => {
      const a = g.now * 0.0014 + (i / this.drones.length) * Math.PI * 2;
      const tx = g.player.x + Math.cos(a) * 62;
      const ty = g.player.y + Math.sin(a) * 62;
      const k = 1 - Math.exp(-8 * dt);
      drone.x += (tx - drone.x) * k;
      drone.y += (ty - drone.y) * k;
      drone.sprite.setPosition(drone.x, drone.y).setRotation(g.now * 0.01);
      if (g.now < drone.nextShot) return;
      const target = nearestEnemy(g, drone.x, drone.y, 320);
      if (!target) return;
      fireBullet(g, drone.x, drone.y, Math.atan2(target.y - drone.y, target.x - drone.x), {
        damage: g.run.stats.damage * 0.6,
        speed: 620,
        range: 380,
        source: "drone",
        color: 0xc4b5fd,
        scale: 0.75,
      });
      drone.nextShot = g.now + 900;
    });
  }

  private updateBlades() {
    const g = this.g;
    const level = itemLevel(g.run, "blades");
    while (this.blades.length < level) {
      this.blades.push(g.add.image(g.player.x, g.player.y, "blade").setDisplaySize(26, 26).setDepth(DEPTH.player - 1));
    }
    if (level === 0) return;
    const damage = (1.6 + level * 0.8) * (g.run.stats.damage / 2);
    const radius = 92 + level * 4;
    this.blades.forEach((blade, i) => {
      const a = g.now * 0.0034 + (i / this.blades.length) * Math.PI * 2;
      const x = g.player.x + Math.cos(a) * radius;
      const y = g.player.y + Math.sin(a) * radius;
      blade.setPosition(x, y).setRotation(a + Math.PI / 2);
      g.enemyHash.query(x, y, 70, near);
      for (const e of near) {
        if (e.dead || dist2(x, y, e.x, e.y) > (e.radius + 14) ** 2) continue;
        if ((this.bladeHits.get(e.uid) ?? 0) > g.now) continue;
        this.bladeHits.set(e.uid, g.now + 420);
        g.damageEnemy(e, damage, "blade", a + Math.PI / 2, 120);
      }
    });
    if (this.bladeHits.size > 400) this.bladeHits.clear();
  }

  private updateArc() {
    const g = this.g;
    const level = itemLevel(g.run, "arc");
    if (level === 0 || g.now < this.nextArc) return;
    const first = nearestEnemy(g, g.player.x, g.player.y, 360);
    if (!first) return;
    const hit = new Set<number>();
    const points = [{ x: g.player.x, y: g.player.y }];
    const damage = (3 + level * 1.5) * (g.run.stats.damage / 2);
    let current: Enemy | null = first;
    for (let jumps = 0; current && jumps < 2 + level; jumps += 1) {
      hit.add(current.uid);
      points.push({ x: current.x, y: current.y });
      g.damageEnemy(current, damage, "arc", 0, 0);
      current = nearestEnemy(g, current.x, current.y, 230, hit);
    }
    g.fx.lightning(points, 0xa78bfa, g.now);
    g.sfx("zap");
    this.nextArc = g.now + Math.max(900, 2700 - level * 300);
  }

  private updatePulse() {
    const g = this.g;
    if (!isEvolved(g.run, "magnetism") || g.now < this.nextPulse) return;
    this.nextPulse = g.now + 6000;
    const radius = 220;
    g.fx.ring(g.player.x, g.player.y, 0x38bdf8, radius, 450);
    g.enemyHash.query(g.player.x, g.player.y, radius, near);
    for (const e of near) {
      if (e.dead || dist2(e.x, e.y, g.player.x, g.player.y) > radius * radius) continue;
      g.damageEnemy(e, 3 * (g.run.stats.damage / 2), "pulse", Math.atan2(e.y - g.player.y, e.x - g.player.x), 700);
    }
  }

  private updateTrail() {
    const g = this.g;
    const now = g.now;
    if (isEvolved(g.run, "mobility") && now < g.run.dashUntil && now > this.nextTrailDrop) {
      this.nextTrailDrop = now + 28;
      const sprite = g.add
        .image(g.player.x, g.player.y, "glow")
        .setTint(0x4ade80)
        .setBlendMode(BlendModes.ADD)
        .setDepth(DEPTH.hazard + 2)
        .setDisplaySize(70, 70);
      this.trail.push({ x: g.player.x, y: g.player.y, until: now + 1400, sprite });
    }
    const tick = now > this.nextTrailTick;
    if (tick) this.nextTrailTick = now + 200;
    const burned = new Set<number>();
    this.trail = this.trail.filter((seg) => {
      if (now > seg.until) {
        seg.sprite.destroy();
        return false;
      }
      seg.sprite.setAlpha((seg.until - now) / 1400);
      if (tick) {
        g.enemyHash.query(seg.x, seg.y, 60, near);
        for (const e of near) {
          if (e.dead || burned.has(e.uid) || dist2(seg.x, seg.y, e.x, e.y) > (e.radius + 30) ** 2) continue;
          burned.add(e.uid);
          g.damageEnemy(e, 2 * (g.run.stats.damage / 2), "trail", 0, 0);
        }
      }
      return true;
    });
  }
}
