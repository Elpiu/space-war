import { ilvlMul } from "./gear";
import type { MissionDef } from "./missions";
import { hash2 } from "./sectors";

/** Contratti di missione: un obiettivo facoltativo per missione, con un bonus in monete. */
export type ContractId = "ground" | "elite" | "cool" | "combo" | "untouched" | "capsule";

export interface Contract {
  id: ContractId;
  goal: number;
  reward: number;
}

/** Contatori della missione in corso. */
export interface ContractStats {
  ground: number;
  elite: number;
  maxCombo: number;
  hits: number;
  overheated: boolean;
  capsule: boolean;
}

export const newContractStats = (): ContractStats => ({ ground: 0, elite: 0, maxCombo: 0, hits: 0, overheated: false, capsule: false });

const ORDER: ContractId[] = ["ground", "elite", "cool", "combo", "untouched", "capsule"];

const idHash = (id: string) => [...id].reduce((h, ch) => hash2(h, ch.charCodeAt(0)), 7);

/** Contratto deterministico della missione (sempre lo stesso per lo stesso id). */
export const contractFor = (m: MissionDef, capsuleFound: boolean): Contract => {
  const hasGround = m.segments.some((s) => s === "surface" || s === "cave" || s === "station");
  const pool = ORDER.filter((id) => (id !== "capsule" || (hasGround && !capsuleFound)) && (id !== "ground" || hasGround));
  const id = pool[idHash(m.id) % pool.length];
  const t = m.tier;
  const goal = id === "ground" ? 5 + t : id === "elite" ? 2 + Math.floor(t / 2) : id === "combo" ? 8 + t : id === "untouched" ? 3 + Math.floor(t / 2) : 1;
  return { id, goal, reward: Math.round(45 * t * ilvlMul(m.ilvl) * (m.elite ? 1.3 : 1)) };
};

export const contractLabel = (c: Contract) =>
  ({
    ground: `Distruggi ${c.goal} unità di terra`,
    elite: `Abbatti ${c.goal} élite`,
    cool: "Nessun surriscaldamento",
    combo: `Raggiungi una combo da ${c.goal}`,
    untouched: `Subisci al massimo ${c.goal} colpi`,
    capsule: "Trova la capsula segreta",
  })[c.id];

/** Stato del contratto: valore corrente e se è (ancora) rispettato. */
export const contractStatus = (c: Contract, s: ContractStats) => {
  switch (c.id) {
    case "ground":
      return { done: s.ground >= c.goal, text: `${Math.min(s.ground, c.goal)}/${c.goal}` };
    case "elite":
      return { done: s.elite >= c.goal, text: `${Math.min(s.elite, c.goal)}/${c.goal}` };
    case "combo":
      return { done: s.maxCombo >= c.goal, text: `migliore ${s.maxCombo}/${c.goal}` };
    case "cool":
      return { done: !s.overheated, text: s.overheated ? "surriscaldato" : "finora sì" };
    case "untouched":
      return { done: s.hits <= c.goal, text: `${s.hits}/${c.goal} colpi` };
    default:
      return { done: s.capsule, text: s.capsule ? "trovata" : "da trovare" };
  }
};
