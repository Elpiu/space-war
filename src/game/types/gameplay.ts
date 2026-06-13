export type PlayerStats = {
  maxHp: number;
  hp: number;
  speed: number;
  damage: number;
  fireRate: number;
  bulletSpeed: number;
  bulletRange: number;
  pickupRadius: number;
  multiShot: number;
  xpMultiplier: number;
  luck: number;
  lifeStealPercent: number;
};

export type SectorSize = "small" | "medium" | "large";

export type MapDirection = "north" | "east" | "south" | "west";

export type MapGenerationPattern = "mixed" | "compact" | "branching" | "spine";

export type MapGenerationProfile = {
  maxSectors: number;
  maxDepth: number;
  pattern: MapGenerationPattern;
};

export type MapOpening = {
  direction: MapDirection;
  centerRatio: number;
  sizeRatio: number;
};

export type SectorArchetypeId =
  | "balanced"
  | "salvage"
  | "nebula"
  | "plasma"
  | "fortress";

export type MapHazardKind =
  | "asteroid"
  | "nebula"
  | "plasma"
  | "gravityWell"
  | "radiation";

export type MapHazard = {
  id: string;
  kind: MapHazardKind;
  x: number;
  y: number;
  radius: number;
  damage?: number;
  slowMultiplier?: number;
};

export type MapSector = {
  id: string;
  name: string;
  size: SectorSize;
  depth: number;
  gridX: number;
  gridY: number;
  cellWidth: number;
  cellHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
  archetype: SectorArchetypeId;
  risk: number;
  rewardMultiplier: number;
  color: number;
  accentColor: number;
  hazards: MapHazard[];
  openings: MapOpening[];
};

export type MapSectorBlueprint = {
  id: string;
  number: number;
  size: SectorSize;
  archetype: SectorArchetypeId;
  depth: number;
  gridX: number;
  gridY: number;
  cellWidth: number;
  cellHeight: number;
  entryDirection?: MapDirection;
  sectorSeed: number;
};

export type MapSectorState = {
  sectors: MapSector[];
  seed: number;
  profile: MapGenerationProfile;
  plannedSectors: MapSectorBlueprint[];
  nextPlannedSectorIndex: number;
  nextSectorNumber: number;
  lastExpandedWave: number;
  activeSpawnSectorIds: string[];
};

export type EnemyTypeId =
  | "chaser"
  | "swarm"
  | "brute"
  | "shooter"
  | "charger"
  | "sniper"
  | "eliteBrute"
  | "bossDreadnought";

export type EnemyBehavior = "chaser" | "swarm" | "brute" | "shooter";

export type EnemyProjectileDefinition = {
  speed: number;
  range: number;
  damage: number;
  radius: number;
  color: number;
};

export type EnemyDefinition = {
  id: EnemyTypeId;
  label: string;
  behavior: EnemyBehavior;
  hp: number;
  speed: number;
  damage: number;
  radius: number;
  xpValue: number;
  coinValue: number;
  color: number;
  strokeColor: number;
  iconKey?: string;
  preferredDistance?: number;
  attackRange?: number;
  attackCooldown?: number;
  projectile?: EnemyProjectileDefinition;
};

export type Enemy = {
  body: Phaser.GameObjects.Arc | Phaser.GameObjects.Image;
  marker?:
    | Phaser.GameObjects.Arc
    | Phaser.GameObjects.Rectangle
    | Phaser.GameObjects.Triangle;
  projectileImageKey?: string;
  baseScaleX: number;
  baseScaleY: number;
  typeId: EnemyTypeId;
  definition: EnemyDefinition;
  hp: number;
  speed: number;
  damage: number;
  xpValue: number;
  coinValue: number;
  radius: number;
  nextAttackAt: number;
  attackCooldown: number;
};

export type Bullet = {
  body: Phaser.GameObjects.Arc;
  velocity: Phaser.Math.Vector2;
  damage: number;
  distanceLeft: number;
  radius: number;
};

export type EnemyProjectile = {
  body: Phaser.GameObjects.Arc | Phaser.GameObjects.Image;
  velocity: Phaser.Math.Vector2;
  damage: number;
  distanceLeft: number;
  radius: number;
};

