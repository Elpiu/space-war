import type { EnemyId } from "../../types";
import type { SegmentKind } from "./level";

export interface MissionDef {
  id: string;
  code: string;
  title: string;
  description: string;
  /** Livello di minaccia 1-5: scala nemici, bottino e ricompense. */
  tier: number;
  /** Sequenza dei segmenti del percorso (prima c'è sempre un tratto aperto). */
  segments: SegmentKind[];
  boss: boolean;
  /** Frazione del percorso a cui compare la Cannoniera (mini-boss). */
  miniBoss?: number;
  /** Posizione sulla mappa del settore, in percentuale. */
  x: number;
  y: number;
  /** Si sblocca completando almeno una di queste missioni. */
  requires: string[];
  /** Moltiplicatori di densità per asteroidi e nebulose. */
  asteroids: number;
  nebulas: number;
  // ---- Solo missioni generate (settore 2 in poi) ----
  sector?: number;
  layer?: number;
  elite?: boolean;
  biome?: string;
  mutators?: ("armored" | "fog" | "heat" | "loot" | "elite" | "swift")[];
  /** Item level del bottino. */
  ilvl?: number;
  /** Moltiplicatori dei nemici dalla curva di minaccia. */
  threat?: { hp: number; damage: number };
  /** Densità di spawn dalla curva logistica. */
  density?: number;
  /** Densità delle unità di terra. */
  ground?: number;
  palette?: { fill: number; edge: number; vein: number; nebula: [number, number]; rock: [number, number] };
  /** Boss di fine percorso (default Dreadnought) e sue fasi extra. */
  bossId?: EnemyId;
  bossTier?: number;
  /** Mini-boss lungo il percorso (default Cannoniera). */
  miniBossId?: EnemyId;
}

export const SECTOR = {
  id: "s1",
  title: "Fascia dei Rottami",
  subtitle: "Settore 1",
};

// Gli id restano quelli dei salvataggi precedenti; codici e posizioni sono solo grafica.
export const MISSIONS: MissionDef[] = [
  {
    id: "s1-1",
    code: "1-1",
    title: "Uscita dal porto",
    description: "Rotta breve fra i detriti del vecchio porto orbitale. Pochi nemici, ideale per provare l'equipaggiamento.",
    tier: 1,
    segments: ["surface", "debris", "open"],
    boss: false,
    x: 5,
    y: 62,
    requires: [],
    asteroids: 0.8,
    nebulas: 0.4,
  },
  {
    id: "s1-2",
    code: "1-2",
    title: "Cimitero di satelliti",
    description: "Sciami di satelliti impazziti e i primi convogli corporate. Tieni pronta un'arma ad area.",
    tier: 2,
    segments: ["debris", "open", "surface", "debris"],
    boss: false,
    x: 20,
    y: 40,
    requires: ["s1-1"],
    asteroids: 1,
    nebulas: 0.6,
  },
  {
    id: "s1-3a",
    code: "1-3",
    title: "Nebulosa Vela",
    description: "Le nebulose rallentano tutti: chi ha più gittata vince.",
    tier: 3,
    segments: ["open", "debris", "surface", "open", "surface"],
    boss: false,
    miniBoss: 0.62,
    x: 36,
    y: 20,
    requires: ["s1-2"],
    asteroids: 0.6,
    nebulas: 2.2,
  },
  {
    id: "s1-3b",
    code: "1-3",
    title: "Campo di asteroidi",
    description: "Corridoi stretti fra le rocce: occhio alle cariche degli Assaltatori.",
    tier: 3,
    segments: ["debris", "cave", "debris", "surface"],
    boss: false,
    miniBoss: 0.7,
    x: 36,
    y: 64,
    requires: ["s1-2"],
    asteroids: 2,
    nebulas: 0.3,
  },
  {
    id: "s1-4",
    code: "1-4",
    title: "Linea di blocco",
    description: "La flotta Remnant presidia il passaggio. Elite frequenti, bottino migliore.",
    tier: 4,
    segments: ["surface", "cave", "station", "surface"],
    boss: false,
    miniBoss: 0.55,
    x: 54,
    y: 42,
    requires: ["s1-3a", "s1-3b"],
    asteroids: 1.2,
    nebulas: 1,
  },
  {
    id: "s1-6",
    code: "1-5",
    title: "Cantiere navale",
    description: "Scheletri di navi in costruzione e torrette ovunque. Il perforabunker qui fa miracoli.",
    tier: 4,
    segments: ["surface", "station", "debris", "surface", "station"],
    boss: false,
    miniBoss: 0.75,
    x: 72,
    y: 24,
    requires: ["s1-4"],
    asteroids: 1,
    nebulas: 0.5,
  },
  {
    id: "s1-7",
    code: "1-5",
    title: "Relitto della stazione",
    description: "Una stazione abbandonata piena di cunicoli. Si dice nasconda una capsula preziosa.",
    tier: 4,
    segments: ["station", "cave", "station", "cave", "open"],
    boss: false,
    miniBoss: 0.5,
    x: 72,
    y: 66,
    requires: ["s1-4"],
    asteroids: 0.6,
    nebulas: 0.8,
  },
  {
    id: "s1-5",
    code: "1-6",
    title: "Il Dreadnought",
    description: "In fondo al corridoio ti aspetta il Dreadnought. Abbattilo per liberare il settore.",
    tier: 5,
    segments: ["surface", "station", "cave", "boss"],
    boss: true,
    x: 92,
    y: 46,
    requires: ["s1-6", "s1-7"],
    asteroids: 0.8,
    nebulas: 0.8,
  },
];

export const missionById = (id: string) => MISSIONS.find((m) => m.id === id);
