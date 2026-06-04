import type { LootTable, RunUpgradeState, Upgrade } from "../types/gameplay";

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
  barricadeUnlocked: false,
  barricadeHpBonus: 0,
  barricadeCostReduction: 0,
  maxBarricades: 0,
  droneLimit: 0,
  droneDamageBonus: 0,
  droneFireRateMultiplier: 1,
  xpMultiplierBonus: 0,
  lifeStealBonus: 0,
  shipSlotBonus: 0,
});

export const XP_UPGRADES: Upgrade[] = [
  {
    id: "rapid-fire",
    source: "xp",
    category: "weapon",
    title: "Cadenza rapida",
    description: "Spari piu spesso.",
    maxStacks: 5,
    weight: 1.15,
    modifiers: [
      { target: "playerStat", stat: "fireRate", operation: "multiply", value: 0.82 },
    ],
  },
  {
    id: "heavy-shots",
    source: "xp",
    category: "weapon",
    title: "Colpi pesanti",
    description: "Aumenta il danno dei proiettili.",
    maxStacks: 5,
    weight: 1.1,
    modifiers: [
      { target: "playerStat", stat: "damage", operation: "add", value: 1.4 },
    ],
  },
  {
    id: "thrusters",
    source: "xp",
    category: "ship",
    title: "Propulsori",
    description: "La navicella si muove piu veloce.",
    maxStacks: 4,
    modifiers: [
      { target: "playerStat", stat: "speed", operation: "add", value: 35 },
    ],
  },
  {
    id: "cargo-magnet",
    source: "xp",
    category: "pickup",
    title: "Magnete cargo",
    description: "Raccogli pickup da piu lontano.",
    maxStacks: 4,
    weight: 0.9,
    modifiers: [
      { target: "playerStat", stat: "pickupRadius", operation: "add", value: 36 },
    ],
  },
  {
    id: "multishot",
    source: "xp",
    category: "weapon",
    title: "Doppio arco",
    description: "Aggiunge un proiettile laterale.",
    maxStacks: 3,
    modifiers: [
      { target: "playerStat", stat: "multiShot", operation: "add", value: 1, max: 4 },
    ],
  },
  {
    id: "reinforced-hull",
    source: "xp",
    category: "ship",
    title: "Scafo rinforzato",
    description: "Aumenta HP massimi e cura il gli HP mancanti.",
    maxStacks: 5,
    apply: ({ stats }) => {
      stats.maxHp += 2;
      stats.hp = Math.floor(stats.maxHp);
    },
  },
  {
    id: "turret-calibration",
    source: "xp",
    category: "turret",
    title: "Calibrazione torrette",
    description: "Torrette con piu danno e piu vita.",
    maxStacks: 4,
    weight: 0.85,
    modifiers: [
      { target: "runUpgrade", stat: "turretDamageBonus", operation: "add", value: 1.5 },
      { target: "runUpgrade", stat: "turretHpBonus", operation: "add", value: 3.5 },
    ],
  },
  {
    id: "mine-engineering",
    source: "xp",
    category: "mine",
    title: "Ingegneria mine",
    description: "Mine piu potenti e con area maggiore.",
    maxStacks: 4,
    weight: 0.85,
    modifiers: [
      { target: "runUpgrade", stat: "mineDamageBonus", operation: "add", value: 1 },
      { target: "runUpgrade", stat: "mineRadiusBonus", operation: "add", value: 14 },
    ],
  },
  {
    id: "sentinel-drone",
    source: "xp",
    category: "drone",
    title: "Mini navicella",
    description: "Aggiunge una piccola scorta automatica.",
    maxStacks: 3,
    weight: 0.8,
    modifiers: [
      { target: "runUpgrade", stat: "droneLimit", operation: "add", value: 1 },
    ],
  },
];

