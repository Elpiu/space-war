import type { RunUpgradeState, Upgrade } from "../types/gameplay";

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
});

export const XP_UPGRADES: Upgrade[] = [
  {
    id: "rapid-fire",
    source: "xp",
    category: "weapon",
    title: "Cadenza rapida",
    description: "Spari piu spesso.",
    maxStacks: 5,
    apply: ({ stats }) => {
      stats.fireRate *= 0.82;
    },
  },
  {
    id: "heavy-shots",
    source: "xp",
    category: "weapon",
    title: "Colpi pesanti",
    description: "Aumenta il danno dei proiettili.",
    maxStacks: 5,
    apply: ({ stats }) => {
      stats.damage += 1.4;
    },
  },
  {
    id: "thrusters",
    source: "xp",
    category: "ship",
    title: "Propulsori",
    description: "La navicella si muove piu veloce.",
    maxStacks: 4,
    apply: ({ stats }) => {
      stats.speed += 35;
    },
  },
  {
    id: "cargo-magnet",
    source: "xp",
    category: "pickup",
    title: "Magnete cargo",
    description: "Raccogli pickup da piu lontano.",
    maxStacks: 4,
    apply: ({ stats }) => {
      stats.pickupRadius += 36;
    },
  },
  {
    id: "multishot",
    source: "xp",
    category: "weapon",
    title: "Doppio arco",
    description: "Aggiunge un proiettile laterale.",
    maxStacks: 3,
    apply: ({ stats }) => {
      stats.multiShot = Math.min(stats.multiShot + 1, 4);
    },
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
    apply: ({ runUpgrades }) => {
      runUpgrades.turretDamageBonus += 1.5;
      runUpgrades.turretHpBonus += 3.5;
    },
  },
  {
    id: "mine-engineering",
    source: "xp",
    category: "mine",
    title: "Ingegneria mine",
    description: "Mine piu potenti e con area maggiore.",
    maxStacks: 4,
    apply: ({ runUpgrades }) => {
      runUpgrades.mineDamageBonus += 1;
      runUpgrades.mineRadiusBonus += 14;
    },
  },
  {
    id: "sentinel-drone",
    source: "xp",
    category: "drone",
    title: "Mini navicella",
    description: "Aggiunge una piccola scorta automatica.",
    maxStacks: 3,
    apply: ({ runUpgrades }) => {
      runUpgrades.droneLimit += 1;
    },
  },
];

export const CHEST_UPGRADES: Upgrade[] = [
  {
    id: "turret-range-cache",
    source: "chest",
    category: "turret",
    title: "Ottiche torretta",
    description: "Le torrette coprono piu spazio.",
    maxStacks: 4,
    apply: ({ runUpgrades }) => {
      runUpgrades.turretRangeBonus += 38;
    },
  },
  {
    id: "extra-turret-slot",
    source: "chest",
    category: "turret",
    title: "Slot torretta",
    description: "Puoi mantenere due torrette in piu.",
    maxStacks: 2,
    apply: ({ runUpgrades }) => {
      runUpgrades.maxTurretBonus += 2;
    },
  },
  {
    id: "mine-supply-cache",
    source: "chest",
    category: "mine",
    title: "Scorta mine",
    description: "Mine meno costose e limite aumentato.",
    maxStacks: 3,
    apply: ({ runUpgrades }) => {
      runUpgrades.mineCostReduction += 1;
      runUpgrades.maxMineBonus += 1;
    },
  },
  {
    id: "barricade-kit",
    source: "chest",
    category: "barricade",
    title: "Kit barricata",
    description: "Aumenta di 2 le barricate piazzabili.",
    // Se vuoi permettere di prendere questo upgrade più volte,
    // rimuovi maxStacks o impostalo a un numero alto
    maxStacks: 5,
    apply: ({ runUpgrades }) => {
      runUpgrades.barricadeUnlocked = true;

      if (typeof runUpgrades.maxBarricades === "undefined") {
        runUpgrades.maxBarricades = 0;
      }

      runUpgrades.maxBarricades += 2;
    },
  },
  {
    id: "barricade-plating",
    source: "chest",
    category: "barricade",
    title: "Piastre barricata",
    description: "Barricate piu resistenti.",
    maxStacks: 4,
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
    maxStacks: 3,
    apply: ({ runUpgrades }) => {
      runUpgrades.droneLimit += 1;
    },
  },
  {
    id: "drone-weapons",
    source: "chest",
    category: "drone",
    title: "Armi drone",
    description: "Le mini navicelle sparano piu forte.",
    maxStacks: 4,
    apply: ({ runUpgrades }) => {
      runUpgrades.droneDamageBonus += 1;
      runUpgrades.droneFireRateMultiplier *= 0.92;
    },
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

export const getAvailableUpgrades = (
  upgrades: Upgrade[],
  state: RunUpgradeState,
) => {
  // Per adesso nessun max stack
  return upgrades;
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
