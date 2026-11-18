import type { IconId } from "../../art/svg";
import type { Rarity } from "../../types";
import { pick, pickWeighted } from "../../utils";

export type GearSlot = "front" | "rear" | "missile" | "bomb" | "device" | "hull";
export type WeaponSlot = Exclude<GearSlot, "device" | "hull">;

/** Parametri di un'arma montata. Le bombe usano `interval` come tempo di ricarica. */
export interface WeaponSpec {
  damage: number;
  interval: number;
  /** Calore generato per colpo (0 per missili e bombe). */
  heat: number;
  speed: number;
  range: number;
  projectiles: number;
  spread: number;
  jitter?: number;
  pierce?: number;
  /** Velocità di virata in rad/s per i colpi a ricerca. */
  homing?: number;
  gravity?: number;
  /** Raggio dell'esplosione all'impatto. */
  blast?: number;
  color: number;
  scale?: number;
  texture?: "bullet" | "orb" | "missile";
}

export interface HullSpec {
  front: number;
  rear: number;
  missile: number;
  bomb: number;
  device: number;
  hp: number;
  speed: number;
  heatCap: number;
  heatSink: number;
}

/** Moltiplicatori dei sistemi d'arma, modificati dai dispositivi. */
export interface RackStats {
  damageMul: number;
  rateMul: number;
  heatCap: number;
  heatSink: number;
  bombRate: number;
  coinMul: number;
}

export interface ShipStats {
  maxHp: number;
  speed: number;
  pickupRadius: number;
  drones: number;
  blades: number;
}

interface GearEffect {
  target: "ship" | "rack";
  stat: keyof ShipStats | keyof RackStats;
  op: "add" | "mul";
  value: number;
  scales?: boolean;
  label: string;
}

interface Milestone {
  text: string;
  patch: Partial<WeaponSpec>;
}

export interface GearDef {
  id: string;
  slot: GearSlot;
  title: string;
  description: string;
  icon: IconId;
  color: number;
  /** Valore base in monete: da qui derivano prezzi di acquisto, vendita e upgrade. */
  value: number;
  /** Tier di missione da cui compare in negozio; null = solo da bottino. */
  shopTier: number | null;
  weapon?: WeaponSpec;
  hull?: HullSpec;
  effects?: GearEffect[];
  milestones?: { 5?: Milestone; 10?: Milestone };
}

/** Un oggetto posseduto: definizione + rarità + livello di upgrade. */
export interface GearItem {
  uid: number;
  defId: string;
  rarity: Rarity;
  level: number;
}

export const GEAR_MAX_LEVEL = 10;

export const GEAR_RARITY: Record<Rarity, { power: number; value: number }> = {
  common: { power: 1, value: 1 },
  uncommon: { power: 1.15, value: 1.6 },
  rare: { power: 1.35, value: 2.6 },
  legendary: { power: 1.6, value: 4.5 },
};

export const SLOT_LABELS: Record<GearSlot, string> = {
  front: "Arma frontale",
  rear: "Arma posteriore",
  missile: "Missili",
  bomb: "Bombe",
  device: "Dispositivo",
  hull: "Scafo",
};

