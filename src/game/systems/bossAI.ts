import { LIMITS, SIGNAL } from "../config";
import type { GameScene } from "../scenes/GameScene";
import type { Enemy, EnemyId } from "../types";
import { rand } from "../utils";
import { fireAimed, orbit, type Ctx, type Steer } from "./enemyAI";
import { spawnEnemy } from "./enemies";

/**
 * Boss a rotazione (Serpente, Fortezza orbitale, Regina dello sciame),
 * mini-boss della campagna (Posamine, Corazzata) e loro parti.
 */

const still: Steer = { mx: 0, my: 0, mul: 0 };

/** Fasi extra dei boss nella campagna infinita: timer più corti. */
const pace = (e: Enemy) => 1 / (1 + 0.15 * e.bossTier);

const phaseOf = (e: Enemy) => {
  const ratio = e.hp / e.maxHp;
  return ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
};

/** Aggiorna la fase e la annuncia. Restituisce la fase corrente. */
const trackPhase = (g: GameScene, e: Enemy) => {
  const phase = phaseOf(e);
  if (phase !== e.bossPhase) {
    e.bossPhase = phase;
    e.state = "move";
    e.nextAttack = g.now + 900;
    g.onBossPhase(phase, e);
  }
  return phase;
};

const radial = (g: GameScene, e: Enemy, count: number, offset: number, speedMul = 1) => {
  const p = e.def.projectile!;
  for (let i = 0; i < count; i += 1) g.fireEnemyBullet(e, offset + (i / count) * Math.PI * 2, p, speedMul);
};

const partsOf = (g: GameScene, e: Enemy) => g.enemies.filter((o) => o.owner === e && !o.dead);

/**
 * Moltiplicatore del danno subito: corazze legate a parti o fasi.
 * - Corazzata: 15% finché un punto debole è acceso.
 * - Serpente: 30% finché restano più di 3 segmenti.
 * - Fortezza: 25% da chiusa, 160% con il nucleo aperto.
 */
export const armorMul = (g: GameScene, e: Enemy) => {
  switch (e.def.id) {
    case "battleship":
      return partsOf(g, e).length > 0 ? 0.15 : 1;
    case "serpent":
      return partsOf(g, e).length > 3 ? 0.3 : 1;
    case "fortress":
      return e.state === "open" ? 1.6 : 0.25;
    default:
      return 1;
  }
};

// ---------- Boss ----------

export const bossBehavior = (g: GameScene, e: Enemy, c: Ctx): Steer | null => {
  switch (e.def.id) {
    case "serpent":
      return serpent(g, e, c);
    case "fortress":
      return fortress(g, e, c);
    case "queen":
      return queen(g, e, c);
    case "serpentSegment":
      return segment(g, e, c);
    case "weakpoint":
      return weakpoint(g, e, c);
    default:
      return null;
  }
};

const SEGMENT_GAP = 5;

const serpent = (g: GameScene, e: Enemy, c: Ctx): Steer => {
  const now = g.now;
  if (!e.trail) {
    // Primo aggiornamento: nasce la coda di segmenti.
    e.trail = [];
    const count = 8 + Math.min(4, e.bossTier);
    for (let i = 0; i < count; i += 1) {
      const s = spawnEnemy(g, "serpentSegment", e.x, e.y, { owner: e, bossTier: e.bossTier });
      s.auxX = i;
      // Ogni segmento vale circa il 9% della testa.
      s.maxHp = s.hp = e.maxHp * 0.09;
    }
  }
  const last = e.trail[0];
  if (!last || Math.hypot(last.x - e.x, last.y - e.y) > 8) {
    e.trail.unshift({ x: e.x, y: e.y });
    if (e.trail.length > 16 * SEGMENT_GAP) e.trail.pop();
  }
  const phase = trackPhase(g, e);
  const p = e.def.projectile!;
  if (now > e.nextAttack) {
    for (const off of phase === 3 ? [-0.3, -0.15, 0, 0.15, 0.3] : [-0.15, 0, 0.15]) g.fireEnemyBullet(e, c.toPlayer + off, p);
    e.nextAttack = now + p.cooldown * pace(e);
  }
  if (phase === 3 && now > e.stateUntil) {
    radial(g, e, 12, now * 0.001);
    e.stateUntil = now + 2600 * pace(e);
  }
  e.sprite.rotation = Math.atan2(e.y - (e.trail[2]?.y ?? e.y), e.x - (e.trail[2]?.x ?? e.x - 1)) + Math.PI / 2;
  // Avanza ondeggiando verso la nave, tenendosi a distanza.
  const wobble = Math.sin(now * 0.002 + e.seed) * 1.1;
  const away = c.d < 220 ? -1 : 1;
  return { mx: c.ux * away - c.uy * wobble, my: c.uy * away + c.ux * wobble, mul: phase === 1 ? 1 : phase === 2 ? 1.35 : 1.55 };
};

