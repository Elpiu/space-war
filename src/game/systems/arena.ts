import { Math as PMath, type GameObjects, type Scene } from "phaser";
import { ARENA_H, ARENA_W, DEPTH, VIEW_H, VIEW_W } from "../config";
import type { Arena } from "../types";
import { clamp, createRng, dist2, rand } from "../utils";
import { drawTerrain } from "./terrain";

/** Arena quadrata del survival: asteroidi che bloccano e nebulose che rallentano. */
export const generateArena = (seed: number): Arena => {
  const rng = createRng(seed);
  const width = ARENA_W;
  const height = ARENA_H;
  const cx = width / 2;
  const cy = height / 2;
  const asteroids: Arena["asteroids"] = [];
  const nebulas: Arena["nebulas"] = [];

  for (let tries = 0; asteroids.length < 34 && tries < 600; tries += 1) {
    const r = rand(36, 120, rng);
    const x = rand(160, width - 160, rng);
    const y = rand(160, height - 160, rng);
    if (dist2(x, y, cx, cy) < 420 * 420) continue;
    if (asteroids.some((a) => dist2(x, y, a.x, a.y) < (a.r + r + 140) ** 2)) continue;
    asteroids.push({ x, y, r });
  }

  for (let tries = 0; nebulas.length < 7 && tries < 300; tries += 1) {
    const r = rand(170, 300, rng);
    const x = rand(r, width - r, rng);
    const y = rand(r, height - r, rng);
    if (dist2(x, y, cx, cy) < (r + 260) ** 2) continue;
    if (nebulas.some((n) => dist2(x, y, n.x, n.y) < (n.r + r) ** 2)) continue;
    nebulas.push({ x, y, r });
  }

  return { seed, width, height, asteroids, nebulas };
};

export const arenaCenter = (arena: Arena) => ({ x: arena.width / 2, y: arena.height / 2 });

export const drawArena = (scene: Scene, arena: Arena) => {
  const objects: GameObjects.GameObject[] = [];
  const rng = createRng(arena.seed ^ 0x9e3779b9);

  arena.nebulas.forEach((n) => {
    objects.push(
      scene.add.image(n.x, n.y, "glow").setDisplaySize(n.r * 2.6, n.r * 2.6).setTint(0x7c3aed).setAlpha(0.55).setDepth(DEPTH.hazard),
      scene.add.image(n.x + n.r * 0.2, n.y - n.r * 0.15, "glow").setDisplaySize(n.r * 1.6, n.r * 1.6).setTint(0xdb2777).setAlpha(0.35).setDepth(DEPTH.hazard),
    );
  });

  const g = scene.add.graphics().setDepth(DEPTH.hazard + 1);
  objects.push(g);

  arena.asteroids.forEach((a) => {
    const points = Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const r = a.r * rand(0.86, 1.1, rng);
      return new PMath.Vector2(a.x + Math.cos(angle) * r, a.y + Math.sin(angle) * r);
    });
    g.fillStyle(0x0b1020, 0.5);
    g.fillCircle(a.x + 10, a.y + 14, a.r);
    g.fillStyle(0x334155, 1);
    g.lineStyle(4, 0x0b1020, 1);
    g.fillPoints(points, true);
    g.strokePoints(points, true);
    g.fillStyle(0x475569, 1);
    g.fillPoints(
      points.map((p) => new PMath.Vector2(a.x + (p.x - a.x) * 0.72 - a.r * 0.12, a.y + (p.y - a.y) * 0.72 - a.r * 0.14)),
      true,
    );
    const craters = Math.max(2, Math.round(a.r / 30));
    for (let i = 0; i < craters; i += 1) {
      const angle = rand(0, Math.PI * 2, rng);
      const d = rand(0, a.r * 0.5, rng);
      const cr = rand(a.r * 0.1, a.r * 0.2, rng);
      g.fillStyle(0x1e293b, 1);
      g.fillCircle(a.x + Math.cos(angle) * d, a.y + Math.sin(angle) * d, cr);
    }
  });

  if (arena.terrain) objects.push(...drawTerrain(scene, arena.terrain));

  // Bordo dell'arena e vuoto esterno scurito.
  const pad = 2000;
  g.fillStyle(0x020617, 0.75);
  const { width: w, height: h } = arena;
  g.fillRect(-pad, -pad, w + pad * 2, pad);
  g.fillRect(-pad, h, w + pad * 2, pad);
  g.fillRect(-pad, 0, pad, h);
  g.fillRect(w, 0, pad, h);
  g.lineStyle(10, 0x38bdf8, 0.12);
  g.strokeRect(0, 0, w, h);
  g.lineStyle(3, 0x7dd3fc, 0.7);
  g.strokeRect(0, 0, w, h);

  return objects;
};

/** Sfondo stellare in parallasse, fissato alla camera. */
export class Starfield {
  private layers: { sprite: GameObjects.TileSprite; factor: number }[] = [];

  constructor(private readonly scene: Scene) {
    const add = (key: string, factor: number, alpha: number) => {
      const sprite = scene.add
        .tileSprite(VIEW_W / 2, VIEW_H / 2, VIEW_W, VIEW_H, key)
        .setScrollFactor(0)
        .setDepth(DEPTH.background)
        .setAlpha(alpha);
      this.layers.push({ sprite, factor });
    };
    add("nebula", 0.04, 1);
    add("stars-far", 0.12, 1);
    add("stars-mid", 0.3, 1);
    add("stars-near", 0.55, 1);
  }

  update(drift = 0) {
    const cam = this.scene.cameras.main;
    this.layers.forEach(({ sprite, factor }) => {
      sprite.tilePositionX = (cam.scrollX + drift) * factor;
      sprite.tilePositionY = (cam.scrollY + drift * 0.35) * factor;
    });
  }
}

export const pushOutOfAsteroids = (arena: Arena, e: { x: number; y: number }, radius: number) => {
  for (const a of arena.asteroids) {
    const min = a.r * 0.92 + radius;
    const dx = e.x - a.x;
    const dy = e.y - a.y;
    const d2 = dx * dx + dy * dy;
    if (d2 >= min * min) continue;
    const d = Math.sqrt(d2) || 0.001;
    e.x = a.x + (dx / d) * min;
    e.y = a.y + (dy / d) * min;
  }
};

export const hitsAsteroid = (arena: Arena, x: number, y: number, radius: number) =>
  arena.asteroids.some((a) => dist2(x, y, a.x, a.y) < (a.r * 0.92 + radius) ** 2);

export const inNebula = (arena: Arena, x: number, y: number) =>
  arena.nebulas.some((n) => dist2(x, y, n.x, n.y) < n.r * n.r);

export const clampToArena = (arena: Arena, e: { x: number; y: number }, radius: number) => {
  e.x = clamp(e.x, radius, arena.width - radius);
  e.y = clamp(e.y, radius, arena.height - radius);
};

export const insideArena = (arena: Arena, x: number, y: number, margin = 0) =>
  x > -margin && y > -margin && x < arena.width + margin && y < arena.height + margin;
