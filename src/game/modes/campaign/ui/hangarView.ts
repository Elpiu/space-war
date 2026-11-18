import { icon } from "../../../art/svg";
import { RARITIES } from "../../../data/upgrades";
import type { Rarity } from "../../../types";
import { esc } from "../../../ui/dom";
import { hex } from "../../../utils";
import { SLOT_LABELS, milestonesOf, mustGearDef, sellPrice, type GearItem, type GearSlot } from "../gear";
import {
  canUnequip,
  equippedHull,
  equippedSlotOf,
  isSellable,
  itemByUid,
  simulateEquip,
  slotKeys,
  slotType,
  summarize,
  type CampaignProfile,
  type ShipSummary,
  type SlotKey,
} from "../profile";
import { hullSvg, socketPosition } from "../schematic";
import {
  RARITY_ORDER,
  SLOT_ICONS,
  SLOT_NAMES,
  SLOT_ORDER,
  gearLines,
  gearTile,
  itemScore,
  slotLabel,
  statsPanel,
  type HubState,
} from "./common";

/** Differenze principali fra la nave attuale e quella con il pezzo montato. */
const deltaText = (now: ShipSummary, next: ShipSummary) => {
  const parts: string[] = [];
  const add = (label: string, key: keyof ShipSummary, digits: number, higherIsBetter = true) => {
    const d = next[key] - now[key];
    if (Math.abs(d) < 0.05) return;
    const good = higherIsBetter ? d > 0 : d < 0;
    parts.push(`<em class="${good ? "is-up" : "is-down"}">${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(digits)} ${label}</em>`);
  };
  add("danno/s", "dps", 1);
  add("calore/s", "heat", 0, false);
  add("HP", "hp", 1);
  add("scudo", "shield", 1);
  add("vel.", "speed", 0);
  add("dissip.", "sink", 0);
  add("raccolta", "pickup", 0);
  return parts.length ? parts.slice(0, 3).join(" ") : `<em>nessuna differenza</em>`;
};

const socket = (profile: CampaignProfile, key: SlotKey, selected: boolean, counts: Record<string, number>) => {
  const pos = socketPosition(key, counts);
  const item = itemByUid(profile, profile.equipped[key]);
  const type = slotType(key);
  const def = item ? mustGearDef(item.defId) : undefined;
  const weapon = type === "front" || type === "rear" || type === "missile";
  const fp = (which: 2 | 3) =>
    `<i class="hq-fp ${profile.fireProfiles[which].includes(key) ? "is-on" : ""}" data-action="fp" data-id="${which}:${key}" title="Attiva nel profilo di fuoco ${which}">${which}</i>`;
  return `<div class="hq-socket ${selected ? "is-selected" : ""} ${item ? "" : "is-empty"} hq-socket--${type}" style="left:${pos.x}%;top:${pos.y}%;--c:${def ? hex(def.color) : "#64748b"};--r:${item ? hex(RARITIES[item.rarity].color) : "#334155"}">
    <button class="hq-socket__btn" data-action="slot" data-id="${key}" title="${esc(def ? def.title : slotLabel(key))}">
      ${icon(def ? def.icon : SLOT_ICONS[type])}${item ? `<b>${item.level}</b>` : ""}
    </button>
    <span class="hq-socket__label">${slotLabel(key, true)}</span>
    ${weapon && item ? `<span class="hq-socket__fp">${fp(2)}${fp(3)}</span>` : ""}
  </div>`;
};

