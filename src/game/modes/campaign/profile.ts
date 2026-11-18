import type { DifficultyId } from "../../config";
import type { Rarity } from "../../types";
import {
  GEAR,
  applyDevice,
  buyPrice,
  gearDef,
  hullSpec,
  mustGearDef,
  sellPrice,
  upgradeCost,
  weaponDps,
  weaponHeat,
  weaponSpec,
  type GearDef,
  type GearItem,
  type RackStats,
  type ShipStats,
  type WeaponSlot,
  type WeaponSpec,
} from "./gear";
import { MISSIONS, type MissionDef } from "./missions";
import { LAYERS, generateSector, ilvlOf, nodeState, sectorOfId } from "./sectors";

const KEY = "space-war-campaign-v2";
const LEGACY_KEY = "space-war-campaign-v1";

/** Chiave di uno slot: "hull" oppure tipo + indice, per esempio "front0". */
export type SlotKey = string;

/** Profilo persistente della campagna, separato dai crediti del survival. */
export interface CampaignProfile {
  coins: number;
  inventory: GearItem[];
  equipped: Record<SlotKey, number | null>;
  completed: string[];
  nextUid: number;
  /** Pezzi del negozio già visti: gli altri hanno il badge "nuovo". */
  seenShop: string[];
  /** Stelle per missione: 1 = Normale, 2 = Difficile, 3 = Incubo. */
  stars: Record<string, number>;
  /** Missioni di cui è stata trovata la capsula segreta. */
  secrets: string[];
  /**
   * Profili di fuoco 2 e 3: slot d'arma attivi. Il profilo 1 usa sempre tutto.
   * Servono a gestire il calore spegnendo le armi più calde.
   */
  fireProfiles: { 2: SlotKey[]; 3: SlotKey[] };
  /** Seed della campagna infinita: rende i settori generati riproducibili. */
  seed: number;
  /** Settore più alto sbloccato (1 = solo il settore fatto a mano). */
  sector: number;
  /** Esito dei nodi senza combattimento già risolti (cantiere, evento, tesoro). */
  nodeOutcomes: Record<string, string>;
}

export const DIFFICULTY_STARS: Record<DifficultyId, number> = { normal: 1, hard: 2, nightmare: 3 };

const SLOT_TYPES = ["front", "rear", "missile", "bomb", "device"] as const;
type SlotType = (typeof SLOT_TYPES)[number];

export const slotType = (key: SlotKey) => (key === "hull" ? "hull" : (key.replace(/\d+$/, "") as SlotType));

const starter = (): CampaignProfile => ({
  coins: 0,
  inventory: [
    { uid: 1, defId: "blaster", rarity: "common", level: 1 },
    { uid: 2, defId: "tail-gun", rarity: "common", level: 1 },
    { uid: 3, defId: "cluster", rarity: "common", level: 1 },
    { uid: 4, defId: "frigate", rarity: "common", level: 1 },
  ],
  equipped: { hull: 4, front0: 1, rear0: 2, bomb0: 3 },
  completed: [],
  nextUid: 5,
  seenShop: ["blaster", "tail-gun", "cluster", "frigate"],
  stars: {},
  secrets: [],
  fireProfiles: { 2: ["front0"], 3: ["rear0", "missile0"] },
  seed: Math.floor(Math.random() * 0x7fffffff),
  sector: 1,
  nodeOutcomes: {},
});

export const toggleFireSlot = (profile: CampaignProfile, which: 2 | 3, key: SlotKey) => {
  const list = profile.fireProfiles[which];
  profile.fireProfiles[which] = list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
  saveProfile(profile);
};

// ---------- Salvataggio e migrazione ----------

/** Dal v1 (arma principale + secondario + moduli) al v2 a slot. */
const migrateV1 = (raw: Record<string, unknown>): CampaignProfile => {
  const profile = starter();
  profile.coins = typeof raw.coins === "number" ? raw.coins : 0;
  profile.completed = Array.isArray(raw.completed) ? (raw.completed as string[]) : [];
  const legacy = Array.isArray(raw.inventory) ? (raw.inventory as GearItem[]) : [];
  for (const item of legacy) {
    if (item.defId === "field-turret" || item.defId === "minelayer") {
      // Torrette e mine non esistono più in campagna: rimborso in monete.
      profile.coins += Math.round(45 * ({ common: 1, uncommon: 1.6, rare: 2.6, legendary: 4.5 }[item.rarity] ?? 1) * 0.5);
      continue;
    }
    if (!gearDef(item.defId)) continue;
    profile.inventory.push({ ...item, uid: profile.nextUid++ });
  }
  return profile;
};

