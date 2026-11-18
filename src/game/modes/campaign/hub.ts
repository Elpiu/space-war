import { icon } from "../../art/svg";
import { RARITIES } from "../../data/upgrades";
import { asset, el, esc, layer } from "../../ui/dom";
import { closeScreen } from "../../ui/screens";
import { formatTime, hex } from "../../utils";
import { GEAR_MAX_LEVEL, SLOT_LABELS, describeGear, gearDef, sellPrice, upgradeCost, type EquipSlot, type GearItem } from "./gear";
import { MISSIONS, SECTOR, type MissionDef } from "./missions";
import {
  EQUIP_ORDER,
  canUnequip,
  equip,
  equippedSlotOf,
  isMissionUnlocked,
  itemByUid,
  loadProfile,
  loadoutStats,
  nextMission,
  sell,
  unequip,
  upgrade,
  type CampaignProfile,
} from "./profile";

const EQUIP_LABELS: Record<EquipSlot, string> = {
  primary: "Arma",
  secondary: "Secondario",
  module1: "Modulo",
  module2: "Modulo",
  hull: "Scafo",
};

const rarityColor = (item: GearItem) => hex(RARITIES[item.rarity].color);

const itemTile = (item: GearItem, selected: boolean, equipped: boolean) => {
  const def = gearDef(item.defId);
  return `<button class="gear-tile ${selected ? "is-selected" : ""} ${equipped ? "is-equipped" : ""}" style="--c:${hex(def.color)};--r:${rarityColor(item)}" data-item="${item.uid}" title="${esc(def.title)}">
    ${icon(def.icon)}<b>${item.level}</b>${equipped ? `<i>${icon("check")}</i>` : ""}
  </button>`;
};

/** Hub della campagna: mappa del settore + equipaggiamento + inventario. */
export const openCampaignHub = (actions: { launch: (missionId: string) => void; back: () => void }) => {
  const profile = loadProfile();
  let missionId = nextMission(profile).id;
  let selected: number | null = profile.equipped.primary;
  let feedback = "";

  const render = () => {
    closeScreen();
    const mission = MISSIONS.find((m) => m.id === missionId)!;
    const root = el(`
      <div class="screen hub">
        <header class="hub__head">
          <div><small>${icon("map")} CAMPAGNA · ${esc(SECTOR.subtitle)}</small><h2 class="title title--sm">${esc(SECTOR.title)}</h2></div>
          <span class="pill pill--big">${icon("coin")}${profile.coins} monete</span>
          <button class="btn" data-act="back">${icon("home")} Menu</button>
        </header>
        <div class="hub__top">
          <section class="hub__map panel">${renderMap(profile, missionId)}</section>
          <aside class="hub__mission panel">${renderMission(profile, mission)}</aside>
        </div>
        <div class="hub__bottom">
          <section class="hub__loadout panel">${renderLoadout(profile, selected)}</section>
          <section class="hub__inventory panel">
            <h3>${icon("crate")} Hangar · ${profile.inventory.length} oggetti</h3>
            <div class="gear-grid">${sortedInventory(profile).map((item) => itemTile(item, item.uid === selected, Boolean(equippedSlotOf(profile, item.uid)))).join("")}</div>
          </section>
          <aside class="hub__detail panel">${renderDetail(profile, selected, feedback)}</aside>
        </div>
      </div>
    `);
    layer("screen").appendChild(root);

    root.querySelector("[data-act=back]")?.addEventListener("click", actions.back);
    root.querySelector("[data-act=launch]")?.addEventListener("click", () => actions.launch(missionId));
    root.querySelectorAll<HTMLElement>("[data-mission]").forEach((node) =>
      node.addEventListener("click", () => {
        missionId = node.dataset.mission!;
        render();
      }),
    );
    root.querySelectorAll<HTMLElement>("[data-item]").forEach((node) =>
      node.addEventListener("click", () => {
        selected = Number(node.dataset.item);
        feedback = "";
        render();
      }),
    );
    root.querySelectorAll<HTMLElement>("[data-slot]").forEach((node) =>
      node.addEventListener("click", () => {
        const uid = profile.equipped[node.dataset.slot as EquipSlot];
        if (uid !== null) selected = uid;
        feedback = "";
        render();
      }),
    );
    const act = (name: string, fn: () => void) => root.querySelector(`[data-gear=${name}]`)?.addEventListener("click", () => {
      fn();
      render();
    });
    act("equip", () => selected !== null && equip(profile, selected));
    act("unequip", () => {
      const slot = selected !== null ? equippedSlotOf(profile, selected) : undefined;
      if (slot) unequip(profile, slot);
    });
    act("upgrade", () => {
      if (selected === null) return;
      feedback = upgrade(profile, selected) ? "Potenziato!" : "Monete insufficienti";
    });
    act("sell", () => {
      if (selected === null) return;
      const price = sell(profile, selected);
      feedback = price ? `Venduto per ${price} monete` : "";
      selected = null;
    });
  };

  render();
};