/** Pannello destro: cosa c'è nella presa e cosa ci si può montare. */
const slotPanel = (profile: CampaignProfile, state: HubState, now: ShipSummary) => {
  const key = state.slot;
  if (!key) {
    return `<h3>${icon("wrench")} Slot</h3><p class="muted">Clicca una presa sullo schema per vedere cosa ci puoi montare.</p>`;
  }
  const type = slotType(key) as GearSlot;
  const mounted = itemByUid(profile, profile.equipped[key]);
  const candidates = profile.inventory
    .filter((i) => mustGearDef(i.defId).slot === type && i.uid !== mounted?.uid)
    .sort((a, b) => itemScore(b) - itemScore(a));

  const mountedCard = mounted
    ? (() => {
        const def = mustGearDef(mounted.defId);
        const ms = milestonesOf(mounted)
          .map((m) => `<li class="${m.reached ? "is-reached" : ""}">${icon(m.reached ? "check" : "lock")} Liv. ${m.level}: ${esc(m.text)}</li>`)
          .join("");
        return `<div class="hq-mounted" style="--c:${hex(def.color)};--r:${hex(RARITIES[mounted.rarity].color)}">
          <div class="gear-detail"><span class="gear-detail__icon">${icon(def.icon)}</span>
            <div><small style="color:var(--r)">${RARITIES[mounted.rarity].label} · ${SLOT_LABELS[def.slot]}</small><h3>${esc(def.title)} <em>Liv. ${mounted.level}</em></h3></div></div>
          ${gearLines(mounted)}
          ${ms ? `<ul class="gear-milestones">${ms}</ul>` : ""}
          <div class="gear-actions">
            ${canUnequip(profile, key) ? `<button class="btn btn--small" data-action="unequip" data-id="${key}">Rimuovi</button>` : ""}
            <button class="btn btn--small" data-action="tab-workshop" data-uid="${mounted.uid}">${icon("arrow-up")} Officina</button>
          </div>
        </div>`;
      })()
    : `<p class="muted">Slot vuoto.</p>`;

  const rows = candidates
    .map((item) => {
      const def = mustGearDef(item.defId);
      const next = summarize(simulateEquip(profile, key, item.uid));
      const where = equippedSlotOf(profile, item.uid);
      return `<div class="hq-cand" data-hover="${item.uid}" style="--c:${hex(def.color)};--r:${hex(RARITIES[item.rarity].color)}">
        <span class="hq-cand__icon">${icon(def.icon)}<b>${item.level}</b></span>
        <span class="hq-cand__body"><b>${esc(def.title)}${item.fresh ? ` <em class="badge-new">NUOVO</em>` : ""}</b>
          <small style="color:var(--r)">${RARITIES[item.rarity].label}${where ? ` · montato in ${slotLabel(where)}` : ""}</small>
          <span class="hq-cand__delta">${deltaText(now, next)}</span></span>
        <button class="btn btn--small" data-action="equip-to" data-uid="${item.uid}" data-id="${key}">Monta</button>
      </div>`;
    })
    .join("");
  return `<h3>${icon(SLOT_ICONS[type])} ${slotLabel(key)}</h3>
    ${mountedCard}
    <h3 class="hq-sub">${icon("crate")} Compatibili · ${candidates.length}</h3>
    <div class="hq-cands">${rows || `<p class="muted">Nessun pezzo di questo tipo: cercane nel negozio o nel bottino.</p>`}</div>`;
};

export const filteredInventory = (profile: CampaignProfile, state: HubState) => {
  const f = state.filter;
  const list = profile.inventory.filter((i) => {
    const def = mustGearDef(i.defId);
    if (f.type !== "all" && def.slot !== f.type) return false;
    if (f.rarity !== "all" && i.rarity !== f.rarity) return false;
    if (f.fresh && !i.fresh) return false;
    return true;
  });
  const by = {
    power: (a: GearItem, b: GearItem) => itemScore(b) - itemScore(a),
    level: (a: GearItem, b: GearItem) => b.level - a.level,
    rarity: (a: GearItem, b: GearItem) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity),
    type: (a: GearItem, b: GearItem) => SLOT_ORDER.indexOf(mustGearDef(a.defId).slot) - SLOT_ORDER.indexOf(mustGearDef(b.defId).slot),
  }[state.sort];
  return list.sort((a, b) => by(a, b) || itemScore(b) - itemScore(a));
};

