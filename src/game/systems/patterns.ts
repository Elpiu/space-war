import type { GameScene } from "../scenes/GameScene";
import type { Enemy, PatternId, ProjectileDef } from "../types";
import { fireEnemyBullet } from "./weapons";

/**
 * Schemi di fuoco riutilizzabili da nemici, mini-boss e boss. Il nome dice
 * la forma che i colpi disegnano sullo schermo:
 * - aimed: un colpo mirato;            - burst: tre colpi ravvicinati in fila;
 * - fan:   ventaglio stretto (3-5);     - U: arco largo, i lati corrono più del centro;
 * - I:     colonna di colpi sulla stessa linea a velocità diverse;
 * - S:     colpi che serpeggiano;       - C: anello con un varco da attraversare;
 * - X:     croce a 4 o 8 braccia;       - wall: muro perpendicolare con un buco;
 * - spiral: un braccio rotante (chiamato a raffica).
 */
export type { PatternId };

/** Moltiplicatore della ricarica: gli schemi con più colpi sparano meno spesso. */
export const PATTERN_COST: Record<PatternId, number> = { aimed: 1, burst: 1.3, fan: 1.3, U: 1.8, I: 1.4, S: 1.2, C: 2.4, X: 1.5, wall: 2.2, spiral: 1 };

/** Prossimo colpo di un nemico che usa lo schema normale. */
export const patternCooldown = (e: Enemy, base: number) => base * PATTERN_COST[patternOf(e)] * (0.85 + Math.random() * 0.3);

/** Schema del colpo normale di un nemico. */
export const patternOf = (e: Enemy): PatternId => e.pattern ?? e.def.pattern ?? "aimed";

const shot = (g: GameScene, e: Enemy, angle: number, p: ProjectileDef, speedMul = 1, phase = 0) => g.fireEnemyBullet(e, angle, p, speedMul, phase);

/** Spara uno schema verso `angle` (di solito la direzione della nave). */
export const firePattern = (g: GameScene, e: Enemy, id: PatternId, angle: number, p: ProjectileDef, opts: { count?: number; spin?: number } = {}) => {
  switch (id) {
    case "aimed":
      shot(g, e, angle, p);
      return;
    case "burst":
      // Tre colpi in fila: stessa direzione, velocità crescenti.
      for (let i = 0; i < 3; i += 1) shot(g, e, angle, p, 0.85 + i * 0.15);
      return;
    case "fan": {
      const n = opts.count ?? 3;
      for (let i = 0; i < n; i += 1) shot(g, e, angle + (i - (n - 1) / 2) * 0.18, p);
      return;
    }
    case "U": {
      // Arco largo: i colpi esterni corrono di più e il fronte prende la forma di una U.
      const n = opts.count ?? 7;
      for (let i = 0; i < n; i += 1) {
        const k = (i - (n - 1) / 2) / ((n - 1) / 2);
        shot(g, e, angle + k * 0.75, p, 0.7 + Math.abs(k) * 0.45);
      }
      return;
    }
    case "I": {
      // Colonna: stessa linea, velocità diverse, arrivano uno dopo l'altro.
      const n = opts.count ?? 5;
      for (let i = 0; i < n; i += 1) shot(g, e, angle, p, 0.6 + i * 0.16);
      return;
    }
    case "S": {
      // Serpentina: due colpi in controfase che si intrecciano.
      const wavy: ProjectileDef = { ...p, wave: p.wave ?? 38, waveFreq: p.waveFreq ?? 6 };
      const n = opts.count ?? 2;
      for (let i = 0; i < n; i += 1) shot(g, e, angle, wavy, 0.9, (i / n) * Math.PI * 2);
      return;
    }
    case "C": {
      // Anello con un varco di circa 70° centrato sulla nave: va attraversato.
      const n = opts.count ?? 22;
      const gap = 0.62;
      for (let i = 0; i < n; i += 1) {
        const a = angle + (i / n) * Math.PI * 2;
        const off = Math.atan2(Math.sin(a - angle), Math.cos(a - angle));
        if (Math.abs(off) < gap) continue;
        shot(g, e, a, p, 0.8);
      }
      return;
    }
    case "X": {
      const arms = opts.count ?? 4;
      const spin = opts.spin ?? 0;
      for (let i = 0; i < arms; i += 1) shot(g, e, spin + (i / arms) * Math.PI * 2, p);
      return;
    }
    case "wall": {
      // Muro di colpi perpendicolare alla mira, con un buco casuale di due posti.
      const n = opts.count ?? 9;
      const hole = Math.floor(Math.random() * (n - 2));
      const nx = -Math.sin(angle);
      const ny = Math.cos(angle);
      for (let i = 0; i < n; i += 1) {
        if (i === hole || i === hole + 1) continue;
        const off = (i - (n - 1) / 2) * 34;
        // Colpi paralleli: partono da posizioni sfalsate lungo il muro.
        fireEnemyBullet(g, e.x + nx * off, e.y + ny * off, angle, p, p.damage * (e.damage / Math.max(0.01, e.def.damage)), 0.75);
      }
      return;
    }
    case "spiral":
      shot(g, e, opts.spin ?? 0, p, 0.9);
      shot(g, e, (opts.spin ?? 0) + Math.PI, p, 0.9);
      return;
  }
};
