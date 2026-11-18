import type { IconId } from "../../art/svg";
import { affixLabel, applyWeaponAffixes, rollAffixes, type GearAffix } from "./affixes";
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
  /** Rimbalzi sul nemico successivo. */
  bounce?: number;
  /** Moltiplicatore di danno contro unità di terra e strutture. */
  groundMul?: number;
  /** Raggio continuo: `damage` è al secondo, `heat` è al secondo. */
  beam?: boolean;
  /** Probabilità di colpo critico (danno doppio), dagli affissi. */
  crit?: number;
  /** Ogni N colpi parte un proiettile in più, dagli affissi. */
  volley?: number;
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
  /** Bonus monete per ogni passo di combo (con il Moltiplicatore). */
  comboBonus: number;
  /** Probabilità che un nemico abbattuto esploda (affissi). */
  killBlast: number;
}

export interface ShipStats {
  maxHp: number;
  speed: number;
  pickupRadius: number;
  drones: number;
  blades: number;
  /** Punti scudo che assorbono i colpi prima degli HP. */
  shield: number;
  shieldRegen: number;
  /** HP rigenerati al secondo (nanobot). */
  regen: number;
  /** Frazione del danno delle armi di bordo restituita in HP (affissi). */
  lifeSteal: number;
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
  /** Appena ottenuto e non ancora guardato in hangar. */
  fresh?: boolean;
  /** Bloccato: non si vende, nemmeno con la vendita multipla. */
  locked?: boolean;
  /** Item level: 0 nel settore 1, cresce di 10 per settore della campagna infinita. */
  ilvl?: number;
  /** Affissi casuali del bottino (0-3 in base alla rarità). */
  affixes?: GearAffix[];
  /** Ricalibrazioni già fatte: ognuna rende la successiva più cara. */
  recal?: number;
}

