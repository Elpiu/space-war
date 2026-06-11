import type {
  MapGenerationProfile,
  PlayerStats,
  SectorSize,
} from "../types/gameplay";

export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 768;

export const SCREEN_CENTER_X = GAME_WIDTH / 2;
export const SCREEN_CENTER_Y = GAME_HEIGHT / 2;
export const SECTOR_CELL_SIZE = 420;
export const MAP_SECTOR_LIMIT = 12;
export const MAP_MAX_DEPTH = 4;
export const MAP_FIRST_EXPANSION_WAVE = 2;
export const MAP_EXPANSION_INTERVAL = 2;
export const DEFAULT_MAP_GENERATION_PROFILE: MapGenerationProfile = {
  maxSectors: MAP_SECTOR_LIMIT,
  maxDepth: MAP_MAX_DEPTH,
  pattern: "mixed",
};

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

export const BARRICADE_COST = 5;
export const CHEST_COST = 12;
export const CHEST_KILL_THRESHOLD = 80;
export const BUYABLE_CHEST_INTERVAL = 26000;
export const MAX_BUYABLE_CHESTS = 2;
export const MAX_TURRETS = 3;
export const MAX_MINES = 6;
export const BARRICADE_HP = 18;
export const PLACEABLE_UNIT_SIZE = 84;
export const PLACEABLE_CELL_SIZE = PLACEABLE_UNIT_SIZE / 2;
export const PLACEABLE_INTERACTION_RANGE = 320;
export const PLACEABLE_MOVE_COST = 1;
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
  xpMultiplier: 1,
  lifeSteal: 0,
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
