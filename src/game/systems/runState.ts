import { CHEST_KILL_THRESHOLD, INITIAL_PLAYER_STATS } from "../config/gameplay";
import {
  createInitialDifficultyState,
  createInitialRunItemState,
  createInitialRunTomeState,
  createInitialRunUpgradeState,
} from "../data/upgrades";
import type {
  Barricade,
  Bullet,
  Chest,
  Drone,
  Enemy,
  EnemyProjectile,
  Mine,
  Pickup,
  PlayerStats,
  RunUpgradeState,
  RunDifficultyState,
  RunItemState,
  RunTomeState,
  TemporaryEffectState,
  Turret,
} from "../types/gameplay";
import { destroyChest } from "./chests";
import { destroyDrone } from "./drones";
import { destroyEnemy, destroyEnemyProjectile } from "./enemies";
import { destroyBarricade, destroyMine, destroyTurret } from "./placeables";

export type RunState = {
  stats: PlayerStats;
  runUpgrades: RunUpgradeState;
  tomes: RunTomeState;
  items: RunItemState;
  difficulty: RunDifficultyState;
  temporaryEffects: TemporaryEffectState;
  enemies: Enemy[];
  bullets: Bullet[];
  enemyProjectiles: EnemyProjectile[];
  pickups: Pickup[];
  chests: Chest[];
  turrets: Turret[];
  mines: Mine[];
  barricades: Barricade[];
  drones: Drone[];
  xp: number;
  xpToNext: number;
  level: number;
  coins: number;
  wave: number;
  nextWaveAt: number;
  waveEndsAt: number;
  nextSpawnPulseAt: number;
  wavePhase: string;
  nextShotAt: number;
  killsSinceLastChest: number;
  totalKills: number;
  freeTomeRerolls: number;
  paidTomeRerolls: number;
  nextChestKillThreshold: number;
  nextBuyableChestAt: number;
  invulnerableUntil: number;
  isLevelingUp: boolean;
  isPaused: boolean;
  pausedAt: number;
  isGameOver: boolean;
};

export const createInitialRunState = (): RunState => ({
  stats: { ...INITIAL_PLAYER_STATS },
  runUpgrades: createInitialRunUpgradeState(),
  tomes: createInitialRunTomeState(),
  items: createInitialRunItemState(),
  difficulty: createInitialDifficultyState(),
  temporaryEffects: {
    magnetOverloadUntil: 0,
    venomRoundsUntil: 0,
  },
  enemies: [],
  bullets: [],
  enemyProjectiles: [],
  pickups: [],
  chests: [],
  turrets: [],
  mines: [],
  barricades: [],
  drones: [],
  xp: 0,
  xpToNext: 6,
  level: 1,
  coins: 0,
  wave: 0,
  nextWaveAt: 0,
  waveEndsAt: 0,
  nextSpawnPulseAt: 0,
  wavePhase: "attesa",
  nextShotAt: 0,
  killsSinceLastChest: 0,
  totalKills: 0,
  freeTomeRerolls: 2,
  paidTomeRerolls: 0,
  nextChestKillThreshold: CHEST_KILL_THRESHOLD,
  nextBuyableChestAt: 12000,
  invulnerableUntil: 0,
  isLevelingUp: false,
  isPaused: false,
  pausedAt: 0,
  isGameOver: false,
});

export const resetRunState = (run: RunState) => {
  destroyRunEntities(run);
  Object.assign(run, createInitialRunState());
};

export const destroyRunEntities = (run: RunState) => {
  run.enemies.forEach(destroyEnemy);
  run.bullets.forEach((bullet) => bullet.body.destroy());
  run.enemyProjectiles.forEach(destroyEnemyProjectile);
  run.pickups.forEach((pickup) => pickup.body.destroy());
  run.chests.forEach(destroyChest);
  run.turrets.forEach(destroyTurret);
  run.mines.forEach(destroyMine);
  run.barricades.forEach(destroyBarricade);
  run.drones.forEach(destroyDrone);

  run.enemies = [];
  run.bullets = [];
  run.enemyProjectiles = [];
  run.pickups = [];
  run.chests = [];
  run.turrets = [];
  run.mines = [];
  run.barricades = [];
  run.drones = [];
};
