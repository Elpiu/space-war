import { createRng, type Rng } from "../../utils";
import { ilvlMul } from "./gear";
import type { SegmentKind } from "./level";
import { MISSIONS, missionById, type MissionDef } from "./missions";

/**
 * Campagna infinita: dal settore 2 ogni settore è generato da un seed
 * deterministico (seed del profilo + numero del settore). Lo stesso profilo
 * rivede sempre lo stesso settore; un altro profilo ne vede uno diverso.
 *
 * Tecniche:
 * - grafo a strati (DAG) per la mappa a nodi;
 * - catena di Markov per la sequenza dei segmenti di una missione;
 * - curva di minaccia m(s) = 1 + 0.35·s^1.15 su HP e danni;
 * - densità logistica d(s) = 1 + 0.6 / (1 + e^(−0.6(s−4)));
 * - item level con rendimenti decrescenti: potenza × (1 + 0.1·√ilvl);
 * - biomi a rotazione (n mod 5) e mutatori dal settore 4.
 */

// ---------- Curve ----------

/** Numero di strati della mappa di un settore (l'ultimo è il boss). */
export const LAYERS = 6;

/** Progresso continuo nella campagna infinita: 0 all'inizio del settore 2. */
export const progressOf = (sector: number, layer: number) => Math.max(0, sector - 2 + layer / (LAYERS - 1));

/** Curva di minaccia: crescita appena più che lineare. */
export const threatOf = (s: number) => ({
  hp: 1 + 0.35 * s ** 1.15,
  damage: 1 + 0.2 * s ** 1.05,
});

/** Densità logistica: cresce e poi si stabilizza, lo schermo resta leggibile. */
export const densityOf = (s: number) => 1 + 0.6 / (1 + Math.exp(-0.6 * (s - 4)));

/** Item level del bottino: 0 nel settore 1, poi +10 per settore. */
export const ilvlOf = (sector: number, layer: number) => (sector <= 1 ? 0 : Math.round(10 * (sector - 1) + (10 * layer) / (LAYERS - 1)));

// ---------- Biomi ----------

export type BiomeId = "scrap" | "ice" | "toxic" | "corp" | "mines";

export interface Biome {
  id: BiomeId;
  name: string;
  description: string;
  /** Moltiplicatori di probabilità dei segmenti di arrivo nella catena di Markov. */
  bias: Partial<Record<SegmentKind, number>>;
  asteroids: number;
  nebulas: number;
  ground: number;
  /** Formazioni favorite (peso ×2.5). */
  favored: string[];
  palette: { fill: number; edge: number; vein: number; nebula: [number, number]; rock: [number, number] };
  places: string[];
}

export const BIOMES: Biome[] = [
  {
    id: "scrap",
    name: "Discarica Orbitale",
    description: "Rottami a perdita d'occhio e sciami che si dividono.",
    bias: { debris: 1.8, open: 1.3 },
    asteroids: 1.4,
    nebulas: 0.6,
    ground: 1,
    favored: ["sine-swarm", "splitters", "convoy", "chaser-pack"],
    palette: { fill: 0x1c1917, edge: 0xf59e0b, vein: 0x44403c, nebula: [0x7c3aed, 0xdb2777], rock: [0x44403c, 0x57534e] },
    places: ["Cimitero di cargo", "Ammasso di lamiere", "Pozzo dei relitti", "Deriva dei container", "Ferrovecchio", "Rottamaio sospeso", "Banchina fantasma", "Valle delle carcasse"],
  },
  {
    id: "ice",
    name: "Anelli di Ghiaccio",
    description: "Blocchi di ghiaccio ovunque: corridoi stretti e cecchini nascosti.",
    bias: { debris: 1.6, cave: 1.6, station: 0.6 },
    asteroids: 2.1,
    nebulas: 0.5,
    ground: 0.9,
    favored: ["sniper-post", "laser-post", "interceptor-wing", "shield-wall"],
    palette: { fill: 0x0c1a2b, edge: 0x7dd3fc, vein: 0x1e3a5f, nebula: [0x0ea5e9, 0x67e8f9], rock: [0x5b7a99, 0x93b4d1] },
    places: ["Anello esterno", "Grotte di brina", "Faglia cristallina", "Lago gelato", "Specchio di ghiaccio", "Crepaccio blu", "Cometa spezzata", "Tundra orbitale"],
  },
  {
    id: "toxic",
    name: "Nebulosa Tossica",
    description: "Le nebulose qui corrodono lo scafo: restarci dentro costa HP.",
    bias: { open: 1.6, cave: 1.4 },
    asteroids: 0.7,
    nebulas: 2.4,
    ground: 0.8,
    favored: ["phantoms", "emp-raid", "zigzag-line", "dive"],
    palette: { fill: 0x14200f, edge: 0x84cc16, vein: 0x365314, nebula: [0x4d7c0f, 0xa3e635], rock: [0x3f4a2a, 0x556b2f] },
    places: ["Palude di gas", "Bolla acida", "Nube verde", "Fumarole", "Velo corrosivo", "Banco di spore", "Estuario tossico", "Occhio della nebbia"],
  },
  {
    id: "corp",
    name: "Cantieri Corporate",
    description: "Stazioni, cartelloni e torrette: la sicurezza privata non scherza.",
    bias: { station: 2, surface: 1.6, debris: 0.6 },
    asteroids: 0.7,
    nebulas: 0.6,
    ground: 1.35,
    favored: ["gunline", "missile-battery", "repair-squad", "shield-escort"],
    palette: { fill: 0x1a1025, edge: 0xf472b6, vein: 0x4a1d3f, nebula: [0xdb2777, 0x8b5cf6], rock: [0x3b3450, 0x51476b] },
    places: ["Molo 7", "Distretto logistico", "Piattaforma di lancio", "Fabbrica di droni", "Torre del marketing", "Deposito franchigia", "Hangar azionisti", "Varco doganale"],
  },
  {
    id: "mines",
    name: "Campo Minato",
    description: "Kamikaze, pozzi gravitazionali e mine vaganti: occhio a dove ti fermi.",
    bias: { open: 1.5, debris: 1.4, station: 0.7 },
    asteroids: 1.2,
    nebulas: 0.8,
    ground: 1,
    favored: ["kamikaze-rain", "gravity-trap", "bomber-run", "blinkers"],
    palette: { fill: 0x1f0f0f, edge: 0xef4444, vein: 0x4c1d1d, nebula: [0x991b1b, 0xf97316], rock: [0x4a3535, 0x634545] },
    places: ["Zona rossa", "Linea delle mine", "Varco detonante", "Fronte bruciato", "Trincea orbitale", "Corridoio a scoppio", "Settore interdetto", "Pianura dei crateri"],
  },
];

