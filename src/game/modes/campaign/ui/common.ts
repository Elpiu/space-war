import { icon } from "../../../art/svg";
import type { DifficultyId } from "../../../config";
import { RARITIES } from "../../../data/upgrades";
import type { Rarity } from "../../../types";
import { esc } from "../../../ui/dom";
import { hex } from "../../../utils";
import { affixLinesOf, describeGear, gearPower, mustGearDef, weaponDps, weaponSpec, type GearItem, type GearSlot } from "../gear";
import type { ShipSummary, SlotKey } from "../profile";

export type HubTab = "map" | "hangar" | "shop" | "workshop";

/** Stato dell'interfaccia dell'hub (non salvato). */
export interface HubState {
  tab: HubTab;
  /** Settore mostrato nella mappa (1 = settore fatto a mano). */
  sector: number;
  missionId: string;
  difficulty: DifficultyId;
  /** Presa selezionata nello schema della nave. */
  slot: SlotKey | null;
  /** Pezzo selezionato (inventario, officina). */
  selected: number | null;
  /** Pezzo del negozio in anteprima. */
  preview: string | null;
  filter: { type: GearSlot | "all"; rarity: Rarity | "all"; fresh: boolean };
  sort: "power" | "level" | "rarity" | "type";
  multi: boolean;
  picked: Set<number>;
  confirm: string | null;
  feedback: string;
}

export const RARITY_ORDER: Rarity[] = ["legendary", "rare", "uncommon", "common"];
export const SLOT_ORDER: GearSlot[] = ["front", "rear", "missile", "bomb", "device", "hull"];

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

export const gearTile = (item: GearItem, opts: { selected?: boolean; equipped?: boolean; picked?: boolean; multi?: boolean } = {}) => {
  const def = mustGearDef(item.defId);
  return `<button class="hq-tile ${opts.selected ? "is-selected" : ""} ${opts.picked ? "is-picked" : ""}" style="--c:${hex(def.color)};--r:${rarityColor(item)}" data-action="item" data-uid="${item.uid}" title="${esc(def.title)} · ${RARITIES[item.rarity].label} · Liv. ${item.level}${item.ilvl ? ` · iL ${item.ilvl}` : ""}${affixLinesOf(item).map((l) => ` · ${esc(l)}`).join("")}">
    ${icon(def.icon)}<b>${item.level}</b>
    ${opts.equipped ? `<i class="hq-tile__on">${icon("check")}</i>` : ""}
    ${item.locked ? `<i class="hq-tile__lock">${icon("lock")}</i>` : ""}
    ${item.fresh ? `<em class="badge-new">NUOVO</em>` : ""}
    ${item.affixes?.length ? `<s class="hq-tile__aff">${"◆".repeat(item.affixes.length)}</s>` : ""}
    ${opts.multi ? `<span class="hq-tile__check">${opts.picked ? icon("check") : ""}</span>` : ""}
  </button>`;
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