export const CHEST_UPGRADES: Upgrade[] = [
  {
    id: "turret-range-cache",
    source: "chest",
    category: "turret",
    title: "Ottiche torretta",
    description: "Le torrette coprono piu spazio.",
    weight: 1,
    modifiers: [
      { target: "runUpgrade", stat: "turretRangeBonus", operation: "add", value: 38 },
    ],
  },
  {
    id: "extra-turret-slot",
    source: "chest",
    category: "turret",
    title: "Slot torretta",
    description: "Puoi mantenere due torrette in piu.",
    weight: 0.75,
    modifiers: [
      { target: "runUpgrade", stat: "maxTurretBonus", operation: "add", value: 2 },
    ],
  },
  {
    id: "mine-supply-cache",
    source: "chest",
    category: "mine",
    title: "Scorta mine",
    description: "Mine meno costose e limite aumentato.",
    weight: 1,
    modifiers: [
      { target: "runUpgrade", stat: "mineCostReduction", operation: "add", value: 1 },
      { target: "runUpgrade", stat: "maxMineBonus", operation: "add", value: 1 },
    ],
  },
  {
    id: "barricade-kit",
    source: "chest",
    category: "barricade",
    title: "Kit barricata",
    description: "Aumenta di 2 le barricate piazzabili.",
    weight: 0.85,
    // Se vuoi permettere di prendere questo upgrade più volte,
    // rimuovi maxStacks o impostalo a un numero alto
    modifiers: [
      { target: "runUpgrade", stat: "barricadeUnlocked", operation: "set", value: true },
      { target: "runUpgrade", stat: "maxBarricades", operation: "add", value: 2 },
    ],
  },
  {
    id: "barricade-plating",
    source: "chest",
    category: "barricade",
    title: "Piastre barricata",
    description: "Barricate piu resistenti.",
    weight: 0.75,
    apply: ({ runUpgrades }) => {
      runUpgrades.barricadeUnlocked = true;
      runUpgrades.maxBarricades = Math.max(runUpgrades.maxBarricades, 2);
      runUpgrades.barricadeHpBonus += 5;
    },
  },
  {
    id: "drone-link",
    source: "chest",
    category: "drone",
    title: "Link drone",
    description: "Aggiunge una mini navicella sentinella.",
    weight: 0.95,
    modifiers: [
      { target: "runUpgrade", stat: "droneLimit", operation: "add", value: 1 },
    ],
  },
  {
    id: "drone-weapons",
    source: "chest",
    category: "drone",
    title: "Armi drone",
    description: "Le mini navicelle sparano piu forte.",
    weight: 0.85,
    modifiers: [
      { target: "runUpgrade", stat: "droneDamageBonus", operation: "add", value: 1 },
      { target: "runUpgrade", stat: "droneFireRateMultiplier", operation: "multiply", value: 0.92 },
    ],
  },
  //{
  //  id: "field-coins",
  //  source: "chest",
  //  category: "economy",
  //  title: "Crediti di campo",
  //  description: "Ricevi risorsa run extra.",
  //  maxStacks: 8,
  //  apply: ({ runUpgrades }) => {
  //    runUpgrades.mineCostReduction += 0;
  //  },
  //},
];

export const XP_UPGRADE_LOOT_TABLE: LootTable<Upgrade> = {
  id: "xp-level-up",
  source: "xp",
  entries: XP_UPGRADES,
};

export const CHEST_UPGRADE_LOOT_TABLE: LootTable<Upgrade> = {
  id: "field-chest",
  source: "chest",
  entries: CHEST_UPGRADES,
};

export const getAvailableUpgrades = (
  upgrades: Upgrade[],
  state: RunUpgradeState,
) => {
  return upgrades.filter((upgrade) => {
    if (!upgrade.maxStacks) {
      return true;
    }

    return (state.stacks[upgrade.id] ?? 0) < upgrade.maxStacks;
  });
};

export const getUpgradeStacks = (state: RunUpgradeState, upgrade: Upgrade) => {
  return state.stacks[upgrade.id] ?? 0;
};
