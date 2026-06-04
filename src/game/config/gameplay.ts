import type { PlayerStats, SectorSize } from "../types/gameplay";

export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 768;

export const SCREEN_CENTER_X = GAME_WIDTH / 2;
export const SCREEN_CENTER_Y = GAME_HEIGHT / 2;
export const SECTOR_CELL_SIZE = 420;
export const MAP_SECTOR_LIMIT = 8;
export const MAP_FIRST_EXPANSION_WAVE = 2;
export const MAP_EXPANSION_INTERVAL = 2;

export const PLAYER_RADIUS = 17;
export const ENEMY_RADIUS = 16;
export const BULLET_RADIUS = 5;
export const PICKUP_RADIUS = 7;

export const PLAYER_HIT_COOLDOWN = 850;
export const WAVE_DURATION = 30000;
export const WAVE_BREAK_DURATION = 3500;
export const WAVE_START_SPAWN_INTERVAL = 4200;
export const WAVE_MID_SPAWN_INTERVAL = 3000;
export const WAVE_FINAL_SPAWN_INTERVAL = 1900;

export const TURRET_COST = 6;
export const MINE_COST = 3;
export const BARRICADE_COST = 5;
export const CHEST_COST = 12;
export const CHEST_KILL_THRESHOLD = 80;
export const BUYABLE_CHEST_INTERVAL = 26000;
export const MAX_BUYABLE_CHESTS = 2;
export const MAX_TURRETS = 3;
export const MAX_MINES = 6;
export const TURRET_RANGE = 190;
export const TURRET_FIRE_RATE = 760;
export const TURRET_DAMAGE = 1;
export const TURRET_HP = 9;
export const MINE_TRIGGER_RADIUS = 34;
export const MINE_DAMAGE_RADIUS = 92;
export const MINE_DAMAGE = 4;
export const MINE_HP = 3;
export const BARRICADE_HP = 18;
export const DRONE_RANGE = 210;
export const DRONE_FIRE_RATE = 980;
export const DRONE_DAMAGE = 1;

export const INITIAL_PLAYER_STATS: PlayerStats = {
  maxHp: 8,
  hp: 8,
  speed: 245,
  damage: 2,
  fireRate: 390,
  bulletSpeed: 620,
  bulletRange: 560,
  pickupRadius: 70,
  multiShot: 1,
};

export const TURRET_CONFIGS: Record<
  string,
  { range: number; fireRate: number; damage: number; hp: number; color: number }
> = {
  turretBasic: {
    range: 100,
    fireRate: 1000,
    damage: 5,
    hp: 20,
    color: 0x38bdf8,
  },
  turretLongRange: {
    range: 170,
    fireRate: 1170,
    damage: 5,
    hp: 20,
    color: 0x818cf8,
  },
  turretTesla: { range: 60, fireRate: 500, damage: 2, hp: 30, color: 0xa855f7 },
};

export const SECTOR_SIZE_CONFIG: Record<
  SectorSize,
  {
    label: string;
    cellWidth: number;
    cellHeight: number;
    risk: number;
    color: number;
    accentColor: number;
  }
> = {
  small: {
    label: "S",
    cellWidth: 1,
    cellHeight: 1,
    risk: 0.92,
    color: 0x0f766e,
    accentColor: 0x2dd4bf,
  },
  medium: {
    label: "M",
    cellWidth: 2,
    cellHeight: 1,
    risk: 1,
    color: 0x7c3aed,
    accentColor: 0xc084fc,
  },
  large: {
    label: "L",
    cellWidth: 2,
    cellHeight: 2,
    risk: 1.18,
    color: 0x0369a1,
    accentColor: 0x38bdf8,
  },
};