export const loadProfile = (): CampaignProfile => {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const legacy = window.localStorage.getItem(LEGACY_KEY);
      const profile = legacy ? migrateV1(JSON.parse(legacy)) : starter();
      saveProfile(profile);
      return profile;
    }
    const stored = JSON.parse(raw) as Partial<CampaignProfile>;
    const profile = { ...starter(), ...stored } as CampaignProfile;
    // Chi aveva già completato missioni prima delle stelle parte da una stella.
    for (const id of profile.completed) profile.stars[id] = Math.max(1, profile.stars[id] ?? 0);
    // Chi aveva già battuto il Dreadnought del settore 1 trova aperto il settore 2.
    if (profile.completed.includes(BOSS_S1)) profile.sector = Math.max(profile.sector, 2);
    profile.inventory = profile.inventory.filter((item) => Boolean(gearDef(item.defId)));
    sanitize(profile);
    // Il seed dei settori va fissato subito, o ogni caricamento ne genererebbe uno nuovo.
    if (typeof stored.seed !== "number") saveProfile(profile);
    return profile;
  } catch {
    return starter();
  }
};

export const saveProfile = (profile: CampaignProfile) => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // Storage non disponibile: la campagna resta giocabile senza salvataggio.
  }
};

/** Toglie riferimenti a oggetti spariti e slot che lo scafo non ha. */
const sanitize = (profile: CampaignProfile) => {
  const owned = new Set(profile.inventory.map((i) => i.uid));
  if (!owned.has(profile.equipped.hull ?? -1)) {
    const hull = profile.inventory.find((i) => mustGearDef(i.defId).slot === "hull");
    profile.equipped.hull = hull?.uid ?? null;
  }
  const valid = new Set(slotKeys(profile));
  for (const key of Object.keys(profile.equipped)) {
    const uid = profile.equipped[key];
    if (!valid.has(key) || (uid !== null && !owned.has(uid))) delete profile.equipped[key];
  }
};

// ---------- Slot ----------

export const itemByUid = (profile: CampaignProfile, uid: number | null | undefined) =>
  uid === null || uid === undefined ? undefined : profile.inventory.find((i) => i.uid === uid);

export const equippedHull = (profile: CampaignProfile) => itemByUid(profile, profile.equipped.hull);

/** Slot disponibili per lo scafo montato, nell'ordine in cui li mostra l'hub. */
export const slotKeys = (profile: CampaignProfile): SlotKey[] => {
  const hull = equippedHull(profile);
  const keys: SlotKey[] = ["hull"];
  if (!hull) return keys;
  const spec = mustGearDef(hull.defId).hull!;
  for (const type of SLOT_TYPES) for (let i = 0; i < spec[type]; i += 1) keys.push(`${type}${i}`);
  return keys;
};

export const equippedSlotOf = (profile: CampaignProfile, uid: number) =>
  Object.keys(profile.equipped).find((key) => profile.equipped[key] === uid);

const BOSS_S1 = "s1-5";

export const isMissionUnlocked = (profile: CampaignProfile, mission: MissionDef) => {
  if (mission.sector && mission.sector >= 2) {
    if (mission.sector > profile.sector) return false;
    const sector = generateSector(profile.seed, mission.sector);
    const node = sector.nodes.get(mission.id);
    const state = node ? nodeState(sector, node, new Set(profile.completed)) : "locked";
    return state === "open" || state === "done";
  }
  return (
    mission.requires.length === 0 ||
    profile.completed.includes(mission.id) ||
    mission.requires.some((id) => profile.completed.includes(id))
  );
};

/** Segna un nodo come completato; il boss di un settore apre il successivo. */
export const completeNode = (profile: CampaignProfile, id: string) => {
  if (!profile.completed.includes(id)) profile.completed.push(id);
  const n = sectorOfId(id);
  const isBoss = n === 1 ? id === BOSS_S1 : id === `g${n}-${LAYERS - 1}-0`;
  if (isBoss) profile.sector = Math.max(profile.sector, n + 1);
};

/** Una difficoltà si sblocca vincendo la missione a quella precedente. */
export const difficultyUnlocked = (profile: CampaignProfile, missionId: string, difficulty: DifficultyId) =>
  DIFFICULTY_STARS[difficulty] <= (profile.stars[missionId] ?? 0) + 1;

export const recordVictory = (profile: CampaignProfile, missionId: string, difficulty: DifficultyId) => {
  completeNode(profile, missionId);
  profile.stars[missionId] = Math.max(profile.stars[missionId] ?? 0, DIFFICULTY_STARS[difficulty]);
};