export const biomeOf = (sector: number) => BIOMES[(((sector - 2) % BIOMES.length) + BIOMES.length) % BIOMES.length];

// ---------- Mutatori ----------

export type MutatorId = "armored" | "fog" | "heat" | "loot" | "elite" | "swift";

export const MUTATORS: Record<MutatorId, { label: string; text: string; reward: number }> = {
  armored: { label: "Corazze pesanti", text: "Nemici +30% HP", reward: 0.25 },
  fog: { label: "Nebbia densa", text: "I nemici lontani si vedono appena", reward: 0.2 },
  heat: { label: "Calore +20%", text: "Le armi dissipano meno", reward: 0.2 },
  loot: { label: "Bottino doppio", text: "Casse doppie, nemici +15% danno", reward: 0 },
  elite: { label: "Ondata élite", text: "Élite molto più frequenti", reward: 0.3 },
  swift: { label: "Nemici rapidi", text: "Nemici +20% velocità", reward: 0.2 },
};
const MUTATOR_IDS = Object.keys(MUTATORS) as MutatorId[];

/** Moltiplicatore delle ricompense in monete dato dai mutatori. */
export const mutatorReward = (list: MutatorId[] = []) => list.reduce((m, id) => m * (1 + MUTATORS[id].reward), 1);

// ---------- Catena di Markov dei segmenti ----------

type Kind = Exclude<SegmentKind, "boss">;
const KINDS: Kind[] = ["open", "debris", "surface", "cave", "station"];

/** Probabilità di transizione: righe = segmento attuale, colonne = successivo. */
const TRANSITIONS: Record<Kind, number[]> = {
  open: [0.1, 0.3, 0.3, 0.15, 0.15],
  debris: [0.25, 0.1, 0.25, 0.25, 0.15],
  surface: [0.15, 0.2, 0.1, 0.3, 0.25],
  cave: [0.15, 0.15, 0.2, 0.1, 0.4],
  station: [0.25, 0.2, 0.25, 0.25, 0.05],
};

