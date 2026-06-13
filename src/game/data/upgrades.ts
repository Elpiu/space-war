import type {
  ChestItemDefinition,
  ChestItemId,
  Rarity,
  RunDifficultyState,
  RunItemState,
  RunTomeState,
  RunUpgradeState,
  TomeDefinition,
  TomeId,
} from "../types/gameplay";

export const MAX_RUN_TOMES = 4;
export const MIN_ACTIVE_POOL_SIZE = 8;

export const RARITY_MULTIPLIERS: Record<Rarity, number> = {
  common: 1,
  uncommon: 1.5,
  rare: 2.25,
  legendary: 3.5,
};

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "COMUNE",
  uncommon: "NON COMUNE",
  rare: "RARO",
  legendary: "LEGGENDARIO",
};

export const createInitialRunUpgradeState = (): RunUpgradeState => ({
  stacks: {},
  turretDamageBonus: 0,
  turretRangeBonus: 0,
  turretFireRateMultiplier: 1,
  turretHpBonus: 0,
  maxTurretBonus: 0,
  mineDamageBonus: 0,
  mineRadiusBonus: 0,
  mineCostReduction: 0,
  maxMineBonus: 0,
  barricadeUnlocked: true,
  barricadeHpBonus: 0,
  barricadeCostReduction: 0,
  maxBarricades: 1,
  droneLimit: 0,
  droneDamageBonus: 0,
  droneFireRateMultiplier: 1,
  xpMultiplierBonus: 0,
  shipSlotBonus: 0,
  engineeringMultiplier: 1,
  swarmMultiplier: 1,
  maxHpPer100Kills: 0,
});

export const createInitialRunTomeState = (): RunTomeState => ({
  levels: {},
  totalBonuses: {},
});

export const createInitialRunItemState = (): RunItemState => ({
  levels: {},
});

export const createInitialDifficultyState = (): RunDifficultyState => ({
  enemyHpMultiplier: 1,
  enemyDamageMultiplier: 1,
  spawnDensityMultiplier: 1,
  rewardMultiplier: 1,
  chestFrequencyMultiplier: 1,
});

const increasePercent = (value: number, percent: number) =>
  value * (1 + percent / 100);