export const GEAR: GearDef[] = [
  // ---------- Armi frontali ----------
  {
    id: "blaster",
    slot: "front",
    title: "Blaster Orbitale",
    description: "Affidabile e fresco: colpo singolo a buona cadenza.",
    icon: "gear-blaster",
    color: 0xfde68a,
    value: 40,
    shopTier: 0,
    weapon: { damage: 2, interval: 300, heat: 5, speed: 780, range: 900, projectiles: 1, spread: 0, color: 0xfde68a },
    milestones: {
      5: { text: "Doppia canna", patch: { projectiles: 2, spread: 0.05 } },
      10: { text: "Colpi perforanti", patch: { pierce: 1 } },
    },
  },
  {
    id: "spread",
    slot: "front",
    title: "Spargitore",
    description: "Ventaglio a corto raggio, scalda parecchio.",
    icon: "gear-spread",
    color: 0xfb923c,
    value: 60,
    shopTier: 1,
    weapon: { damage: 1.3, interval: 420, heat: 9, speed: 680, range: 560, projectiles: 3, spread: 0.2, color: 0xfdba74 },
    milestones: {
      5: { text: "5 colpi", patch: { projectiles: 5 } },
      10: { text: "7 colpi", patch: { projectiles: 7 } },
    },
  },
  {
    id: "minigun",
    slot: "front",
    title: "Mitragliera",
    description: "Pioggia di colpi leggeri e imprecisi.",
    icon: "gear-minigun",
    color: 0xfacc15,
    value: 70,
    shopTier: 2,
    weapon: { damage: 0.8, interval: 95, heat: 2.6, speed: 860, range: 820, projectiles: 1, spread: 0, jitter: 0.07, color: 0xfef08a, scale: 0.8 },
    milestones: {
      5: { text: "Canne raffreddate", patch: { heat: 1.8 } },
      10: { text: "Doppio rotore", patch: { projectiles: 2, spread: 0.08 } },
    },
  },
  {
    id: "rail",
    slot: "front",
    title: "Railgun",
    description: "Lento e rovente, ma trapassa tutto ciò che trova.",
    icon: "gear-rail",
    color: 0x67e8f9,
    value: 90,
    shopTier: 3,
    weapon: { damage: 8, interval: 900, heat: 22, speed: 1500, range: 1400, projectiles: 1, spread: 0, pierce: 3, color: 0x67e8f9, scale: 1.4 },
    milestones: {
      5: { text: "Perfora 5", patch: { pierce: 5 } },
      10: { text: "Sovraccarico: +50% danno", patch: { damage: 12 } },
    },
  },

  // ---------- Armi posteriori ----------
  {
    id: "tail-gun",
    slot: "rear",
    title: "Cannone di Coda",
    description: "Copre le spalle da chi arriva da dietro.",
    icon: "gear-blaster",
    color: 0x93c5fd,
    value: 35,
    shopTier: 0,
    weapon: { damage: 1.5, interval: 420, heat: 3, speed: 700, range: 700, projectiles: 1, spread: 0, color: 0x93c5fd },
    milestones: {
      5: { text: "2 colpi a ventaglio", patch: { projectiles: 2, spread: 0.3 } },
      10: { text: "3 colpi a ventaglio", patch: { projectiles: 3 } },
    },
  },
  {
    id: "flak",
    slot: "rear",
    title: "Flak di Coda",
    description: "Una rosa di schegge alle tue spalle.",
    icon: "gear-spread",
    color: 0xc4b5fd,
    value: 55,
    shopTier: 2,
    weapon: { damage: 1, interval: 650, heat: 6, speed: 560, range: 380, projectiles: 5, spread: 0.45, color: 0xc4b5fd, scale: 0.8 },
    milestones: { 5: { text: "7 schegge", patch: { projectiles: 7 } }, 10: { text: "Gittata doppia", patch: { range: 760 } } },
  },

  // ---------- Missili (non scaldano) ----------
  {
    id: "rockets",
    slot: "missile",
    title: "Razzi Diretti",
    description: "Salve di razzi che esplodono all'impatto.",
    icon: "gear-missile",
    color: 0xf87171,
    value: 60,
    shopTier: 1,
    weapon: { damage: 4, interval: 1400, heat: 0, speed: 540, range: 1000, projectiles: 2, spread: 0.12, blast: 55, color: 0xfca5a5, texture: "missile" },
    milestones: { 5: { text: "3 razzi", patch: { projectiles: 3 } }, 10: { text: "4 razzi", patch: { projectiles: 4 } } },
  },
  {
    id: "swarm",
    slot: "missile",
    title: "Sciame a Ricerca",
    description: "Missili leggeri che inseguono il bersaglio.",
    icon: "gear-missile",
    color: 0xf472b6,
    value: 85,
    shopTier: 2,
    weapon: { damage: 2.5, interval: 1800, heat: 0, speed: 460, range: 1200, projectiles: 3, spread: 0.6, homing: 4.5, blast: 34, color: 0xf9a8d4, texture: "missile", scale: 0.8 },
    milestones: { 5: { text: "4 missili", patch: { projectiles: 4 } }, 10: { text: "6 missili", patch: { projectiles: 6 } } },
  },

  // ---------- Bombe (indicatore che si ricarica) ----------
  {
    id: "cluster",
    slot: "bomb",
    title: "Bomba a Grappolo",
    description: "Cade e devasta un'area. Tasto B.",
    icon: "gear-bomb",
    color: 0xfb923c,
    value: 50,
    shopTier: 0,
    weapon: { damage: 10, interval: 3500, heat: 0, speed: 160, range: 2000, projectiles: 1, spread: 0, gravity: 900, blast: 110, color: 0xfdba74, texture: "orb", scale: 1.6 },
    milestones: { 5: { text: "Raggio 140", patch: { blast: 140 } }, 10: { text: "Danno 16", patch: { damage: 16 } } },
  },

  // ---------- Dispositivi ----------
  {
    id: "plating",
    slot: "device",
    title: "Piastre Extra",
    description: "Più punti scafo.",
    icon: "item-bulkhead",
    color: 0x2dd4bf,
    value: 35,
    shopTier: 0,
    effects: [{ target: "ship", stat: "maxHp", op: "add", value: 4, scales: true, label: "HP" }],
  },
  {
    id: "radiator",
    slot: "device",
    title: "Radiatore",
    description: "Il calore si disperde più in fretta.",
    icon: "gear-radiator",
    color: 0x38bdf8,
    value: 40,
    shopTier: 0,
    effects: [{ target: "rack", stat: "heatSink", op: "mul", value: 0.25, scales: true, label: "Dissipazione" }],
  },
  {
    id: "heat-tank",
    slot: "device",
    title: "Serbatoio Termico",
    description: "Più colpi prima di surriscaldarsi.",
    icon: "gear-radiator",
    color: 0xf97316,
    value: 40,
    shopTier: 1,
    effects: [{ target: "rack", stat: "heatCap", op: "mul", value: 0.3, scales: true, label: "Capacità termica" }],
  },
  {
    id: "scope",
    slot: "device",
    title: "Mirino Tattico",
    description: "Più danno per tutte le armi.",
    icon: "tome-power",
    color: 0xfb923c,
    value: 45,
    shopTier: 1,
    effects: [{ target: "rack", stat: "damageMul", op: "mul", value: 0.12, scales: true, label: "Danno" }],
  },
  {
    id: "loader",
    slot: "device",
    title: "Caricatore",
    description: "Tutte le armi sparano più spesso.",
    icon: "tome-cadence",
    color: 0xfacc15,
    value: 45,
    shopTier: 2,
    effects: [{ target: "rack", stat: "rateMul", op: "mul", value: 0.12, scales: true, label: "Cadenza" }],
  },
  {
    id: "thruster",
    slot: "device",
    title: "Propulsore",
    description: "Nave più veloce.",
    icon: "tome-mobility",
    color: 0x34d399,
    value: 35,
    shopTier: 1,
    effects: [{ target: "ship", stat: "speed", op: "mul", value: 0.12, scales: true, label: "Velocità" }],
  },
  {
    id: "coil",
    slot: "device",
    title: "Bobina Magnetica",
    description: "Raccogli monete e casse da più lontano.",
    icon: "tome-magnetism",
    color: 0x38bdf8,
    value: 25,
    shopTier: 0,
    effects: [{ target: "ship", stat: "pickupRadius", op: "mul", value: 0.6, scales: true, label: "Raccolta" }],
  },
  {
    id: "bounty",
    slot: "device",
    title: "Scanner Taglie",
    description: "Ogni abbattimento rende più monete.",
    icon: "coin",
    color: 0xfbbf24,
    value: 60,
    shopTier: null,
    effects: [{ target: "rack", stat: "coinMul", op: "mul", value: 0.2, scales: true, label: "Monete" }],
  },
  {
    id: "bomb-bay",
    slot: "device",
    title: "Vano Bombe",
    description: "Le bombe si ricaricano più in fretta.",
    icon: "gear-bomb",
    color: 0xfdba74,
    value: 40,
    shopTier: 2,
    effects: [{ target: "rack", stat: "bombRate", op: "mul", value: 0.3, scales: true, label: "Ricarica bombe" }],
  },
  {
    id: "wingman",
    slot: "device",
    title: "Drone Gregario",
    description: "Due droni ti scortano e sparano da soli.",
    icon: "item-drone",
    color: 0xa78bfa,
    value: 70,
    shopTier: null,
    effects: [{ target: "ship", stat: "drones", op: "add", value: 2, label: "Droni" }],
  },
  {
    id: "blade-ring",
    slot: "device",
    title: "Anello di Lame",
    description: "Due lame orbitano attorno alla nave.",
    icon: "item-blades",
    color: 0x7dd3fc,
    value: 70,
    shopTier: null,
    effects: [{ target: "ship", stat: "blades", op: "add", value: 2, label: "Lame" }],
  },

  // ---------- Scafi: definiscono gli slot ----------
  {
    id: "scout",
    slot: "hull",
    title: "Scafo Ricognitore",
    description: "Fragile e rapidissimo. Missili, niente bombe.",
    icon: "gear-hull",
    color: 0x34d399,
    value: 60,
    shopTier: 1,
    hull: { front: 2, rear: 0, missile: 1, bomb: 0, device: 1, hp: 8, speed: 300, heatCap: 100, heatSink: 32 },
  },
  {
    id: "frigate",
    slot: "hull",
    title: "Scafo Fregata",
    description: "Equilibrato: coda e vano bombe.",
    icon: "gear-hull",
    color: 0x38bdf8,
    value: 50,
    shopTier: 0,
    hull: { front: 2, rear: 1, missile: 0, bomb: 1, device: 1, hp: 11, speed: 255, heatCap: 110, heatSink: 30 },
  },
  {
    id: "bastion",
    slot: "hull",
    title: "Scafo Bastione",
    description: "Lento, corazzato, tre armi frontali.",
    icon: "gear-hull",
    color: 0xf97316,
    value: 120,
    shopTier: 3,
    hull: { front: 3, rear: 1, missile: 1, bomb: 1, device: 2, hp: 16, speed: 215, heatCap: 130, heatSink: 26 },
  },
];

