import { icon } from "../../../art/svg";
import { RARITIES } from "../../../data/upgrades";
import { esc } from "../../../ui/dom";
import { hex } from "../../../utils";
import { AFFIX_COUNT } from "../affixes";
import {
  GEAR_MAX_LEVEL,
  SLOT_LABELS,
  affixLinesOf,
  describeGear,
  milestonesOf,
  mustGearDef,
  sellPrice,
  upgradeCost,
  type GearItem,
  type GearSlot,
} from "../gear";
import {
  canUnequip,
  commonsValue,
  equippedSlotOf,
  fusionCost,
  fusionPartners,
  isSellable,
  itemByUid,
  recalCost,
  simulateEquip,
  slotKeys,
  slotType,
  summarize,
  type CampaignProfile,
  type ShipSummary,
  type SlotKey,
} from "../profile";
import { CATEGORIES, gearLines, itemRow, itemScore, slotLabel, type HubState } from "./common";

// ---------- Slot e confronti ----------

/** Slot dello scafo montato per una categoria. */
export const catSlots = (profile: CampaignProfile, cat: GearSlot) => slotKeys(profile).filter((k) => slotType(k) === cat);

/** Slot in cui finisce un pezzo con "Monta": uno libero, altrimenti il più debole (mai il migliore). */
export const targetSlot = (profile: CampaignProfile, defId: string, preferred?: SlotKey | null) => {
  const type = mustGearDef(defId).slot;
  if (type === "hull") return "hull";
  const keys = catSlots(profile, type);
  if (preferred && keys.includes(preferred)) return preferred;
  const empty = keys.find((k) => !profile.equipped[k]);
  if (empty || keys.length === 0) return empty;
  const score = (k: string) => {
    const item = itemByUid(profile, profile.equipped[k]);
    return item ? itemScore(item) : 0;
  };
  return [...keys].sort((a, b) => score(a) - score(b))[0];
};

