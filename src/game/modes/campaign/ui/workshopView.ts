import { icon } from "../../../art/svg";
import { RARITIES } from "../../../data/upgrades";
import { esc } from "../../../ui/dom";
import { hex } from "../../../utils";
import { GEAR_MAX_LEVEL, SLOT_LABELS, describeGear, milestonesOf, mustGearDef, sellPrice, upgradeCost, type GearItem } from "../gear";
import { commonsValue, equippedSlotOf, isSellable, itemByUid, type CampaignProfile } from "../profile";
import { gearLines, slotLabel, type HubState } from "./common";
import { inventoryPanel } from "./hangarView";

/** Cosa cambia al prossimo livello di upgrade. */
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

const detail = (profile: CampaignProfile, state: HubState) => {
  const item = itemByUid(profile, state.selected);
  if (!item) return `<p class="muted">Scegli un pezzo dall'inventario per potenziarlo, bloccarlo o venderlo.</p>`;
  const def = mustGearDef(item.defId);
  const where = equippedSlotOf(profile, item.uid);
  const cost = upgradeCost(item);
  const maxed = item.level >= GEAR_MAX_LEVEL;
  const levelBar = Array.from({ length: GEAR_MAX_LEVEL }, (_, i) => `<i class="${i < item.level ? "on" : ""} ${i === 4 || i === 9 ? "is-mile" : ""}"></i>`).join("");
  const ms = milestonesOf(item)
    .map((m) => `<li class="${m.reached ? "is-reached" : ""}">${icon(m.reached ? "check" : "lock")} Liv. ${m.level}: ${esc(m.text)}</li>`)
    .join("");
  return `
    <div class="gear-detail" style="--c:${hex(def.color)};--r:${hex(RARITIES[item.rarity].color)}">
      <span class="gear-detail__icon">${icon(def.icon)}</span>
      <div><small style="color:var(--r)">${RARITIES[item.rarity].label} · ${SLOT_LABELS[def.slot]}${where ? ` · montato in ${slotLabel(where)}` : ""}</small>
        <h3>${esc(def.title)} <em>Liv. ${item.level}</em></h3></div>
    </div>
    <div class="hq-levels">${levelBar}</div>
    <p class="muted">${esc(def.description)}</p>
    ${gearLines(item)}
    ${ms ? `<ul class="gear-milestones">${ms}</ul>` : ""}
    ${upgradePreview(item)}
    <div class="gear-actions">
      <button class="btn btn--primary btn--small" data-action="upgrade" data-uid="${item.uid}" ${maxed || profile.coins < cost ? "disabled" : ""}>${icon("arrow-up")} ${maxed ? "Livello max" : `Potenzia ${cost}`}</button>
      <button class="btn btn--small" data-action="lock" data-uid="${item.uid}">${icon("lock")} ${item.locked ? "Sblocca" : "Blocca"}</button>
      <button class="btn btn--small ${state.confirm === `sell-${item.uid}` ? "btn--danger" : ""}" data-action="sell" data-uid="${item.uid}" ${isSellable(profile, item) ? "" : "disabled"}>${icon("coin")} ${state.confirm === `sell-${item.uid}` ? "Conferma" : "Vendi"} ${sellPrice(item)}</button>
    </div>
    <p class="muted hq-note">Fusione e ricalibrazione arriveranno nell'Officina con il bottino con affissi.</p>
    ${state.feedback ? `<p class="hub__feedback">${esc(state.feedback)}</p>` : ""}`;
};

export const workshopView = (profile: CampaignProfile, state: HubState) => {
  const commons = commonsValue(profile);
  return `<div class="hq-workshop">
    <div class="hq-workshop__left">
      ${commons.count ? `<button class="btn btn--small ${state.confirm === "commons" ? "btn--danger" : ""}" data-action="sell-commons">${icon("coin")} ${state.confirm === "commons" ? `Conferma: vendi ${commons.count} comuni per ${commons.total}` : `Vendi comuni liberi (${commons.count}) +${commons.total}`}</button>` : ""}
      ${inventoryPanel(profile, state)}
    </div>
    <aside class="panel hq-workshop__detail">${detail(profile, state)}</aside>
  </div>`;
};
