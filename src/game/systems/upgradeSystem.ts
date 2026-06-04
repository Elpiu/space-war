import { Utils } from "phaser";
import {
  CHEST_UPGRADE_LOOT_TABLE,
  XP_UPGRADE_LOOT_TABLE,
  getAvailableUpgrades,
  getUpgradeStacks,
} from "../data/upgrades";
import type {
  Drone,
  LootBiasContext,
  RunUpgradeState,
  ShopLoadout,
  Upgrade,
  UpgradeCategory,
} from "../types/gameplay";
import { syncDroneCount } from "./drones";
import { applyModifiers } from "./modifiers";
import type { RunState } from "./runState";

export const getLevelUpChoices = (
  context: LootBiasContext,
  choiceCount = 3,
) => {
  return pickWeightedUpgrades(
    getAvailableUpgrades(XP_UPGRADE_LOOT_TABLE.entries, context.runUpgrades),
    context,
    choiceCount,
  );
};

export const pickChestUpgrade = (context: LootBiasContext) => {
  const available = getAvailableUpgrades(
    CHEST_UPGRADE_LOOT_TABLE.entries,
    context.runUpgrades,
  );

  return pickWeightedUpgrade(available, context);
};

export const applyUpgradeToRun = (options: {
  scene: Phaser.Scene;
  run: RunState;
  upgrade: Upgrade;
  player: Phaser.GameObjects.Triangle | null;
  drones: Drone[];
}) => {
  const context = {
    stats: options.run.stats,
    runUpgrades: options.run.runUpgrades,
  };

  applyModifiers(context, options.upgrade.modifiers);
  options.upgrade.apply?.(context);

  options.run.runUpgrades.stacks[options.upgrade.id] =
    getUpgradeStacks(options.run.runUpgrades, options.upgrade) + 1;

  if (options.player) {
    syncDroneCount(
      options.scene,
      options.drones,
      options.player,
      options.run.runUpgrades,
    );
  }
};

export const addXpAndCheckLevelUp = (run: RunState, value: number) => {
  run.xp += Math.max(1, Math.round(value * run.stats.xpMultiplier));

  if (run.xp < run.xpToNext) {
    return false;
  }

  run.xp -= run.xpToNext;
  run.level += 1;
  run.xpToNext = Math.floor(run.xpToNext * 1.45 + 3);

  return true;
};

const pickWeightedUpgrades = (
  upgrades: Upgrade[],
  context: LootBiasContext,
  count: number,
) => {
  const pool = [...upgrades];
  const choices: Upgrade[] = [];

  while (pool.length > 0 && choices.length < count) {
    const picked = pickWeightedUpgrade(pool, context);

    if (!picked) {
      break;
    }

    choices.push(picked);
    pool.splice(pool.indexOf(picked), 1);
  }

  return choices;
};

const pickWeightedUpgrade = (
  upgrades: Upgrade[],
  context: LootBiasContext,
) => {
  if (upgrades.length === 0) {
    return undefined;
  }

  const weighted = upgrades.map((upgrade) => ({
    upgrade,
    weight: getUpgradeWeight(upgrade, context),
  }));
  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);

  if (totalWeight <= 0) {
    return Utils.Array.GetRandom(upgrades);
  }

  let roll = Math.random() * totalWeight;

  for (const entry of weighted) {
    roll -= entry.weight;

    if (roll <= 0) {
      return entry.upgrade;
    }
  }

  return weighted[weighted.length - 1]?.upgrade;
};

const getUpgradeWeight = (upgrade: Upgrade, context: LootBiasContext) => {
  const baseWeight = upgrade.weight ?? 1;
  const loadoutMultiplier = getLoadoutCategoryMultiplier(
    upgrade.category,
    context.loadout,
  );
  const buildMultiplier = getBuildCategoryMultiplier(upgrade.category, context);
  const stackMultiplier = getStackMomentumMultiplier(upgrade, context.runUpgrades);
  const gateMultiplier = getCategoryGateMultiplier(upgrade, context.runUpgrades);

  return Math.max(
    0.05,
    baseWeight *
      loadoutMultiplier *
      buildMultiplier *
      stackMultiplier *
      gateMultiplier,
  );
};

