import {
  CHEST_ITEMS,
  DEFAULT_CHEST_ITEM_IDS,
  DEFAULT_TOME_IDS,
  MIN_ACTIVE_POOL_SIZE,
  TOMES,
  getChestItemById,
  getTomeById,
} from "../data/upgrades";
import type {
  ChestItemId,
  ContentKind,
  MetaProgressionState,
  PostRunRewardPreview,
  ShopContentEntry,
  TomeId,
} from "../types/gameplay";
import type { RunState } from "./runState";

const META_STORAGE_KEY = "space-war-meta-v3";
const LEGACY_STORAGE_KEYS = ["space-war-meta-v2", "space-war-meta-v1"];

export const SHOP_CATEGORIES: { id: ContentKind; label: string }[] = [
  { id: "tome", label: "Tomi" },
  { id: "item", label: "Oggetti" },
];

export const SHOP_CONTENT: ShopContentEntry[] = [
  ...TOMES.map((entry) => ({
    kind: "tome" as const,
    id: entry.id,
    title: entry.title,
    description: entry.description,
    shortEffect: entry.shortEffect,
    accentColor: entry.accentColor,
    cost: entry.cost,
    isDefault: entry.isDefault,
  })),
  ...CHEST_ITEMS.map((entry) => ({
    kind: "item" as const,
    id: entry.id,
    title: entry.title,
    description: entry.description,
    shortEffect: entry.shortEffect,
    accentColor: entry.accentColor,
    cost: entry.cost,
    isDefault: entry.isDefault,
  })),
];

export const loadMetaProgression = (): MetaProgressionState => {
  const current = readStorage(META_STORAGE_KEY);

  if (current) {
    return normalizeMetaState(current);
  }

  for (const key of LEGACY_STORAGE_KEYS) {
    const legacy = readStorage(key);

    if (legacy) {
      const migrated = createDefaultMetaState();
      migrated.postRunCredits = getStoredCredits(legacy);
      saveMetaProgression(migrated);
      return migrated;
    }
  }

  return createDefaultMetaState();
};

export const saveMetaProgression = (state: MetaProgressionState) => {
  window.localStorage.setItem(META_STORAGE_KEY, JSON.stringify(state));
};

export const calculatePostRunReward = (
  run: Pick<RunState, "level" | "wave">,
): PostRunRewardPreview => ({
  reachedLevel: run.level,
  reachedWave: run.wave,
  earnedCredits: Math.max(0, run.level * 2 + run.wave * 3),
});

export const grantPostRunCredits = (
  state: MetaProgressionState,
  reward: PostRunRewardPreview,
) => {
  state.postRunCredits += Math.max(0, Math.floor(reward.earnedCredits));
  saveMetaProgression(state);
};

export const getShopContent = (kind: ContentKind) =>
  SHOP_CONTENT.filter((entry) => entry.kind === kind);

export const isContentUnlocked = (
  state: MetaProgressionState,
  kind: ContentKind,
  id: string,
) =>
  kind === "tome"
    ? state.unlockedTomes.includes(id as TomeId)
    : state.unlockedChestItems.includes(id as ChestItemId);

export const isContentActive = (
  state: MetaProgressionState,
  kind: ContentKind,
  id: string,
) =>
  kind === "tome"
    ? state.activeTomes.includes(id as TomeId)
    : state.activeChestItems.includes(id as ChestItemId);

export const unlockContent = (
  state: MetaProgressionState,
  kind: ContentKind,
  id: string,
) => {
  const entry = SHOP_CONTENT.find(
    (candidate) => candidate.kind === kind && candidate.id === id,
  );

  if (!entry || isContentUnlocked(state, kind, id)) {
    return false;
  }

  if (state.postRunCredits < entry.cost) {
    return false;
  }

  state.postRunCredits -= entry.cost;

  if (kind === "tome") {
    const tomeId = id as TomeId;
    state.unlockedTomes = unique([...state.unlockedTomes, tomeId]);
    state.activeTomes = unique([...state.activeTomes, tomeId]);
  } else {
    const itemId = id as ChestItemId;
    state.unlockedChestItems = unique([...state.unlockedChestItems, itemId]);
    state.activeChestItems = unique([...state.activeChestItems, itemId]);
  }

  saveMetaProgression(state);
  return true;
};

