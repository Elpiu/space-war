import type { DifficultyId } from "./config";
import { DEFAULT_UNLOCKS, ITEMS, TOMES } from "./data/upgrades";
import type { ItemId, Run, TomeId } from "./types";

const KEY = "space-war-meta-v4";
const LEGACY_KEYS = ["space-war-meta-v3", "space-war-meta-v2", "space-war-meta-v1"];

export interface Meta {
  credits: number;
  unlocked: string[];
  bestWave: number;
  runs: number;
  hintsSeen: string[];
  muted: boolean;
  difficulty: DifficultyId;
}

const defaults = (): Meta => ({
  credits: 0,
  unlocked: [...DEFAULT_UNLOCKS],
  bestWave: 0,
  runs: 0,
  hintsSeen: [],
  muted: false,
  difficulty: "normal",
});

const read = (key: string): Record<string, unknown> | null => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const num = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

export const loadMeta = (): Meta => {
  const base = defaults();
  const stored = read(KEY);

  if (!stored) {
    // Dai salvataggi precedenti si conservano solo i crediti.
    const legacy = LEGACY_KEYS.map(read).find(Boolean);
    if (legacy) base.credits = num(legacy.postRunCredits);
    saveMeta(base);
    return base;
  }

  const unlocked = Array.isArray(stored.unlocked) ? stored.unlocked.filter((v) => typeof v === "string") : [];
  return {
    credits: num(stored.credits),
    unlocked: [...new Set([...base.unlocked, ...(unlocked as string[])])],
    bestWave: num(stored.bestWave),
    runs: num(stored.runs),
    hintsSeen: Array.isArray(stored.hintsSeen) ? (stored.hintsSeen as string[]) : [],
    muted: stored.muted === true,
    difficulty: ["normal", "hard", "nightmare"].includes(stored.difficulty as string)
      ? (stored.difficulty as DifficultyId)
      : "normal",
  };
};

export const saveMeta = (meta: Meta) => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(meta));
  } catch {
    // Storage non disponibile: il gioco funziona comunque, senza salvare.
  }
};

export const unlockedTomes = (meta: Meta) =>
  TOMES.filter((tome) => meta.unlocked.includes(`tome:${tome.id}`)).map((tome) => tome.id as TomeId);

export const unlockedItems = (meta: Meta) =>
  ITEMS.filter((item) => meta.unlocked.includes(`item:${item.id}`)).map((item) => item.id as ItemId);

export const buyUnlock = (meta: Meta, key: string, cost: number) => {
  if (meta.unlocked.includes(key) || meta.credits < cost) return false;
  meta.credits -= cost;
  meta.unlocked.push(key);
  saveMeta(meta);
  return true;
};

export const runCredits = (run: Run, rewardMultiplier: number) =>
  Math.floor((run.wave * 3 + run.level * 2 + Math.floor(run.kills / 15)) * rewardMultiplier);
