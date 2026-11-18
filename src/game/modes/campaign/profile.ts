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
  weaponSpec,
  type GearDef,
  type GearItem,
  type RackStats,
  type ShipStats,
  type WeaponSlot,
  type WeaponSpec,
} from "./gear";
import { MISSIONS, type MissionDef } from "./missions";

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
});

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
    const profile = { ...starter(), ...(JSON.parse(raw) as CampaignProfile) };
    // Chi aveva già completato missioni prima delle stelle parte da una stella.
    for (const id of profile.completed) profile.stars[id] = Math.max(1, profile.stars[id] ?? 0);
    profile.inventory = profile.inventory.filter((item) => Boolean(gearDef(item.defId)));
    sanitize(profile);
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

export const isMissionUnlocked = (profile: CampaignProfile, mission: MissionDef) =>
  mission.requires.length === 0 ||
  profile.completed.includes(mission.id) ||
  mission.requires.some((id) => profile.completed.includes(id));

/** Una difficoltà si sblocca vincendo la missione a quella precedente. */
export const difficultyUnlocked = (profile: CampaignProfile, missionId: string, difficulty: DifficultyId) =>
  DIFFICULTY_STARS[difficulty] <= (profile.stars[missionId] ?? 0) + 1;

export const recordVictory = (profile: CampaignProfile, missionId: string, difficulty: DifficultyId) => {
  if (!profile.completed.includes(missionId)) profile.completed.push(missionId);
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

export const sell = (profile: CampaignProfile, uid: number) => {
  const item = itemByUid(profile, uid);
  if (!item || equippedSlotOf(profile, uid)) return 0;
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
  Math.max(0, ...MISSIONS.filter((m) => profile.completed.includes(m.id)).map((m) => m.tier));

export const shopCatalog = (profile: CampaignProfile): GearDef[] =>
  GEAR.filter((g) => g.shopTier !== null && g.shopTier <= shopTier(profile));

export const buy = (profile: CampaignProfile, defId: string) => {
  const def = mustGearDef(defId);
  const price = buyPrice(def);
  if (profile.coins < price) return null;
  profile.coins -= price;
  const [item] = addLoot(profile, [{ defId, rarity: "common", level: 1 }]);
  saveProfile(profile);
  return item;
};

/** Vende tutti i pezzi comuni di livello 1 non montati. */
export const sellCommons = (profile: CampaignProfile) => {
  const junk = profile.inventory.filter((i) => i.rarity === "common" && i.level === 1 && !equippedSlotOf(profile, i.uid));
  const total = junk.reduce((sum, i) => sum + sellPrice(i), 0);
  const ids = new Set(junk.map((i) => i.uid));
  profile.inventory = profile.inventory.filter((i) => !ids.has(i.uid));
  profile.coins += total;
  saveProfile(profile);
  return { count: junk.length, total };
};

export const commonsValue = (profile: CampaignProfile) => {
  const junk = profile.inventory.filter((i) => i.rarity === "common" && i.level === 1 && !equippedSlotOf(profile, i.uid));
  return { count: junk.length, total: junk.reduce((sum, i) => sum + sellPrice(i), 0) };
};

/** Primo pezzo montato in uno slot di questo tipo (per i confronti). */
export const equippedOfType = (profile: CampaignProfile, type: string) =>
  slotKeys(profile)
    .filter((key) => slotType(key) === type)
    .map((key) => itemByUid(profile, profile.equipped[key]))
    .find(Boolean);

export const addLoot = (profile: CampaignProfile, items: { defId: string; rarity: Rarity; level: number }[]) => {
  const added = items.map((item) => ({ ...item, uid: profile.nextUid++, fresh: true }));
  profile.inventory.push(...added);
  return added;
};

export const nextMission = (profile: CampaignProfile) =>
  MISSIONS.find((m) => isMissionUnlocked(profile, m) && !profile.completed.includes(m.id)) ?? MISSIONS[0];

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
  return { ship, rack, mounts };
};
