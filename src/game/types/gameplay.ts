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
  lifeSteal: number;
};

export type SectorSize = "small" | "medium" | "large";

export type MapDirection = "north" | "east" | "south" | "west";

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

export type MapSectorState = {
  sectors: MapSector[];
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
  body: Phaser.GameObjects.Arc;
  marker?:
    | Phaser.GameObjects.Arc
    | Phaser.GameObjects.Rectangle
    | Phaser.GameObjects.Triangle;
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
  body: Phaser.GameObjects.Arc;
  velocity: Phaser.Math.Vector2;
  damage: number;
  distanceLeft: number;
  radius: number;
};

export type Pickup = {
  body: Phaser.GameObjects.Arc;
  kind: "xp" | "coin" | "hp";
  value: number;
  radius: number;
};

export type UpgradeSource = "xp" | "chest";

export type UpgradeCategory =
  | "weapon"
  | "ship"
  | "pickup"
  | "turret"
  | "mine"
  | "barricade"
  | "drone"
  | "economy";

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
  lifeStealBonus: number;
  shipSlotBonus: number;
};

export type UpgradeApplyContext = {
  stats: PlayerStats;
  runUpgrades: RunUpgradeState;
};

export type NumericModifierOperation = "add" | "multiply" | "set";

export type PlayerStatModifier = {
  target: "playerStat";
  stat: keyof PlayerStats;
  operation: NumericModifierOperation;
  value: number;
  min?: number;
  max?: number;
};

export type RunUpgradeModifier = {
  target: "runUpgrade";
  stat: Exclude<keyof RunUpgradeState, "stacks">;
  operation: NumericModifierOperation;
  value: number | boolean;
  min?: number;
  max?: number;
};

export type Modifier = PlayerStatModifier | RunUpgradeModifier;

export type Upgrade = {
  id: string;
  source: UpgradeSource;
  category: UpgradeCategory;
  title: string;
  description: string;
  maxStacks?: number;
  weight?: number;
  modifiers?: Modifier[];
  apply?: (context: UpgradeApplyContext) => void;
};

export type LootTable<T> = {
  id: string;
  source: UpgradeSource;
  entries: T[];
  fallback?: T;
};

export type LootBiasContext = {
  runUpgrades: RunUpgradeState;
  loadout?: ShopLoadout;
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
  body: Phaser.GameObjects.Rectangle;
  rangeIndicator: Phaser.GameObjects.Arc;
  hpBar: Phaser.GameObjects.Graphics;
  levelText: Phaser.GameObjects.Text;
  gridX: number;
  gridY: number;
  level: number;
  label: string;
  baseCost: number;
  sourceId: ShopItemId;
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
  sourceId: ShopItemId;
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
  body: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  kind: ChestKind;
  cost: number;
  radius: number;
  opened: boolean;
};

export type HangarUpgradeId =
  | "starterHull"
  | "starterThrusters"
  | "starterMagnet";

export type HangarUpgrade = {
  id: HangarUpgradeId;
  title: string;
  description: string;
  baseCost: number;
  maxLevel: number;
  apply: (stats: PlayerStats, level: number) => void;
};

export type ShopCategory =
  | "ships"
  | "weapons"
  | "boosters"
  | "turrets"
  | "mines";

export type ShopItemId =
  | "shipScout"
  | "shipTank"
  | "shipLightFighter"
  | "shipSupport"
  | "shipSniper"
  | "weaponBase"
  | "weaponRapid"
  | "weaponHeavy"
  | "weaponShotgun"
  | "weaponScatter"
  | "boosterNone"
  | "boosterHull"
  | "boosterSpeed"
  | "boosterMagnet"
  | "boosterOverdrive"
  | "turretBasic"
  | "turretTesla"
  | "turretLongRange"
  | "turretSiege"
  | "mineBasic"
  | "mineBlast"
  | "mineCluster"
  | "mineEMP";

export type ShopLoadout = Record<ShopCategory, ShopItemId>;
export type ShopItemLevels = Partial<Record<ShopItemId, number>>;

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

export type ShopItem = {
  id: ShopItemId;
  category: ShopCategory;
  title: string;
  description: string;
  statLine: string;
  accentColor: number;
  iconKind:
    | "shipStandard"
    | "shipTank"
    | "shipLight"
    | "shipSniper"
    | "weaponBase"
    | "weaponRapid"
    | "weaponHeavy"
    | "weaponShotgun"
    | "boosterNone"
    | "boosterHull"
    | "boosterSpeed"
    | "boosterMagnet"
    | "turretBasic"
    | "turretLongRange"
    | "turretTesla"
    | "mineBasic"
    | "mineBlast";
  cost: number;
  isDefault: boolean;
  modifiers?: Modifier[];
  upgrade?: {
    label: string;
    modifiersPerLevel: Modifier[];
  };
  turret?: TurretDefinition;
  mine?: MineDefinition;
};

export type PostRunRewardPreview = {
  reachedLevel: number;
  reachedWave: number;
  earnedCredits: number;
};

export type MetaProgressionState = {
  permanentCoins: number;
  postRunCredits: number;
  upgrades: Record<HangarUpgradeId, number>;
  unlockedItems: ShopItemId[];
  itemLevels: ShopItemLevels;
  loadout: ShopLoadout;
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
};