const weighted = <T>(items: T[], weights: number[], rng: Rng) => {
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = rng() * total;
  for (let i = 0; i < items.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
};

export const markovSegments = (count: number, biome: Biome, rng: Rng): Kind[] => {
  const bias = (k: Kind) => biome.bias[k] ?? 1;
  let current = weighted(KINDS, KINDS.map(bias), rng);
  const out: Kind[] = [current];
  while (out.length < count) {
    current = weighted(KINDS, TRANSITIONS[current].map((p, i) => p * bias(KINDS[i])), rng);
    out.push(current);
  }
  return out;
};

// ---------- Mappa a nodi ----------

export type NodeKind = "mission" | "elite" | "shipyard" | "event" | "treasure" | "boss";

export const NODE_KINDS: Record<NodeKind, { label: string; icon: "flag" | "skull" | "wrench" | "event" | "crate" | "boss" }> = {
  mission: { label: "Missione", icon: "flag" },
  elite: { label: "Élite", icon: "skull" },
  shipyard: { label: "Cantiere", icon: "wrench" },
  event: { label: "Evento", icon: "event" },
  treasure: { label: "Tesoro", icon: "crate" },
  boss: { label: "Boss", icon: "boss" },
};

export const isCombat = (kind: NodeKind) => kind === "mission" || kind === "elite" || kind === "boss";

export type EventId = "derelict" | "smuggler" | "distress" | "lab";

export interface SectorNode {
  id: string;
  sector: number;
  layer: number;
  index: number;
  kind: NodeKind;
  /** Posizione sulla mappa, in percentuale. */
  x: number;
  y: number;
  next: string[];
  prev: string[];
  ilvl: number;
  /** Solo nodi di combattimento. */
  mission?: MissionDef;
  /** Solo nodi evento. */
  event?: EventId;
}

export interface Sector {
  n: number;
  biome: Biome;
  title: string;
  layers: SectorNode[][];
  nodes: Map<string, SectorNode>;
}

/** Hash intero a 32 bit di due numeri (mescolamento tipo murmur). */
export const hash2 = (a: number, b: number) => {
  let h = (a ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (b + 0x7f4a7c15), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
};

const EVENTS: EventId[] = ["derelict", "smuggler", "distress", "lab"];

const pickKind = (layer: number, nonCombatUsed: boolean, rng: Rng): NodeKind => {
  const options: NodeKind[] = ["mission", "elite", "shipyard", "event", "treasure"];
  const weights = [
    40,
    layer >= 2 ? 16 : 0,
    !nonCombatUsed && layer >= 2 ? 14 : 0,
    !nonCombatUsed ? 22 : 0,
    !nonCombatUsed && layer >= 1 ? 11 : 0,
  ];
  return weighted(options, weights, rng);
};

const cache = new Map<string, Sector>();

/** Genera (o recupera dalla cache) il settore n per un profilo. */
export const generateSector = (profileSeed: number, n: number): Sector => {
  const key = `${profileSeed}:${n}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const rng = createRng(hash2(profileSeed, n));
  const biome = biomeOf(n);
  const usedPlaces = new Set<string>();
  const place = () => {
    const free = biome.places.filter((p) => !usedPlaces.has(p));
    const name = free[Math.floor(rng() * free.length)] ?? biome.places[0];
    usedPlaces.add(name);
    return name;
  };

  // Strati: 2 nodi al primo, 2-3 nel mezzo, 1 (boss) all'ultimo.
  const layers: SectorNode[][] = [];
  for (let layer = 0; layer < LAYERS; layer += 1) {
    const count = layer === LAYERS - 1 ? 1 : layer === 0 ? 2 : rng() < 0.55 ? 3 : 2;
    const row: SectorNode[] = [];
    let nonCombatUsed = false;
    for (let index = 0; index < count; index += 1) {
      const kind: NodeKind = layer === LAYERS - 1 ? "boss" : layer === 0 ? "mission" : pickKind(layer, nonCombatUsed, rng);
      if (!isCombat(kind)) nonCombatUsed = true;
      const x = 6 + (layer / (LAYERS - 1)) * 86;
      const y = count === 1 ? 50 : 18 + (index / (count - 1)) * 64 + (rng() - 0.5) * 8;
      row.push({ id: `g${n}-${layer}-${index}`, sector: n, layer, index, kind, x, y, next: [], prev: [], ilvl: ilvlOf(n, layer) });
    }
    // L'ultimo strato prima del boss offre sempre un cantiere se ha 3 nodi.
    if (layer === LAYERS - 2 && row.length === 3 && !row.some((r) => r.kind === "shipyard")) row[1].kind = "shipyard";
    layers.push(row);
  }

  // Archi solo verso nodi vicini (posizione normalizzata nello strato).
  for (let layer = 0; layer < LAYERS - 1; layer += 1) {
    const from = layers[layer];
    const to = layers[layer + 1];
    const pos = (i: number, len: number) => (len === 1 ? 0.5 : i / (len - 1));
    const link = (a: SectorNode, b: SectorNode) => {
      if (a.next.includes(b.id)) return;
      a.next.push(b.id);
      b.prev.push(a.id);
    };
    for (const a of from) {
      for (const b of to) {
        const d = Math.abs(pos(a.index, from.length) - pos(b.index, to.length));
        if (to.length === 1 || (from.length !== to.length ? d <= 0.5 + 1e-6 : d < 1e-6)) link(a, b);
      }
    }
    // Strati della stessa ampiezza: un incrocio casuale per dare scelta.
    if (from.length === to.length && to.length > 1) {
      const i = Math.floor(rng() * (from.length - 1));
      if (rng() < 0.5) link(from[i], to[i + 1]);
      else link(from[i + 1], to[i]);
    }
    for (const b of to) if (b.prev.length === 0) link(from[Math.min(from.length - 1, b.index)], b);
  }

  // Mai due nodi senza combattimento in fila: nessuna rotta salta tutti gli scontri.
  for (const row of layers) {
    for (const node of row) {
      if (isCombat(node.kind)) continue;
      const after = node.next.map((id) => layers[node.layer + 1].find((o) => o.id === id)!);
      for (const b of after) if (!isCombat(b.kind)) b.kind = "mission";
    }
  }

  // Contenuti: missioni con segmenti dalla catena di Markov, eventi, mutatori.
  for (const row of layers) {
    for (const node of row) {
      if (node.kind === "event") node.event = EVENTS[Math.floor(rng() * EVENTS.length)];
      if (!isCombat(node.kind)) continue;
      const s = progressOf(n, node.layer);
      const segCount = node.kind === "boss" ? 3 : 3 + Math.floor(node.layer / 2) + (rng() < 0.3 ? 1 : 0);
      const segments: SegmentKind[] = markovSegments(segCount, biome, rng);
      if (node.kind === "boss") segments.push("boss");
      const mutators: MutatorId[] = [];
      if (n >= 4 && node.kind !== "boss") {
        const count = n >= 7 && rng() < 0.5 ? 2 : 1;
        while (mutators.length < count) {
          const m = MUTATOR_IDS[Math.floor(rng() * MUTATOR_IDS.length)];
          if (!mutators.includes(m)) mutators.push(m);
        }
      }
      const elite = node.kind === "elite";
      const threat = threatOf(s);
      const title = node.kind === "boss" ? `Cuore di ${biome.name}` : place();
      node.mission = {
        id: node.id,
        code: `${n}-${node.layer + 1}`,
        title,
        description:
          node.kind === "boss"
            ? `Il guardiano del settore ${n} difende l'uscita. Abbattilo per aprire il settore ${n + 1}.`
            : `${biome.description}${elite ? " Squadre élite di scorta: bottino migliore." : ""}`,
        tier: 5,
        segments,
        boss: node.kind === "boss",
        miniBoss: elite ? 0.5 + rng() * 0.2 : node.layer >= 2 && rng() < 0.45 ? 0.5 + rng() * 0.25 : undefined,
        x: node.x,
        y: node.y,
        requires: node.prev,
        asteroids: biome.asteroids * (0.8 + rng() * 0.4),
        nebulas: biome.nebulas * (0.8 + rng() * 0.4),
        sector: n,
        layer: node.layer,
        elite,
        biome: biome.id,
        mutators,
        ilvl: node.ilvl,
        threat: { hp: threat.hp * (elite ? 1.25 : 1), damage: threat.damage },
        density: densityOf(s),
        ground: biome.ground,
        palette: biome.palette,
      };
    }
  }

  const nodes = new Map(layers.flat().map((node) => [node.id, node]));
  const sector: Sector = { n, biome, title: biome.name, layers, nodes };
  cache.set(key, sector);
  return sector;
};

