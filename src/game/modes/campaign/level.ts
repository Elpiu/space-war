import { VIEW_H } from "../../config";
import { OFFSCREEN, ceilAt, floorAt } from "../../systems/terrain";
import type { Arena, EnemyId, Terrain } from "../../types";
import { createRng, dist2, rand, type Rng } from "../../utils";
import type { MissionDef } from "./missions";

export type SegmentKind = "open" | "debris" | "surface" | "cave" | "station" | "boss";

export interface Segment {
  kind: SegmentKind;
  start: number;
  end: number;
}

/** Unità di terra o struttura piazzata sul terreno, creata quando entra in scena. */
export interface Prop {
  id: EnemyId;
  x: number;
  anchor: "floor" | "ceil";
}

export interface Level {
  arena: Arena;
  segments: Segment[];
  props: Prop[];
  /** Capsula segreta: vicino al terreno, fuori dalla traiettoria più comoda. */
  capsule?: { x: number; y: number };
}

/** Cosa si trova a terra in ogni tipo di segmento, con i pesi e il tier minimo. */
const GROUND: Partial<Record<SegmentKind, { id: EnemyId; weight: number; minTier: number; anchor?: "floor" | "ceil" | "both" }[]>> = {
  surface: [
    { id: "aaTurret", weight: 3, minTier: 1 },
    { id: "fuelTank", weight: 2, minTier: 1 },
    { id: "billboard", weight: 1.5, minTier: 1 },
    { id: "tank", weight: 2, minTier: 2 },
    { id: "silo", weight: 1.5, minTier: 3 },
    { id: "spider", weight: 1.5, minTier: 2 },
    { id: "flakTower", weight: 1.3, minTier: 3 },
    { id: "shieldGen", weight: 0.8, minTier: 3 },
    { id: "droneHangar", weight: 0.8, minTier: 4 },
  ],
  cave: [
    { id: "aaTurret", weight: 4, minTier: 1, anchor: "both" },
    { id: "fuelTank", weight: 1.5, minTier: 1 },
    { id: "silo", weight: 1, minTier: 3 },
    { id: "laserPylon", weight: 1.6, minTier: 2, anchor: "both" },
    { id: "spider", weight: 1.4, minTier: 2, anchor: "both" },
  ],
  station: [
    { id: "aaTurret", weight: 4, minTier: 1, anchor: "both" },
    { id: "billboard", weight: 1, minTier: 1 },
    { id: "fuelTank", weight: 1.5, minTier: 1 },
    { id: "laserPylon", weight: 1.8, minTier: 2, anchor: "both" },
    { id: "flakTower", weight: 1.2, minTier: 3, anchor: "both" },
    { id: "shieldGen", weight: 1, minTier: 3 },
    { id: "droneHangar", weight: 1, minTier: 4 },
  ],
};

export const SEGMENT_LABELS: Record<SegmentKind, string> = {
  open: "Spazio aperto",
  debris: "Fascia di rottami",
  surface: "Superficie",
  cave: "Caverna",
  station: "Stazione",
  boss: "Arena del boss",
};

const LENGTHS: Record<SegmentKind, [number, number]> = {
  open: [1300, 1800],
  debris: [1900, 2500],
  surface: [2100, 2800],
  cave: [1900, 2500],
  station: [1800, 2300],
  boss: [1500, 1500],
};

const STEP = 40;
const MIN_GAP = 290;

/**
 * Rumore frattale (fBm) a una dimensione: somma di ottave di rumore a valori
 * interpolati, ognuna con ampiezza dimezzata e frequenza raddoppiata. Dà
 * rilievi naturali a ogni scala. Restituisce valori circa in [-1, 1].
 */
const fbm = (rng: Rng, octaves = 4) => {
  const table = Array.from({ length: 256 }, () => rng() * 2 - 1);
  const base = rand(0.0018, 0.0032, rng);
  const offset = rng() * 1000;
  const noise = (x: number) => {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    return table[i & 255] * (1 - u) + table[(i + 1) & 255] * u;
  };
  let norm = 0;
  for (let o = 0; o < octaves; o += 1) norm += 0.5 ** o;
  return (x: number) => {
    let sum = 0;
    for (let o = 0; o < octaves; o += 1) sum += noise((x + offset) * base * 2 ** o) * 0.5 ** o;
    return (sum / norm) * 1.6;
  };
};