const sortedInventory = (profile: CampaignProfile) => {
  const slotOrder = ["primary", "secondary", "module", "hull"];
  const rarityOrder = ["legendary", "rare", "uncommon", "common"];
  return [...profile.inventory].sort((a, b) => {
    const da = gearDef(a.defId);
    const db = gearDef(b.defId);
    return (
      slotOrder.indexOf(da.slot) - slotOrder.indexOf(db.slot) ||
      rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity) ||
      b.level - a.level
    );
  });
};

const renderMap = (profile: CampaignProfile, selectedId: string) => {
  const edges = MISSIONS.flatMap((m) =>
    m.requires.map((reqId) => {
      const from = MISSIONS.find((r) => r.id === reqId)!;
      const open = profile.completed.includes(reqId);
      return `<line x1="${from.x}" y1="${from.y}" x2="${m.x}" y2="${m.y}" class="${open ? "is-open" : ""}"/>`;
    }),
  ).join("");
  const nodes = MISSIONS.map((m) => {
    const unlocked = isMissionUnlocked(profile, m);
    const done = profile.completed.includes(m.id);
    const state = done ? "is-done" : unlocked ? "is-open" : "is-locked";
    return `<button class="map-node ${state} ${m.boss ? "is-boss" : ""} ${m.id === selectedId ? "is-selected" : ""}" style="left:${m.x}%;top:${m.y}%" data-mission="${m.id}" ${unlocked ? "" : "disabled"}>
      ${icon(done ? "check" : m.boss ? "boss" : unlocked ? "flag" : "lock")}<span>${m.code}</span>
    </button>`;
  }).join("");
  return `<div class="map-inner"><svg class="map-edges" viewBox="0 0 100 100" preserveAspectRatio="none">${edges}</svg>${nodes}</div>`;
};