export const gearDef = (id: string) => GEAR.find((g) => g.id === id);
export const mustGearDef = (id: string) => gearDef(id)!;

export const gearPower = (item: GearItem) => GEAR_RARITY[item.rarity].power * (1 + (item.level - 1) * 0.08);

export const buyPrice = (def: GearDef) => Math.round(def.value * 1.5);

export const sellPrice = (item: GearItem) =>
  Math.round(mustGearDef(item.defId).value * GEAR_RARITY[item.rarity].value * (1 + (item.level - 1) * 0.5) * 0.5);

export const upgradeCost = (item: GearItem) =>
  item.level >= GEAR_MAX_LEVEL ? Infinity : Math.round(mustGearDef(item.defId).value * GEAR_RARITY[item.rarity].value * 0.7 * item.level ** 1.3);

/** Parametri effettivi dell'arma: base × potenza + soglie raggiunte. */
export const weaponSpec = (item: GearItem): WeaponSpec | undefined => {
  const def = mustGearDef(item.defId);
  if (!def.weapon) return undefined;
  const spec: WeaponSpec = { ...def.weapon };
  if (item.level >= 5 && def.milestones?.[5]) Object.assign(spec, def.milestones[5].patch);
  if (item.level >= 10 && def.milestones?.[10]) Object.assign(spec, def.milestones[10].patch);
  spec.damage *= gearPower(item);
  return spec;
};

