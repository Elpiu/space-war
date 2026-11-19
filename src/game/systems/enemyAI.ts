import { PLAYER_RADIUS, SIGNAL } from "../config";
import type { GameScene } from "../scenes/GameScene";
import type { Enemy } from "../types";
import { angleDiff, clamp, dist2, rand } from "../utils";

/** Movimento scelto da un comportamento: direzione e moltiplicatore di velocità. */
export interface Steer {
  mx: number;
  my: number;
  mul: number;
}

export interface Ctx {
  d: number;
  ux: number;
  uy: number;
  toPlayer: number;
  dt: number;
}

/** Distanza fra un punto e un segmento (per i raggi laser). */
const pointSegmentDistance = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
  const vx = bx - ax;
  const vy = by - ay;
  const t = clamp(((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1), 0, 1);
  return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
};

/** Gira intorno alla nave mantenendo una distanza preferita. */
export const orbit = (e: Enemy, c: Ctx, distance: number): Steer => {
  const side = e.seed > 500 ? 1 : -1;
  if (c.d > distance * 1.15) return { mx: c.ux, my: c.uy, mul: 1 };
  if (c.d < distance * 0.8) return { mx: -c.ux, my: -c.uy, mul: 1 };
  return { mx: -c.uy * side, my: c.ux * side, mul: 0.7 };
};

// ---------- Attacchi condivisi (IA e traiettorie della campagna) ----------

/**
 * Drone laser: carica (linea gialla sottile, 900 ms), spara (raggio rosso,
 * 600 ms) lungo la direzione bloccata all'inizio della carica, poi recupera.
 */
export const laserAttack = (g: GameScene, e: Enemy, toPlayer: number) => {
  const now = g.now;
  const t = g.telegraph;
  const length = 1100;
  const end = () => ({ x: e.x + Math.cos(e.lockAngle) * length, y: e.y + Math.sin(e.lockAngle) * length });
  if (e.state === "move" && now > e.nextAttack) {
    e.state = "windup";
    e.stateUntil = now + 900;
    e.lockAngle = toPlayer;
  }
  if (e.state === "windup") {
    const p = end();
    const progress = 1 - (e.stateUntil - now) / 900;
    t.lineStyle(1 + progress * 3, SIGNAL.charge, 0.35 + progress * 0.5);
    t.lineBetween(e.x, e.y, p.x, p.y);
    if (now >= e.stateUntil) {
      e.state = "dash";
      e.stateUntil = now + 600;
      g.sfx("zap");
    }
    return true;
  }
  if (e.state === "dash") {
    const p = end();
    t.lineStyle(16, SIGNAL.danger, 0.35);
    t.lineBetween(e.x, e.y, p.x, p.y);
    t.lineStyle(5, 0xffffff, 0.95);
    t.lineBetween(e.x, e.y, p.x, p.y);
    if (pointSegmentDistance(g.player.x, g.player.y, e.x, e.y, p.x, p.y) < PLAYER_RADIUS + 8) g.hurtPlayer(e.damage);
    if (now >= e.stateUntil) {
      e.state = "recover";
      e.stateUntil = now + 1500;
    }
    return true;
  }
  if (e.state === "recover" && now >= e.stateUntil) {
    e.state = "move";
    e.nextAttack = now + 600;
  }
  return false;
};

/** Boss, mini-boss e strutture non ricevono cure né scudi: resterebbero immortali. */
const supportable = (o: Enemy) => !o.def.boss && !o.def.miniBoss && !o.def.part && !o.def.structure;

/** Riparatore e Scudiero: effetti sugli alleati vicini. */
export const supportTick = (g: GameScene, e: Enemy) => {
  const now = g.now;
  if (e.def.id === "repairer" && now > e.nextAttack) {
    let healed = 0;
    for (const o of g.enemies) {
      if (o === e || o.dead || !supportable(o) || o.hp >= o.maxHp || dist2(e.x, e.y, o.x, o.y) > 190 * 190) continue;
      o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.18);
      g.fx.burst(o.x, o.y, SIGNAL.heal, 4);
      healed += 1;
    }
    if (healed) g.fx.ring(e.x, e.y, SIGNAL.heal, 190);
    e.nextAttack = now + 2000;
  }
  if (e.def.id === "shieldBearer") {
    const t = g.telegraph;
    t.lineStyle(2, SIGNAL.shield, 0.35);
    t.strokeCircle(e.x, e.y, 190);
    for (const o of g.enemies) {
      if (o === e || o.dead || !supportable(o) || dist2(e.x, e.y, o.x, o.y) > 190 * 190) continue;
      o.protectedUntil = now + 200;
      t.lineStyle(2, SIGNAL.shield, 0.6);
      t.lineBetween(e.x, e.y, o.x, o.y);
    }
  }
};

/** Affissi élite con effetto continuo (rigenerazione, fasi fantasma). */
export const affixTick = (g: GameScene, e: Enemy, dt: number) => {
  if (e.affix === "regen" && e.hp < e.maxHp) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.03 * dt);
  if (e.affix === "phantom" || e.def.id === "phantom") {
    // Ciclo di 4 s: 1,4 s intangibile, con un breve preavviso a intermittenza.
    const cycle = (g.now + e.seed * 7) % 4000;
    const wasIntangible = e.intangible;
    e.intangible = cycle < 1400;
    const warning = cycle >= 3600;
    e.sprite.setAlpha(e.intangible ? 0.22 : warning && Math.floor(g.now / 90) % 2 ? 0.6 : 1);
    if (wasIntangible !== e.intangible) g.fx.burst(e.x, e.y, 0xe2e8f0, 5);
  }
};

