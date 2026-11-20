import { icon } from "../../../art/svg";
import type { DifficultyId } from "../../../config";
import { RARITIES } from "../../../data/upgrades";
import type { Rarity } from "../../../types";
import { esc } from "../../../ui/dom";
import { hex } from "../../../utils";
import { affixLinesOf, describeGear, gearPower, mustGearDef, weaponDps, weaponSpec, type GearItem, type GearSlot } from "../gear";
import type { ShipSummary, SlotKey } from "../profile";

export type HubTab = "map" | "hangar" | "shop";

/** Stato dell'interfaccia dell'hub (non salvato). */
export interface HubState {
  tab: HubTab;
  /** Settore mostrato nella mappa (1 = settore fatto a mano). */
  sector: number;
  missionId: string;
  difficulty: DifficultyId;
  /** Categoria aperta in Hangar e Negozio. */
  cat: GearSlot;
  /** Slot di destinazione per "Monta" (uno slot della categoria aperta). */
  slot: SlotKey | null;
  /** Pezzo selezionato nell'hangar. */
  selected: number | null;
  /** Articolo del negozio in anteprima (id del catalogo oppure "offer:N"). */
  preview: string | null;
  /** Nel negozio: categoria del catalogo oppure le offerte del settore. */
  shopCat: GearSlot | "offers";
  confirm: string | null;
  feedback: string;
}

export const RARITY_ORDER: Rarity[] = ["legendary", "rare", "uncommon", "common"];
export const SLOT_ORDER: GearSlot[] = ["front", "rear", "missile", "bomb", "device", "hull"];

/** Categorie di Hangar e Negozio, nell'ordine della lista. */
export const CATEGORIES: { id: GearSlot; label: string; icon: Parameters<typeof icon>[0] }[] = [
  { id: "front", label: "Armi frontali", icon: "gear-blaster" },
  { id: "rear", label: "Armi di coda", icon: "gear-spread" },
  { id: "missile", label: "Missili", icon: "gear-missile" },
  { id: "bomb", label: "Bombe", icon: "gear-bomb" },
  { id: "device", label: "Dispositivi", icon: "gear-radiator" },
  { id: "hull", label: "Scafo", icon: "gear-hull" },
];

/** Riassunto in una riga delle statistiche di un pezzo (prime 3 voci). */
export const summaryLine = (item: GearItem) =>
  describeGear(item)
    .filter((l) => !l.startsWith("Item level") && !l.startsWith("Slot:"))
    .slice(0, 3)
    .join(" · ");

/** Riga di un pezzo nelle liste di Hangar e Negozio. */
export const itemRow = (
  item: GearItem,
  opts: { action: string; id?: string; selected?: boolean; tag?: string; delta?: string; side?: string; extra?: string },
) => {
  const def = mustGearDef(item.defId);
  const affixes = item.affixes?.length ? `<s class="hq-row__aff">${"◆".repeat(item.affixes.length)}</s>` : "";
  return `<div class="hq-row ${opts.selected ? "is-selected" : ""}" style="--c:${hex(def.color)};--r:${rarityColor(item)}" data-action="${opts.action}" ${opts.id ? `data-id="${opts.id}"` : ""} data-uid="${item.uid}">
    <span class="hq-row__icon">${icon(def.icon)}${item.uid >= 0 ? `<b>${item.level}</b>` : ""}</span>
    <span class="hq-row__body">
      <b>${esc(def.title)}${affixes}${item.fresh ? ` <em class="badge-new">NUOVO</em>` : ""}</b>
      <small><i style="color:var(--r)">${RARITIES[item.rarity].label}</i>${item.ilvl ? ` · iL ${item.ilvl}` : ""}${opts.tag ? ` · ${opts.tag}` : ""}</small>
      <span class="hq-row__stats">${esc(summaryLine(item))}</span>
      ${opts.delta ? `<span class="hq-row__delta">${opts.delta}</span>` : ""}
    </span>
    ${opts.side ? `<span class="hq-row__side">${opts.side}</span>` : ""}
    ${opts.extra ?? ""}
  </div>`;
};

export const SLOT_NAMES: Record<string, string> = {
  hull: "Scafo",
  front: "Frontale",
  rear: "Coda",
  missile: "Missili",
  bomb: "Bombe",
  device: "Dispositivo",
};

