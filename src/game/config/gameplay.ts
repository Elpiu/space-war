import type { PlayerStats } from '../types/gameplay';

export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 768;

export const NODE_CENTER_X = GAME_WIDTH / 2;
export const NODE_CENTER_Y = GAME_HEIGHT / 2;
export const NODE_RADIUS = 330;

export const PLAYER_RADIUS = 17;
export const ENEMY_RADIUS = 16;
export const BULLET_RADIUS = 5;
export const PICKUP_RADIUS = 7;

export const PLAYER_HIT_COOLDOWN = 850;
export const WAVE_INTERVAL = 13000;

export const INITIAL_PLAYER_STATS: PlayerStats = {
    maxHp: 8,
    hp: 8,
    speed: 245,
    damage: 2,
    fireRate: 390,
    bulletSpeed: 620,
    bulletRange: 560,
    pickupRadius: 70,
    multiShot: 1
};
