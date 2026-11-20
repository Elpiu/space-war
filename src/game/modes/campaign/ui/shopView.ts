import { icon } from "../../../art/svg";
import { RARITIES } from "../../../data/upgrades";
import { esc } from "../../../ui/dom";
import { hex } from "../../../utils";
import { SLOT_LABELS, buyPrice, milestonesOf, mustGearDef, type GearItem } from "../gear";
import {
  offerPrice,
  offerRerollCost,
  sectorOffers,
  shopCatalog,
  shopIlvl,
  simulateEquip,
  summarize,
  type CampaignProfile,
} from "../profile";
import { CATEGORIES, gearLines, itemRow, slotLabel, statsPanel, type HubState } from "./common";
import { deltaText, targetSlot } from "./hangarView";

export { targetSlot };

/** Pezzo "virtuale" per mostrare le statistiche di un articolo del catalogo. */
const virtualItem = (defId: string, ilvl = 0): GearItem => ({ uid: -1, defId, rarity: "common", level: 1, ilvl });

/** Articolo in anteprima: offerta del settore o pezzo del catalogo. */
const previewed = (profile: CampaignProfile, preview: string) => {
  if (preview.startsWith("offer:")) {
    const index = Number(preview.slice(6));
    const offer = sectorOffers(profile)[index];
    return offer ? { item: { ...offer, uid: -1 } as GearItem, price: offerPrice(offer), index } : null;
  }
  return { item: virtualItem(preview, shopIlvl(profile)), price: buyPrice(mustGearDef(preview), shopIlvl(profile)), index: -1 };
};

const previewPanel = (profile: CampaignProfile, preview: string, feedback: string) => {
  const p = previewed(profile, preview);
  if (!p) return `<p class="muted">Offerta già acquistata: le offerte si rinnovano dopo ogni missione vinta.</p>${feedback ? `<p class="hub__feedback">${esc(feedback)}</p>` : ""}`;
  const { item, price, index } = p;
  const offer = index >= 0;
  const def = mustGearDef(item.defId);
  const slot = targetSlot(profile, item.defId);
  let compare = `<p class="muted">Lo scafo montato non ha slot di questo tipo.</p>`;
  if (slot) {
    const fake = { ...item, uid: 999999 };
    const simulated = simulateEquip({ ...profile, inventory: [...profile.inventory, fake] }, slot, fake.uid);
    compare = `<div class="compare"><small>Se lo monti in ${esc(slotLabel(slot))}</small>${statsPanel(summarize(profile), summarize(simulated))}</div>`;
  }
  const ms = milestonesOf(item).map((m) => `<li>${icon("lock")} Liv. ${m.level}: ${esc(m.text)}</li>`).join("");
  return `
    <div class="gear-detail" style="--c:${hex(def.color)};--r:${hex(RARITIES[item.rarity].color)}">
      <span class="gear-detail__icon">${icon(def.icon)}</span>
      <div><small style="color:var(--r)">${offer ? `Offerta · ${RARITIES[item.rarity].label}` : "Catalogo"} · ${SLOT_LABELS[def.slot]}</small><h3>${esc(def.title)}</h3></div>
    </div>
    <p class="muted">${esc(def.description)}</p>
    ${gearLines(item)}
    ${ms ? `<ul class="gear-milestones">${ms}</ul>` : ""}
    <div class="gear-actions">
      <button class="btn" data-action="${offer ? "buy-offer" : "buy"}" data-id="${offer ? index : def.id}" ${profile.coins < price ? "disabled" : ""}>${icon("coin")} Compra ${price}</button>
      <button class="btn btn--primary btn--small" data-action="${offer ? "buy-offer-mount" : "buy-mount"}" data-id="${offer ? index : def.id}" ${profile.coins < price || !slot ? "disabled" : ""}>${icon("check")} Compra e monta</button>
    </div>
    ${feedback ? `<p class="hub__feedback">${esc(feedback)}</p>` : ""}
    ${compare}`;
};