/** Potenza dell'item level con rendimenti decrescenti: 1 + 0.1·√ilvl. */
export const ilvlMul = (ilvl = 0) => 1 + 0.1 * Math.sqrt(Math.max(0, ilvl));

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

  {
    id: "orb",
    slot: "front",
    title: "Sfera Rimbalzante",
    description: "Una sfera lenta che salta da un nemico all'altro.",
    icon: "gear-orb",
    color: 0x93c5fd,
    value: 65,
    shopTier: 1,
    weapon: { damage: 3, interval: 700, heat: 10, speed: 430, range: 900, projectiles: 1, spread: 0, bounce: 2, color: 0x93c5fd, texture: "orb", scale: 1.6 },
    milestones: {
      5: { text: "4 rimbalzi", patch: { bounce: 4 } },
      10: { text: "Doppia sfera", patch: { projectiles: 2, spread: 0.16 } },
    },
  },
  {
    id: "laser",
    slot: "front",
    title: "Laser Continuo",
    description: "Raggio fisso finché tieni premuto. Scalda in continuazione.",
    icon: "gear-laser",
    color: 0xf472b6,
    value: 110,
    shopTier: 3,
    weapon: { damage: 9, interval: 100, heat: 30, speed: 0, range: 800, projectiles: 1, spread: 0, beam: true, color: 0xf472b6 },
    milestones: {
      5: { text: "Lente focale: gittata 1100", patch: { range: 1100 } },
      10: { text: "Raggio perforante: colpisce 3 nemici", patch: { pierce: 2 } },
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

  {
    id: "rear-mines",
    slot: "rear",
    title: "Lanciamine di Coda",
    description: "Lascia indietro mine lente che esplodono al contatto.",
    icon: "mine",
    color: 0xfb923c,
    value: 60,
    shopTier: 2,
    weapon: { damage: 6, interval: 1100, heat: 5, speed: 70, range: 380, projectiles: 1, spread: 0, blast: 80, color: 0xfdba74, texture: "orb", scale: 1.2 },
    milestones: { 5: { text: "Raggio 110", patch: { blast: 110 } }, 10: { text: "Due mine", patch: { projectiles: 2, spread: 0.6 } } },
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

  {
    id: "bunker",
    slot: "bomb",
    title: "Perforabunker",
    description: "Esplosione piccola ma devastante su torrette e strutture.",
    icon: "gear-bomb",
    color: 0xfacc15,
    value: 65,
    shopTier: 2,
    weapon: { damage: 9, interval: 3000, heat: 0, speed: 120, range: 2000, projectiles: 1, spread: 0, gravity: 1100, blast: 70, groundMul: 3, color: 0xfde047, texture: "orb", scale: 1.4 },
    milestones: { 5: { text: "Danno a terra x4", patch: { groundMul: 4 } }, 10: { text: "Raggio 100", patch: { blast: 100 } } },
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
    id: "shield-gen",
    slot: "device",
    title: "Generatore di Scudo",
    description: "Uno scudo assorbe i colpi e si ricarica dopo 2.5 s senza danni.",
    icon: "shield",
    color: 0x7dd3fc,
    value: 70,
    shopTier: 2,
    effects: [
      { target: "ship", stat: "shield", op: "add", value: 4, scales: true, label: "Scudo" },
      { target: "ship", stat: "shieldRegen", op: "add", value: 1.2, label: "Ricarica scudo/s" },
    ],
  },
  {
    id: "nanobots",
    slot: "device",
    title: "Nanobot",
    description: "Riparano lo scafo poco alla volta.",
    icon: "wrench",
    color: 0x4ade80,
    value: 60,
    shopTier: 1,
    effects: [{ target: "ship", stat: "regen", op: "add", value: 0.12, scales: true, label: "HP/s" }],
  },
  {
    id: "combo",
    slot: "device",
    title: "Moltiplicatore Combo",
    description: "Le uccisioni a catena (entro 1.8 s) rendono sempre più monete.",
    icon: "star",
    color: 0xf472b6,
    value: 60,
    shopTier: 3,
    effects: [{ target: "rack", stat: "comboBonus", op: "add", value: 0.08, scales: true, label: "Monete per passo di combo" }],
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

/** Potenza = rarità × livello × item level. */
export const gearPower = (item: GearItem) => GEAR_RARITY[item.rarity].power * (1 + (item.level - 1) * 0.08) * ilvlMul(item.ilvl);

export const buyPrice = (def: GearDef, ilvl = 0) => Math.round(def.value * 1.5 * ilvlMul(ilvl));

export const sellPrice = (item: GearItem) =>
  Math.round(mustGearDef(item.defId).value * GEAR_RARITY[item.rarity].value * (1 + (item.level - 1) * 0.5) * 0.5 * ilvlMul(item.ilvl));

export const upgradeCost = (item: GearItem) =>
  item.level >= GEAR_MAX_LEVEL
    ? Infinity
    : Math.round(mustGearDef(item.defId).value * GEAR_RARITY[item.rarity].value * 0.7 * item.level ** 1.3 * ilvlMul(item.ilvl));

/** Parametri effettivi dell'arma: base × potenza + soglie raggiunte. */
export const weaponSpec = (item: GearItem): WeaponSpec | undefined => {
  const def = mustGearDef(item.defId);
  if (!def.weapon) return undefined;
  const spec: WeaponSpec = { ...def.weapon };
  if (item.level >= 5 && def.milestones?.[5]) Object.assign(spec, def.milestones[5].patch);
  if (item.level >= 10 && def.milestones?.[10]) Object.assign(spec, def.milestones[10].patch);
  spec.damage *= gearPower(item);
  applyWeaponAffixes(spec, item.affixes);
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
    if (spec.beam) {
      lines.push(`Danno ${spec.damage.toFixed(1)}/s`, `Calore ${spec.heat}/s`, `Gittata ${spec.range}`);
    } else {
      lines.push(`Danno ${spec.damage.toFixed(1)}${spec.projectiles > 1 ? ` ×${spec.projectiles}` : ""}`);
      if (def.slot === "bomb") lines.push(`Ricarica ${(spec.interval / 1000).toFixed(1)}s`);
      else lines.push(`Colpi/s ${(1000 / spec.interval).toFixed(1)}`);
      if (spec.heat > 0) lines.push(`Calore ${spec.heat}/colpo`);
      else if (def.slot !== "bomb") lines.push("Non scalda");
    }
    if (spec.pierce) lines.push(`Perfora ${spec.pierce}`);
    if (spec.bounce) lines.push(`Rimbalzi ${spec.bounce}`);
    if (spec.blast) lines.push(`Esplosione ${spec.blast}`);
    if (spec.groundMul) lines.push(`Danno a terra x${spec.groundMul}`);
    if (spec.homing) lines.push("A ricerca");
  }
  if (def.hull) {
    const h = hullSpec(item);
    lines.push(`HP ${h.hp.toFixed(1)}`, `Velocità ${h.speed}`, `Calore ${h.heatCap} / ${h.heatSink}/s`);
    lines.push(`Slot: ${h.front} front · ${h.rear} coda · ${h.missile} missili · ${h.bomb} bombe · ${h.device} disp.`);
  }
  if (item.ilvl) lines.push(`Item level ${item.ilvl} (potenza ×${ilvlMul(item.ilvl).toFixed(2)})`);
  const power = gearPower(item);
  for (const e of def.effects ?? []) {
    const value = e.scales ? e.value * power : e.value;
    const shown = e.stat === "comboBonus" ? `+${Math.round(value * 100)}%` : `+${Number.isInteger(value) ? value : value < 1 ? value.toFixed(2) : value.toFixed(1)}`;
    lines.push(e.op === "mul" ? `${e.label} +${Math.round(value * 100)}%` : `${e.label} ${shown}`);
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
export const rollGear = (tier: number, minRarity: Rarity = "common", ilvl = 0): Omit<GearItem, "uid"> => {
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
  const affixes = rollAffixes(def.slot, rarity, Boolean(def.weapon?.beam));
  return {
    defId: def.id,
    rarity,
    level: 1,
    ...(ilvl > 0 ? { ilvl } : {}),
    ...(affixes.length ? { affixes } : {}),
  };
};

/** Danno al secondo di un'arma (per i confronti in hangar), con critici e raffiche. */
export const weaponDps = (spec: WeaponSpec) => {
  const crit = 1 + (spec.crit ?? 0);
  if (spec.beam) return spec.damage * (1 + (spec.pierce ?? 0)) * crit;
  const extra = spec.volley ? 1 / spec.volley : 0;
  return ((spec.damage * (spec.projectiles + extra) * 1000) / spec.interval) * crit;
};

/** Righe degli affissi di un pezzo. */
export const affixLinesOf = (item: GearItem) => (item.affixes ?? []).map(affixLabel);

/** Calore al secondo a fuoco continuo. */
export const weaponHeat = (spec: WeaponSpec) => (spec.beam ? spec.heat : (spec.heat * 1000) / spec.interval);