const renderMission = (profile: CampaignProfile, m: MissionDef) => {
  const unlocked = isMissionUnlocked(profile, m);
  const done = profile.completed.includes(m.id);
  const threat = Array.from({ length: 5 }, (_, i) => `<i class="${i < m.tier ? "on" : ""}"></i>`).join("");
  return `
    <small class="muted">Missione ${m.code}${done ? " · completata" : ""}</small>
    <h3>${esc(m.title)}</h3>
    <p>${esc(m.description)}</p>
    <div class="threat"><span>Minaccia</span><span class="pips">${threat}</span></div>
    <ul class="mission-facts">
      <li>${icon("coin")} Bonus vittoria: ${40 * m.tier} monete</li>
      <li>${icon("crate")} ${done ? "Bottino garantito a fine missione" : "Prima vittoria: bottino non comune o migliore"}</li>
      ${m.boss ? `<li>${icon("boss")} Boss a fine percorso</li>` : `<li>${icon("flag")} Raggiungi l'uscita in fondo al corridoio</li>`}
    </ul>
    <button class="btn btn--primary" data-act="launch" ${unlocked ? "" : "disabled"}>${icon("play")} Lancia missione</button>`;
};

const renderLoadout = (profile: CampaignProfile, selected: number | null) => {
  const slots = EQUIP_ORDER.map((slot) => {
    const item = itemByUid(profile, profile.equipped[slot]);
    if (!item) return `<button class="loadout-slot is-empty" data-slot="${slot}"><span>${EQUIP_LABELS[slot]}</span><em>vuoto</em></button>`;
    const def = gearDef(item.defId);
    return `<button class="loadout-slot ${item.uid === selected ? "is-selected" : ""}" style="--c:${hex(def.color)};--r:${rarityColor(item)}" data-slot="${slot}">
      <span>${EQUIP_LABELS[slot]}</span>${icon(def.icon)}<b>${esc(def.title)}</b><small>Liv. ${item.level}</small>
    </button>`;
  }).join("");
  const s = loadoutStats(profile);
  return `
    <h3>${icon("gear-hull")} Equipaggiamento</h3>
    <div class="loadout">${slots}</div>
    <div class="loadout-stats">
      <span>${icon("heart")} ${s.maxHp.toFixed(1)} HP</span>
      <span>${icon("tome-power")} ${s.damage.toFixed(1)} danno</span>
      <span>${icon("tome-cadence")} ${(1000 / s.fireInterval).toFixed(1)} colpi/s</span>
      <span>${icon("tome-mobility")} ${Math.round(s.speed)} velocità</span>
    </div>`;
};

const renderDetail = (profile: CampaignProfile, uid: number | null, feedback: string) => {
  const item = itemByUid(profile, uid);
  if (!item) return `<p class="muted">Seleziona un oggetto per vederne le statistiche.</p>${feedback ? `<p class="hub__feedback">${esc(feedback)}</p>` : ""}`;
  const def = gearDef(item.defId);
  const slot = equippedSlotOf(profile, item.uid);
  const cost = upgradeCost(item);
  const maxed = item.level >= GEAR_MAX_LEVEL;
  return `
    <div class="gear-detail" style="--c:${hex(def.color)};--r:${rarityColor(item)}">
      <span class="gear-detail__icon">${icon(def.icon)}</span>
      <div>
        <small style="color:var(--r)">${RARITIES[item.rarity].label} · ${SLOT_LABELS[def.slot]}</small>
        <h3>${esc(def.title)} <em>Liv. ${item.level}</em></h3>
      </div>
    </div>
    <p class="muted">${esc(def.description)}</p>
    <ul class="gear-stats">${describeGear(item).map((line) => `<li>${esc(line)}</li>`).join("")}</ul>
    <div class="gear-actions">
      ${slot ? (canUnequip(slot) ? `<button class="btn" data-gear="unequip">Rimuovi</button>` : `<span class="muted">Equipaggiato</span>`) : `<button class="btn" data-gear="equip">${icon("check")} Equipaggia</button>`}
      <button class="btn" data-gear="upgrade" ${maxed || profile.coins < cost ? "disabled" : ""}>${icon("arrow-up")} ${maxed ? "Livello max" : `Potenzia ${cost}`}</button>
      <button class="btn btn--danger" data-gear="sell" ${slot ? "disabled" : ""}>${icon("coin")} Vendi ${sellPrice(item)}</button>
    </div>
    ${feedback ? `<p class="hub__feedback">${esc(feedback)}</p>` : ""}`;
};

// ---------- Esito missione ----------

export const showMissionResult = (
  result: { mission: MissionDef; victory: boolean; coins: number; bonus: number; items: GearItem[]; firstClear: boolean; kills: number; time: number },
  actions: { map: () => void; retry: () => void },
) => {
  closeScreen();
  const loot = result.items.length
    ? result.items
        .map((item) => {
          const def = gearDef(item.defId);
          return `<li style="--c:${hex(def.color)};--r:${rarityColor(item)}">${icon(def.icon)}<span><b>${esc(def.title)}</b><small>${RARITIES[item.rarity].label} · ${SLOT_LABELS[def.slot]}</small></span></li>`;
        })
        .join("")
    : `<li class="muted">Nessun bottino questa volta.</li>`;
  const root = el(`
    <div class="screen over">
      <div class="panel over__panel">
        <img class="result__ship" src="${asset("assets/images/starship.png")}" alt="" />
        <h2 class="title ${result.victory ? "title--good" : "title--danger"}">${result.victory ? "MISSIONE COMPIUTA" : "MISSIONE FALLITA"}</h2>
        <p class="muted">${result.mission.code} · ${esc(result.mission.title)}${result.firstClear ? " · prima vittoria!" : ""}</p>
        <div class="stats">
          <div><small>Abbattuti</small><b>${result.kills}</b></div>
          <div><small>Tempo</small><b>${formatTime(result.time)}</b></div>
          <div><small>Monete</small><b>${result.coins}</b></div>
          <div><small>Bonus</small><b>${result.bonus}</b></div>
        </div>
        <section class="result__loot"><h3>Bottino</h3><ul class="build-list">${loot}</ul></section>
        ${result.victory ? "" : `<p class="muted">Monete e bottino raccolti restano tuoi: riprova quando vuoi.</p>`}
        <div class="pause__actions">
          <button class="btn btn--primary" data-act="map">${icon("map")} Mappa</button>
          <button class="btn" data-act="retry">${icon("reroll")} Riprova</button>
        </div>
      </div>
    </div>
  `);
  layer("screen").appendChild(root);
  root.querySelector("[data-act=map]")?.addEventListener("click", actions.map);
  root.querySelector("[data-act=retry]")?.addEventListener("click", actions.retry);
};