export type Pickup = {
  body: Phaser.GameObjects.Arc | Phaser.GameObjects.Container;
  kind: "xp" | "coin" | "hp" | "special";
  value: number;
  radius: number;
  specialEffectId?: SpecialDropId;
};

export type DamageSource =
  | "shipProjectile"
  | "turret"
  | "mine"
  | "drone";

export type SpecialDropId = "magnet-overload" | "venom-rounds";

export type SpecialDropDefinition = {
  id: SpecialDropId;
  title: string;
  description: string;
  durationMs: number;
  color: number;
  iconKey: string;
};

export type TemporaryEffectState = {
  magnetOverloadUntil: number;
  venomRoundsUntil: number;
};

export type UpgradeCategory =
  | "weapon"
  | "ship"
  | "pickup"
  | "turret"
  | "mine"
  | "barricade"
  | "drone"
  | "economy";

export type Rarity = "common" | "uncommon" | "rare" | "legendary";
export type UpgradeCardRarity = Rarity;

export type UpgradeCardVisual = {
  iconKey: string;
  backgroundKey: string;
  accentColor: number;
  familyLabel: string;
  shortEffect: string;
  rarity: UpgradeCardRarity;
};

export type RunUpgradeState = {
  stacks: Record<string, number>;
  turretDamageBonus: number;
  turretRangeBonus: number;
  turretFireRateMultiplier: number;
  turretHpBonus: number;
  maxTurretBonus: number;
  mineDamageBonus: number;
  mineRadiusBonus: number;
  mineCostReduction: number;
  maxMineBonus: number;
  barricadeUnlocked: boolean;
  barricadeHpBonus: number;
  barricadeCostReduction: number;
  maxBarricades: number;
  droneLimit: number;
  droneDamageBonus: number;
  droneFireRateMultiplier: number;
  xpMultiplierBonus: number;
  shipSlotBonus: number;
  engineeringMultiplier: number;
  swarmMultiplier: number;
  maxHpPer100Kills: number;
};

export type RunTomeState = {
  levels: Partial<Record<TomeId, number>>;
  totalBonuses: Partial<Record<TomeId, number>>;
};

export type RunItemState = {
  levels: Partial<Record<ChestItemId, number>>;
};

export type RunDifficultyState = {
  enemyHpMultiplier: number;
  enemyDamageMultiplier: number;
  spawnDensityMultiplier: number;
  rewardMultiplier: number;
  chestFrequencyMultiplier: number;
};

export type TomeId =
  | "power"
  | "cadence"
  | "vitality"
  | "mobility"
  | "wisdom"
  | "magnetism"
  | "fortune"
  | "difficulty"
  | "vampirism"
  | "ballistics"
  | "engineering"
  | "swarm";

export type ChestItemId =
  | "splitter-camera"
  | "sentinel-beacon"
  | "turret-optics"
  | "turret-slot"
  | "mine-supply"
  | "blast-charge"
  | "barricade-kit"
  | "reactive-plating"
  | "heavy-core"
  | "rapid-loader"
  | "drone-arsenal"
  | "overdrive-reactor"
  | "reinforced-bulkhead"
  | "adaptive-hull";

export type ContentKind = "tome" | "item";

export type TomeApplyContext = {
  stats: PlayerStats;
  runUpgrades: RunUpgradeState;
  difficulty: RunDifficultyState;
};

export type TomeDefinition = {
  id: TomeId;
  title: string;
  description: string;
  shortEffect: string;
  accentColor: number;
  baseIncrement: number;
  maxLevel: number;
  cost: number;
  isDefault: boolean;
  apply: (context: TomeApplyContext, scaledIncrement: number) => void;
};

export type TomeOffer = {
  tome: TomeDefinition;
  rarity: Rarity;
  rarityMultiplier: number;
  scaledIncrement: number;
};

export type ChestItemDefinition = {
  id: ChestItemId;
  title: string;
  description: string;
  shortEffect: string;
  category: UpgradeCategory;
  accentColor: number;
  maxLevel: number;
  cost: number;
  isDefault: boolean;
  weight?: number;
  apply: (context: TomeApplyContext, rarity: Rarity) => void;
};

