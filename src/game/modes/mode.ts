import type { DifficultyId } from "../config";
import type { GameScene } from "../scenes/GameScene";
import type { Arena, Enemy, Stats } from "../types";

export type ModeId = "survival" | "campaign";
export type RunOutcome = "victory" | "death" | "abandon";

/** Dati che la modalità mostra nel pannello centrale e nella barra in alto dell'HUD. */
export interface HudInfo {
  label: string;
  value: string;
  detail: string;
  event: string;
  bar: { ratio: number; text: string; kind: "xp" | "route" };
}

export interface ModeSetup {
  arena: Arena;
  start: { x: number; y: number };
  base: Stats;
  /** Livello di minaccia: scala i nemici come la wave del survival. */
  wave: number;
  difficulty: DifficultyId;
}

/**
 * Una modalità di gioco. Il nucleo (GameScene) gestisce nave, nemici, armi,
 * pickup ed effetti; la modalità decide arena, ritmo, ricompense e fine run.
 */
export interface GameMode {
  readonly id: ModeId;
  /** Direzione fissa del muso in radianti, oppure null se segue il movimento. */
  readonly heading: number | null;
  setup(g: GameScene): ModeSetup;
  /** Chiamato quando nave e camera esistono. */
  begin(g: GameScene): void;
  update(g: GameScene, dt: number): void;
  constrainPlayer?(g: GameScene, pos: { x: number; y: number }): void;
  /** Ricompense per un'uccisione (il nucleo ha già gestito effetti e contatori). */
  onKill(g: GameScene, e: Enemy): void;
  onChest(g: GameScene, x: number, y: number): void;
  /** Ci sono level-up in attesa (solo le modalità che danno XP). */
  onLevelUp?(g: GameScene): void;
  /** Fine run: assegna ricompense e mostra la schermata finale. */
  end(g: GameScene, outcome: RunOutcome): void;
  hud(g: GameScene): HudInfo;
  /** Markup della striscia in basso a destra (build o equipaggiamento). */
  build(g: GameScene): string;
}