const shopNav = (profile: CampaignProfile, state: HubState) => {
  const catalog = shopCatalog(profile);
  const offers = sectorOffers(profile).filter(Boolean).length;
  const offerBtn = `<button class="hq-cat hq-cat--offers ${state.shopCat === "offers" ? "is-on" : ""}" data-action="shop-cat" data-id="offers">
    ${icon("star")}<span><b>Offerte del settore</b><small>${offers} pezzi rari con affissi</small></span></button>`;
  const cats = CATEGORIES.map((c) => {
    const count = catalog.filter((d) => d.slot === c.id).length;
    const fresh = catalog.some((d) => d.slot === c.id && !profile.seenShop.includes(d.id));
    return `<button class="hq-cat ${state.shopCat === c.id ? "is-on" : ""}" data-action="shop-cat" data-id="${c.id}" ${count ? "" : "disabled"}>
      ${icon(c.icon)}<span><b>${c.label}</b><small>${count} nel catalogo</small></span>${fresh ? `<i class="hq-cat__new"></i>` : ""}</button>`;
  }).join("");
  return offerBtn + cats;
};

const shopList = (profile: CampaignProfile, state: HubState) => {
  const now = summarize(profile);
  const delta = (item: GearItem) => {
    const slot = targetSlot(profile, item.defId);
    if (!slot) return "";
    const fake = { ...item, uid: 999999 };
    return deltaText(now, summarize(simulateEquip({ ...profile, inventory: [...profile.inventory, fake] }, slot, fake.uid)));
  };
  const price = (value: number) => `<span class="hq-price ${profile.coins < value ? "is-poor" : ""}">${icon("coin")} ${value}</span>`;
  if (state.shopCat === "offers") {
    const reroll = offerRerollCost(profile);
    const rows = sectorOffers(profile)
      .map((o, i) =>
        o
          ? itemRow({ ...o, uid: -1 }, { action: "preview", id: `offer:${i}`, selected: state.preview === `offer:${i}`, delta: delta({ ...o, uid: -1 }), side: price(offerPrice(o)) })
          : `<div class="hq-row hq-row--empty"><span class="hq-row__body"><b>Venduto</b><small>Torna dopo la prossima missione vinta</small></span></div>`,
      )
      .join("");
    return `<div class="hq-offers__head"><h3>${icon("star")} Offerte del settore</h3>
        <button class="btn btn--small" data-action="reroll-offers" ${profile.coins < reroll ? "disabled" : ""}>${icon("reroll")} Rinnova ${reroll}</button></div>
      <p class="muted">Pezzi rari o migliori con affissi: cambiano dopo ogni missione vinta.</p>
      <div class="hq-rows">${rows}</div>`;
  }
  const cat = CATEGORIES.find((c) => c.id === state.shopCat)!;
  const rows = shopCatalog(profile)
    .filter((d) => d.slot === state.shopCat)
    .map((d) => {
      const item = virtualItem(d.id, shopIlvl(profile));
      const owned = profile.inventory.filter((i) => i.defId === d.id).length;
      return itemRow(item, {
        action: "preview",
        id: d.id,
        selected: state.preview === d.id,
        tag: `${profile.seenShop.includes(d.id) ? "" : "NUOVO · "}${owned ? `ne hai ${owned}` : "non posseduto"}`,
        delta: delta(item),
        side: price(buyPrice(d, shopIlvl(profile))),
      });
    })
    .join("");
  return `<h3>${icon(cat.icon)} ${cat.label} · catalogo</h3>
    <p class="muted">Pezzi comuni a prezzo fisso; le rarità migliori arrivano dalle offerte e dalle casse.</p>
    <div class="hq-rows">${rows}</div>`;
};

export const shopView = (profile: CampaignProfile, state: HubState) => `<div class="hq-shop">
    <nav class="panel hq-cats">${shopNav(profile, state)}</nav>
    <section class="panel hq-shop__list">${shopList(profile, state)}</section>
    <aside class="panel hq-shop__detail">${state.preview ? previewPanel(profile, state.preview, state.feedback) : `<p class="muted">Scegli un articolo per vedere statistiche e confronto con la nave attuale.</p>`}</aside>
  </div>`;