/** Differenze principali fra la nave attuale e quella con il pezzo montato. */
export const deltaText = (now: ShipSummary, next: ShipSummary) => {
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

// ---------- Colonna sinistra: categorie e nave ----------

const categoryNav = (profile: CampaignProfile, state: HubState) =>
  CATEGORIES.map((c) => {
    const slots = catSlots(profile, c.id);
    const mounted = slots.filter((k) => profile.equipped[k]).length;
    const spare = profile.inventory.filter((i) => mustGearDef(i.defId).slot === c.id && !equippedSlotOf(profile, i.uid));
    const fresh = spare.some((i) => i.fresh);
    return `<button class="hq-cat ${state.cat === c.id ? "is-on" : ""}" data-action="cat" data-id="${c.id}">
      ${icon(c.icon)}<span><b>${c.label}</b><small>${slots.length ? `${mounted}/${slots.length} montati` : "nessuno slot"} · ${spare.length} in magazzino</small></span>
      ${fresh ? `<i class="hq-cat__new"></i>` : ""}
    </button>`;
  }).join("");

/** Riepilogo compatto della nave. */
export const shipCard = (s: ShipSummary) => {
  const balance = s.sink - s.heat;
  const ratio = s.sink > 0 ? Math.min(2, s.heat / s.sink) : 0;
  return `<div class="hq-shipcard">
    <span>${icon("heart")} <b>${s.hp.toFixed(0)}</b> HP</span>
    ${s.shield > 0 ? `<span>${icon("shield")} <b>${s.shield.toFixed(0)}</b> scudo</span>` : ""}
    <span>${icon("tome-power")} <b>${s.dps.toFixed(1)}</b> danno/s</span>
    <span>${icon("tome-mobility")} <b>${s.speed.toFixed(0)}</b> velocità</span>
    <div class="hq-heat ${balance < 0 ? "is-hot" : ""}">
      <div class="hq-heat__bar"><i style="width:${Math.min(100, ratio * 50)}%"></i><span></span></div>
      <small>${icon("heat")} ${balance >= 0 ? "Fuoco continuo senza surriscaldarsi" : `Surriscalda in ~${Math.max(1, Math.round(s.cap / -balance))} s`}</small>
    </div>
  </div>`;
};

// ---------- Colonna centrale: montati e magazzino ----------

const fireToggles = (profile: CampaignProfile, key: SlotKey) => {
  const t = slotType(key);
  if (t !== "front" && t !== "rear" && t !== "missile") return "";
  const fp = (which: 2 | 3) =>
    `<i class="hq-fp ${profile.fireProfiles[which].includes(key) ? "is-on" : ""}" data-action="fp" data-id="${which}:${key}" title="Accesa nel profilo di fuoco ${which}">${which}</i>`;
  return `<span class="hq-row__fp" title="Profili di fuoco 2 e 3 (il profilo 1 usa tutto)">${fp(2)}${fp(3)}</span>`;
};

const listColumn = (profile: CampaignProfile, state: HubState, now: ShipSummary) => {
  const cat = CATEGORIES.find((c) => c.id === state.cat)!;
  const slots = catSlots(profile, state.cat);
  const mountedRows = slots
    .map((k) => {
      const item = itemByUid(profile, profile.equipped[k]);
      if (!item) {
        return `<div class="hq-row hq-row--empty ${state.slot === k ? "is-target" : ""}" data-action="slot" data-id="${k}">
          <span class="hq-row__icon">${icon(cat.icon)}</span><span class="hq-row__body"><b>${slotLabel(k)} libero</b><small>Scegli un pezzo dal magazzino e premi Monta</small></span></div>`;
      }
      return itemRow(item, {
        action: "pick",
        id: k,
        selected: state.selected === item.uid,
        tag: `${slotLabel(k)}${state.slot === k && slots.length > 1 ? " · destinazione" : ""}`,
        extra: fireToggles(profile, k),
      });
    })
    .join("");

  const spare = profile.inventory
    .filter((i) => mustGearDef(i.defId).slot === state.cat && !equippedSlotOf(profile, i.uid))
    .sort((a, b) => itemScore(b) - itemScore(a));
  const spareRows = spare
    .map((item) => {
      const target = targetSlot(profile, item.defId, state.slot);
      const delta = target ? deltaText(now, summarize(simulateEquip(profile, target, item.uid))) : "";
      return itemRow(item, {
        action: "pick",
        selected: state.selected === item.uid,
        delta,
        side: target
          ? `<button class="btn btn--small" data-action="equip" data-uid="${item.uid}">Monta</button>`
          : `<small class="muted">nessuno slot</small>`,
      });
    })
    .join("");

  const commons = commonsValue(profile);
  return `
    <h3>${icon(cat.icon)} ${cat.label} · montati</h3>
    <div class="hq-rows">${mountedRows || `<p class="muted">Questo scafo non ha slot per ${cat.label.toLowerCase()}.</p>`}</div>
    <h3 class="hq-sub">${icon("crate")} In magazzino · ${spare.length}</h3>
    <div class="hq-rows">${spareRows || `<p class="muted">Niente in magazzino: cerca nel negozio o nelle casse dei cargo.</p>`}</div>
    ${commons.count ? `<button class="btn btn--small hq-commons ${state.confirm === "commons" ? "btn--danger" : ""}" data-action="sell-commons">${icon("coin")} ${state.confirm === "commons" ? `Conferma: vendi ${commons.count} comuni per ${commons.total}` : `Vendi i comuni liberi (${commons.count}) +${commons.total}`}</button>` : ""}`;
};

// ---------- Colonna destra: dettaglio e azioni ----------

const NEXT: Partial<Record<string, keyof typeof RARITIES>> = { common: "uncommon", uncommon: "rare", rare: "legendary" };

const upgradePreview = (item: GearItem) => {
  if (item.level >= GEAR_MAX_LEVEL) return `<p class="muted">Livello massimo raggiunto.</p>`;
  const now = describeGear(item);
  const next = describeGear({ ...item, level: item.level + 1 });
  const diffs = now
    .map((line, i) => (next[i] && next[i] !== line ? `${line} → ${next[i].slice(next[i].lastIndexOf(" ") + 1)}` : ""))
    .filter(Boolean);
  const unlock = milestonesOf(item).find((m) => m.level === item.level + 1);
  return `<div class="compare"><small>Al livello ${item.level + 1}</small>
    <ul class="gear-stats">${diffs.map((d) => `<li>${esc(d)}</li>`).join("") || "<li>Nessuna statistica cambia</li>"}</ul>
    ${unlock ? `<p class="unlock">${icon("star")} Sblocca: ${esc(unlock.text)}</p>` : ""}</div>`;
};

const fusionPanel = (profile: CampaignProfile, item: GearItem) => {
  const next = NEXT[item.rarity];
  if (!next) return "";
  const partners = fusionPartners(profile, item);
  const cost = fusionCost(item);
  const ready = partners.length >= 2;
  const slots = [item, ...partners.slice(0, 2)]
    .map((p) => `<i class="on" style="--r:${hex(RARITIES[p.rarity].color)}"></i>`)
    .concat(Array.from({ length: Math.max(0, 2 - partners.length) }, () => `<i></i>`))
    .join("");
  return `<section class="hq-forge">
    <h4>${icon("reroll")} Fusione <small>3 uguali → <b style="color:${hex(RARITIES[next].color)}">${RARITIES[next].label}</b></small></h4>
    <div class="hq-forge__slots">${slots}</div>
    <p class="muted">${ready ? `Usa 2 doppioni in magazzino; tiene livello e item level migliori, +${AFFIX_COUNT[next] - (item.affixes?.length ?? 0)} affisso.` : `Doppioni in magazzino: ${partners.length}/2.`}</p>
    <button class="btn btn--small" data-action="fuse" data-uid="${item.uid}" ${ready && profile.coins >= cost ? "" : "disabled"}>${icon("reroll")} Fondi ${cost}</button>
  </section>`;
};

const recalPanel = (profile: CampaignProfile, item: GearItem) => {
  if (!item.affixes?.length) return "";
  const cost = recalCost(item);
  const rows = item.affixes
    .map(
      (a, i) => `<li><span>${icon("star")} ${esc(affixLinesOf({ ...item, affixes: [a] })[0])}</span>
        <button class="btn btn--small" data-action="recal" data-uid="${item.uid}" data-id="${i}" ${profile.coins < cost ? "disabled" : ""} title="Ritira questo affisso">${icon("reroll")} ${cost}</button></li>`,
    )
    .join("");
  return `<section class="hq-forge"><h4>${icon("star")} Ricalibrazione <small>ritira un affisso</small></h4><ul class="hq-recal">${rows}</ul></section>`;
};

const detailPanel = (profile: CampaignProfile, state: HubState) => {
  const item = itemByUid(profile, state.selected);
  if (!item) return `<p class="muted">Seleziona un pezzo per vederne il dettaglio, montarlo, potenziarlo, fonderlo o venderlo.</p>`;
  const def = mustGearDef(item.defId);
  const where = equippedSlotOf(profile, item.uid);
  const target = where ? null : targetSlot(profile, item.defId, state.slot);
  const cost = upgradeCost(item);
  const maxed = item.level >= GEAR_MAX_LEVEL;
  const levelBar = Array.from({ length: GEAR_MAX_LEVEL }, (_, i) => `<i class="${i < item.level ? "on" : ""} ${i === 4 || i === 9 ? "is-mile" : ""}"></i>`).join("");
  const ms = milestonesOf(item)
    .map((m) => `<li class="${m.reached ? "is-reached" : ""}">${icon(m.reached ? "check" : "lock")} Liv. ${m.level}: ${esc(m.text)}</li>`)
    .join("");
  const sellKey = `sell-${item.uid}`;
  return `
    <div class="gear-detail" style="--c:${hex(def.color)};--r:${hex(RARITIES[item.rarity].color)}">
      <span class="gear-detail__icon">${icon(def.icon)}</span>
      <div><small style="color:var(--r)">${RARITIES[item.rarity].label} · ${SLOT_LABELS[def.slot]}${where ? ` · montato in ${slotLabel(where)}` : " · in magazzino"}</small>
        <h3>${esc(def.title)} <em>Liv. ${item.level}</em></h3></div>
    </div>
    <div class="hq-levels" style="--c:${hex(def.color)}">${levelBar}</div>
    ${gearLines(item)}
    ${ms ? `<ul class="gear-milestones">${ms}</ul>` : ""}
    <div class="gear-actions">
      ${where ? (canUnequip(profile, where) ? `<button class="btn btn--small" data-action="unequip" data-id="${where}">Rimuovi</button>` : "") : target ? `<button class="btn btn--primary btn--small" data-action="equip" data-uid="${item.uid}">${icon("check")} Monta in ${slotLabel(target)}</button>` : ""}
      <button class="btn btn--small" data-action="upgrade" data-uid="${item.uid}" ${maxed || profile.coins < cost ? "disabled" : ""}>${icon("arrow-up")} ${maxed ? "Livello max" : `Potenzia ${cost}`}</button>
      <button class="btn btn--small ${state.confirm === sellKey ? "btn--danger" : ""}" data-action="sell" data-uid="${item.uid}" ${isSellable(profile, item) ? "" : "disabled"} title="${where ? "Smonta il pezzo prima di venderlo" : ""}">${icon("coin")} ${state.confirm === sellKey ? "Conferma" : "Vendi"} ${sellPrice(item)}</button>
    </div>
    ${state.feedback ? `<p class="hub__feedback">${esc(state.feedback)}</p>` : ""}
    ${upgradePreview(item)}
    ${fusionPanel(profile, item)}
    ${recalPanel(profile, item)}`;
};

export const hangarView = (profile: CampaignProfile, state: HubState) => {
  const now = summarize(profile);
  return `<div class="hq-hangar">
    <aside class="hq-hangar__nav">
      <nav class="panel hq-cats">${categoryNav(profile, state)}</nav>
      <section class="panel">${shipCard(now)}</section>
    </aside>
    <section class="panel hq-hangar__list">${listColumn(profile, state, now)}</section>
    <aside class="panel hq-hangar__detail">${detailPanel(profile, state)}</aside>
  </div>`;
};
