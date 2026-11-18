// Numeri condivisi e bilanciamento. Tutto il tuning vive qui.

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const ARENA_W = 3200;
export const ARENA_H = 3200;

export const PLAYER_RADIUS = 16;
export const PLAYER_HIT_IFRAMES = 650;

export const BASE_STATS = {
  maxHp: 10,
  speed: 250,
  damage: 2,
  fireInterval: 400,
  bulletSpeed: 680,
  range: 540,
  pickupRadius: 90,
  projectiles: 1,
  xpMult: 1,
  lifeSteal: 0,
  dashCooldown: 1700,
  deployPower: 1,
};

export const DASH = {
  duration: 170,
  speedMultiplier: 3.6,
  iframes: 260,
};

export const WAVE = {
  duration: 30000,
  breakDuration: 3000,
  bossEvery: 5,
  hordeOffset: 3,
};

export const DEPLOY = {
  turretCost: 8,
  mineCost: 4,
  turretLifetime: 30000,
  turretRange: 280,
  turretInterval: 620,
  turretDamage: 3,
  mineArmDelay: 450,
  mineTriggerRadius: 46,
  mineBlastRadius: 120,
  mineDamage: 12,
  baseTurrets: 1,
  baseMines: 2,
};

export const LIMITS = {
  maxEnemies: 220,
  maxGems: 160,
  maxRunTomes: 4,
  tomeMaxLevel: 5,
  itemMaxLevel: 5,
  freeRerolls: 2,
};

export const CHEST_KILL_STEP = 55;

export type DifficultyId = "normal" | "hard" | "nightmare";

export const DIFFICULTIES: Record<
  DifficultyId,
  {
    label: string;
    description: string;
    hp: number;
    damage: number;
    density: number;
    reward: number;
  }
> = {
  normal: {
    label: "Normale",
    description: "L'orbita come la conosci.",
    hp: 1,
    damage: 1,
    density: 1,
    reward: 1,
  },
  hard: {
    label: "Difficile",
    description: "Nemici +40% HP, più numerosi. Crediti x1.5.",
    hp: 1.4,
    damage: 1.25,
    density: 1.25,
    reward: 1.5,
  },
  nightmare: {
    label: "Incubo",
    description: "Solo per piloti senza assicurazione. Crediti x2.2.",
    hp: 2,
    damage: 1.6,
    density: 1.5,
    reward: 2.2,
  },
};

export const COLORS = {
  player: 0x38bdf8,
  bullet: 0xfde68a,
  bulletVenom: 0xa3e635,
  enemyBullet: 0xf472b6,
  xp: 0x22d3ee,
  coin: 0xfacc15,
  heal: 0xfb7185,
  danger: 0xef4444,
  shield: 0x7dd3fc,
};

/**
 * Linguaggio dei segnali: ogni avviso ha un colore fisso.
 * Giallo = carica in corso, rosso = danno in arrivo, azzurro = scudo,
 * viola = controllo (attrazione, EMP), verde = cura, magenta = teletrasporto.
 */
export const SIGNAL = {
  charge: 0xfacc15,
  danger: 0xef4444,
  shield: 0x22d3ee,
  control: 0xa855f7,
  heal: 0x4ade80,
  warp: 0xe879f9,
};

export const DEPTH = {
  background: -10,
  hazard: 0,
  pickup: 10,
  deployable: 12,
  telegraph: 14,
  enemy: 20,
  enemyBullet: 26,
  bullet: 24,
  player: 30,
  fx: 40,
  text: 50,
  overlay: 60,
};
