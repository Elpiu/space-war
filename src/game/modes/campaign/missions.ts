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
  /** Posizione sulla mappa del settore, in percentuale. */
  x: number;
  y: number;
  /** Si sblocca completando almeno una di queste missioni. */
  requires: string[];
  /** Moltiplicatori di densità per asteroidi e nebulose. */
  asteroids: number;
  nebulas: number;
}

export const SECTOR = {
  id: "s1",
  title: "Fascia dei Rottami",
  subtitle: "Settore 1",
};

export const MISSIONS: MissionDef[] = [
  {
    id: "s1-1",
    code: "1-1",
    title: "Uscita dal porto",
    description: "Rotta breve fra i detriti del vecchio porto orbitale. Pochi nemici, ideale per provare l'equipaggiamento.",
    tier: 1,
    segments: ["surface", "debris", "open"],
    boss: false,
    x: 8,
    y: 62,
    requires: [],
    asteroids: 0.8,
    nebulas: 0.4,
  },
  {
    id: "s1-2",
    code: "1-2",
    title: "Cimitero di satelliti",
    description: "Sciami di satelliti impazziti. Tieni pronta un'arma ad area.",
    tier: 2,
    segments: ["debris", "open", "surface", "debris"],
    boss: false,
    x: 28,
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
    segments: ["open", "debris", "surface", "open"],
    boss: false,
    x: 50,
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
    x: 50,
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
    x: 72,
    y: 42,
    requires: ["s1-3a", "s1-3b"],
    asteroids: 1.2,
    nebulas: 1,
  },
  {
    id: "s1-5",
    code: "1-5",
    title: "Il Dreadnought",
    description: "In fondo al corridoio ti aspetta il Dreadnought. Abbattilo per liberare il settore.",
    tier: 5,
    segments: ["surface", "station", "cave", "boss"],
    boss: true,
    x: 92,
    y: 50,
    requires: ["s1-4"],
    asteroids: 0.8,
    nebulas: 0.8,
  },
];

export const missionById = (id: string) => MISSIONS.find((m) => m.id === id)!;
