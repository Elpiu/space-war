import { ENEMIES } from "./data/enemies";
import type { EnemyId } from "./types";

/**
 * Archivio comune alle due modalità: nemici incontrati e abbattuti, pezzi
 * d'equipaggiamento trovati, statistiche per le medaglie. Si aggiorna in
 * memoria durante la partita e si salva a fine run (flushArchive).
 */
export interface Archive {
  seen: string[];
  kills: Record<string, number>;
  gear: string[];
  medals: string[];
  stats: { bossKills: number; eliteKills: number; contracts: number; dailies: number; maxCombo: number; fusions: number };
}

const KEY = "space-war-archive-v1";

const empty = (): Archive => ({
  seen: [],
  kills: {},
  gear: [],
  medals: [],
  stats: { bossKills: 0, eliteKills: 0, contracts: 0, dailies: 0, maxCombo: 0, fusions: 0 },
});

let cached: Archive | null = null;
let dirty = false;

export const getArchive = (): Archive => {
  if (cached) return cached;
  try {
    const raw = window.localStorage.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as Partial<Archive>) : {};
    const base = empty();
    cached = {
      seen: Array.isArray(s.seen) ? s.seen : [],
      kills: s.kills && typeof s.kills === "object" ? s.kills : {},
      gear: Array.isArray(s.gear) ? s.gear : [],
      medals: Array.isArray(s.medals) ? s.medals : [],
      stats: { ...base.stats, ...(s.stats ?? {}) },
    };
  } catch {
    cached = empty();
  }
  return cached;
};

export const recordSeen = (id: EnemyId) => {
  const a = getArchive();
  if (a.seen.includes(id)) return;
  a.seen.push(id);
  dirty = true;
};

export const recordKill = (id: EnemyId, elite: boolean) => {
  const a = getArchive();
  a.kills[id] = (a.kills[id] ?? 0) + 1;
  if (elite) a.stats.eliteKills += 1;
  if (ENEMIES[id].boss) a.stats.bossKills += 1;
  if (!a.seen.includes(id)) a.seen.push(id);
  dirty = true;
};

export const recordGear = (defId: string) => {
  const a = getArchive();
  if (a.gear.includes(defId)) return;
  a.gear.push(defId);
  dirty = true;
};

export const recordStat = (key: keyof Archive["stats"], value = 1, mode: "add" | "max" = "add") => {
  const a = getArchive();
  a.stats[key] = mode === "max" ? Math.max(a.stats[key], value) : a.stats[key] + value;
  dirty = true;
};

export const totalKills = (a = getArchive()) => Object.values(a.kills).reduce((s, n) => s + n, 0);

/** Salva l'archivio se è cambiato. */
export const saveArchive = () => {
  if (!dirty || !cached) return;
  dirty = false;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cached));
  } catch {
    // Storage non disponibile.
  }
};

// ---------- Medaglie e verniciature ----------

export interface MedalContext {
  bestWave: number;
  sector: number;
  catalogRatio: number;
}

export interface Medal {
  id: string;
  title: string;
  text: string;
  paint: string;
  /** Progresso da 0 a 1. */
  progress: (a: Archive, c: MedalContext) => number;
}

const ratio = (value: number, goal: number) => Math.min(1, value / goal);

export const MEDALS: Medal[] = [
  { id: "first-blood", title: "Primo sangue", text: "100 nemici abbattuti", paint: "cobalt", progress: (a) => ratio(totalKills(a), 100) },
  { id: "exterminator", title: "Sterminatore", text: "2.000 nemici abbattuti", paint: "obsidian", progress: (a) => ratio(totalKills(a), 2000) },
  { id: "elite-hunter", title: "Cacciatore di élite", text: "50 élite abbattuti", paint: "gold", progress: (a) => ratio(a.stats.eliteKills, 50) },
  { id: "giant-slayer", title: "Ammazzagiganti", text: "5 boss abbattuti", paint: "crimson", progress: (a) => ratio(a.stats.bossKills, 5) },
  { id: "zoologist", title: "Zoologo", text: "30 tipi di nemici scoperti", paint: "emerald", progress: (a) => ratio(a.seen.length, 30) },
  { id: "collector", title: "Collezionista", text: "Metà del catalogo trovato", paint: "amethyst", progress: (_a, c) => ratio(c.catalogRatio, 0.5) },
  { id: "explorer", title: "Esploratore", text: "Settore 4 della campagna sbloccato", paint: "ice", progress: (_a, c) => ratio(c.sector - 1, 3) },
  { id: "veteran", title: "Veterano", text: "Wave 20 nel survival", paint: "sunset", progress: (_a, c) => ratio(c.bestWave, 20) },
  { id: "contractor", title: "Contrattista", text: "10 contratti di missione completati", paint: "copper", progress: (a) => ratio(a.stats.contracts, 10) },
  { id: "regular", title: "Abitudinario", text: "3 sfide del giorno vinte", paint: "neon", progress: (a) => ratio(a.stats.dailies, 3) },
  { id: "combo-master", title: "Maestro delle combo", text: "Combo da 20 abbattimenti", paint: "plasma", progress: (a) => ratio(a.stats.maxCombo, 20) },
  { id: "alchemist", title: "Alchimista", text: "5 fusioni in officina", paint: "silver", progress: (a) => ratio(a.stats.fusions, 5) },
];

export const PAINTS: Record<string, { label: string; tint: number | null }> = {
  standard: { label: "Standard", tint: null },
  cobalt: { label: "Cobalto", tint: 0x60a5fa },
  obsidian: { label: "Ossidiana", tint: 0x6b7280 },
  gold: { label: "Oro", tint: 0xfacc15 },
  crimson: { label: "Cremisi", tint: 0xf87171 },
  emerald: { label: "Smeraldo", tint: 0x4ade80 },
  amethyst: { label: "Ametista", tint: 0xc084fc },
  ice: { label: "Ghiaccio", tint: 0xa5f3fc },
  sunset: { label: "Tramonto", tint: 0xfb923c },
  copper: { label: "Rame", tint: 0xd97706 },
  neon: { label: "Neon", tint: 0xf0abfc },
  plasma: { label: "Plasma", tint: 0x22d3ee },
  silver: { label: "Argento", tint: 0xe2e8f0 },
};

export const paintUnlocked = (paint: string, a = getArchive()) =>
  paint === "standard" || MEDALS.some((m) => m.paint === paint && a.medals.includes(m.id));

/** Assegna le medaglie raggiunte; restituisce quelle nuove. */
export const checkMedals = (c: MedalContext): Medal[] => {
  const a = getArchive();
  const earned = MEDALS.filter((m) => !a.medals.includes(m.id) && m.progress(a, c) >= 1);
  if (earned.length) {
    a.medals.push(...earned.map((m) => m.id));
    dirty = true;
  }
  return earned;
};