export const SLOT_ICONS: Record<string, Parameters<typeof icon>[0]> = {
  hull: "gear-hull",
  front: "gear-blaster",
  rear: "gear-blaster",
  missile: "gear-missile",
  bomb: "gear-bomb",
  device: "gear-radiator",
};

export const slotLabel = (key: SlotKey, short = false) => {
  const type = key === "hull" ? "hull" : key.replace(/\d+$/, "");
  const index = Number(key.replace(/\D/g, ""));
  const name = short && type === "device" ? "Disp." : SLOT_NAMES[type];
  return type === "front" || type === "device" ? `${name} ${index + 1}` : name;
};

export const rarityColor = (item: GearItem) => hex(RARITIES[item.rarity].color);

/** Tre stelle: piene per le difficoltà vinte, spente per le altre. */
export const starsHtml = (stars: number) => [1, 2, 3].map((n) => `<b class="${n <= stars ? "on" : ""}">★</b>`).join("");

/** Punteggio per ordinare per "potenza" in modo omogeneo fra tipi diversi. */
export const itemScore = (item: GearItem) => {
  const spec = weaponSpec(item);
  if (spec) return weaponDps(spec) * 10;
  return gearPower(item) * mustGearDef(item.defId).value;
};

/** Scheda statistiche della nave, con le differenze se c'è un'anteprima. */
export const statsPanel = (now: ShipSummary, next?: ShipSummary) => {
  const balance = now.sink - now.heat;
  const row = (label: string, iconId: Parameters<typeof icon>[0], key: keyof ShipSummary, digits = 1, higherIsBetter = true, unit = "") => {
    const value = now[key];
    const delta = next ? next[key] - value : 0;
    const good = higherIsBetter ? delta > 0 : delta < 0;
    const diff =
      next && Math.abs(delta) > 0.05
        ? `<em class="${good ? "is-up" : "is-down"}">${delta > 0 ? "▲" : "▼"} ${Math.abs(delta).toFixed(digits)}</em>`
        : "";
    return `<div class="hq-stat">${icon(iconId)}<span>${label}</span><b>${value.toFixed(digits)}${unit}</b>${diff}</div>`;
  };
  const heatRatio = now.sink > 0 ? Math.min(2, now.heat / now.sink) : 0;
  const nextBalance = next ? next.sink - next.heat : balance;
  return `
    <h3>${icon("gear-hull")} Nave</h3>
    ${row("HP", "heart", "hp")}
    ${now.shield > 0 || (next && next.shield > 0) ? row("Scudo", "shield", "shield") : ""}
    ${row("Danno/s", "tome-power", "dps")}
    ${row("Velocità", "tome-mobility", "speed", 0)}
    ${row("Raccolta", "tome-magnetism", "pickup", 0)}
    ${now.regen > 0 || (next && next.regen > 0) ? row("HP/s", "wrench", "regen", 2) : ""}
    <h3>${icon("heat")} Bilancio termico</h3>
    ${row("Calore/s", "heat", "heat", 0, false)}
    ${row("Dissipazione/s", "gear-radiator", "sink", 0)}
    ${row("Capacità", "gear-radiator", "cap", 0)}
    <div class="hq-heat ${balance < 0 ? "is-hot" : ""}">
      <div class="hq-heat__bar"><i style="width:${Math.min(100, heatRatio * 50)}%"></i><span></span></div>
      <small>${balance >= 0 ? "Fuoco continuo senza surriscaldarsi" : `Surriscalda in ~${Math.max(1, Math.round(now.cap / -balance))} s di fuoco continuo`}${next && Math.abs(nextBalance - balance) > 0.5 ? ` → ${nextBalance >= 0 ? "stabile" : `~${Math.max(1, Math.round(next.cap / -nextBalance))} s`}` : ""}</small>
    </div>`;
};

/** Righe di statistiche di un pezzo. */
export const gearLines = (item: GearItem) => {
  const affixes = affixLinesOf(item)
    .map((l) => `<li class="is-affix">${icon("star")} ${esc(l)}</li>`)
    .join("");
  return `<ul class="gear-stats">${describeGear(item).map((l) => `<li>${esc(l)}</li>`).join("")}${affixes}</ul>`;
};
