import { LIMITS, PLAYER_RADIUS, SIGNAL, VIEW_H, VIEW_W } from "../config";
import type { GameScene } from "../scenes/GameScene";
import type { Enemy } from "../types";
import { angleDiff, clamp, dist2 } from "../utils";
import { orbit, type Ctx, type Steer } from "./enemyAI";
import { spawnEnemy } from "./enemies";
import { ceilAt, floorAt } from "./terrain";

/**
 * Bestiario 2: volanti (Picchiatore, Flak, Radar, Sanguisuga, Specchio,
 * Madre dello sciame, Mina vagante) e unità di terra della campagna
 * (Torre flak, Recinto laser, Ragno, Generatore di scudo, Hangar droni).
 */

const still: Steer = { mx: 0, my: 0, mul: 0 };

/** Movimento e attacchi dei nuovi volanti. Restituisce null se il nemico non è di questo gruppo. */
export const bestiary2Behavior = (g: GameScene, e: Enemy, c: Ctx): Steer | null => {
  const now = g.now;
  const t = g.telegraph;
  switch (e.def.id) {
    case "diver": {
      // Si piazza sopra la nave, annuncia la picchiata con la linea gialla e scende.
      if (e.state === "move") {
        const hx = g.player.x - e.x;
        const hy = g.player.y - 230 - e.y;
        if (Math.hypot(hx, hy) < 70 && now > e.nextAttack) {
          e.state = "windup";
          e.stateUntil = now + 700;
        }
        return { mx: hx, my: hy, mul: 1 };
      }
      if (e.state === "windup") {
        e.lockAngle = c.toPlayer;
        const progress = 1 - (e.stateUntil - now) / 700;
        t.lineStyle(6 + progress * 10, SIGNAL.charge, 0.15 + progress * 0.35);
        t.lineBetween(e.x, e.y, e.x + Math.cos(e.lockAngle) * 520, e.y + Math.sin(e.lockAngle) * 520);
        if (now >= e.stateUntil) {
          e.state = "dash";
          e.stateUntil = now + 520;
        }
        return still;
      }
      if (e.state === "dash") {
        if (Math.random() < 0.6) g.fx.trailDot(e.x, e.y, 0xf43f5e);
        if (now >= e.stateUntil) {
          e.state = "recover";
          e.stateUntil = now + 700;
        }
        return { mx: Math.cos(e.lockAngle), my: Math.sin(e.lockAngle), mul: 4.6 };
      }
      if (now >= e.stateUntil) {
        e.state = "move";
        e.nextAttack = now + 1600;
      }
      return { mx: 0, my: -1, mul: 0.6 };
    }
    case "flak": {
      // La granata si apre a fine corsa: spara anche da oltre la sua gittata.
      const p = e.def.projectile!;
      if (now > e.nextAttack && c.d < 600) {
        g.fireEnemyBullet(e, c.toPlayer, p);
        e.nextAttack = now + p.cooldown * (0.85 + Math.random() * 0.3);
      }
      return orbit(e, c, e.def.preferredDistance ?? 380);
    }
    case "radar": {
      // Cono di scansione rotante: chi ci sta dentro ricarica le armi più in fretta.
      const range = 300;
      const sweep = now * 0.003 + e.seed;
      t.lineStyle(2, SIGNAL.heal, 0.25);
      t.strokeCircle(e.x, e.y, range);
      t.lineStyle(3, SIGNAL.heal, 0.6);
      t.lineBetween(e.x, e.y, e.x + Math.cos(sweep) * range, e.y + Math.sin(sweep) * range);
      for (const o of g.enemies) {
        if (o === e || o.dead || !o.def.projectile || o.def.boss || o.def.part) continue;
        if (dist2(e.x, e.y, o.x, o.y) > range * range) continue;
        o.nextAttack -= c.dt * 1000 * 0.6;
        if (Math.random() < 0.02) g.fx.burst(o.x, o.y, SIGNAL.heal, 2);
      }
      return orbit(e, c, e.def.preferredDistance ?? 420);
    }
    case "leech": {
      if (e.state === "latched") {
        // Attaccata allo scafo: rallenta la nave e la consuma a intervalli.
        e.x = g.player.x + Math.cos(e.lockAngle) * (PLAYER_RADIUS + 8);
        e.y = g.player.y + Math.sin(e.lockAngle) * (PLAYER_RADIUS + 8);
        g.slowPlayer();
        t.lineStyle(3, SIGNAL.control, 0.7);
        t.strokeCircle(g.player.x, g.player.y, PLAYER_RADIUS + 14);
        if (now > e.nextAttack) {
          g.hurtPlayer(1);
          e.nextAttack = now + 2400;
        }
        return still;
      }
      if (c.d < e.radius + PLAYER_RADIUS) {
        e.state = "latched";
        e.lockAngle = Math.atan2(e.y - g.player.y, e.x - g.player.x);
        e.nextAttack = now + 1200;
        g.toast("Sanguisuga attaccata: abbattila!", "warning", "warning");
      }
      const wobble = Math.sin(now * 0.008 + e.seed) * 0.5;
      return { mx: c.ux - c.uy * wobble, my: c.uy + c.ux * wobble, mul: 1 };
    }
    case "mirror": {
      // Lo specchio si gira lentamente verso la nave: va aggirato.
      e.facing += clamp(angleDiff(e.facing, c.toPlayer), -1.3 * c.dt, 1.3 * c.dt);
      return { mx: c.ux, my: c.uy, mul: c.d < 200 ? 0.2 : 1 };
    }
    case "broodmother": {
      if (now > e.nextAttack && g.enemies.length < LIMITS.maxEnemies) {
        for (let i = 0; i < 3; i += 1) {
          const a = e.seed + i * 2.1;
          spawnEnemy(g, "swarm", e.x + Math.cos(a) * e.radius, e.y + Math.sin(a) * e.radius);
        }
        g.fx.ring(e.x, e.y, 0x84cc16, 80);
        e.nextAttack = now + 4500;
      }
      return orbit(e, c, e.def.preferredDistance ?? 420);
    }
    case "spaceMine": {
      if (e.state === "move" && c.d < 120) {
        e.state = "arming";
        e.stateUntil = now + 600;
      }
      if (e.state === "arming") {
        const progress = 1 - (e.stateUntil - now) / 600;
        t.fillStyle(SIGNAL.danger, 0.12 + progress * 0.2);
        t.fillCircle(e.x, e.y, 115 * progress);
        t.lineStyle(3, 0xfca5a5, 0.9);
        t.strokeCircle(e.x, e.y, 115);
        if (now >= e.stateUntil) g.explodeKamikaze(e);
        return still;
      }
      e.sprite.rotation += c.dt * 0.6;
      return { mx: c.ux, my: c.uy, mul: 1 };
    }
    default:
      return null;
  }
};

