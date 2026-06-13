import {
  CHEST_ITEMS,
  MAX_RUN_TOMES,
  RARITY_MULTIPLIERS,
  TOMES,
  getItemLevel,
  getTomeLevel,
} from "../data/upgrades";
import type {
  ChestItemId,
  ChestItemReward,
  MetaProgressionState,
  Rarity,
  TomeId,
  TomeOffer,
} from "../types/gameplay";
import { syncDroneCount } from "./drones";
import type { RunState } from "./runState";

const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 70,
  uncommon: 22,
  rare: 7,
  legendary: 1,
};

export const getLevelUpChoices = (
  run: RunState,
  metaState: MetaProgressionState,
  choiceCount = 3,
): TomeOffer[] => {
  const ownedIds = Object.entries(run.tomes.levels)
    .filter(([, level]) => (level ?? 0) > 0)
    .map(([id]) => id as TomeId);
  const allowedIds =
    ownedIds.length >= MAX_RUN_TOMES
      ? ownedIds
      : metaState.activeTomes.filter((id) => metaState.unlockedTomes.includes(id));
  const available = TOMES.filter(
    (tome) =>
      allowedIds.includes(tome.id) &&
      getTomeLevel(run.tomes, tome.id) < tome.maxLevel,
  );

  return pickUnique(available, choiceCount).map((tome) => {
    const rarity = rollRarity(run.stats.luck);
    const rarityMultiplier = RARITY_MULTIPLIERS[rarity];

    return {
      tome,
      rarity,
      rarityMultiplier,
      scaledIncrement: tome.baseIncrement * rarityMultiplier,
    };
  });
};

export const applyTomeOfferToRun = (options: {
  run: RunState;
  offer: TomeOffer;
}) => {
  const { run, offer } = options;
  offer.tome.apply(
    {
      stats: run.stats,
      runUpgrades: run.runUpgrades,
      difficulty: run.difficulty,
    },
    offer.scaledIncrement,
  );
  run.tomes.levels[offer.tome.id] =
    getTomeLevel(run.tomes, offer.tome.id) + 1;
  run.tomes.totalBonuses[offer.tome.id] =
    (run.tomes.totalBonuses[offer.tome.id] ?? 0) + offer.scaledIncrement;
};

export const pickChestItemReward = (
  run: RunState,
  metaState: MetaProgressionState,
): ChestItemReward | undefined => {
  const available = CHEST_ITEMS.filter(
    (item) =>
      metaState.activeChestItems.includes(item.id) &&
      metaState.unlockedChestItems.includes(item.id) &&
      getItemLevel(run.items, item.id) < item.maxLevel,
  );
  const item = pickWeightedItem(available);

  if (!item) {
    return undefined;
  }

  const rarity = rollRarity(run.stats.luck);

  return {
    item,
    rarity,
    rarityMultiplier: RARITY_MULTIPLIERS[rarity],
  };
};

export const applyChestItemToRun = (options: {
  scene: Phaser.Scene;
  run: RunState;
  reward: ChestItemReward;
  player: Phaser.GameObjects.Image | null;
}) => {
  const { run, reward } = options;
  reward.item.apply(
    {
      stats: run.stats,
      runUpgrades: run.runUpgrades,
      difficulty: run.difficulty,
    },
    reward.rarity,
  );
  run.items.levels[reward.item.id] =
    getItemLevel(run.items, reward.item.id) + 1;

  if (options.player) {
    syncDroneCount(
      options.scene,
      run.drones,
      options.player,
      run.runUpgrades,
    );
  }
};

export const addXpAndCheckLevelUp = (run: RunState, value: number) => {
  run.xp += Math.max(
    1,
    Math.round(value * run.stats.xpMultiplier),
  );

  if (run.xp < run.xpToNext) {
    return false;
  }

  run.xp -= run.xpToNext;
  run.level += 1;
  run.xpToNext = Math.floor(run.xpToNext * 1.45 + 3);

  return true;
};

export const rollRarity = (luck: number): Rarity => {
  const luckFactor = Math.max(0, luck) / 100;
  const weights: Record<Rarity, number> = {
    common: Math.max(18, RARITY_WEIGHTS.common * (1 - luckFactor * 0.5)),
    uncommon: RARITY_WEIGHTS.uncommon * (1 + luckFactor * 0.45),
    rare: RARITY_WEIGHTS.rare * (1 + luckFactor * 0.9),
    legendary: RARITY_WEIGHTS.legendary * (1 + luckFactor * 1.6),
  };
  const entries = Object.entries(weights) as [Rarity, number][];
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;

  for (const [rarity, weight] of entries) {
    roll -= weight;

    if (roll <= 0) {
      return rarity;
    }
  }

  return "common";
};

const pickUnique = <T>(entries: T[], count: number) => {
  const pool = [...entries];
  const picked: T[] = [];

  while (pool.length > 0 && picked.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool[index]);
    pool.splice(index, 1);
  }

  return picked;
};

const pickWeightedItem = (items: typeof CHEST_ITEMS) => {
  if (items.length === 0) {
    return undefined;
  }

  const total = items.reduce((sum, item) => sum + (item.weight ?? 1), 0);
  let roll = Math.random() * total;

  for (const item of items) {
    roll -= item.weight ?? 1;

    if (roll <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
};

export const isTomeId = (value: string): value is TomeId =>
  TOMES.some((entry) => entry.id === value);

export const isChestItemId = (value: string): value is ChestItemId =>
  CHEST_ITEMS.some((entry) => entry.id === value);
