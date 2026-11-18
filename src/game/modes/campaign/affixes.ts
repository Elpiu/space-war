import type { Rarity } from "../../types";
import type { GearSlot, RackStats, ShipStats, WeaponSpec } from "./gear";

/**
 * Affissi del bottino: ogni pezzo trovato ne ha 0-3 in base alla rarità.
 * Gli affissi d'arma modificano la WeaponSpec del pezzo; quelli di nave
 * valgono per tutta la nave finché il pezzo è montato.
 */
export type GearAffixId =
  | "dmg"
  | "rate"
  | "cool"
  | "crit"
  | "range"
  | "volley"
  | "pierce"
  | "leech"
  | "blast"
  | "coins"
  | "hull"
  | "sink"
  | "speed";

export interface GearAffix {
  id: GearAffixId;
  /** Valore tirato (percentuale o quantità, secondo l'affisso). */
  v: number;
}

interface AffixDef {
  label: (v: number) => string;
  /** Slot su cui può comparire. */
  slots: GearSlot[];
  range: [number, number];
  /** Rarità minima per comparire. */
  minRarity?: Rarity;
  /** Solo armi a proiettili (non laser). */
  noBeam?: boolean;
  weapon?: (spec: WeaponSpec, v: number) => void;
  ship?: (ship: ShipStats, rack: RackStats, v: number) => void;
}

const GUNS: GearSlot[] = ["front", "rear"];
const WEAPONS: GearSlot[] = ["front", "rear", "missile", "bomb"];
const ANY: GearSlot[] = ["front", "rear", "missile", "bomb", "device", "hull"];

export const GEAR_AFFIXES: Record<GearAffixId, AffixDef> = {
  dmg: { label: (v) => `+${v}% danno`, slots: WEAPONS, range: [6, 14], weapon: (s, v) => (s.damage *= 1 + v / 100) },
  rate: { label: (v) => `+${v}% cadenza`, slots: WEAPONS, range: [5, 12], weapon: (s, v) => (s.interval /= 1 + v / 100) },
  cool: { label: (v) => `−${v}% calore`, slots: GUNS, range: [8, 18], weapon: (s, v) => (s.heat *= 1 - v / 100) },
  crit: { label: (v) => `${v}% colpo critico (×2)`, slots: WEAPONS, range: [5, 12], weapon: (s, v) => (s.crit = (s.crit ?? 0) + v / 100) },
  range: { label: (v) => `+${v}% gittata`, slots: GUNS, range: [10, 22], weapon: (s, v) => (s.range *= 1 + v / 100) },
  volley: {
    label: () => "+1 proiettile ogni 4 colpi",
    slots: GUNS,
    range: [4, 4],
    noBeam: true,
    weapon: (s, v) => (s.volley = v),
  },
  pierce: {
    label: () => "+1 perforazione",
    slots: GUNS,
    range: [1, 1],
    minRarity: "rare",
    weapon: (s, v) => (s.pierce = (s.pierce ?? 0) + v),
  },
  leech: { label: (v) => `Rubavita ${v}% (armi di bordo)`, slots: ANY, range: [1, 3], ship: (ship, _r, v) => (ship.lifeSteal += v / 100) },
  blast: { label: (v) => `${v}% esplosione all'uccisione`, slots: ANY, range: [8, 16], ship: (_s, r, v) => (r.killBlast += v / 100) },
  coins: { label: (v) => `+${v}% monete`, slots: ANY, range: [8, 20], ship: (_s, r, v) => (r.coinMul *= 1 + v / 100) },
  hull: { label: (v) => `+${v} HP`, slots: ["device", "hull"], range: [1, 3], ship: (ship, _r, v) => (ship.maxHp += v) },
  sink: { label: (v) => `+${v}% dissipazione`, slots: ["device", "hull", "front", "rear"], range: [6, 14], ship: (_s, r, v) => (r.heatSink *= 1 + v / 100) },
  speed: { label: (v) => `+${v}% velocità`, slots: ["device", "hull"], range: [4, 10], ship: (ship, _r, v) => (ship.speed *= 1 + v / 100) },
};

const RARITY_ORDER: Rarity[] = ["common", "uncommon", "rare", "legendary"];

/** Numero di affissi per rarità. */
export const AFFIX_COUNT: Record<Rarity, number> = { common: 0, uncommon: 1, rare: 2, legendary: 3 };

const candidates = (slot: GearSlot, rarity: Rarity, beam: boolean, exclude: GearAffixId[]) =>
  (Object.keys(GEAR_AFFIXES) as GearAffixId[]).filter((id) => {
    const def = GEAR_AFFIXES[id];
    if (!def.slots.includes(slot) || exclude.includes(id)) return false;
    if (def.noBeam && beam) return false;
    if (beam && id === "range") return false;
    return !def.minRarity || RARITY_ORDER.indexOf(rarity) >= RARITY_ORDER.indexOf(def.minRarity);
  });

/** Tira un affisso; i leggendari pescano nella metà alta dell'intervallo. */
export const rollAffix = (slot: GearSlot, rarity: Rarity, beam: boolean, exclude: GearAffixId[] = []): GearAffix | null => {
  const pool = candidates(slot, rarity, beam, exclude);
  if (pool.length === 0) return null;
  const id = pool[Math.floor(Math.random() * pool.length)];
  const [min, max] = GEAR_AFFIXES[id].range;
  const low = rarity === "legendary" ? min + (max - min) / 2 : min;
  return { id, v: Math.round(low + Math.random() * (max - low)) };
};

export const rollAffixes = (slot: GearSlot, rarity: Rarity, beam: boolean): GearAffix[] => {
  const out: GearAffix[] = [];
  for (let i = 0; i < AFFIX_COUNT[rarity]; i += 1) {
    const a = rollAffix(slot, rarity, beam, out.map((x) => x.id));
    if (a) out.push(a);
  }
  return out;
};

export const affixLabel = (a: GearAffix) => GEAR_AFFIXES[a.id].label(a.v);

export const applyWeaponAffixes = (spec: WeaponSpec, affixes: GearAffix[] = []) => {
  for (const a of affixes) GEAR_AFFIXES[a.id].weapon?.(spec, a.v);
};

export const applyShipAffixes = (ship: ShipStats, rack: RackStats, affixes: GearAffix[] = []) => {
  for (const a of affixes) GEAR_AFFIXES[a.id].ship?.(ship, rack, a.v);
};
