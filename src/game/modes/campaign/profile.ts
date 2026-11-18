import { defaultLoadout } from "../../data/upgrades";
import type { Rarity, Stats } from "../../types";
import { applyGear, gearDef, sellPrice, upgradeCost, type EquipSlot, type GearItem } from "./gear";
import { MISSIONS, type MissionDef } from "./missions";

const KEY = "space-war-campaign-v1";

/** Profilo persistente della campagna, separato dai crediti del survival. */
export interface CampaignProfile {
  coins: number;
  inventory: GearItem[];
  equipped: Record<EquipSlot, number | null>;
  completed: string[];
  nextUid: number;
}

export const EQUIP_ORDER: EquipSlot[] = ["primary", "secondary", "module1", "module2", "hull"];

const starter = (): CampaignProfile => {
  const inventory: GearItem[] = [
    { uid: 1, defId: "blaster", rarity: "common", level: 1 },
    { uid: 2, defId: "field-turret", rarity: "common", level: 1 },
    { uid: 3, defId: "frigate", rarity: "common", level: 1 },
  ];
  return {
    coins: 0,
    inventory,
    equipped: { primary: 1, secondary: 2, module1: null, module2: null, hull: 3 },
    completed: [],
    nextUid: 4,
  };
};

export const loadProfile = (): CampaignProfile => {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return starter();
    const data = JSON.parse(raw) as CampaignProfile;
    const profile = { ...starter(), ...data };
    // Scarta oggetti di definizioni non più esistenti.
    profile.inventory = profile.inventory.filter((item) => {
      try {
        return Boolean(gearDef(item.defId));
      } catch {
        return false;
      }
    });
    const owned = new Set(profile.inventory.map((i) => i.uid));
    EQUIP_ORDER.forEach((slot) => {
      if (profile.equipped[slot] !== null && !owned.has(profile.equipped[slot]!)) profile.equipped[slot] = null;
    });
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

export const itemByUid = (profile: CampaignProfile, uid: number | null) =>
  uid === null ? undefined : profile.inventory.find((i) => i.uid === uid);

export const equippedSlotOf = (profile: CampaignProfile, uid: number) =>
  EQUIP_ORDER.find((slot) => profile.equipped[slot] === uid);

export const isMissionUnlocked = (profile: CampaignProfile, mission: MissionDef) =>
  mission.requires.length === 0 || mission.requires.some((id) => profile.completed.includes(id));

/** Statistiche della nave in campagna: base + scafo + arma + secondario + moduli. */
export const loadoutStats = (profile: CampaignProfile): Stats => {
  const stats: Stats = { ...defaultLoadout(), maxTurrets: 0, maxMines: 0, aim: "forward" };
  (["hull", "primary", "secondary", "module1", "module2"] as EquipSlot[]).forEach((slot) => {
    const item = itemByUid(profile, profile.equipped[slot]);
    if (item) applyGear(stats, item);
  });
  return stats;
};

export const equip = (profile: CampaignProfile, uid: number) => {
  const item = itemByUid(profile, uid);
  if (!item || equippedSlotOf(profile, uid)) return;
  const slot = gearDef(item.defId).slot;
  if (slot === "module") {
    const target: EquipSlot = profile.equipped.module1 === null ? "module1" : profile.equipped.module2 === null ? "module2" : "module2";
    profile.equipped[target] = uid;
  } else {
    profile.equipped[slot] = uid;
  }
  saveProfile(profile);
};

/** Arma principale e scafo sono obbligatori: si possono solo sostituire. */
export const canUnequip = (slot: EquipSlot) => slot !== "primary" && slot !== "hull";

export const unequip = (profile: CampaignProfile, slot: EquipSlot) => {
  if (!canUnequip(slot)) return;
  profile.equipped[slot] = null;
  saveProfile(profile);
};

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

export const addLoot = (profile: CampaignProfile, items: { defId: string; rarity: Rarity; level: number }[]) => {
  const added = items.map((item) => ({ ...item, uid: profile.nextUid++ }));
  profile.inventory.push(...added);
  return added;
};

export const nextMission = (profile: CampaignProfile) =>
  MISSIONS.find((m) => isMissionUnlocked(profile, m) && !profile.completed.includes(m.id)) ?? MISSIONS[0];