/** Genera il livello di una missione: segmenti, terreno, asteroidi e nebulose. */
export const generateLevel = (mission: MissionDef, seed: number): Level => {
  const rng = createRng(seed);
  const H = VIEW_H;

  const kinds: SegmentKind[] = ["open", ...mission.segments];
  if (!mission.boss) kinds.push("open");
  const segments: Segment[] = [];
  let cursor = 0;
  kinds.forEach((kind, i) => {
    const [min, max] = LENGTHS[kind];
    const length = i === 0 ? 900 : i === kinds.length - 1 && kind === "open" ? 800 : rand(min, max, rng);
    segments.push({ kind, start: cursor, end: cursor + length });
    cursor += length;
  });
  const width = Math.round(cursor);

  const n = Math.ceil(width / STEP) + 1;
  const floor = new Array<number>(n).fill(H + OFFSCREEN);
  const ceil = new Array<number>(n).fill(-OFFSCREEN);
  const sampleKinds = new Array<string>(n).fill("open");
  const floorWave = fbm(rng);
  const ceilWave = fbm(rng);

  for (const seg of segments) {
    for (let i = Math.floor(seg.start / STEP); i <= Math.min(n - 1, Math.ceil(seg.end / STEP)); i += 1) {
      const x = i * STEP;
      sampleKinds[i] = seg.kind;
      if (seg.kind === "surface") floor[i] = H - 105 + floorWave(x) * 60;
      if (seg.kind === "cave") {
        floor[i] = H - 165 + floorWave(x) * 70;
        ceil[i] = 165 + ceilWave(x) * 70;
      }
      if (seg.kind === "station") {
        floor[i] = H - 70;
        ceil[i] = 70;
      }
      if (seg.kind === "boss") floor[i] = H - 60;
    }
  }

  // Ammorbidisce i profili: le entrate e le uscite diventano rampe.
  const smooth = (values: number[], radius: number) =>
    values.map((_, i) => {
      let sum = 0;
      let count = 0;
      for (let k = -radius; k <= radius; k += 1) {
        const v = values[Math.max(0, Math.min(values.length - 1, i + k))];
        sum += v;
        count += 1;
      }
      return sum / count;
    });
  const smoothFloor = smooth(floor, 6);
  const smoothCeil = smooth(ceil, 6);

  // Stazione: pilastri alternati da sopra e da sotto, con un varco sempre libero.
  for (const seg of segments.filter((s) => s.kind === "station")) {
    let x = seg.start + 450;
    let fromTop = rng() < 0.5;
    while (x < seg.end - 350) {
      const w = rand(80, 130, rng);
      const h = rand(150, 300, rng);
      for (let i = Math.floor(x / STEP); i <= Math.ceil((x + w) / STEP) && i < n; i += 1) {
        if (fromTop) smoothCeil[i] = Math.max(smoothCeil[i], 70 + h);
        else smoothFloor[i] = Math.min(smoothFloor[i], H - 70 - h);
      }
      fromTop = !fromTop;
      x += rand(380, 520, rng);
    }
  }

  // Garantisce sempre un passaggio abbastanza alto.
  for (let i = 0; i < n; i += 1) {
    const gap = smoothFloor[i] - smoothCeil[i];
    if (gap < MIN_GAP) {
      const fix = (MIN_GAP - gap) / 2;
      smoothFloor[i] += fix;
      smoothCeil[i] -= fix;
    }
  }

  const terrain: Terrain = { step: STEP, height: H, floor: smoothFloor, ceil: smoothCeil, kinds: sampleKinds, palette: mission.palette };

  // Asteroidi: tanti nei rottami, pochi nello spazio aperto, mai dentro il terreno.
  const asteroids: Arena["asteroids"] = [];
  for (const seg of segments) {
    const perKm = seg.kind === "debris" ? 4 * mission.asteroids : seg.kind === "open" && seg.start > 0 ? 0.8 * mission.asteroids : 0;
    const count = Math.round(((seg.end - seg.start) / 1000) * perKm);
    for (let tries = 0, made = 0; made < count && tries < count * 30; tries += 1) {
      const r = rand(28, seg.kind === "debris" ? 90 : 60, rng);
      const x = rand(seg.start + 120, seg.end - 120, rng);
      const y = rand(r, H - r, rng);
      if (y - r < ceilAt(terrain, x) + 20 || y + r > floorAt(terrain, x) - 20) continue;
      if (asteroids.some((a) => dist2(x, y, a.x, a.y) < (a.r + r + 170) ** 2)) continue;
      asteroids.push({ x, y, r });
      made += 1;
    }
  }

  const nebulas: Arena["nebulas"] = [];
  for (const seg of segments.filter((s) => s.kind === "open" || s.kind === "debris")) {
    const count = Math.round(((seg.end - seg.start) / 1000) * 0.7 * mission.nebulas);
    for (let k = 0; k < count; k += 1) {
      nebulas.push({ x: rand(seg.start + 150, seg.end - 150, rng), y: rand(100, H - 100, rng), r: rand(160, 250, rng) });
    }
  }

  // Unità di terra e strutture lungo i segmenti con pavimento o soffitto.
  const props: Prop[] = [];
  for (const seg of segments) {
    const table = GROUND[seg.kind]?.filter((entry) => entry.minTier <= mission.tier);
    if (!table || table.length === 0) continue;
    const total = table.reduce((sum, entry) => sum + entry.weight, 0);
    let x = seg.start + rand(250, 400, rng);
    while (x < seg.end - 150) {
      let roll = rng() * total;
      const entry = table.find((item) => (roll -= item.weight) <= 0) ?? table[0];
      const anchor = entry.anchor === "both" ? (rng() < 0.5 ? "ceil" : "floor") : (entry.anchor ?? "floor");
      props.push({ id: entry.id, x, anchor });
      x += (rand(260, 440, rng) * (1.15 - mission.tier * 0.06)) / (mission.ground ?? 1);
    }
  }

  // Capsula segreta: in un segmento con terreno, rasoterra o contro il soffitto.
  let capsule: Level["capsule"];
  const hidden = segments.filter((sg) => sg.kind === "cave" || sg.kind === "surface" || sg.kind === "station");
  if (hidden.length > 0) {
    const seg = hidden[Math.floor(rng() * hidden.length)];
    const x = rand(seg.start + 300, seg.end - 300, rng);
    const low = rng() < 0.6 || seg.kind === "surface";
    capsule = { x, y: low ? floorAt(terrain, x) - 34 : ceilAt(terrain, x) + 34 };
  }

  const palette = mission.palette ? { nebula: mission.palette.nebula, rock: mission.palette.rock } : undefined;
  return { arena: { seed, width, height: H, asteroids, nebulas, terrain, palette }, segments, props, capsule };
};

export const segmentAt = (segments: Segment[], x: number) =>
  segments.find((s) => x >= s.start && x < s.end) ?? segments[segments.length - 1];
