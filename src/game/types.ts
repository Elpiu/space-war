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
  | "boss"
  // Solo campagna: unità di terra, strutture e trasporti.
  | "aaTurret"
  | "tank"
  | "silo"
  | "fuelTank"
  | "billboard"
  | "cargo"
  | "gunship"
  // Bestiario v3
  | "interceptor"
  | "zigzag"
  | "bomber"
  | "laserDrone"
  | "missilePod"
  | "repairer"
  | "shieldBearer"
  | "gravityWell"
  | "empDrone"
  | "phantom"
  | "teleporter"
  | "splitter"
  // Bestiario 2
  | "diver"
  | "flak"
  | "radar"
  | "leech"
  | "mirror"
  | "broodmother"
  | "spaceMine"
  | "flakTower"
  | "laserPylon"
  | "spider"
  | "shieldGen"
  | "droneHangar"
  // Mini-boss, boss e loro parti
  | "minelayer"
  | "battleship"
  | "weakpoint"
  | "serpent"
  | "serpentSegment"
  | "fortress"
  | "queen";

/** Schemi di fuoco (vedi systems/patterns.ts). */
export type PatternId = "aimed" | "burst" | "fan" | "U" | "I" | "S" | "C" | "X" | "wall" | "spiral";

export type AffixId = "swift" | "armored" | "splitter" | "regen" | "explosive" | "barrier" | "phantom";

export interface ProjectileDef {
  speed: number;
  damage: number;
  radius: number;
  cooldown: number;
  range: number;
  /** Colpi a parabola (bombe) e a ricerca (missili). */
  gravity?: number;
  homing?: number;
  /** Granata a frammentazione: a fine corsa si apre in N schegge. */
  burst?: number;
  /** Moto ondulato (schema a S): ampiezza laterale in px e frequenza in rad/s. */
  wave?: number;
  waveFreq?: number;
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
  /** Solo in campagna: mai negli spawn del survival. */
  campaignOnly?: boolean;
  /** Struttura: non si muove e non attacca, vale monete. */
  structure?: boolean;
  /** Boss di fine percorso / di wave: barra in alto, vittoria alla sua morte. */
  boss?: boolean;
  /** Mini-boss della campagna: ferma lo scorrimento finché non cade. */
  miniBoss?: boolean;
  /** Parte di un nemico più grande (segmenti, punti deboli): muore con lui. */
  part?: boolean;
  /** Annunci delle fasi 2 e 3 (boss). */
  phases?: [string, string];
  /** Schema di fuoco del colpo normale (default: mirato). */
  pattern?: PatternId;
}

/** Traiettoria prestabilita dei volanti in formazione (campagna). */
export interface FlightPath {
  kind: "straight" | "sine" | "dive" | "hold" | "wheel";
  /** Per "hold": resta a combattere riposizionandosi invece di uscire dopo holdFor. */
  engage?: boolean;
  /** Bersaglio corrente del riposizionamento (frazione dello schermo in x, pixel in y). */
  tx?: number;
  ty?: number;
  t: number;
  x0: number;
  y0: number;
  speed: number;
  amp?: number;
  freq?: number;
  phase?: number;
  targetY?: number;
  /** Per "hold": frazione dello schermo dove fermarsi, e per quanto. */
  holdAt?: number;
  holdFor?: number;
  stage?: number;
  holdUntil?: number;
  exitY?: number;
}

export type EnemyState = "move" | "windup" | "dash" | "recover" | "aim" | "arming" | "latched" | "open";

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
  path?: FlightPath;
  /** Unità ancorata al pavimento o al soffitto. */
  anchor?: "floor" | "ceil";
  homeX: number;
  dir: number;
  /** Fantasmi: in questa fase i colpi passano attraverso. */
  intangible: boolean;
  /** Protetto da uno Scudiero fino a questo istante (danno dimezzato). */
  protectedUntil: number;
  /** Punti barriera (affisso Schermato): si consumano prima degli HP. */
  barrier: number;
  /** Generazione degli Scissionisti (0 = originale). */
  gen: number;
  auxX: number;
  auxY: number;
  /** Schema di fuoco di questo esemplare (sostituisce quello della definizione). */
  pattern?: PatternId;
  /** Nemico a cui appartiene questa parte (segmenti, punti deboli). */
  owner?: Enemy;
  /** Scia della testa del Serpente: i segmenti la seguono. */
  trail?: { x: number; y: number }[];
  /** Fasi extra del boss (campagna infinita): attacchi più fitti. */
  bossTier: number;
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
  /** Moltiplicatore contro unità di terra e strutture. */
  groundMul: number;
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
  gravity: number;
  homing: number;
  burst: number;
  /** Moto ondulato: ampiezza, frequenza, fase ed età del proiettile. */
  wave: number;
  waveFreq: number;
  phase: number;
  age: number;
  active: boolean;
}

export type PickupKind = "xp" | "coin" | "heart" | "magnet" | "venom" | "emp" | "chest" | "capsule";

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

/** Profili di pavimento e soffitto campionati ogni `step` pixel. */
export interface Terrain {
  step: number;
  height: number;
  floor: number[];
  ceil: number[];
  /** Tipo di segmento per campione: decide lo stile del disegno. */
  kinds: string[];
  /** Colori del bioma: sostituiscono lo stile per tipo di segmento. */
  palette?: { fill: number; edge: number; vein: number };
}

export interface Arena {
  seed: number;
  width: number;
  height: number;
  terrain?: Terrain;
  asteroids: { x: number; y: number; r: number }[];
  nebulas: { x: number; y: number; r: number }[];
  /** Colori di nebulose e asteroidi del bioma. */
  palette?: { nebula: [number, number]; rock: [number, number] };
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
  /** Moltiplicatori dei nemici (campagna infinita); 1 altrove. */
  threat: { hp: number; damage: number; speed: number };
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
