import type { IconId } from "../art/svg";
import type { DifficultyId } from "../config";
import type { Armament } from "../systems/rack";
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
  bar: { ratio: number; text: string; kind: "xp" | "route"; marks?: number[] };
}

/** Un'abilità mostrata in basso a sinistra nell'HUD (anello di ricarica). */
export interface SkillInfo {
  id: string;
  icon: IconId;
  key: string;
  /** Riempimento dell'anello, da 0 a 1. */
  ratio: number;
  ready: boolean;
  info?: string;
  /** Anello rosso: calore alto o surriscaldamento. */
  hot?: boolean;
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
  /** Lo scatto è disponibile in questa modalità. */
  readonly allowDash: boolean;
  setup(g: GameScene): ModeSetup;
  /** Sistema d'arma della nave; senza, il nucleo usa l'arsenale del survival. */
  createArmament?(g: GameScene): Armament;
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
  skills(g: GameScene): SkillInfo[];
  /** Markup della striscia in basso a destra (build o equipaggiamento). */
  build(g: GameScene): string;
}
