import { VIEW_H } from "../../config";
import { OFFSCREEN, ceilAt, floorAt } from "../../systems/terrain";
import type { Arena, Terrain } from "../../types";
import { createRng, dist2, rand, type Rng } from "../../utils";
import type { MissionDef } from "./missions";

export type SegmentKind = "open" | "debris" | "surface" | "cave" | "station" | "boss";

export interface Segment {
  kind: SegmentKind;
  start: number;
  end: number;
}

export interface Level {
  arena: Arena;
  segments: Segment[];
}

export const SEGMENT_LABELS: Record<SegmentKind, string> = {
  open: "Spazio aperto",
  debris: "Fascia di rottami",
  surface: "Superficie",
  cave: "Caverna",
  station: "Stazione",
  boss: "Arena del boss",
};

const LENGTHS: Record<SegmentKind, [number, number]> = {
  open: [1000, 1400],
  debris: [1400, 1900],
  surface: [1600, 2200],
  cave: [1500, 2000],
  station: [1400, 1800],
  boss: [1500, 1500],
};

const STEP = 40;
const MIN_GAP = 290;

/** Rumore morbido: somma di tre sinusoidi con fasi casuali. */
const wave = (rng: Rng) => {
  const parts = [0, 1, 2].map((i) => ({ f: rand(0.0015, 0.004, rng) * (i + 1), p: rand(0, Math.PI * 2, rng), a: 1 / (i + 1) }));
  const norm = parts.reduce((s, p) => s + p.a, 0);
  return (x: number) => parts.reduce((s, p) => s + Math.sin(x * p.f + p.p) * p.a, 0) / norm;
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
  const floorWave = wave(rng);
  const ceilWave = wave(rng);

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

  const terrain: Terrain = { step: STEP, height: H, floor: smoothFloor, ceil: smoothCeil, kinds: sampleKinds };

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

  return { arena: { seed, width, height: H, asteroids, nebulas, terrain }, segments };
};

export const segmentAt = (segments: Segment[], x: number) =>
  segments.find((s) => x >= s.start && x < s.end) ?? segments[segments.length - 1];
