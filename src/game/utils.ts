export type Rng = () => number;

/** Mulberry32: RNG deterministico per generare l'arena da un seed. */
export const createRng = (seed: number): Rng => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

export const rand = (min: number, max: number, rng: Rng = Math.random) =>
  min + (max - min) * rng();

export const randInt = (min: number, max: number, rng: Rng = Math.random) =>
  Math.floor(rand(min, max + 1, rng));

export const pick = <T>(values: readonly T[], rng: Rng = Math.random): T =>
  values[Math.floor(rng() * values.length)];

export const pickWeighted = <T>(
  entries: readonly T[],
  weight: (entry: T) => number,
  rng: Rng = Math.random,
): T | undefined => {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, weight(entry)), 0);
  if (total <= 0) return undefined;
  let roll = rng() * total;
  for (const entry of entries) {
    roll -= Math.max(0, weight(entry));
    if (roll <= 0) return entry;
  }
  return entries[entries.length - 1];
};

export const pickUnique = <T>(values: readonly T[], count: number): T[] => {
  const pool = [...values];
  const out: T[] = [];
  while (pool.length > 0 && out.length < count) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
};

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const dist2 = (ax: number, ay: number, bx: number, by: number) => {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
};

export const dist = (ax: number, ay: number, bx: number, by: number) =>
  Math.sqrt(dist2(ax, ay, bx, by));

/** Differenza angolare con segno nell'intervallo [-PI, PI]. */
export const angleDiff = (a: number, b: number) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};

export const hex = (color: number) => `#${color.toString(16).padStart(6, "0")}`;

export const fmt = (value: number) =>
  Number.isInteger(value) ? `${value}` : value.toFixed(1);

export const formatTime = (ms: number) => {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

/** Griglia spaziale per query di vicinato in O(1) medio. */
export class SpatialHash<T extends { x: number; y: number }> {
  private cells = new Map<number, T[]>();

  constructor(private readonly size = 96) {}

  clear() {
    this.cells.clear();
  }

  private key(cx: number, cy: number) {
    return (cx + 1024) * 4096 + (cy + 1024);
  }

  insert(item: T) {
    const k = this.key(Math.floor(item.x / this.size), Math.floor(item.y / this.size));
    const cell = this.cells.get(k);
    if (cell) cell.push(item);
    else this.cells.set(k, [item]);
  }

  query(x: number, y: number, radius: number, out: T[] = []): T[] {
    out.length = 0;
    const minX = Math.floor((x - radius) / this.size);
    const maxX = Math.floor((x + radius) / this.size);
    const minY = Math.floor((y - radius) / this.size);
    const maxY = Math.floor((y + radius) / this.size);
    for (let cx = minX; cx <= maxX; cx += 1) {
      for (let cy = minY; cy <= maxY; cy += 1) {
        const cell = this.cells.get(this.key(cx, cy));
        if (cell) for (const item of cell) out.push(item);
      }
    }
    return out;
  }
}
