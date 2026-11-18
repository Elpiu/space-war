import { BASE_STATS, DEPLOY, LIMITS } from "../config";
import type { ItemDef, ItemId, Rarity, Run, Stats, TomeDef, TomeId, TomeOffer } from "../types";
import { pickUnique, pickWeighted } from "../utils";

export const RARITIES: Record<Rarity, { label: string; multiplier: number; weight: number; color: number }> = {
  common: { label: "Comune", multiplier: 1, weight: 62, color: 0x94a3b8 },
  uncommon: { label: "Non comune", multiplier: 1.5, weight: 26, color: 0x4ade80 },
  rare: { label: "Raro", multiplier: 2.25, weight: 9, color: 0x38bdf8 },
  legendary: { label: "Leggendario", multiplier: 3.5, weight: 3, color: 0xfbbf24 },
};

export const TOMES: TomeDef[] = [
  {
    id: "power",
    title: "Potenza",
    stat: "danno",
    increment: 12,
    color: 0xfb923c,
    icon: "tome-power",
    cost: 0,
    evolution: { title: "Nucleo Perforante", description: "I colpi della nave trapassano 2 nemici." },
  },
  {
    id: "cadence",
    title: "Cadenza",
    stat: "velocità di fuoco",
    increment: 10,
    color: 0xfacc15,
    icon: "tome-cadence",
    cost: 0,
    evolution: { title: "Raffica Stellare", description: "Ogni 5 salve spari un anello di 12 colpi." },
  },
  {
    id: "vitality",
    title: "Vitalità",
    stat: "HP massimi",
    increment: 15,
    color: 0xfb7185,
    icon: "tome-vitality",
    cost: 0,
    evolution: { title: "Scudo Rigenerante", description: "Uno scudo assorbe un colpo ogni 12 secondi." },
  },
  {
    id: "mobility",
    title: "Mobilità",
    stat: "velocità e scatto",
    increment: 8,
    color: 0x34d399,
    icon: "tome-mobility",
    cost: 0,
    evolution: { title: "Scia al Plasma", description: "Lo scatto lascia una scia che brucia i nemici." },
  },
  {
    id: "magnetism",
    title: "Magnetismo",
    stat: "raggio di raccolta",
    increment: 20,
    color: 0x38bdf8,
    icon: "tome-magnetism",
    cost: 0,
    evolution: { title: "Campo Repulsore", description: "Ogni 6 secondi un'onda respinge e danneggia i nemici vicini." },
  },
  {
    id: "wisdom",
    title: "Sapienza",
    stat: "esperienza",
    increment: 12,
    color: 0x22d3ee,
    icon: "tome-wisdom",
    cost: 0,
    evolution: { title: "Illuminazione", description: "4 scelte a ogni livello e un reroll gratis in più." },
  },
  {
    id: "vampirism",
    title: "Vampirismo",
    stat: "rubavita dei colpi",
    increment: 1.5,
    color: 0xe11d48,
    icon: "tome-vampirism",
    cost: 60,
    evolution: { title: "Sete di Sangue", description: "Ogni uccisione cura 0.2 HP." },
  },
  {
    id: "engineering",
    title: "Ingegneria",
    stat: "potenza di torrette e mine",
    increment: 15,
    color: 0x2dd4bf,
    icon: "tome-engineering",
    cost: 80,
    evolution: { title: "Fabbrica Orbitale", description: "+1 torretta e le torrette sparano colpi doppi." },
  },
];

export const ITEMS: ItemDef[] = [
  {
    id: "splitter",
    title: "Camera Splitter",
    description: "Spari un proiettile in più a ventaglio.",
    perLevel: "+1 proiettile",
    color: 0xfacc15,
    icon: "item-splitter",
    cost: 0,
  },
  {
    id: "drone",
    title: "Drone Sentinella",
    description: "Un drone ti segue e spara al nemico più vicino.",
    perLevel: "+1 drone",
    color: 0xa78bfa,
    icon: "item-drone",
    cost: 0,
  },
  {
    id: "bulkhead",
    title: "Paratia Rinforzata",
    description: "Piastre extra sullo scafo. Cura subito.",
    perLevel: "+3 HP massimi",
    color: 0x2dd4bf,
    icon: "item-bulkhead",
    cost: 0,
  },
  {
    id: "turretSlot",
    title: "Hangar Torrette",
    description: "Puoi tenere attiva una torretta in più.",
    perLevel: "+1 torretta, +20% danno torrette",
    color: 0x38bdf8,
    icon: "item-turret",
    cost: 0,
  },
  {
    id: "mineSupply",
    title: "Scorta Mine",
    description: "Una mina in più e un'esplosione più ampia.",
    perLevel: "+1 mina, +15% raggio",
    color: 0xfb923c,
    icon: "item-mine",
    cost: 0,
  },
  {
    id: "bounce",
    title: "Proiettili Rimbalzanti",
    description: "I colpi rimbalzano sul nemico successivo.",
    perLevel: "+1 rimbalzo",
    color: 0x4ade80,
    icon: "item-bounce",
    cost: 70,
  },
  {
    id: "blades",
    title: "Lame Orbitanti",
    description: "Lame che ruotano attorno alla nave.",
    perLevel: "+1 lama, +danno",
    color: 0x7dd3fc,
    icon: "item-blades",
    cost: 90,
  },
  {
    id: "arc",
    title: "Arco Elettrico",
    description: "Un fulmine periodico che salta tra i nemici.",
    perLevel: "+1 salto, più frequente",
    color: 0xc4b5fd,
    icon: "item-arc",
    cost: 110,
  },
];