export type ChestItemReward = {
  item: ChestItemDefinition;
  rarity: Rarity;
  rarityMultiplier: number;
};

export type ShopContentEntry = {
  kind: ContentKind;
  id: TomeId | ChestItemId;
  title: string;
  description: string;
  shortEffect: string;
  accentColor: number;
  cost: number;
  isDefault: boolean;
};

export type PlaceableKind = "turret" | "mine" | "barricade";

export type PlaceableCommon = {
  id: string;
  kind: PlaceableKind;
  gridX: number;
  gridY: number;
  level: number;
  label: string;
  baseCost: number;
};

export type Turret = {
  id: string;
  kind: "turret";
  body: Phaser.GameObjects.Image;
  rangeIndicator: Phaser.GameObjects.Arc;
  hpBar: Phaser.GameObjects.Graphics;
  levelText: Phaser.GameObjects.Text;
  gridX: number;
  gridY: number;
  level: number;
  label: string;
  baseCost: number;
  range: number;
  fireRate: number;
  damage: number;
  beamColor: number;
  pulseColor: number;
  nextShotAt: number;
  hp: number;
  maxHp: number;
  radius: number;
  damageCooldownUntil: number;
};

export type Mine = {
  id: string;
  kind: "mine";
  body: Phaser.GameObjects.Arc;
  gridX: number;
  gridY: number;
  level: number;
  label: string;
  baseCost: number;
  triggerRadius: number;
  damageRadius: number;
  damage: number;
  pulseColor: number;
  isExploding: boolean;
  hp: number;
  maxHp: number;
  radius: number;
  damageCooldownUntil: number;
};

export type Barricade = {
  id: string;
  kind: "barricade";
  body: Phaser.GameObjects.Rectangle;
  hpBar: Phaser.GameObjects.Graphics;
  levelText: Phaser.GameObjects.Text;
  gridX: number;
  gridY: number;
  level: number;
  label: string;
  baseCost: number;
  hp: number;
  maxHp: number;
  radius: number;
  damageCooldownUntil: number;
};

export type Drone = {
  body: Phaser.GameObjects.Triangle;
  orbitAngle: number;
  range: number;
  fireRate: number;
  damage: number;
  nextShotAt: number;
};

export type ChestKind = "reward" | "shop";

export type Chest = {
  body: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  kind: ChestKind;
  cost: number;
  radius: number;
  opened: boolean;
};

export type TurretDefinition = {
  cost: number;
  range: number;
  fireRate: number;
  damage: number;
  hp: number;
  radius: number;
  bodySize: number;
  color: number;
  strokeColor: number;
  beamColor: number;
  pulseColor: number;
};

export type MineDefinition = {
  cost: number;
  triggerRadius: number;
  damageRadius: number;
  damage: number;
  hp: number;
  radius: number;
  color: number;
  strokeColor: number;
  pulseColor: number;
  slowMultiplier?: number;
};

export type PostRunRewardPreview = {
  reachedLevel: number;
  reachedWave: number;
  earnedCredits: number;
};

export type MetaProgressionState = {
  postRunCredits: number;
  unlockedTomes: TomeId[];
  unlockedChestItems: ChestItemId[];
  activeTomes: TomeId[];
  activeChestItems: ChestItemId[];
};

export type HudState = {
  hp: number;
  maxHp: number;
  xp: number;
  xpToNext: number;
  level: number;
  coins: number;
  wave: number;
  wavePhase: string;
  enemyCount: number;
  sectorName: string;
  sectorSize: SectorSize;
  discoveredSectors: number;
  turretCount: number;
  maxTurrets: number;
  mineCount: number;
  maxMines: number;
  barricadeCount: number;
  maxBarricades: number;
  droneCount: number;
  chestCount: number;
  acquiredTomes: {
    id: string;
    title: string;
    level: number;
    accentColor: number;
  }[];
  acquiredItems: {
    id: string;
    title: string;
    category: UpgradeCategory;
    level: number;
    accentColor: number;
  }[];
  activeEffects: string[];
};
