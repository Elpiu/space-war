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
];

export const pickFormation = (segment: SegmentKind, tier: number) => {
  const pool = FORMATIONS.filter((f) => f.segments.includes(segment) && f.minTier <= tier);
  if (pool.length === 0) return undefined;
  const total = pool.reduce((sum, f) => sum + f.weight, 0);
  let roll = Math.random() * total;
  for (const f of pool) {
    roll -= f.weight;
    if (roll <= 0) return f;
  }
  return pick(pool);
};