export const tomeById = (id: TomeId) => TOMES.find((tome) => tome.id === id)!;
export const itemById = (id: ItemId) => ITEMS.find((item) => item.id === id)!;

export const tomeLevel = (run: Run, id: TomeId) => run.tomes[id]?.level ?? 0;
export const tomeBonus = (run: Run, id: TomeId) => (run.tomes[id]?.bonus ?? 0) / 100;
export const itemLevel = (run: Run, id: ItemId) => run.items[id] ?? 0;
export const isEvolved = (run: Run, id: TomeId) => tomeLevel(run, id) >= LIMITS.tomeMaxLevel;

export const defaultLoadout = (): Stats => ({
  ...BASE_STATS,
  pierce: 0,
  bounce: 0,
  maxTurrets: DEPLOY.baseTurrets,
  maxMines: DEPLOY.baseMines,
  drones: 0,
  blades: 0,
  arc: 0,
  mineRadius: 1,
  spread: 0.15,
  aim: "auto",
});

/** Statistiche derivate: loadout base + tomi + oggetti. Niente stato duplicato. */
export const computeStats = (run: Run): Stats => {
  const base = run.base;
  const b = (id: TomeId) => tomeBonus(run, id);
  const i = (id: ItemId) => itemLevel(run, id);

  return {
    ...base,
    maxHp: base.maxHp * (1 + b("vitality")) + i("bulkhead") * 3,
    speed: base.speed * (1 + b("mobility")),
    damage: base.damage * (1 + b("power")),
    fireInterval: Math.max(70, base.fireInterval / (1 + b("cadence"))),
    pickupRadius: base.pickupRadius * (1 + b("magnetism")),
    projectiles: base.projectiles + i("splitter"),
    xpMult: base.xpMult * (1 + b("wisdom")),
    lifeSteal: base.lifeSteal + b("vampirism"),
    dashCooldown: base.dashCooldown / (1 + b("mobility")),
    deployPower: base.deployPower * (1 + b("engineering")) * (1 + i("turretSlot") * 0.2),
    pierce: base.pierce + (isEvolved(run, "power") ? 2 : 0),
    bounce: base.bounce + i("bounce"),
    maxTurrets: base.maxTurrets + i("turretSlot") + (isEvolved(run, "engineering") ? 1 : 0),
    maxMines: base.maxMines + i("mineSupply"),
    drones: base.drones + i("drone"),
    blades: base.blades + i("blades"),
    arc: base.arc + i("arc"),
    mineRadius: base.mineRadius * (1 + i("mineSupply") * 0.15),
  };
};

const rollRarity = (): Rarity =>
  pickWeighted(Object.keys(RARITIES) as Rarity[], (r) => RARITIES[r].weight) ?? "common";

/** Offerte di level-up: rispettano il limite di 4 tomi diversi per run. */
export const rollTomeOffers = (run: Run, unlocked: TomeId[]): TomeOffer[] => {
  const owned = Object.keys(run.tomes) as TomeId[];
  const canAddNew = owned.length < LIMITS.maxRunTomes;
  const pool = TOMES.filter((tome) => {
    if (!unlocked.includes(tome.id)) return false;
    if (tomeLevel(run, tome.id) >= LIMITS.tomeMaxLevel) return false;
    return owned.includes(tome.id) || canAddNew;
  });
  const count = isEvolved(run, "wisdom") ? 4 : 3;

  return pickUnique(pool, count).map((tome) => {
    const rarity = rollRarity();
    return { tome, rarity, value: tome.increment * RARITIES[rarity].multiplier };
  });
};

export const rollItem = (run: Run, unlocked: ItemId[]): ItemDef | undefined =>
  pickWeighted(
    ITEMS.filter((item) => unlocked.includes(item.id) && itemLevel(run, item.id) < LIMITS.itemMaxLevel),
    (item) => (item.id === "bulkhead" ? 0.7 : 1),
  );

export const DEFAULT_UNLOCKS: string[] = [
  ...TOMES.filter((tome) => tome.cost === 0).map((tome) => `tome:${tome.id}`),
  ...ITEMS.filter((item) => item.cost === 0).map((item) => `item:${item.id}`),
];