export const TOMES: TomeDefinition[] = [
  {
    id: "power",
    title: "Tomo della Potenza",
    description: "Aumenta percentualmente il danno della nave.",
    shortEffect: "Danno",
    accentColor: 0xfb923c,
    baseIncrement: 10,
    maxLevel: 10,
    cost: 0,
    isDefault: true,
    apply: ({ stats }, value) => {
      stats.damage = increasePercent(stats.damage, value);
    },
  },
  {
    id: "cadence",
    title: "Tomo della Cadenza",
    description: "Riduce l'intervallo tra i colpi automatici.",
    shortEffect: "Velocita attacco",
    accentColor: 0xfacc15,
    baseIncrement: 8,
    maxLevel: 10,
    cost: 0,
    isDefault: true,
    apply: ({ stats }, value) => {
      stats.fireRate = Math.max(70, stats.fireRate / (1 + value / 100));
    },
  },
  {
    id: "vitality",
    title: "Tomo della Vitalita",
    description: "Aumenta gli HP massimi e cura dello stesso valore.",
    shortEffect: "HP massimi",
    accentColor: 0xfb7185,
    baseIncrement: 12,
    maxLevel: 10,
    cost: 0,
    isDefault: true,
    apply: ({ stats }, value) => {
      const oldMax = stats.maxHp;
      stats.maxHp = increasePercent(stats.maxHp, value);
      stats.hp = Math.min(stats.maxHp, stats.hp + stats.maxHp - oldMax);
    },
  },
  {
    id: "mobility",
    title: "Tomo della Mobilita",
    description: "Aumenta la velocita di movimento.",
    shortEffect: "Movimento",
    accentColor: 0x34d399,
    baseIncrement: 8,
    maxLevel: 10,
    cost: 0,
    isDefault: true,
    apply: ({ stats }, value) => {
      stats.speed = increasePercent(stats.speed, value);
    },
  },
  {
    id: "wisdom",
    title: "Tomo della Sapienza",
    description: "Aumenta l'esperienza ottenuta dai pickup.",
    shortEffect: "Esperienza",
    accentColor: 0x22d3ee,
    baseIncrement: 10,
    maxLevel: 10,
    cost: 0,
    isDefault: true,
    apply: ({ stats }, value) => {
      stats.xpMultiplier = increasePercent(stats.xpMultiplier, value);
    },
  },
  {
    id: "magnetism",
    title: "Tomo del Magnetismo",
    description: "Estende il raggio di raccolta dei pickup.",
    shortEffect: "Raggio raccolta",
    accentColor: 0x38bdf8,
    baseIncrement: 15,
    maxLevel: 10,
    cost: 0,
    isDefault: true,
    apply: ({ stats }, value) => {
      stats.pickupRadius = increasePercent(stats.pickupRadius, value);
    },
  },
  {
    id: "fortune",
    title: "Tomo della Fortuna",
    description: "Migliora rarita e frequenza dei drop speciali.",
    shortEffect: "Fortuna",
    accentColor: 0xfbbf24,
    baseIncrement: 10,
    maxLevel: 10,
    cost: 0,
    isDefault: true,
    apply: ({ stats }, value) => {
      stats.luck += value;
    },
  },
  {
    id: "difficulty",
    title: "Tomo della Difficolta",
    description: "Rende le wave piu dure, ma accelera tutte le ricompense.",
    shortEffect: "Rischio e ricompensa",
    accentColor: 0xef4444,
    baseIncrement: 10,
    maxLevel: 10,
    cost: 0,
    isDefault: true,
    apply: ({ difficulty }, value) => {
      difficulty.enemyHpMultiplier = increasePercent(
        difficulty.enemyHpMultiplier,
        value,
      );
      difficulty.enemyDamageMultiplier = increasePercent(
        difficulty.enemyDamageMultiplier,
        value * 0.7,
      );
      difficulty.spawnDensityMultiplier = increasePercent(
        difficulty.spawnDensityMultiplier,
        value * 0.65,
      );
      difficulty.rewardMultiplier = increasePercent(
        difficulty.rewardMultiplier,
        value,
      );
      difficulty.chestFrequencyMultiplier = increasePercent(
        difficulty.chestFrequencyMultiplier,
        value * 0.8,
      );
    },
  },
  {
    id: "vampirism",
    title: "Tomo del Vampirismo",
    description: "Cura una parte del danno effettivamente inflitto.",
    shortEffect: "Vampirismo",
    accentColor: 0xbe123c,
    baseIncrement: 1.5,
    maxLevel: 10,
    cost: 45,
    isDefault: false,
    apply: ({ stats }, value) => {
      stats.lifeStealPercent = Math.min(18, stats.lifeStealPercent + value);
    },
  },
  {
    id: "ballistics",
    title: "Tomo della Balistica",
    description: "Aumenta velocita e gittata dei proiettili.",
    shortEffect: "Proiettili",
    accentColor: 0xa78bfa,
    baseIncrement: 10,
    maxLevel: 10,
    cost: 35,
    isDefault: false,
    apply: ({ stats }, value) => {
      stats.bulletSpeed = increasePercent(stats.bulletSpeed, value);
      stats.bulletRange = increasePercent(stats.bulletRange, value);
    },
  },
  {
    id: "engineering",
    title: "Tomo dell'Ingegneria",
    description: "Migliora danno, resistenza e portata dei piazzabili.",
    shortEffect: "Piazzabili",
    accentColor: 0x2dd4bf,
    baseIncrement: 10,
    maxLevel: 10,
    cost: 55,
    isDefault: false,
    apply: ({ runUpgrades }, value) => {
      runUpgrades.engineeringMultiplier = increasePercent(
        runUpgrades.engineeringMultiplier,
        value,
      );
    },
  },
  {
    id: "swarm",
    title: "Tomo dello Sciame",
    description: "Migliora danno e cadenza dei droni presenti e futuri.",
    shortEffect: "Droni",
    accentColor: 0xc084fc,
    baseIncrement: 10,
    maxLevel: 10,
    cost: 60,
    isDefault: false,
    apply: ({ runUpgrades }, value) => {
      runUpgrades.swarmMultiplier = increasePercent(
        runUpgrades.swarmMultiplier,
        value,
      );
    },
  },
];

const discreteByRarity = (
  rarity: Rarity,
  values: Record<Rarity, number>,
) => values[rarity];