export const equip = (profile: CampaignProfile, uid: number) => {
  const item = itemByUid(profile, uid);
  if (!item || equippedSlotOf(profile, uid)) return "";
  const type = mustGearDef(item.defId).slot;
  if (type === "hull") {
    profile.equipped.hull = uid;
    sanitize(profile);
    saveProfile(profile);
    return "";
  }
  const keys = slotKeys(profile).filter((k) => slotType(k) === type);
  if (keys.length === 0) return "Questo scafo non ha slot di questo tipo";
  const target = keys.find((k) => !profile.equipped[k]) ?? keys[keys.length - 1];
  profile.equipped[target] = uid;
  saveProfile(profile);
  return "";
};

/** Scafo e ultima arma frontale non si possono togliere, solo sostituire. */
export const canUnequip = (profile: CampaignProfile, key: SlotKey) => {
  if (key === "hull") return false;
  if (slotType(key) !== "front") return true;
  return Object.keys(profile.equipped).filter((k) => slotType(k) === "front" && profile.equipped[k]).length > 1;
};

export const unequip = (profile: CampaignProfile, key: SlotKey) => {
  if (!canUnequip(profile, key)) return;
  delete profile.equipped[key];
  saveProfile(profile);
};

// ---------- Economia ----------

/** Si può vendere: non montato e non bloccato. */
export const isSellable = (profile: CampaignProfile, item: GearItem) => !item.locked && !equippedSlotOf(profile, item.uid);

export const toggleLock = (profile: CampaignProfile, uid: number) => {
  const item = itemByUid(profile, uid);
  if (!item) return;
  item.locked = !item.locked;
  saveProfile(profile);
};

/** Vende in blocco i pezzi indicati (salta montati e bloccati). */
export const sellMany = (profile: CampaignProfile, uids: number[]) => {
  const ids = new Set(uids);
  const sold = profile.inventory.filter((i) => ids.has(i.uid) && isSellable(profile, i));
  const total = sold.reduce((sum, i) => sum + sellPrice(i), 0);
  const soldIds = new Set(sold.map((i) => i.uid));
  profile.inventory = profile.inventory.filter((i) => !soldIds.has(i.uid));
  profile.coins += total;
  saveProfile(profile);
  return { count: sold.length, total };
};

export const sell = (profile: CampaignProfile, uid: number) => {
  const item = itemByUid(profile, uid);
  if (!item || !isSellable(profile, item)) return 0;
  const price = sellPrice(item);
  profile.coins += price;
  profile.inventory = profile.inventory.filter((i) => i.uid !== uid);
  saveProfile(profile);
  return price;
};

export const upgrade = (profile: CampaignProfile, uid: number) => {
  const item = itemByUid(profile, uid);
  if (!item) return false;
  const cost = upgradeCost(item);
  if (profile.coins < cost) return false;
  profile.coins -= cost;
  item.level += 1;
  saveProfile(profile);
  return true;
};

/** Tier massimo raggiunto: sblocca il catalogo del negozio. */
export const shopTier = (profile: CampaignProfile) =>
  profile.sector >= 2 ? 5 : Math.max(0, ...MISSIONS.filter((m) => profile.completed.includes(m.id)).map((m) => m.tier));

/** Item level dei pezzi del negozio: un settore indietro rispetto al più alto sbloccato. */
export const shopIlvl = (profile: CampaignProfile) => ilvlOf(profile.sector - 1, 0);

export const shopCatalog = (profile: CampaignProfile): GearDef[] =>
  GEAR.filter((g) => g.shopTier !== null && g.shopTier <= shopTier(profile));

export const buy = (profile: CampaignProfile, defId: string) => {
  const def = mustGearDef(defId);
  const ilvl = shopIlvl(profile);
  const price = buyPrice(def, ilvl);
  if (profile.coins < price) return null;
  profile.coins -= price;
  const [item] = addLoot(profile, [ilvl > 0 ? { defId, rarity: "common", level: 1, ilvl } : { defId, rarity: "common", level: 1 }]);
  saveProfile(profile);
  return item;
};

/** Vende tutti i pezzi comuni di livello 1 non montati. */
export const sellCommons = (profile: CampaignProfile) =>
  sellMany(
    profile,
    profile.inventory.filter((i) => i.rarity === "common" && i.level === 1).map((i) => i.uid),
  );

export const commonsValue = (profile: CampaignProfile) => {
  const junk = profile.inventory.filter((i) => i.rarity === "common" && i.level === 1 && isSellable(profile, i));
  return { count: junk.length, total: junk.reduce((sum, i) => sum + sellPrice(i), 0) };
};