/**
 * Unità di terra del Bestiario 2 (chiamata dal movimento scritto).
 * Restituisce true se ha gestito l'attacco (niente colpo generico).
 */
export const groundTick = (g: GameScene, e: Enemy, dt: number, toPlayer: number): boolean => {
  const now = g.now;
  const t = g.telegraph;
  const camX = g.cameras.main.scrollX;
  const onScreen = e.x > camX && e.x < camX + VIEW_W;
  switch (e.def.id) {
    case "spider": {
      // Cammina sul terreno verso la nave, senza allontanarsi troppo dalla tana.
      const dir = Math.sign(g.player.x - e.x);
      if (Math.abs(g.player.x - e.x) > 30) e.x = clamp(e.x + dir * e.speed * dt, e.homeX - 380, e.homeX + 380);
      e.sprite.setScale(e.scale * (1 + Math.sin(now * 0.02) * 0.04), e.scale);
      const p = e.def.projectile!;
      if (onScreen && now > e.nextAttack) {
        for (const off of [-0.22, 0, 0.22]) g.fireEnemyBullet(e, toPlayer + off, p);
        e.nextAttack = now + p.cooldown * (0.8 + Math.random() * 0.4);
      }
      return true;
    }
    case "laserPylon": {
      if (!onScreen) return true;
      const terrain = g.arena.terrain;
      const toY = e.anchor === "floor" ? (terrain ? Math.max(0, ceilAt(terrain, e.x)) : 0) : terrain ? Math.min(VIEW_H, floorAt(terrain, e.x)) : VIEW_H;
      const cycle = (now + e.seed * 9) % 4400;
      if (cycle < 1000) {
        t.lineStyle(1 + (cycle / 1000) * 3, SIGNAL.charge, 0.3 + (cycle / 1000) * 0.5);
        t.lineBetween(e.x, e.y, e.x, toY);
      } else if (cycle < 2200) {
        t.lineStyle(18, SIGNAL.danger, 0.3);
        t.lineBetween(e.x, e.y, e.x, toY);
        t.lineStyle(5, 0xffffff, 0.95);
        t.lineBetween(e.x, e.y, e.x, toY);
        const top = Math.min(e.y, toY);
        const bottom = Math.max(e.y, toY);
        if (Math.abs(g.player.x - e.x) < PLAYER_RADIUS + 6 && g.player.y > top && g.player.y < bottom) g.hurtPlayer(e.damage);
      }
      return true;
    }
    case "shieldGen": {
      const range = 280;
      t.lineStyle(2, SIGNAL.shield, 0.3 + Math.sin(now * 0.004) * 0.1);
      t.strokeCircle(e.x, e.y, range);
      for (const o of g.enemies) {
        if (o === e || o.dead || !(o.anchor || o.def.structure) || dist2(e.x, e.y, o.x, o.y) > range * range) continue;
        o.protectedUntil = now + 200;
        t.lineStyle(2, SIGNAL.shield, 0.55);
        t.lineBetween(e.x, e.y, o.x, o.y);
      }
      return true;
    }
    case "droneHangar": {
      if (onScreen && now > e.nextAttack && g.enemies.length < LIMITS.maxEnemies) {
        const dy = e.anchor === "floor" ? -40 : 40;
        for (const side of [-1, 1]) spawnEnemy(g, "interceptor", e.x + side * 24, e.y + dy, { small: true });
        g.fx.ring(e.x, e.y, 0x94a3b8, 70);
        e.nextAttack = now + 5500;
      }
      return true;
    }
    default:
      return false;
  }
};