export const hullSpec = (item: GearItem): HullSpec => {
  const hull = mustGearDef(item.defId).hull!;
  return { ...hull, hp: hull.hp * gearPower(item) };
};

export const applyDevice = (ship: ShipStats, rack: RackStats, item: GearItem) => {
  const power = gearPower(item);
  for (const e of mustGearDef(item.defId).effects ?? []) {
    const bag = (e.target === "ship" ? ship : rack) as unknown as Record<string, number>;
    const value = e.scales ? e.value * power : e.value;
    if (e.op === "add") bag[e.stat] += value;
    else bag[e.stat] *= 1 + value;
  }
};

/** Righe leggibili per la scheda dell'oggetto. */
export const describeGear = (item: GearItem) => {
  const def = mustGearDef(item.defId);
  const lines: string[] = [];
  const spec = weaponSpec(item);
  if (spec) {
    lines.push(`Danno ${spec.damage.toFixed(1)}${spec.projectiles > 1 ? ` ×${spec.projectiles}` : ""}`);
    if (def.slot === "bomb") lines.push(`Ricarica ${(spec.interval / 1000).toFixed(1)}s`);
    else lines.push(`Colpi/s ${(1000 / spec.interval).toFixed(1)}`);
    if (spec.heat > 0) lines.push(`Calore ${spec.heat}/colpo`);
    else if (def.slot !== "bomb") lines.push("Non scalda");
    if (spec.pierce) lines.push(`Perfora ${spec.pierce}`);
    if (spec.blast) lines.push(`Esplosione ${spec.blast}`);
    if (spec.homing) lines.push("A ricerca");
  }
  if (def.hull) {
    const h = hullSpec(item);
    lines.push(`HP ${h.hp.toFixed(1)}`, `Velocità ${h.speed}`, `Calore ${h.heatCap} / ${h.heatSink}/s`);
    lines.push(`Slot: ${h.front} front · ${h.rear} coda · ${h.missile} missili · ${h.bomb} bombe · ${h.device} disp.`);
  }
  const power = gearPower(item);
  for (const e of def.effects ?? []) {
    const value = e.scales ? e.value * power : e.value;
    lines.push(e.op === "mul" ? `${e.label} +${Math.round(value * 100)}%` : `${e.label} +${Number.isInteger(value) ? value : value.toFixed(1)}`);
  }
  return lines;
};