/** Monta un pezzo in uno slot preciso (lo toglie da dov'era). */
export const equipTo = (profile: CampaignProfile, uid: number, key: SlotKey) => {
  const item = itemByUid(profile, uid);
  if (!item) return "";
  const type = mustGearDef(item.defId).slot;
  if (type !== slotType(key)) return "Pezzo non compatibile con questo slot";
  const previous = equippedSlotOf(profile, uid);
  if (previous) delete profile.equipped[previous];
  profile.equipped[key] = uid;
  if (key === "hull") sanitize(profile);
  saveProfile(profile);
  return "";
};

/** Copia del profilo con uno slot cambiato: serve per l'anteprima delle differenze. */
export const simulateEquip = (profile: CampaignProfile, key: SlotKey, uid: number | null): CampaignProfile => {
  const equipped = { ...profile.equipped };
  for (const k of Object.keys(equipped)) if (uid !== null && equipped[k] === uid) delete equipped[k];
  if (uid === null) delete equipped[key];
  else equipped[key] = uid;
  return { ...profile, equipped };
};

/** Numeri chiave della nave, per le schede statistiche e i confronti. */
export interface ShipSummary {
  hp: number;
  shield: number;
  dps: number;
  heat: number;
  sink: number;
  cap: number;
  speed: number;
  pickup: number;
  regen: number;
}

export const summarize = (profile: CampaignProfile): ShipSummary => {
  const { ship, rack, mounts } = buildLoadout(profile);
  const guns = mounts.filter((m) => m.slot === "front" || m.slot === "rear");
  const missiles = mounts.filter((m) => m.slot === "missile");
  const mul = rack.damageMul * rack.rateMul;
  return {
    hp: ship.maxHp,
    shield: ship.shield,
    dps: [...guns, ...missiles].reduce((sum, m) => sum + weaponDps(m.spec) * mul, 0),
    heat: guns.reduce((sum, m) => sum + weaponHeat(m.spec) * rack.rateMul, 0),
    sink: rack.heatSink,
    cap: rack.heatCap,
    speed: ship.speed,
    pickup: ship.pickupRadius,
    regen: ship.regen,
  };
};

/** Primo pezzo montato in uno slot di questo tipo (per i confronti). */
export const equippedOfType = (profile: CampaignProfile, type: string) =>
  slotKeys(profile)
    .filter((key) => slotType(key) === type)
    .map((key) => itemByUid(profile, profile.equipped[key]))
    .find(Boolean);

export const addLoot = (profile: CampaignProfile, items: { defId: string; rarity: Rarity; level: number; ilvl?: number }[]) => {
  const added = items.map((item) => ({ ...item, uid: profile.nextUid++, fresh: true }));
  profile.inventory.push(...added);
  return added;
};

/** Primo nodo da giocare: nel settore più alto sbloccato, altrimenti nel settore 1. */
export const nextMission = (profile: CampaignProfile): { id: string; sector: number } => {
  if (profile.sector >= 2) {
    const sector = generateSector(profile.seed, profile.sector);
    const done = new Set(profile.completed);
    const open = [...sector.nodes.values()].find((node) => nodeState(sector, node, done) === "open");
    return { id: (open ?? sector.layers[0][0]).id, sector: profile.sector };
  }
  const m = MISSIONS.find((x) => isMissionUnlocked(profile, x) && !profile.completed.includes(x.id)) ?? MISSIONS[0];
  return { id: m.id, sector: 1 };
};

// ---------- Loadout per la missione ----------

export interface Mount {
  slot: WeaponSlot;
  index: number;
  spec: WeaponSpec;
}

export interface CampaignLoadout {
  ship: ShipStats;
  rack: RackStats;
  mounts: Mount[];
  fireProfiles: { 2: SlotKey[]; 3: SlotKey[] };
}

export const buildLoadout = (profile: CampaignProfile): CampaignLoadout => {
  const hullItem = equippedHull(profile);
  const hull = hullItem ? hullSpec(hullItem) : { hp: 10, speed: 250, heatCap: 100, heatSink: 30 };
  const ship: ShipStats = { maxHp: hull.hp, speed: hull.speed, pickupRadius: 160, drones: 0, blades: 0, shield: 0, shieldRegen: 0, regen: 0 };
  const rack: RackStats = { damageMul: 1, rateMul: 1, heatCap: hull.heatCap, heatSink: hull.heatSink, bombRate: 1, coinMul: 1, comboBonus: 0 };
  const mounts: Mount[] = [];

  for (const key of slotKeys(profile)) {
    const item = itemByUid(profile, profile.equipped[key]);
    if (!item || key === "hull") continue;
    const type = slotType(key);
    if (type === "device") applyDevice(ship, rack, item);
    else {
      const spec = weaponSpec(item);
      if (spec) mounts.push({ slot: type as WeaponSlot, index: Number(key.replace(/\D/g, "")), spec });
    }
  }
  return { ship, rack, mounts, fireProfiles: profile.fireProfiles };
};
