import type { IconId } from "../../art/svg";
import type { Rarity, Stats } from "../../types";
import { pick, pickWeighted } from "../../utils";

export type GearSlot = "primary" | "secondary" | "module" | "hull";
export type EquipSlot = "primary" | "secondary" | "module1" | "module2" | "hull";
type NumericStat = Exclude<keyof Stats, "aim">;

/**
 * Effetto di un pezzo d'equipaggiamento sulle statistiche.
 * - set: sostituisce il valore (armi e scafi definiscono la base)
 * - add: somma
 * - mul: moltiplica per (1 + valore)
 * Con `scales` il valore cresce con rarità e livello.
 */
interface GearEffect {
  stat: NumericStat;
  op: "set" | "add" | "mul";
  value: number;
  scales?: boolean;
}

export interface GearDef {
  id: string;
  slot: GearSlot;
  title: string;
  description: string;
  icon: IconId;
  color: number;
  /** Valore base in monete: da qui derivano prezzo di vendita e di upgrade. */
  value: number;
  effects: GearEffect[];
}

/** Un oggetto posseduto: definizione + rarità + livello di upgrade. */
export interface GearItem {
  uid: number;
  defId: string;
  rarity: Rarity;
  level: number;
}

export const GEAR_MAX_LEVEL = 10;

export const GEAR_RARITY: Record<Rarity, { power: number; value: number; weight: number }> = {
  common: { power: 1, value: 1, weight: 60 },
  uncommon: { power: 1.15, value: 1.6, weight: 28 },
  rare: { power: 1.35, value: 2.6, weight: 9 },
  legendary: { power: 1.6, value: 4.5, weight: 3 },
};

export const SLOT_LABELS: Record<GearSlot, string> = {
  primary: "Arma principale",
  secondary: "Sistema secondario",
  module: "Modulo",
  hull: "Scafo",
};