export const CHEST_ITEMS: ChestItemDefinition[] = [
  {
    id: "splitter-camera",
    title: "Camera Splitter",
    description: "Aggiunge proiettili laterali al fuoco automatico.",
    shortEffect: "Proiettili +",
    category: "weapon",
    accentColor: 0xfef08a,
    maxLevel: 10,
    cost: 0,
    isDefault: true,
    apply: ({ stats }, rarity) => {
      stats.multiShot = Math.min(
        12,
        stats.multiShot +
          discreteByRarity(rarity, {
            common: 1,
            uncommon: 1,
            rare: 2,
            legendary: 3,
          }),
      );
    },
  },
  {
    id: "sentinel-beacon",
    title: "Faro Sentinella",
    description: "Richiama mini navicelle automatiche.",
    shortEffect: "Droni +",
    category: "drone",
    accentColor: 0xa78bfa,
    maxLevel: 10,
    cost: 0,
    isDefault: true,
    apply: ({ runUpgrades }, rarity) => {
      runUpgrades.droneLimit += discreteByRarity(rarity, {
        common: 1,
        uncommon: 1,
        rare: 2,
        legendary: 3,
      });
    },
  },
  {
    id: "turret-optics",
    title: "Ottiche Torretta",
    description: "Aumenta portata e precisione delle torrette.",
    shortEffect: "Range torretta +",
    category: "turret",
    accentColor: 0x38bdf8,
    maxLevel: 10,
    cost: 0,
    isDefault: true,
    apply: ({ runUpgrades }, rarity) => {
      runUpgrades.turretRangeBonus += 24 * RARITY_MULTIPLIERS[rarity];
    },
  },
  {
    id: "turret-slot",
    title: "Slot Torretta",
    description: "Aumenta il numero massimo di torrette.",
    shortEffect: "Slot torretta +",
    category: "turret",
    accentColor: 0x60a5fa,
    maxLevel: 10,
    cost: 0,
    isDefault: true,
    apply: ({ runUpgrades }, rarity) => {
      runUpgrades.maxTurretBonus += discreteByRarity(rarity, {
        common: 1,
        uncommon: 1,
        rare: 2,
        legendary: 3,
      });
    },
  },
  {
    id: "mine-supply",
    title: "Scorta Mine",
    description: "Riduce il costo e aumenta il limite delle mine.",
    shortEffect: "Mine costo -",
    category: "mine",
    accentColor: 0xfacc15,
    maxLevel: 10,
    cost: 0,
    isDefault: true,
    apply: ({ runUpgrades }, rarity) => {
      const amount = discreteByRarity(rarity, {
        common: 1,
        uncommon: 1,
        rare: 2,
        legendary: 3,
      });
      runUpgrades.mineCostReduction += amount;
      runUpgrades.maxMineBonus += amount;
    },
  },
  {
    id: "blast-charge",
    title: "Carica Esplosiva",
    description: "Aumenta danno e raggio delle mine.",
    shortEffect: "Mine potenza +",
    category: "mine",
    accentColor: 0xfb923c,
    maxLevel: 10,
    cost: 0,
    isDefault: true,
    apply: ({ runUpgrades }, rarity) => {
      const multiplier = RARITY_MULTIPLIERS[rarity];
      runUpgrades.mineDamageBonus += 1.2 * multiplier;
      runUpgrades.mineRadiusBonus += 12 * multiplier;
    },
  },
  {
    id: "barricade-kit",
    title: "Kit Barricata",
    description: "Sblocca e aumenta le barricate piazzabili.",
    shortEffect: "Barricate +",
    category: "barricade",
    accentColor: 0xe2e8f0,
    maxLevel: 10,
    cost: 0,
    isDefault: true,
    apply: ({ runUpgrades }, rarity) => {
      runUpgrades.barricadeUnlocked = true;
      runUpgrades.maxBarricades += discreteByRarity(rarity, {
        common: 2,
        uncommon: 2,
        rare: 3,
        legendary: 5,
      });
    },
  },
  {
    id: "reactive-plating",
    title: "Piastre Reattive",
    description: "Rinforza torrette e barricate.",
    shortEffect: "HP difese +",
    category: "barricade",
    accentColor: 0x94a3b8,
    maxLevel: 10,
    cost: 0,
    isDefault: true,
    apply: ({ runUpgrades }, rarity) => {
      const multiplier = RARITY_MULTIPLIERS[rarity];
      runUpgrades.barricadeUnlocked = true;
      runUpgrades.maxBarricades = Math.max(2, runUpgrades.maxBarricades);
      runUpgrades.barricadeHpBonus += 5 * multiplier;
      runUpgrades.turretHpBonus += 4 * multiplier;
    },
  },
  {
    id: "heavy-core",
    title: "Nucleo Pesante",
    description: "Aumenta molto il danno, ma rallenta la cadenza.",
    shortEffect: "Danno alto",
    category: "weapon",
    accentColor: 0xf97316,
    maxLevel: 10,
    cost: 35,
    isDefault: false,
    apply: ({ stats }, rarity) => {
      const multiplier = RARITY_MULTIPLIERS[rarity];
      stats.damage = increasePercent(stats.damage, 12 * multiplier);
      stats.fireRate = increasePercent(stats.fireRate, 4);
    },
  },
  {
    id: "rapid-loader",
    title: "Caricatore Rapido",
    description: "Accelera il fuoco, riducendo leggermente il danno.",
    shortEffect: "Cadenza alta",
    category: "weapon",
    accentColor: 0x67e8f9,
    maxLevel: 10,
    cost: 35,
    isDefault: false,
    apply: ({ stats }, rarity) => {
      stats.fireRate = Math.max(
        70,
        stats.fireRate / (1 + (10 * RARITY_MULTIPLIERS[rarity]) / 100),
      );
      stats.damage = Math.max(0.5, stats.damage * 0.98);
    },
  },
  {
    id: "drone-arsenal",
    title: "Arsenale Drone",
    description: "Potenziamento offensivo per tutte le sentinelle.",
    shortEffect: "Armi drone +",
    category: "drone",
    accentColor: 0xc084fc,
    maxLevel: 10,
    cost: 45,
    isDefault: false,
    apply: ({ runUpgrades }, rarity) => {
      const multiplier = RARITY_MULTIPLIERS[rarity];
      runUpgrades.droneDamageBonus += multiplier;
      runUpgrades.droneFireRateMultiplier = Math.max(
        0.35,
        runUpgrades.droneFireRateMultiplier / (1 + 0.08 * multiplier),
      );
    },
  },
  {
    id: "overdrive-reactor",
    title: "Reattore Overdrive",
    description: "Potenzia danno e cadenza sacrificando scafo massimo.",
    shortEffect: "Potenza instabile",
    category: "ship",
    accentColor: 0xef4444,
    maxLevel: 10,
    cost: 60,
    isDefault: false,
    apply: ({ stats }, rarity) => {
      const multiplier = RARITY_MULTIPLIERS[rarity];
      stats.damage = increasePercent(stats.damage, 7 * multiplier);
      stats.fireRate = Math.max(
        70,
        stats.fireRate / (1 + (6 * multiplier) / 100),
      );
      const hpLoss = Math.min(stats.maxHp - 1, 0.4 * multiplier);
      stats.maxHp -= hpLoss;
      stats.hp = Math.min(stats.hp, stats.maxHp);
    },
  },
  {
    id: "reinforced-bulkhead",
    title: "Paratia Rinforzata",
    description: "Aumenta immediatamente gli HP massimi e cura dello stesso valore.",
    shortEffect: "HP flat +",
    category: "ship",
    accentColor: 0x4ade80,
    maxLevel: 10,
    cost: 40,
    isDefault: false,
    apply: ({ stats }, rarity) => {
      const hp = discreteByRarity(rarity, {
        common: 1,
        uncommon: 2,
        rare: 3,
        legendary: 5,
      });
      stats.maxHp += hp;
      stats.hp += hp;
    },
  },
  {
    id: "adaptive-hull",
    title: "Scafo Adattivo",
    description: "Ogni 100 kill aumenta permanentemente gli HP massimi per la run.",
    shortEffect: "HP ogni 100 kill",
    category: "ship",
    accentColor: 0x2dd4bf,
    maxLevel: 10,
    cost: 55,
    isDefault: false,
    apply: ({ runUpgrades }, rarity) => {
      runUpgrades.maxHpPer100Kills += discreteByRarity(rarity, {
        common: 1,
        uncommon: 1,
        rare: 2,
        legendary: 3,
      });
    },
  },
];

export const DEFAULT_TOME_IDS = TOMES.filter((entry) => entry.isDefault).map(
  (entry) => entry.id,
);
export const DEFAULT_CHEST_ITEM_IDS = CHEST_ITEMS.filter(
  (entry) => entry.isDefault,
).map((entry) => entry.id);

export const getTomeById = (id: TomeId) =>
  TOMES.find((entry) => entry.id === id);

export const getChestItemById = (id: ChestItemId) =>
  CHEST_ITEMS.find((entry) => entry.id === id);

export const getTomeLevel = (state: RunTomeState, id: TomeId) =>
  state.levels[id] ?? 0;

export const getItemLevel = (state: RunItemState, id: ChestItemId) =>
  state.levels[id] ?? 0;
