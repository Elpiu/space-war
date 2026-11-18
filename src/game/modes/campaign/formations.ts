import type { GameScene } from "../../scenes/GameScene";
import { spawnEnemy } from "../../systems/enemies";
import type { AffixId, EnemyId } from "../../types";
import { clamp, pick, rand, randInt } from "../../utils";
import type { SegmentKind } from "./level";

export interface FormationContext {
  g: GameScene;
  /** X di ingresso (appena fuori dal bordo destro). */
  x: number;
  /** Spazio libero verticale all'ingresso. */
  top: number;
  bottom: number;
  tier: number;
  elite: () => AffixId | undefined;
}

export interface Formation {
  id: string;
  segments: SegmentKind[];
  minTier: number;
  weight: number;
  /** Crea l'ondata e restituisce il tipo principale (per i suggerimenti). */
  spawn(ctx: FormationContext): EnemyId;
}

const midY = (c: FormationContext) => rand(c.top + 40, Math.max(c.top + 40, c.bottom - 40));

/**
 * Ondate della campagna. Le formazioni seguono traiettorie scritte; alcune
 * ondate usano ancora l'IA del survival per variare (inseguitori, kamikaze).
 */
export const FORMATIONS: Formation[] = [
  {
    id: "sine-swarm",
    segments: ["open", "debris", "cave", "surface"],
    minTier: 1,
    weight: 5,
    spawn: (c) => {
      const y0 = midY(c);
      const amp = clamp((c.bottom - c.top) / 2 - 30, 40, 120);
      const count = 5 + Math.floor(c.tier / 2);
      for (let i = 0; i < count; i += 1) {
        spawnEnemy(c.g, "swarm", c.x + i * 60, y0, {
          path: { kind: "sine", t: 0, x0: c.x + i * 60, y0: clamp(y0, c.top + amp, c.bottom - amp), speed: 150 + c.tier * 10, amp, freq: 2.6, phase: i * 0.55 },
        });
      }
      return "swarm";
    },
  },
  {
    id: "vee",
    segments: ["open", "surface", "station"],
    minTier: 1,
    weight: 4,
    spawn: (c) => {
      const y0 = clamp(midY(c), c.top + 90, c.bottom - 90);
      for (let i = 0; i < 5; i += 1) {
        const x0 = c.x + Math.abs(i - 2) * 55;
        const y = y0 + (i - 2) * 45;
        spawnEnemy(c.g, "chaser", x0, y, {
          affix: i === 2 ? c.elite() : undefined,
          path: { kind: "straight", t: 0, x0, y0: y, speed: 170 + c.tier * 10 },
        });
      }
      return "chaser";
    },
  },
  {
    id: "dive",
    segments: ["open", "surface", "debris"],
    minTier: 2,
    weight: 3,
    spawn: (c) => {
      const fromTop = Math.random() < 0.5;
      const count = randInt(2, 3);
      for (let i = 0; i < count; i += 1) {
        const x0 = c.x + i * 90;
        const y0 = fromTop ? c.top + 20 : c.bottom - 20;
        spawnEnemy(c.g, "charger", x0, y0, {
          affix: i === 0 ? c.elite() : undefined,
          path: { kind: "dive", t: 0, x0, y0, speed: 240, targetY: clamp(c.g.player.y, c.top + 30, c.bottom - 30) },
        });
      }
      return "charger";
    },
  },
  {
    id: "gunline",
    segments: ["surface", "station", "open"],
    minTier: 2,
    weight: 3,
    spawn: (c) => {
      const count = 2 + Math.floor(c.tier / 2);
      for (let i = 0; i < count; i += 1) {
        const y0 = c.top + ((i + 1) / (count + 1)) * (c.bottom - c.top);
        spawnEnemy(c.g, "shooter", c.x + i * 40, y0, {
          affix: i === 0 ? c.elite() : undefined,
          path: { kind: "hold", t: 0, x0: c.x, y0, speed: 170, holdAt: rand(0.62, 0.85), holdFor: 4500, exitY: y0 < 360 ? -1 : 1 },
        });
      }
      return "shooter";
    },
  },
  {
    id: "sniper-post",
    segments: ["station", "surface"],
    minTier: 3,
    weight: 2,
    spawn: (c) => {
      const y0 = midY(c);
      spawnEnemy(c.g, "sniper", c.x, y0, {
        affix: c.elite(),
        path: { kind: "hold", t: 0, x0: c.x, y0, speed: 150, holdAt: 0.88, holdFor: 6500, exitY: y0 < 360 ? -1 : 1 },
      });
      return "sniper";
    },
  },
  {
    id: "kamikaze-rain",
    segments: ["debris", "open"],
    minTier: 2,
    weight: 3,
    spawn: (c) => {
      for (let i = 0; i < 3; i += 1) spawnEnemy(c.g, "kamikaze", c.x + i * 50, midY(c));
      return "kamikaze";
    },
  },
  {
    id: "shield-wall",
    segments: ["debris", "station"],
    minTier: 3,
    weight: 2,
    spawn: (c) => {
      for (let i = 0; i < 2; i += 1) spawnEnemy(c.g, "shielded", c.x + i * 40, midY(c), { affix: c.elite() });
      return "shielded";
    },
  },
  {
    id: "convoy",
    segments: ["open", "debris", "surface"],
    minTier: 1,
    weight: 1.4,
    spawn: (c) => {
      if (c.g.enemies.some((e) => e.def.id === "cargo" && !e.dead)) return "chaser";
      const y0 = clamp(midY(c), c.top + 110, c.bottom - 110);
      spawnEnemy(c.g, "cargo", c.x + 60, y0, { path: { kind: "straight", t: 0, x0: c.x + 60, y0, speed: 70 } });
      for (const side of [-1, 1]) {
        spawnEnemy(c.g, "chaser", c.x, y0 + side * 85, {
          path: { kind: "sine", t: 0, x0: c.x, y0: y0 + side * 85, speed: 70, amp: 25, freq: 3, phase: side },
        });
      }
      return "cargo";
    },
  },
  {
    id: "chaser-pack",
    segments: ["open", "debris", "surface", "cave", "station"],
    minTier: 1,
    weight: 2,
    spawn: (c) => {
      const count = randInt(2, 2 + Math.floor(c.tier / 2));
      for (let i = 0; i < count; i += 1) spawnEnemy(c.g, "chaser", c.x + i * 40, midY(c), { affix: i === 0 ? c.elite() : undefined });
      return "chaser";
    },
  },
  {
    id: "brute",
    segments: ["surface", "debris"],
    minTier: 3,
    weight: 1.5,
    spawn: (c) => {
      spawnEnemy(c.g, "brute", c.x, midY(c), { affix: c.elite() });
      return "brute";
    },
  },
  {
    id: "carrier",
    segments: ["open"],
    minTier: 4,
    weight: 1,
    spawn: (c) => {
      spawnEnemy(c.g, "carrier", c.x + 40, midY(c));
      return "carrier";
    },
  },

  // ---------- Bestiario v3 ----------
  {
    id: "interceptor-wing",
    segments: ["open", "debris", "surface"],
    minTier: 1,
    weight: 2.5,
    spawn: (c) => {
      const y0 = midY(c);
      for (let i = 0; i < 3; i += 1) {
        const y = clamp(y0 + (i - 1) * 60, c.top + 20, c.bottom - 20);
        spawnEnemy(c.g, "interceptor", c.x + i * 120, y, { path: { kind: "straight", t: 0, x0: c.x + i * 120, y0: y, speed: 340 } });
      }
      return "interceptor";
    },
  },
  {
    id: "zigzag-line",
    segments: ["open", "cave", "surface"],
    minTier: 2,
    weight: 2.5,
    spawn: (c) => {
      const y0 = midY(c);
      for (let i = 0; i < 4; i += 1) {
        spawnEnemy(c.g, "zigzag", c.x + i * 70, y0, {
          affix: i === 0 ? c.elite() : undefined,
          path: { kind: "sine", t: 0, x0: c.x + i * 70, y0, speed: 150, amp: clamp((c.bottom - c.top) / 3, 30, 90), freq: 6, phase: i * 1.5 },
        });
      }
      return "zigzag";
    },
  },
  {
    id: "splitters",
    segments: ["open", "debris", "cave"],
    minTier: 2,
    weight: 2,
    spawn: (c) => {
      for (let i = 0; i < 2; i += 1) spawnEnemy(c.g, "splitter", c.x + i * 60, midY(c), { affix: i === 0 ? c.elite() : undefined });
      return "splitter";
    },
  },
  {
    id: "bomber-run",
    segments: ["surface", "open"],
    minTier: 2,
    weight: 2,
    spawn: (c) => {
      for (let i = 0; i < 2; i += 1) {
        const y = c.top + 30 + i * 30;
        spawnEnemy(c.g, "bomber", c.x + i * 160, y, { path: { kind: "straight", t: 0, x0: c.x + i * 160, y0: y, speed: 115 } });
      }
      return "bomber";
    },
  },
  {
    id: "missile-battery",
    segments: ["surface", "open", "station"],
    minTier: 3,
    weight: 1.8,
    spawn: (c) => {
      const y0 = midY(c);
      spawnEnemy(c.g, "missilePod", c.x, y0, {
        affix: c.elite(),
        path: { kind: "hold", t: 0, x0: c.x, y0, speed: 130, holdAt: 0.86, holdFor: 7000, exitY: y0 < 360 ? -1 : 1 },
      });
      return "missilePod";
    },
  },
  {
    id: "laser-post",
    segments: ["station", "cave", "open"],
    minTier: 3,
    weight: 2,
    spawn: (c) => {
      const count = c.tier >= 4 ? 2 : 1;
      for (let i = 0; i < count; i += 1) {
        const y0 = c.top + ((i + 1) / (count + 1)) * (c.bottom - c.top);
        spawnEnemy(c.g, "laserDrone", c.x + i * 50, y0, {
          path: { kind: "hold", t: 0, x0: c.x, y0, speed: 150, holdAt: 0.8 + i * 0.06, holdFor: 7500, exitY: y0 < 360 ? -1 : 1 },
        });
      }
      return "laserDrone";
    },
  },
  {
    id: "repair-squad",
    segments: ["open", "surface", "station"],
    minTier: 3,
    weight: 1.6,
    spawn: (c) => {
      for (let i = 0; i < 2; i += 1) {
        const y0 = c.top + ((i + 1) / 3) * (c.bottom - c.top);
        spawnEnemy(c.g, "shooter", c.x, y0, { path: { kind: "hold", t: 0, x0: c.x, y0, speed: 160, holdAt: 0.66, holdFor: 6000, exitY: i ? 1 : -1 } });
      }
      const ry = (c.top + c.bottom) / 2;
      spawnEnemy(c.g, "repairer", c.x + 80, ry, { path: { kind: "hold", t: 0, x0: c.x + 80, y0: ry, speed: 150, holdAt: 0.84, holdFor: 6500, exitY: 1 } });
      return "repairer";
    },
  },
  {
    id: "shield-escort",
    segments: ["station", "debris", "surface"],
    minTier: 4,
    weight: 1.6,
    spawn: (c) => {
      const y0 = clamp(midY(c), c.top + 90, c.bottom - 90);
      spawnEnemy(c.g, "shieldBearer", c.x + 110, y0, { path: { kind: "straight", t: 0, x0: c.x + 110, y0, speed: 95 } });
      for (let i = 0; i < 4; i += 1) {
        const y = y0 + (i - 1.5) * 50;
        spawnEnemy(c.g, "chaser", c.x, y, { path: { kind: "straight", t: 0, x0: c.x, y0: y, speed: 95 } });
      }
      return "shieldBearer";
    },
  },
  {
    id: "gravity-trap",
    segments: ["cave", "open", "debris"],
    minTier: 4,
    weight: 1.3,
    spawn: (c) => {
      spawnEnemy(c.g, "gravityWell", c.x + 40, midY(c), { affix: c.elite() });
      for (let i = 0; i < 2; i += 1) spawnEnemy(c.g, "kamikaze", c.x + 120 + i * 50, midY(c));
      return "gravityWell";
    },
  },
  {
    id: "emp-raid",
    segments: ["open", "station", "surface"],
    minTier: 4,
    weight: 1.4,
    spawn: (c) => {
      for (let i = 0; i < 2; i += 1) spawnEnemy(c.g, "empDrone", c.x + i * 70, midY(c));
      return "empDrone";
    },
  },
  {
    id: "phantoms",
    segments: ["cave", "station", "open"],
    minTier: 5,
    weight: 1.4,
    spawn: (c) => {
      for (let i = 0; i < 3; i += 1) spawnEnemy(c.g, "phantom", c.x + i * 60, midY(c), { affix: i === 0 ? c.elite() : undefined });
      return "phantom";
    },
  },
  {
    id: "blinkers",
    segments: ["open", "debris", "surface"],
    minTier: 5,
    weight: 1.2,
    spawn: (c) => {
      for (let i = 0; i < 2; i += 1) spawnEnemy(c.g, "teleporter", c.x + i * 80, midY(c));
      return "teleporter";
    },
  },
];

/** Sceglie un'ondata adatta al segmento; il bioma può favorirne alcune (peso x2.5). */
export const pickFormation = (segment: SegmentKind, tier: number, favored: string[] = []) => {
  const pool = FORMATIONS.filter((f) => f.segments.includes(segment) && f.minTier <= tier);
  if (pool.length === 0) return undefined;
  const weight = (f: (typeof pool)[number]) => f.weight * (favored.includes(f.id) ? 2.5 : 1);
  const total = pool.reduce((sum, f) => sum + weight(f), 0);
  let roll = Math.random() * total;
  for (const f of pool) {
    roll -= weight(f);
    if (roll <= 0) return f;
  }
  return pick(pool);
};
