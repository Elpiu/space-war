import { BlendModes, Math as PMath, type GameObjects, type Scene } from "phaser";
import { DEPTH } from "../config";
import type { Terrain } from "../types";
import { clamp } from "../utils";

/** Quanto fuori schermo sta un pavimento (o soffitto) "assente". */
export const OFFSCREEN = 140;
const isEmptyFloor = (t: Terrain, v: number) => v >= t.height + OFFSCREEN - 20;
const isEmptyCeil = (v: number) => v <= -OFFSCREEN + 20;

const sample = (values: number[], step: number, x: number) => {
  const f = clamp(x / step, 0, values.length - 1);
  const i = Math.floor(f);
  const t = f - i;
  const a = values[i];
  const b = values[Math.min(values.length - 1, i + 1)];
  return a + (b - a) * t;
};

export const floorAt = (t: Terrain, x: number) => sample(t.floor, t.step, x);
export const ceilAt = (t: Terrain, x: number) => sample(t.ceil, t.step, x);

/** Il cerchio (x, y, r) tocca pavimento o soffitto. */
export const terrainSolid = (t: Terrain | undefined, x: number, y: number, r: number) => {
  if (!t) return false;
  // Si campionano il centro e i due bordi per non attraversare i gradini.
  for (const sx of [x - r * 0.7, x, x + r * 0.7]) {
    if (y + r > floorAt(t, sx) || y - r < ceilAt(t, sx)) return true;
  }
  return false;
};

/** Spinge una y dentro lo spazio libero alla x data. */
export const clampToGap = (t: Terrain | undefined, x: number, y: number, r: number) => {
  if (!t) return y;
  const top = ceilAt(t, x) + r;
  const bottom = floorAt(t, x) - r;
  if (top > bottom) return (top + bottom) / 2;
  return clamp(y, top, bottom);
};

const STYLE: Record<string, { fill: number; edge: number; vein: number }> = {
  surface: { fill: 0x0f1f2e, edge: 0x2dd4bf, vein: 0x134e4a },
  cave: { fill: 0x1a1030, edge: 0xc084fc, vein: 0x3b0764 },
  station: { fill: 0x111827, edge: 0x38bdf8, vein: 0x1e3a5f },
  default: { fill: 0x111827, edge: 0x64748b, vein: 0x1f2937 },
};

/**
 * Disegna pavimento e soffitto: massa scura, venature interne e bordo al neon
 * colorato in base al tipo di segmento.
 */
export const drawTerrain = (scene: Scene, t: Terrain) => {
  const height = t.height;
  const objects: GameObjects.GameObject[] = [];
  const g = scene.add.graphics().setDepth(DEPTH.hazard + 1);
  const glow = scene.add.graphics().setDepth(DEPTH.hazard + 2).setBlendMode(BlendModes.ADD);
  objects.push(g, glow);

  const bottom = height + 60;
  const top = -60;

  // Raggruppa i campioni in tratti continui con lo stesso stile.
  const runs = (values: number[], empty: (v: number) => boolean) => {
    const out: { from: number; to: number; kind: string }[] = [];
    let start = -1;
    for (let i = 0; i <= values.length; i += 1) {
      const solid = i < values.length && !empty(values[i]);
      const kind = i < values.length ? t.kinds[i] : "";
      if (solid && start < 0) start = i;
      const kindChanged = start >= 0 && solid && kind !== t.kinds[start];
      if (start >= 0 && (!solid || kindChanged)) {
        out.push({ from: start, to: solid ? i : i - 1, kind: t.kinds[start] });
        start = solid ? i : -1;
      }
    }
    return out;
  };

  const drawRun = (values: number[], from: number, to: number, kind: string, isFloor: boolean) => {
    const style = STYLE[kind] ?? STYLE.default;
    const edge: PMath.Vector2[] = [];
    for (let i = from; i <= to; i += 1) {
      const v = isFloor ? Math.min(values[i], bottom) : Math.max(values[i], top);
      edge.push(new PMath.Vector2(i * t.step, v));
    }
    const base = isFloor ? bottom : top;
    const poly = [new PMath.Vector2(from * t.step, base), ...edge, new PMath.Vector2(to * t.step, base)];
    g.fillStyle(style.fill, 1);
    g.fillPoints(poly, true);

    // Venature: copie del profilo spostate verso l'interno.
    for (const depth of [18, 46]) {
      const vein = edge.map((p) => new PMath.Vector2(p.x, p.y + (isFloor ? depth : -depth)));
      g.lineStyle(3, style.vein, 0.9);
      g.strokePoints(vein);
    }
    glow.lineStyle(8, style.edge, 0.18);
    glow.strokePoints(edge);
    g.lineStyle(3, style.edge, 0.95);
    g.strokePoints(edge);
  };

  runs(t.floor, (v) => isEmptyFloor(t, v)).forEach((r) => drawRun(t.floor, r.from, r.to, r.kind, true));
  runs(t.ceil, isEmptyCeil).forEach((r) => drawRun(t.ceil, r.from, r.to, r.kind, false));
  return objects;
};
