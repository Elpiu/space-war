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
};

export type SectorSize = "small" | "medium" | "large";

export type MapDirection = "north" | "east" | "south" | "west";

export type MapHazardKind = "asteroid" | "nebula" | "plasma";

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
  risk: number;
  color: number;
  accentColor: number;
  hazards: MapHazard[];
};

export type MapSectorState = {
  sectors: MapSector[];
  nextSectorNumber: number;
  lastExpandedWave: number;
  activeSpawnSectorIds: string[];
};

export type EnemyTypeId = "chaser" | "swarm" | "brute" | "shooter";

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
};

export type UpgradeApplyContext = {
  stats: PlayerStats;
  runUpgrades: RunUpgradeState;
};

export type Upgrade = {
  id: string;
  source: UpgradeSource;
  category: UpgradeCategory;
  title: string;
  description: string;
  maxStacks?: number;
  apply: (context: UpgradeApplyContext) => void;
};

export type Turret = {
  body: Phaser.GameObjects.Rectangle;
  rangeIndicator: Phaser.GameObjects.Arc;
  range: number;
  fireRate: number;
  damage: number;
  nextShotAt: number;
  hp: number;
  maxHp: number;
  radius: number;
  damageCooldownUntil: number;
};

export type Mine = {
  body: Phaser.GameObjects.Arc;
  triggerRadius: number;
  damageRadius: number;
  damage: number;
  isExploding: boolean;
  hp: number;
  maxHp: number;
  radius: number;
  damageCooldownUntil: number;
};

export type Barricade = {
  body: Phaser.GameObjects.Rectangle;
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
  | "turretTesla"
  | "turretLongRange"
  | "mineBasic"
  | "mineBlast";

export type ShopLoadout = Record<ShopCategory, ShopItemId>;

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
  apply?: (stats: PlayerStats) => void;
};

export type MetaProgressionState = {
  permanentCoins: number;
  upgrades: Record<HangarUpgradeId, number>;
  unlockedItems: ShopItemId[];
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
