import type { GameObjects } from "phaser";
import type { IconId } from "./art/svg";
import type { BASE_STATS, DifficultyId } from "./config";

/** Statistiche complete della nave. Il loadout base viene dalla modalità. */
export type Stats = typeof BASE_STATS & {
  pierce: number;
  bounce: number;
  maxTurrets: number;
  maxMines: number;
  drones: number;
  blades: number;
  arc: number;
  mineRadius: number;
  spread: number;
};

// ---------- Nemici ----------

export type EnemyId =
  | "chaser"
  | "swarm"
  | "charger"
  | "brute"
  | "shooter"
  | "sniper"
  | "kamikaze"
  | "shielded"
  | "carrier"
  | "boss";

export type AffixId = "swift" | "armored" | "splitter";

export interface ProjectileDef {
  speed: number;
  damage: number;
  radius: number;
  cooldown: number;
  range: number;
}

export interface EnemyDef {
  id: EnemyId;
  label: string;
  hint: string;
  hp: number;
  speed: number;
  damage: number;
  radius: number;
  /** Lato maggiore dello sprite a schermo, in pixel. */
  size: number;
  textures: string[];
  xp: number;
  coins: number;
  color: number;
  minWave: number;
  weight: (wave: number) => number;
  group?: [number, number];
  /** 0 = subisce tutto il contraccolpo, 1 = immune. */
  knockbackResist: number;
  /** Verso in cui guarda il muso dello sprite, per specchiarlo verso il giocatore. */
  faces?: "left" | "right";
  preferredDistance?: number;
  projectile?: ProjectileDef;
}

export type EnemyState = "move" | "windup" | "dash" | "recover" | "aim" | "arming";

export interface Enemy {
  uid: number;
  def: EnemyDef;
  sprite: GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  scale: number;
  state: EnemyState;
  stateUntil: number;
  lockAngle: number;
  nextAttack: number;
  seed: number;
  facing: number;
  affix?: AffixId;
  aura?: GameObjects.Image;
  shield?: GameObjects.Image;
  flashUntil: number;
  flashing: boolean;
  bossPhase: number;
  spiral: number;
  dead: boolean;
}

// ---------- Combattimento ----------

export type DamageSource =
  | "blaster"
  | "drone"
  | "blade"
  | "arc"
  | "turret"
  | "mine"
  | "trail"
  | "pulse"
  | "emp"
  | "blast"
  | "missile"
  | "bomb";

export interface Bullet {
  sprite: GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  life: number;
  radius: number;
  pierce: number;
  bounce: number;
  /** Virata in rad/s verso il nemico più vicino (0 = dritto). */
  homing: number;
  gravity: number;
  /** Raggio dell'esplosione all'impatto (0 = nessuna). */
  blast: number;
  target: number;
  hit: Set<number>;
  source: DamageSource;
  active: boolean;
}

export interface EnemyBullet {
  sprite: GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  life: number;
  active: boolean;
}

export type PickupKind = "xp" | "coin" | "heart" | "magnet" | "venom" | "emp" | "chest";

export interface Pickup {
  kind: PickupKind;
  sprite: GameObjects.Image;
  glow?: GameObjects.Image;
  x: number;
  y: number;
  value: number;
  pulled: boolean;
  active: boolean;
}

export interface Turret {
  base: GameObjects.Image;
  gun: GameObjects.Image;
  range: GameObjects.Image;
  x: number;
  y: number;
  expiresAt: number;
  nextShot: number;
}

export interface Mine {
  sprite: GameObjects.Image;
  x: number;
  y: number;
  armedAt: number;
}

export interface Arena {
  seed: number;
  width: number;
  height: number;
  asteroids: { x: number; y: number; r: number }[];
  nebulas: { x: number; y: number; r: number }[];
}

// ---------- Progressione ----------

export type TomeId =
  | "power"
  | "cadence"
  | "vitality"
  | "mobility"
  | "magnetism"
  | "wisdom"
  | "vampirism"
  | "engineering";

export type ItemId =
  | "splitter"
  | "bounce"
  | "blades"
  | "arc"
  | "drone"
  | "turretSlot"
  | "mineSupply"
  | "bulkhead";

export type Rarity = "common" | "uncommon" | "rare" | "legendary";

export interface TomeDef {
  id: TomeId;
  title: string;
  stat: string;
  increment: number;
  color: number;
  icon: IconId;
  cost: number;
  evolution: { title: string; description: string };
}

export interface ItemDef {
  id: ItemId;
  title: string;
  description: string;
  perLevel: string;
  color: number;
  icon: IconId;
  cost: number;
}

export interface TomeOffer {
  tome: TomeDef;
  rarity: Rarity;
  value: number;
}

export interface Run {
  difficulty: DifficultyId;
  seed: number;
  time: number;
  wave: number;
  waveEndsAt: number;
  nextWaveAt: number;
  inBreak: boolean;
  event: "normal" | "boss" | "horde";
  level: number;
  xp: number;
  xpToNext: number;
  coins: number;
  kills: number;
  hp: number;
  tomes: Partial<Record<TomeId, { level: number; bonus: number }>>;
  items: Partial<Record<ItemId, number>>;
  freeRerolls: number;
  paidRerolls: number;
  invulnUntil: number;
  dashUntil: number;
  dashReadyAt: number;
  dashDir: { x: number; y: number };
  shieldReadyAt: number;
  venomUntil: number;
  magnetUntil: number;
  nextChestKills: number;
  volleys: number;
  damageBySource: Partial<Record<DamageSource, number>>;
  /** Loadout di partenza: fisso nel survival, dato dall'equipaggiamento in campagna. */
  base: Stats;
  stats: Stats;
  over: boolean;
}