const segment = (g: GameScene, e: Enemy, c: Ctx): Steer => {
  const head = e.owner;
  if (!head || head.dead) return still;
  const point = head.trail?.[Math.min((head.trail.length || 1) - 1, (e.auxX + 1) * SEGMENT_GAP)];
  if (point) {
    e.x = point.x;
    e.y = point.y;
  }
  e.sprite.rotation += c.dt * 0.8;
  const p = e.def.projectile!;
  if (g.now > e.nextAttack && c.d < p.range) {
    g.fireEnemyBullet(e, c.toPlayer, p);
    e.nextAttack = g.now + p.cooldown * (0.7 + Math.random() * 0.6) * pace(head);
  }
  // Collegamento verde verso la testa finché la corazza regge.
  if (armorMul(g, head) < 1) {
    g.telegraph.lineStyle(2, SIGNAL.heal, 0.25);
    g.telegraph.lineBetween(e.x, e.y, head.x, head.y);
  }
  return still;
};

const fortress = (g: GameScene, e: Enemy, c: Ctx): Steer => {
  const now = g.now;
  const t = g.telegraph;
  const phase = trackPhase(g, e);
  const p = e.def.projectile!;
  const openEvery = (phase === 3 ? 7500 : 6000) * pace(e);
  if (e.stateUntil === 0) e.stateUntil = now + openEvery;

  if (e.state === "move" && now >= e.stateUntil) {
    e.state = "windup";
    e.stateUntil = now + 900;
  }
  if (e.state === "windup") {
    const progress = 1 - (e.stateUntil - now) / 900;
    t.lineStyle(4, SIGNAL.charge, 0.5 + progress * 0.4);
    t.strokeCircle(e.x, e.y, e.radius * (2.4 - progress * 1.2));
    if (now >= e.stateUntil) {
      e.state = "open";
      e.stateUntil = now + 3200;
      g.fx.ring(e.x, e.y, SIGNAL.charge, e.radius * 2);
      g.sfx("shield");
    }
  } else if (e.state === "open") {
    // Nucleo esposto: niente cannoni, solo il bagliore giallo.
    t.fillStyle(SIGNAL.charge, 0.18 + Math.sin(now * 0.02) * 0.08);
    t.fillCircle(e.x, e.y, e.radius * 0.9);
    if (now >= e.stateUntil) {
      e.state = "move";
      e.stateUntil = now + openEvery;
    }
  } else {
    // Chiusa: cannoni rotanti a flusso continuo.
    const streams = phase === 1 ? 2 : 4;
    if (now > e.nextAttack) {
      e.spiral += 0.17;
      for (let i = 0; i < streams; i += 1) g.fireEnemyBullet(e, e.spiral + (i / streams) * Math.PI * 2, p, 0.9);
      e.nextAttack = now + 150 / pace(e) ** 0.5;
    }
    if (phase >= 2 && now > e.auxY) {
      for (const off of [-0.2, 0, 0.2]) g.fireEnemyBullet(e, c.toPlayer + off, p, 1.2);
      e.auxY = now + 2200 * pace(e);
    }
  }
  e.sprite.rotation += c.dt * (e.state === "open" ? 0 : 0.25);
  // Si avvicina lentamente fino a entrare nella mischia (resta a portata delle armi automatiche).
  return c.d > 250 ? { mx: c.ux, my: c.uy, mul: c.d > 500 ? 1.2 : 0.7 } : still;
};