export const toggleContentActive = (
  state: MetaProgressionState,
  kind: ContentKind,
  id: string,
) => {
  if (!isContentUnlocked(state, kind, id)) {
    return { changed: false, reason: "Contenuto non sbloccato" };
  }

  const current =
    kind === "tome" ? state.activeTomes : state.activeChestItems;
  const active = current.includes(id as never);

  if (active && current.length <= MIN_ACTIVE_POOL_SIZE) {
    return {
      changed: false,
      reason: `Servono almeno ${MIN_ACTIVE_POOL_SIZE} contenuti attivi`,
    };
  }

  if (kind === "tome") {
    const tomeId = id as TomeId;
    state.activeTomes = active
      ? state.activeTomes.filter((entry) => entry !== tomeId)
      : unique([...state.activeTomes, tomeId]);
  } else {
    const itemId = id as ChestItemId;
    state.activeChestItems = active
      ? state.activeChestItems.filter((entry) => entry !== itemId)
      : unique([...state.activeChestItems, itemId]);
  }

  saveMetaProgression(state);
  return { changed: true, reason: active ? "Escluso dal pool" : "Incluso nel pool" };
};

export const createDefaultMetaState = (): MetaProgressionState => ({
  postRunCredits: 0,
  unlockedTomes: [...DEFAULT_TOME_IDS],
  unlockedChestItems: [...DEFAULT_CHEST_ITEM_IDS],
  activeTomes: [...DEFAULT_TOME_IDS],
  activeChestItems: [...DEFAULT_CHEST_ITEM_IDS],
});

const normalizeMetaState = (value: Record<string, unknown>) => {
  const defaultState = createDefaultMetaState();
  const unlockedTomes = normalizeTomeIds(value.unlockedTomes);
  const unlockedChestItems = normalizeChestItemIds(value.unlockedChestItems);
  const mergedTomes = unique([...defaultState.unlockedTomes, ...unlockedTomes]);
  const mergedItems = unique([
    ...defaultState.unlockedChestItems,
    ...unlockedChestItems,
  ]);
  const activeTomes = normalizeTomeIds(value.activeTomes).filter((id) =>
    mergedTomes.includes(id),
  );
  const activeChestItems = normalizeChestItemIds(value.activeChestItems).filter(
    (id) => mergedItems.includes(id),
  );

  return {
    postRunCredits: getStoredCredits(value),
    unlockedTomes: mergedTomes,
    unlockedChestItems: mergedItems,
    activeTomes:
      activeTomes.length >= MIN_ACTIVE_POOL_SIZE
        ? activeTomes
        : [...defaultState.activeTomes],
    activeChestItems:
      activeChestItems.length >= MIN_ACTIVE_POOL_SIZE
        ? activeChestItems
        : [...defaultState.activeChestItems],
  };
};

const normalizeTomeIds = (value: unknown): TomeId[] =>
  Array.isArray(value)
    ? unique(
        value.filter(
          (id): id is TomeId =>
            typeof id === "string" && Boolean(getTomeById(id as TomeId)),
        ),
      )
    : [];

const normalizeChestItemIds = (value: unknown): ChestItemId[] =>
  Array.isArray(value)
    ? unique(
        value.filter(
          (id): id is ChestItemId =>
            typeof id === "string" &&
            Boolean(getChestItemById(id as ChestItemId)),
        ),
      )
    : [];

const readStorage = (key: string): Record<string, unknown> | null => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const getStoredCredits = (value: Record<string, unknown>) =>
  Number.isFinite(value.postRunCredits)
    ? Math.max(0, Math.floor(value.postRunCredits as number))
    : 0;

const unique = <T>(values: T[]) => [...new Set(values)];