// ---------- Comportamenti di movimento dei nuovi nemici ----------

export const extraBehavior = (g: GameScene, e: Enemy, c: Ctx): Steer | null => {
  const now = g.now;
  switch (e.def.id) {
    case "interceptor": {
      // Molto veloce ma con virata limitata: schivando di lato sfila via.
      e.facing += clamp(angleDiff(e.facing, c.toPlayer), -2.2 * c.dt, 2.2 * c.dt);
      e.sprite.rotation = e.facing + Math.PI / 2;
      return { mx: Math.cos(e.facing), my: Math.sin(e.facing), mul: 1 };
    }
    case "zigzag": {
      const w = Math.sign(Math.sin(now * 0.004 + e.seed)) * 0.95;
      fireAimed(g, e, c);
      return { mx: c.ux - c.uy * w, my: c.uy + c.ux * w, mul: 1 };
    }
    case "bomber":
    case "missilePod": {
      fireAimed(g, e, c);
      return orbit(e, c, e.def.preferredDistance ?? 320);
    }
    case "laserDrone": {
      const busy = laserAttack(g, e, c.toPlayer);
      return busy ? { mx: 0, my: 0, mul: 0 } : orbit(e, c, e.def.preferredDistance ?? 360);
    }
    case "repairer": {
      supportTick(g, e);
      // Si tiene dietro agli alleati, lontano dalla nave.
      let ax = 0;
      let ay = 0;
      let n = 0;
      for (const o of g.enemies) {
        if (o === e || o.dead || dist2(e.x, e.y, o.x, o.y) > 500 * 500) continue;
        ax += o.x;
        ay += o.y;
        n += 1;
      }
      if (c.d < 260 || n === 0) return orbit(e, c, e.def.preferredDistance ?? 320);
      const tx = ax / n - c.ux * 120;
      const ty = ay / n - c.uy * 120;
      return { mx: tx - e.x, my: ty - e.y, mul: 0.8 };
    }
    case "shieldBearer":
      supportTick(g, e);
      return { mx: c.ux, my: c.uy, mul: 1 };
    case "gravityWell": {
      if (c.d < 330) {
        const pull = 110 * (1 - c.d / 330) * c.dt;
        g.player.x -= c.ux * pull;
        g.player.y -= c.uy * pull;
        if (Math.random() < 0.3) g.fx.trailDot(g.player.x, g.player.y, SIGNAL.control);
      }
      const t = g.telegraph;
      const pulse = (now * 0.2) % 330;
      t.lineStyle(2, SIGNAL.control, 0.25);
      t.strokeCircle(e.x, e.y, 330);
      t.lineStyle(2, SIGNAL.control, 0.45 * (pulse / 330));
      t.strokeCircle(e.x, e.y, 330 - pulse);
      return { mx: c.ux, my: c.uy, mul: 1 };
    }
    case "empDrone": {
      if (c.d < 230) {
        g.jamPlayer();
        const t = g.telegraph;
        t.lineStyle(2, SIGNAL.control, 0.5 + Math.sin(now * 0.02) * 0.3);
        t.strokeCircle(e.x, e.y, 230);
      }
      return { mx: c.ux, my: c.uy, mul: c.d < 140 ? 0.3 : 1 };
    }
    case "teleporter": {
      const t = g.telegraph;
      if (e.state === "move" && now > e.nextAttack) {
        e.state = "windup";
        e.stateUntil = now + 650;
        const a = rand(0, Math.PI * 2);
        const r = rand(170, 240);
        e.auxX = g.player.x + Math.cos(a) * r;
        e.auxY = g.player.y + Math.sin(a) * r;
      }
      if (e.state === "windup") {
        const progress = 1 - (e.stateUntil - now) / 650;
        t.lineStyle(3, SIGNAL.warp, 0.4 + progress * 0.5);
        t.strokeCircle(e.auxX, e.auxY, 40 - progress * 20);
        if (now >= e.stateUntil) {
          g.fx.burst(e.x, e.y, SIGNAL.warp, 10);
          e.x = e.auxX;
          e.y = e.auxY;
          g.fx.ring(e.x, e.y, SIGNAL.warp, 70);
          const p = e.def.projectile;
          if (p) for (let i = 0; i < 6; i += 1) g.fireEnemyBullet(e, (i / 6) * Math.PI * 2, p);
          e.state = "move";
          e.nextAttack = now + 3200;
        }
        return { mx: 0, my: 0, mul: 0 };
      }
      return orbit(e, c, 260);
    }
    case "phantom":
    case "splitter":
      return { mx: c.ux, my: c.uy, mul: 1 };
    default:
      return null;
  }
};

/** Colpo mirato periodico (con eventuale parabola o ricerca dal ProjectileDef). */
export const fireAimed = (g: GameScene, e: Enemy, c: Ctx) => {
  const p = e.def.projectile;
  if (!p || g.now < e.nextAttack || c.d > p.range) return;
  g.fireEnemyBullet(e, c.toPlayer, p);
  e.nextAttack = g.now + p.cooldown * (0.85 + Math.random() * 0.3);
};
