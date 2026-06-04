import type {
  Modifier,
  PlayerStatModifier,
  PlayerStats,
  UpgradeApplyContext,
} from "../types/gameplay";

export const applyModifiers = (
  context: UpgradeApplyContext,
  modifiers: Modifier[] = [],
) => {
  modifiers.forEach((modifier) => {
    if (modifier.target === "playerStat") {
      applyPlayerStatModifier(context.stats, modifier);
      return;
    }

    const currentValue = context.runUpgrades[modifier.stat];

    if (typeof currentValue === "boolean") {
      context.runUpgrades[modifier.stat] = Boolean(modifier.value) as never;
      return;
    }

    context.runUpgrades[modifier.stat] = applyNumericOperation(
      currentValue,
      modifier.operation,
      Number(modifier.value),
      modifier.min,
      modifier.max,
    ) as never;
  });
};

export const applyPlayerStatModifiers = (
  stats: PlayerStats,
  modifiers: PlayerStatModifier[] = [],
) => {
  modifiers.forEach((modifier) => applyPlayerStatModifier(stats, modifier));
};

const applyPlayerStatModifier = (
  stats: PlayerStats,
  modifier: PlayerStatModifier,
) => {
  const currentValue = stats[modifier.stat];

  stats[modifier.stat] = applyNumericOperation(
    currentValue,
    modifier.operation,
    modifier.value,
    modifier.min,
    modifier.max,
  );
};

const applyNumericOperation = (
  currentValue: number,
  operation: Modifier["operation"],
  value: number,
  min?: number,
  max?: number,
) => {
  const unclampedValue = (() => {
    if (operation === "multiply") {
      return currentValue * value;
    }

    if (operation === "set") {
      return value;
    }

    return currentValue + value;
  })();

  return clampNumber(unclampedValue, min, max);
};

const clampNumber = (value: number, min?: number, max?: number) => {
  if (typeof min === "number" && value < min) {
    return min;
  }

  if (typeof max === "number" && value > max) {
    return max;
  }

  return value;
};