export const milestonesOf = (item: GearItem) => {
  const def = mustGearDef(item.defId);
  return ([5, 10] as const).flatMap((lv) => {
    const m = def.milestones?.[lv];
    return m ? [{ level: lv, text: m.text, reached: item.level >= lv }] : [];
  });
};

/** Bottino casuale: rarità migliori con il livello della missione. */
export const rollGear = (tier: number, minRarity: Rarity = "common"): Omit<GearItem, "uid"> => {
  const weights: Record<GearSlot, number> = { front: 24, rear: 12, missile: 12, bomb: 8, device: 34, hull: 10 };
  const pool = GEAR.filter((g) => g.shopTier === null || g.shopTier <= tier + 1);
  const slot = pickWeighted(Object.keys(weights) as GearSlot[], (s) => (pool.some((g) => g.slot === s) ? weights[s] : 0))!;
  const def = pick(pool.filter((g) => g.slot === slot));
  const order: Rarity[] = ["common", "uncommon", "rare", "legendary"];
  const rarityWeights: Record<Rarity, number> = {
    common: Math.max(10, 60 - tier * 6),
    uncommon: 28,
    rare: 9 + tier * 2.5,
    legendary: 2 + tier * 1.2,
  };
  const allowed = order.slice(order.indexOf(minRarity));
  const rarity = pickWeighted(allowed, (r) => rarityWeights[r]) ?? minRarity;
  return { defId: def.id, rarity, level: 1 };
};