const queen = (g: GameScene, e: Enemy, c: Ctx): Steer => {
  const now = g.now;
  const t = g.telegraph;
  const phase = trackPhase(g, e);
  const p = e.def.projectile!;
  const crowded = g.enemies.length >= LIMITS.maxEnemies;

  // Ondate di sciami (timer su auxX) e uova (timer su auxY).
  if (now > e.auxX && !crowded) {
    const count = phase === 3 ? 6 : 4;
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2;
      spawnEnemy(g, "swarm", e.x + Math.cos(a) * 70, e.y + Math.sin(a) * 70);
    }
    g.fx.ring(e.x, e.y, 0xa3e635, 110);
    e.auxX = now + (phase === 3 ? 3200 : 5200) * pace(e);
  }
  if (phase >= 2 && now > e.auxY && !crowded) {
    if (g.enemies.filter((o) => o.def.id === "broodmother" && !o.dead).length < 2) spawnEnemy(g, "broodmother", e.x, e.y + 40, { small: true });
    e.auxY = now + 9000 * pace(e);
  }
  if (phase === 3 && now > e.stateUntil && e.state === "move") {
    radial(g, e, 16, now * 0.0013);
    e.stateUntil = now + 2400 * pace(e);
  }

  if (phase === 1) {
    if (now > e.nextAttack) {
      for (const off of [-0.2, 0, 0.2]) g.fireEnemyBullet(e, c.toPlayer + off, p);
      e.nextAttack = now + p.cooldown * pace(e);
    }
    return orbit(e, c, 340);
  }

  // Fasi 2-3: cariche telegrafate.
  if (e.state === "move") {
    if (now > e.nextAttack) {
      e.state = "windup";
      e.lockAngle = c.toPlayer;
      e.spiral = now + 750;
    }
    return orbit(e, c, 320);
  }
  if (e.state === "windup") {
    const progress = 1 - (e.spiral - now) / 750;
    t.lineStyle(30, SIGNAL.charge, 0.12 + progress * 0.3);
    t.lineBetween(e.x, e.y, e.x + Math.cos(e.lockAngle) * 600, e.y + Math.sin(e.lockAngle) * 600);
    if (now >= e.spiral) {
      e.state = "dash";
      e.spiral = now + 520;
    }
    return still;
  }
  if (e.state === "dash") {
    if (Math.random() < 0.7) g.fx.trailDot(e.x, e.y, 0xa3e635);
    if (now >= e.spiral) {
      e.state = "move";
      e.nextAttack = now + 2600 * pace(e);
      for (const off of [-0.25, 0, 0.25]) g.fireEnemyBullet(e, c.toPlayer + off, p);
    }
    return { mx: Math.cos(e.lockAngle), my: Math.sin(e.lockAngle), mul: 4.4 };
  }
  e.state = "move";
  return still;
};

// ---------- Mini-boss (movimento scritto della campagna) ----------

/** Restituisce true se ha gestito l'attacco del mini-boss. */
export const miniBossAttack = (g: GameScene, e: Enemy, toPlayer: number): boolean => {
  const now = g.now;
  const p = e.def.projectile!;
  if (e.def.id === "minelayer") {
    if (now > e.nextAttack) {
      for (const off of [-0.4, -0.2, 0, 0.2, 0.4]) g.fireEnemyBullet(e, toPlayer + off, p);
      e.nextAttack = now + p.cooldown;
    }
    if (now > e.stateUntil) {
      // Semina mine vaganti attorno a sé (massimo 8 in campo).
      if (g.enemies.filter((o) => o.def.id === "spaceMine" && !o.dead).length < 8) {
        for (let i = 0; i < 2; i += 1) spawnEnemy(g, "spaceMine", e.x - 40 - rand(0, 60), e.y + (i ? 50 : -50));
      }
      g.fx.ring(e.x, e.y, SIGNAL.danger, 80);
      e.stateUntil = now + 3500;
    }
    return true;
  }
  if (e.def.id === "battleship") {
    if (e.spiral === 0) {
      e.spiral = 1;
      for (const side of [-1, 1]) {
        const w = spawnEnemy(g, "weakpoint", e.x, e.y + side * 60, { owner: e });
        w.auxX = -10;
        w.auxY = side * 62;
      }
    }
    const armored = partsOf(g, e).length > 0;
    if (now > e.nextAttack) {
      for (const off of [-0.16, 0, 0.16]) g.fireEnemyBullet(e, toPlayer + off, p);
      e.nextAttack = now + (armored ? 1700 : 1100);
    }
    if (now > e.stateUntil) {
      radial(g, e, armored ? 10 : 16, now * 0.001, 0.85);
      g.fx.ring(e.x, e.y, 0x38bdf8, 100);
      e.stateUntil = now + (armored ? 5000 : 3200);
    }
    return true;
  }
  return false;
};

/** Punto debole della Corazzata: segue la nave madre e la collega con un raggio ciano. */
const weakpoint = (g: GameScene, e: Enemy, c: Ctx): Steer => {
  const owner = e.owner;
  if (!owner || owner.dead) return still;
  e.x = owner.x + e.auxX;
  e.y = owner.y + e.auxY;
  g.telegraph.lineStyle(3, SIGNAL.shield, 0.5 + Math.sin(g.now * 0.01) * 0.2);
  g.telegraph.lineBetween(e.x, e.y, owner.x, owner.y);
  fireAimed(g, e, c);
  return still;
};

/** Boss del survival a rotazione: Dreadnought, Serpente, Fortezza, Regina. */
export const BOSS_ROTATION: EnemyId[] = ["boss", "serpent", "fortress", "queen"];