export const GEAR: GearDef[] = [
  // Armi principali: sparano in avanti, con un piccolo aiuto alla mira.
  {
    id: "blaster",
    slot: "primary",
    title: "Blaster Orbitale",
    description: "Affidabile, colpo singolo a buona cadenza.",
    icon: "gear-blaster",
    color: 0xfde68a,
    value: 40,
    effects: [
      { stat: "damage", op: "set", value: 2, scales: true },
      { stat: "fireInterval", op: "set", value: 360 },
      { stat: "projectiles", op: "set", value: 1 },
      { stat: "spread", op: "set", value: 0.12 },
      { stat: "bulletSpeed", op: "set", value: 720 },
    ],
  },
  {
    id: "spread",
    slot: "primary",
    title: "Spargitore",
    description: "Tre colpi a ventaglio, corto raggio.",
    icon: "gear-spread",
    color: 0xfb923c,
    value: 60,
    effects: [
      { stat: "damage", op: "set", value: 1.25, scales: true },
      { stat: "fireInterval", op: "set", value: 480 },
      { stat: "projectiles", op: "set", value: 3 },
      { stat: "spread", op: "set", value: 0.26 },
      { stat: "range", op: "set", value: 430 },
    ],
  },
  {
    id: "rail",
    slot: "primary",
    title: "Railgun",
    description: "Lento ma devastante: trapassa 3 nemici.",
    icon: "gear-rail",
    color: 0x67e8f9,
    value: 80,
    effects: [
      { stat: "damage", op: "set", value: 6.5, scales: true },
      { stat: "fireInterval", op: "set", value: 950 },
      { stat: "projectiles", op: "set", value: 1 },
      { stat: "pierce", op: "set", value: 3 },
      { stat: "bulletSpeed", op: "set", value: 1250 },
      { stat: "range", op: "set", value: 780 },
    ],
  },
  {
    id: "minigun",
    slot: "primary",
    title: "Mitragliera",
    description: "Una pioggia di colpi leggeri.",
    icon: "gear-minigun",
    color: 0xfacc15,
    value: 70,
    effects: [
      { stat: "damage", op: "set", value: 0.9, scales: true },
      { stat: "fireInterval", op: "set", value: 120 },
      { stat: "projectiles", op: "set", value: 1 },
      { stat: "spread", op: "set", value: 0 },
      { stat: "bulletSpeed", op: "set", value: 780 },
    ],
  },

  // Sistemi secondari.
  {
    id: "field-turret",
    slot: "secondary",
    title: "Torretta da Campo",
    description: "Q: piazza una torretta (costa monete della missione).",
    icon: "turret",
    color: 0x22d3ee,
    value: 45,
    effects: [
      { stat: "maxTurrets", op: "set", value: 1 },
      { stat: "deployPower", op: "set", value: 1, scales: true },
    ],
  },
  {
    id: "minelayer",
    slot: "secondary",
    title: "Posamine",
    description: "E: fino a 3 mine attive.",
    icon: "mine",
    color: 0xfb923c,
    value: 45,
    effects: [
      { stat: "maxMines", op: "set", value: 3 },
      { stat: "deployPower", op: "set", value: 1, scales: true },
    ],
  },
  {
    id: "wingman",
    slot: "secondary",
    title: "Drone Gregario",
    description: "Due droni ti scortano e sparano da soli.",
    icon: "item-drone",
    color: 0xa78bfa,
    value: 55,
    effects: [
      { stat: "drones", op: "set", value: 2 },
      { stat: "damage", op: "mul", value: 0.05, scales: true },
    ],
  },
  {
    id: "blade-ring",
    slot: "secondary",
    title: "Anello di Lame",
    description: "Due lame orbitano attorno alla nave.",
    icon: "item-blades",
    color: 0x7dd3fc,
    value: 65,
    effects: [
      { stat: "blades", op: "set", value: 2 },
      { stat: "damage", op: "mul", value: 0.05, scales: true },
    ],
  },

  // Moduli passivi (due slot).
  {
    id: "plating",
    slot: "module",
    title: "Piastre Extra",
    description: "Più punti scafo.",
    icon: "item-bulkhead",
    color: 0x2dd4bf,
    value: 35,
    effects: [{ stat: "maxHp", op: "add", value: 4, scales: true }],
  },
  {
    id: "thruster",
    slot: "module",
    title: "Propulsore",
    description: "Più veloce, scatto più frequente.",
    icon: "tome-mobility",
    color: 0x34d399,
    value: 35,
    effects: [
      { stat: "speed", op: "mul", value: 0.12, scales: true },
      { stat: "dashCooldown", op: "mul", value: -0.12, scales: true },
    ],
  },
  {
    id: "scope",
    slot: "module",
    title: "Mirino Tattico",
    description: "Più danno per tutti i colpi.",
    icon: "tome-power",
    color: 0xfb923c,
    value: 40,
    effects: [{ stat: "damage", op: "mul", value: 0.15, scales: true }],
  },
  {
    id: "loader",
    slot: "module",
    title: "Caricatore",
    description: "Spari più spesso.",
    icon: "tome-cadence",
    color: 0xfacc15,
    value: 40,
    effects: [{ stat: "fireInterval", op: "mul", value: -0.12, scales: true }],
  },
  {
    id: "coil",
    slot: "module",
    title: "Bobina Magnetica",
    description: "Raccogli monete e bottino da più lontano.",
    icon: "tome-magnetism",
    color: 0x38bdf8,
    value: 25,
    effects: [{ stat: "pickupRadius", op: "mul", value: 0.5, scales: true }],
  },

  // Scafi: definiscono HP, velocità e scatto.
  {
    id: "scout",
    slot: "hull",
    title: "Scafo Ricognitore",
    description: "Fragile ma rapidissimo.",
    icon: "gear-hull",
    color: 0x34d399,
    value: 50,
    effects: [
      { stat: "maxHp", op: "set", value: 8, scales: true },
      { stat: "speed", op: "set", value: 295 },
      { stat: "dashCooldown", op: "set", value: 1300 },
    ],
  },
  {
    id: "frigate",
    slot: "hull",
    title: "Scafo Fregata",
    description: "Equilibrato.",
    icon: "gear-hull",
    color: 0x38bdf8,
    value: 50,
    effects: [
      { stat: "maxHp", op: "set", value: 11, scales: true },
      { stat: "speed", op: "set", value: 250 },
      { stat: "dashCooldown", op: "set", value: 1700 },
    ],
  },
  {
    id: "bastion",
    slot: "hull",
    title: "Scafo Bastione",
    description: "Lento, ma regge i colpi.",
    icon: "gear-hull",
    color: 0xf97316,
    value: 70,
    effects: [
      { stat: "maxHp", op: "set", value: 16, scales: true },
      { stat: "speed", op: "set", value: 215 },
      { stat: "dashCooldown", op: "set", value: 2100 },
    ],
  },
];

