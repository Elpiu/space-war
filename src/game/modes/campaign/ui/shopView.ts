import { icon } from "../../../art/svg";
import { RARITIES } from "../../../data/upgrades";
import { esc } from "../../../ui/dom";
import { hex } from "../../../utils";
import { SLOT_LABELS, buyPrice, milestonesOf, mustGearDef, type GearItem } from "../gear";
import { itemByUid, shopCatalog, simulateEquip, slotKeys, slotType, summarize, type CampaignProfile } from "../profile";
import { SLOT_ORDER, gearLines, itemScore, statsPanel, type HubState } from "./common";

/** Pezzo "virtuale" per mostrare le statistiche di un articolo del catalogo. */
const virtualItem = (defId: string): GearItem => ({ uid: -1, defId, rarity: "common", level: 1 });

/** Slot in cui finirebbe il pezzo con "Compra e monta". */
export const targetSlot = (profile: CampaignProfile, defId: string) => {
  const type = mustGearDef(defId).slot;
  if (type === "hull") return "hull";
  const keys = slotKeys(profile).filter((k) => slotType(k) === type);
  const empty = keys.find((k) => !profile.equipped[k]);
  if (empty || keys.length === 0) return empty;
  // Tutti pieni: si sostituisce il pezzo più debole, mai il migliore.
  const score = (k: string) => {
    const item = itemByUid(profile, profile.equipped[k]);
    return item ? itemScore(item) : 0;
  };
  return [...keys].sort((a, b) => score(a) - score(b))[0];
};

const previewPanel = (profile: CampaignProfile, defId: string, feedback: string) => {
  const def = mustGearDef(defId);
  const item = virtualItem(defId);
  const price = buyPrice(def);
  const slot = targetSlot(profile, defId);
  let compare = `<p class="muted">Lo scafo montato non ha slot di questo tipo.</p>`;
  if (slot) {
    // Simulazione su una copia: il pezzo non esiste ancora nell'inventario.
    const fake = { ...item, uid: 999999 };
    const simulated = simulateEquip({ ...profile, inventory: [...profile.inventory, fake] }, slot, fake.uid);
    compare = `<div class="compare"><small>Se lo monti al posto di quello attuale</small>${statsPanel(summarize(profile), summarize(simulated))}</div>`;
  }
  const ms = milestonesOf(item).map((m) => `<li>${icon("lock")} Liv. ${m.level}: ${esc(m.text)}</li>`).join("");
  return `
    <div class="gear-detail" style="--c:${hex(def.color)};--r:${hex(RARITIES.common.color)}">
      <span class="gear-detail__icon">${icon(def.icon)}</span>
      <div><small>Negozio · ${SLOT_LABELS[def.slot]}</small><h3>${esc(def.title)}</h3></div>
    </div>
    <p class="muted">${esc(def.description)}</p>
    ${gearLines(item)}
    ${ms ? `<ul class="gear-milestones">${ms}</ul>` : ""}
    <div class="gear-actions">
      <button class="btn" data-action="buy" data-id="${def.id}" ${profile.coins < price ? "disabled" : ""}>${icon("coin")} Compra ${price}</button>
      <button class="btn btn--primary btn--small" data-action="buy-mount" data-id="${def.id}" ${profile.coins < price || !slot ? "disabled" : ""}>${icon("check")} Compra e monta</button>
    </div>
    ${feedback ? `<p class="hub__feedback">${esc(feedback)}</p>` : ""}
    ${compare}`;
};

export const shopView = (profile: CampaignProfile, state: HubState) => {
  const catalog = shopCatalog(profile);
  const sections = SLOT_ORDER.map((slot) => {
    const defs = catalog.filter((d) => d.slot === slot);
    if (!defs.length) return "";
    const cards = defs
      .map((def) => {
        const price = buyPrice(def);
        const isNew = !profile.seenShop.includes(def.id);
        const owned = profile.inventory.filter((i) => i.defId === def.id).length;
        return `<button class="hq-card ${state.preview === def.id ? "is-selected" : ""}" style="--c:${hex(def.color)}" data-action="preview" data-id="${def.id}">
          <span class="hq-card__icon">${icon(def.icon)}</span>
          <b>${esc(def.title)}${isNew ? ` <em class="badge-new">NUOVO</em>` : ""}</b>
          <small>${esc(def.description)}</small>
          <span class="hq-card__foot"><span class="${profile.coins < price ? "is-poor" : ""}">${icon("coin")} ${price}</span>${owned ? `<span class="muted">ne hai ${owned}</span>` : ""}</span>
        </button>`;
      })
      .join("");
    return `<h3>${SLOT_LABELS[slot]}</h3><div class="hq-cards">${cards}</div>`;
  }).join("");
  return `<div class="hq-shop">
    <section class="panel hq-shop__list">
      <p class="muted">Pezzi comuni a prezzo fisso. Il catalogo si allarga completando missioni; le rarità migliori arrivano solo dal bottino.</p>
      ${sections}
    </section>
    <aside class="panel hq-shop__detail">${state.preview ? previewPanel(profile, state.preview, state.feedback) : `<p class="muted">Scegli un articolo per vedere statistiche e confronto con la nave attuale.</p>`}</aside>
  </div>`;
};