const getLoadoutCategoryMultiplier = (
  category: UpgradeCategory,
  loadout: ShopLoadout | undefined,
) => {
  if (!loadout) {
    return 1;
  }

  if (category === "mine") {
    return loadout.mines === "mineBlast" ? 2.2 : 1.65;
  }

  if (category === "turret") {
    return loadout.turrets === "turretBasic" ? 1.35 : 1.85;
  }

  if (category === "pickup" && loadout.boosters === "boosterMagnet") {
    return 1.6;
  }

  if (
    category === "ship" &&
    (loadout.ships === "shipTank" ||
      loadout.ships === "shipLightFighter" ||
      loadout.boosters === "boosterHull" ||
      loadout.boosters === "boosterSpeed")
  ) {
    return 1.25;
  }

  if (category === "weapon" && loadout.weapons !== "weaponBase") {
    return 1.25;
  }

  return 1;
};

const getBuildCategoryMultiplier = (
  category: UpgradeCategory,
  context: LootBiasContext,
) => {
  const { runUpgrades } = context;

  if (category === "drone" && hasDroneBuild(runUpgrades)) {
    return 2.1;
  }

  if (category === "mine" && hasMineBuild(runUpgrades)) {
    return 1.75;
  }

  if (category === "turret" && hasTurretBuild(runUpgrades)) {
    return 1.6;
  }

  if (category === "barricade" && runUpgrades.barricadeUnlocked) {
    return 1.45;
  }

  return 1;
};

const getStackMomentumMultiplier = (
  upgrade: Upgrade,
  runUpgrades: RunUpgradeState,
) => {
  const categoryStacks = Object.entries(runUpgrades.stacks).reduce(
    (total, [upgradeId, stacks]) => {
      const stackedUpgrade = [
        ...XP_UPGRADE_LOOT_TABLE.entries,
        ...CHEST_UPGRADE_LOOT_TABLE.entries,
      ].find((entry) => entry.id === upgradeId);

      return stackedUpgrade?.category === upgrade.category
        ? total + stacks
        : total;
    },
    0,
  );

  return Math.min(2.35, 1 + categoryStacks * 0.22);
};

const getCategoryGateMultiplier = (
  upgrade: Upgrade,
  runUpgrades: RunUpgradeState,
) => {
  if (
    upgrade.category === "barricade" &&
    upgrade.id !== "barricade-kit" &&
    !runUpgrades.barricadeUnlocked
  ) {
    return 0.55;
  }

  if (upgrade.category === "drone" && !hasDroneBuild(runUpgrades)) {
    return 0.85;
  }

  return 1;
};

const hasDroneBuild = (runUpgrades: RunUpgradeState) => {
  return (
    runUpgrades.droneLimit > 0 ||
    runUpgrades.droneDamageBonus > 0 ||
    runUpgrades.droneFireRateMultiplier < 1
  );
};

const hasMineBuild = (runUpgrades: RunUpgradeState) => {
  return (
    runUpgrades.mineDamageBonus > 0 ||
    runUpgrades.mineRadiusBonus > 0 ||
    runUpgrades.mineCostReduction > 0 ||
    runUpgrades.maxMineBonus > 0
  );
};

const hasTurretBuild = (runUpgrades: RunUpgradeState) => {
  return (
    runUpgrades.turretDamageBonus > 0 ||
    runUpgrades.turretRangeBonus > 0 ||
    runUpgrades.turretFireRateMultiplier < 1 ||
    runUpgrades.turretHpBonus > 0 ||
    runUpgrades.maxTurretBonus > 0
  );
};