/** Settore di un id missione: 1 per le missioni fatte a mano, n per "g{n}-…". */
export const sectorOfId = (id: string) => {
  const m = /^g(\d+)-/.exec(id);
  return m ? Number(m[1]) : 1;
};

export const nodeById = (profileSeed: number, id: string) => generateSector(profileSeed, sectorOfId(id)).nodes.get(id);

/** Missione da id: fatta a mano (settore 1) o generata. */
export const resolveMission = (profileSeed: number, id: string): MissionDef => {
  if (sectorOfId(id) === 1) return missionById(id) ?? MISSIONS[0];
  return nodeById(profileSeed, id)?.mission ?? MISSIONS[0];
};

/**
 * Un nodo si può scegliere se è già stato completato (si rigioca) oppure se
 * il suo strato non ha ancora un nodo completato e un predecessore sì: la
 * scelta di un ramo chiude gli altri dello stesso strato.
 */
export const nodeState = (sector: Sector, node: SectorNode, completed: Set<string>): "done" | "open" | "locked" | "skipped" => {
  if (completed.has(node.id)) return "done";
  const row = sector.layers[node.layer];
  if (row.some((o) => completed.has(o.id))) return "skipped";
  if (node.layer === 0 || node.prev.some((id) => completed.has(id))) return "open";
  return "locked";
};

/** Monete di riferimento di un evento, proporzionate all'item level. */
export const eventCoins = (node: SectorNode) => Math.round(60 * ilvlMul(node.ilvl) * (1 + 0.15 * Math.max(0, node.sector - 2)));