/** Barra filtri + griglia dell'inventario, condivisa da Hangar e Officina. */
export const inventoryPanel = (profile: CampaignProfile, state: HubState) => {
  const items = filteredInventory(profile, state);
  const typeChips = (["all", ...SLOT_ORDER] as const)
    .map((t) => `<button class="hq-filter ${state.filter.type === t ? "is-on" : ""}" data-action="filter-type" data-id="${t}">${t === "all" ? "Tutti" : SLOT_NAMES[t]}</button>`)
    .join("");
  const rarityChips = (["all", ...RARITY_ORDER] as const)
    .map(
      (r) =>
        `<button class="hq-filter ${state.filter.rarity === r ? "is-on" : ""}" data-action="filter-rarity" data-id="${r}" ${r !== "all" ? `style="--c:${hex(RARITIES[r as Rarity].color)}"` : ""}>${r === "all" ? "Ogni rarità" : RARITIES[r as Rarity].label}</button>`,
    )
    .join("");
  const picked = profile.inventory.filter((i) => state.picked.has(i.uid) && isSellable(profile, i));
  const pickedValue = picked.reduce((sum, i) => sum + sellPrice(i), 0);
  const multiBar = state.multi
    ? `<div class="hq-multi">
        <span>${state.picked.size} selezionati</span>
        <button class="btn btn--small ${state.confirm === "sell-many" ? "btn--danger" : ""}" data-action="sell-many" ${picked.length ? "" : "disabled"}>${icon("coin")} ${state.confirm === "sell-many" ? `Conferma: vendi ${picked.length} per ${pickedValue}` : `Vendi ${picked.length} (+${pickedValue})`}</button>
        <button class="btn btn--small" data-action="lock-many" ${state.picked.size ? "" : "disabled"}>${icon("lock")} Blocca/sblocca</button>
        <button class="btn btn--small" data-action="pick-all">Seleziona visibili</button>
        <button class="btn btn--small btn--ghost" data-action="multi">Fine</button>
      </div>`
    : "";
  const equipped = new Set(Object.values(profile.equipped));
  return `<section class="panel hq-inv">
    <div class="hq-inv__bar">
      <h3>${icon("crate")} Inventario · ${profile.inventory.length}</h3>
      <div class="hq-filters">${typeChips}</div>
      <div class="hq-filters">${rarityChips}
        <button class="hq-filter ${state.filter.fresh ? "is-on" : ""}" data-action="filter-fresh">Solo nuovi</button>
      </div>
      <label class="hq-sort">Ordina
        <select data-action="sort">
          ${(["power", "level", "rarity", "type"] as const).map((s) => `<option value="${s}" ${state.sort === s ? "selected" : ""}>${{ power: "Potenza", level: "Livello", rarity: "Rarità", type: "Tipo" }[s]}</option>`).join("")}
        </select>
      </label>
      ${state.multi ? "" : `<button class="btn btn--small" data-action="multi">${icon("check")} Selezione multipla</button>`}
    </div>
    ${multiBar}
    <div class="hq-grid">${items.map((item) => gearTile(item, { selected: item.uid === state.selected, equipped: equipped.has(item.uid), picked: state.picked.has(item.uid), multi: state.multi })).join("") || `<p class="muted">Nessun pezzo con questi filtri.</p>`}</div>
  </section>`;
};

export const hangarView = (profile: CampaignProfile, state: HubState) => {
  const now = summarize(profile);
  const keys = slotKeys(profile);
  const counts: Record<string, number> = {};
  keys.forEach((k) => {
    const t = slotType(k);
    counts[t] = (counts[t] ?? 0) + 1;
  });
  const hull = equippedHull(profile);
  return `<div class="hq-hangar">
    <aside class="panel hq-stats" data-role="stats">${statsPanel(now)}</aside>
    <section class="panel hq-ship">
      <div class="hq-ship__head">
        <b>${esc(hull ? mustGearDef(hull.defId).title : "Nessuno scafo")}</b>
        <small>Profili di fuoco: tasti 1 · 2 · 3 in volo. Il profilo 1 usa tutte le armi.</small>
      </div>
      <div class="hq-ship__stage">
        ${hullSvg(hull?.defId)}
        ${keys.map((k) => socket(profile, k, state.slot === k, counts)).join("")}
      </div>
    </section>
    <aside class="panel hq-slot">${slotPanel(profile, state, now)}</aside>
    ${inventoryPanel(profile, state)}
  </div>`;
};

/** Anteprima nella scheda statistiche al passaggio su un candidato. */
export const hoverStats = (profile: CampaignProfile, state: HubState, uid: number | null) => {
  const now = summarize(profile);
  if (uid === null || !state.slot) return statsPanel(now);
  return statsPanel(now, summarize(simulateEquip(profile, state.slot, uid)));
};