export const gearDef = (id: string) => GEAR.find((g) => g.id === id)!;

export const gearPower = (item: GearItem) => GEAR_RARITY[item.rarity].power * (1 + (item.level - 1) * 0.08);

export const sellPrice = (item: GearItem) =>
  Math.round(gearDef(item.defId).value * GEAR_RARITY[item.rarity].value * (1 + (item.level - 1) * 0.5) * 0.5);

export const upgradeCost = (item: GearItem) =>
  item.level >= GEAR_MAX_LEVEL ? Infinity : Math.round(gearDef(item.defId).value * GEAR_RARITY[item.rarity].value * 0.7 * item.level ** 1.3);

export const applyGear = (stats: Stats, item: GearItem) => {
  const power = gearPower(item);
  for (const e of gearDef(item.defId).effects) {
    const value = e.scales ? e.value * power : e.value;
    if (e.op === "set") stats[e.stat] = value;
    else if (e.op === "add") stats[e.stat] += value;
    else stats[e.stat] *= 1 + value;
  }
};

const STAT_LABELS: Partial<Record<NumericStat, string>> = {
  damage: "Danno",
  fireInterval: "Colpi/s",
  projectiles: "Proiettili",
  pierce: "Perforazione",
  range: "Gittata",
  maxHp: "HP",
  speed: "Velocità",
  dashCooldown: "Ricarica scatto",
  pickupRadius: "Raccolta",
  maxTurrets: "Torrette",
  maxMines: "Mine",
  deployPower: "Potenza difese",
  drones: "Droni",
  blades: "Lame",
};

/** Righe leggibili per la scheda dell'oggetto. */
export const describeGear = (item: GearItem) => {
  const power = gearPower(item);
  return gearDef(item.defId).effects.flatMap((e) => {
    const label = STAT_LABELS[e.stat];
    if (!label) return [];
    const value = e.scales ? e.value * power : e.value;
    if (e.op === "mul") return [`${label} ${value > 0 ? "+" : ""}${Math.round(value * 100)}%`];
    if (e.stat === "fireInterval") return [`${label} ${(1000 / value).toFixed(1)}`];
    if (e.stat === "dashCooldown") return [`${label} ${(value / 1000).toFixed(1)}s`];
    if (e.stat === "deployPower") return [`${label} x${value.toFixed(2)}`];
    return [`${label} ${e.op === "add" ? "+" : ""}${Number.isInteger(value) ? value : value.toFixed(1)}`];
  });
};

/** Bottino casuale: rarità migliori con il livello della missione. */
export const rollGear = (tier: number, minRarity: Rarity = "common"): Omit<GearItem, "uid"> => {
  const slot = pickWeighted<GearSlot>(["primary", "secondary", "module", "hull"], (s) => ({ primary: 25, secondary: 22, module: 40, hull: 13 })[s])!;
  const def = pick(GEAR.filter((g) => g.slot === slot));
  const order: Rarity[] = ["common", "uncommon", "rare", "legendary"];
  const weights: Record<Rarity, number> = {
    common: Math.max(10, 60 - tier * 6),
    uncommon: 28,
    rare: 9 + tier * 2.5,
    legendary: 2 + tier * 1.2,
  };
  const allowed = order.slice(order.indexOf(minRarity));
  const rarity = pickWeighted(allowed, (r) => weights[r]) ?? minRarity;
  return { defId: def.id, rarity, level: 1 };
};
