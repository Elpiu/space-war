import { icon } from "../../art/svg";
import type { DifficultyId } from "../../config";
import { RARITIES } from "../../data/upgrades";
import { asset, el, esc, layer, morph } from "../../ui/dom";
import { closeScreen } from "../../ui/screens";
import { formatTime, hex } from "../../utils";
import { SLOT_LABELS, mustGearDef, type GearItem, type GearSlot } from "./gear";
import type { MissionDef } from "./missions";
import { resolveNode } from "./events";
import { generateSector, nodeById, nodeState } from "./sectors";
import {
  buy,
  buyOffer,
  fuse,
  recalibrate,
  rerollOffers,
  equipTo,
  itemByUid,
  loadProfile,
  nextMission,
  saveProfile,
  sell,
  sellCommons,
  shopCatalog,
  toggleFireSlot,
  unequip,
  upgrade,
} from "./profile";
import { rarityColor, slotLabel, starsHtml, type HubState, type HubTab } from "./ui/common";
import { catSlots, hangarView, targetSlot } from "./ui/hangarView";
import { mapView, sectorHeading } from "./ui/mapView";
import { shopView } from "./ui/shopView";

const TABS: { id: HubTab; label: string; icon: Parameters<typeof icon>[0] }[] = [
  { id: "map", label: "Mappa", icon: "map" },
  { id: "hangar", label: "Hangar", icon: "gear-hull" },
  { id: "shop", label: "Negozio", icon: "coin" },
];

/**
 * Hub della campagna: tre schermate a tutto spazio (Mappa, Hangar, Negozio).
 * Hangar e Negozio sono liste per categoria; potenziamento, fusione e
 * ricalibrazione stanno nel dettaglio del pezzo selezionato.
 */
export const openCampaignHub = (actions: { launch: (missionId: string, difficulty: DifficultyId) => void; back: () => void }) => {
  const profile = loadProfile();
  const next = nextMission(profile);
  const state: HubState = {
    tab: "map",
    sector: next.sector,
    missionId: next.id,
    difficulty: "normal",
    cat: "front",
    slot: null,
    selected: null,
    preview: null,
    shopCat: "offers",
    confirm: null,
    feedback: "",
  };
  const header = () => {
    const freshCount = profile.inventory.filter((i) => i.fresh).length;
    const shopNew = shopCatalog(profile).filter((d) => !profile.seenShop.includes(d.id)).length;
    const badge = (tab: HubTab) => (tab === "hangar" && freshCount ? `<i>${freshCount}</i>` : tab === "shop" && shopNew ? `<i>${shopNew}</i>` : "");
    return `<header class="hq-head">
      <div class="hq-brand"><small>${icon("map")} CAMPAGNA · ${esc(sectorHeading(profile, state.sector).subtitle)}</small><b>${esc(sectorHeading(profile, state.sector).title)}</b></div>
      <nav class="hq-tabs">${TABS.map((t) => `<button class="hq-tab ${state.tab === t.id ? "is-on" : ""}" data-action="tab" data-id="${t.id}">${icon(t.icon)}${t.label}${badge(t.id)}</button>`).join("")}</nav>
      <span class="pill pill--big">${icon("coin")}${profile.coins}</span>
      <button class="btn btn--small" data-action="back">${icon("home")} Menu</button>
    </header>`;
  };

  const body = () => (state.tab === "map" ? mapView(profile, state) : state.tab === "hangar" ? hangarView(profile, state) : shopView(profile, state));

  // La schermata si crea una volta; ogni azione poi aggiorna sul posto solo
  // ciò che cambia, così scorrimento e animazioni non ripartono da capo.
  let root: HTMLElement | null = null;
  const render = () => {
    const inner = `${header()}<main class="hq-body">${body()}</main>`;
    if (root?.isConnected) {
      morph(root, inner);
      return;
    }
    closeScreen();
    root = el(`<div class="screen hq">${inner}</div>`);
    layer("screen").appendChild(root);
    root.addEventListener("click", onClick);
  };

  /** Seleziona un pezzo (toglie il badge "nuovo"). */
  const selectItem = (uid: number) => {
    const item = itemByUid(profile, uid);
    if (!item) return;
    state.selected = uid;
    if (item.fresh) {
      item.fresh = false;
      saveProfile(profile);
    }
  };

  /** Apre una categoria dell'hangar: destinazione = primo slot libero o il primo. */
  const openCategory = (cat: GearSlot) => {
    state.cat = cat;
    const slots = catSlots(profile, cat);
    state.slot = slots.find((k) => !profile.equipped[k]) ?? slots[0] ?? null;
    // Nel dettaglio: il pezzo dello slot di destinazione, altrimenti il primo montato della categoria.
    const firstMounted = slots.map((k) => profile.equipped[k]).find((uid) => uid !== null && uid !== undefined);
    state.selected = (state.slot ? profile.equipped[state.slot] : null) ?? firstMounted ?? null;
  };

  openCategory("front");

  /** Doppio clic di conferma per le azioni distruttive. */
  const confirmed = (key: string) => {
    if (state.confirm === key) {
      state.confirm = null;
      return true;
    }
    state.confirm = key;
    return false;
  };

  const handle = (action: string, id: string | undefined, uid: number | null) => {
    if (!action.startsWith("sell") && action !== "item") state.confirm = null;
    switch (action) {
      case "back":
        return actions.back();
      case "launch":
        return actions.launch(state.missionId, state.difficulty);
      case "tab":
        state.tab = id as HubTab;
        state.feedback = "";
        break;
      case "mission":
        state.missionId = id!;
        state.difficulty = "normal";
        state.feedback = "";
        break;
      case "sector": {
        const n = Math.max(1, Math.min(profile.sector, Number(id)));
        state.sector = n;
        state.feedback = "";
        state.difficulty = "normal";
        if (n === 1) state.missionId = nextMission({ ...profile, sector: 1 }).id;
        else {
          // Seleziona il primo nodo giocabile del settore (o il primo in assoluto).
          const sector = generateSector(profile.seed, n);
          const done = new Set(profile.completed);
          const open = [...sector.nodes.values()].find((node) => nodeState(sector, node, done) === "open");
          state.missionId = (open ?? sector.layers[0][0]).id;
        }
        break;
      }
      case "node-choice": {
        const node = nodeById(profile.seed, state.missionId);
        if (node) state.feedback = resolveNode(profile, node, Number(id));
        break;
      }
      case "difficulty":
        state.difficulty = id as DifficultyId;
        break;
      case "cat":
        openCategory(id as GearSlot);
        state.feedback = "";
        break;
      case "slot":
        // Slot vuoto: diventa la destinazione di "Monta".
        state.slot = id!;
        state.selected = profile.equipped[id!] ?? null;
        state.feedback = "";
        break;
      case "pick":
        if (uid === null) break;
        selectItem(uid);
        if (id) state.slot = id;
        state.feedback = "";
        break;
      case "equip": {
        const item = uid !== null ? itemByUid(profile, uid) : undefined;
        if (!item) break;
        const slot = targetSlot(profile, item.defId, state.slot);
        if (!slot) {
          state.feedback = "Questo scafo non ha slot di questo tipo";
          break;
        }
        state.feedback = equipTo(profile, item.uid, slot) || `${mustGearDef(item.defId).title} montato in ${slotLabel(slot)}`;
        state.slot = slot;
        selectItem(item.uid);
        // Cambiando scafo gli slot cambiano: si riapre la categoria.
        if (slot === "hull") openCategory("hull");
        break;
      }
      case "fp": {
        const [which, key] = id!.split(":");
        toggleFireSlot(profile, Number(which) as 2 | 3, key);
        break;
      }
      case "unequip":
        unequip(profile, id!);
        state.slot = id!;
        break;
      case "shop-cat":
        state.shopCat = id as GearSlot | "offers";
        state.preview = null;
        state.feedback = "";
        break;
      case "preview":
        state.preview = id!;
        state.feedback = "";
        if (!id!.startsWith("offer:") && !profile.seenShop.includes(id!)) {
          profile.seenShop.push(id!);
          saveProfile(profile);
        }
        break;
      case "buy":
      case "buy-mount": {
        const item = buy(profile, id!);
        if (!item) {
          state.feedback = "Monete insufficienti";
          break;
        }
        item.fresh = false;
        state.feedback = `Acquistato: ${mustGearDef(item.defId).title}`;
        if (action === "buy-mount") {
          const slot = targetSlot(profile, id!);
          if (slot) state.feedback = equipTo(profile, item.uid, slot) || `${mustGearDef(item.defId).title} montato in ${slotLabel(slot)}`;
        }
        saveProfile(profile);
        break;
      }
      case "buy-offer":
      case "buy-offer-mount": {
        const item = buyOffer(profile, Number(id));
        if (!item) {
          state.feedback = "Monete insufficienti";
          break;
        }
        const title = mustGearDef(item.defId).title;
        state.feedback = `Acquistato: ${title}`;
        if (action === "buy-offer-mount") {
          const slot = targetSlot(profile, item.defId);
          if (slot) state.feedback = equipTo(profile, item.uid, slot) || `${title} montato in ${slotLabel(slot)}`;
        }
        state.preview = null;
        saveProfile(profile);
        break;
      }
      case "reroll-offers":
        state.feedback = rerollOffers(profile);
        state.preview = null;
        break;
      case "fuse":
        if (uid !== null) state.feedback = fuse(profile, uid);
        break;
      case "recal":
        if (uid !== null) state.feedback = recalibrate(profile, uid, Number(id));
        break;
      case "upgrade":
        if (uid !== null) state.feedback = upgrade(profile, uid) ? "Potenziato!" : "Monete insufficienti";
        break;
      case "sell":
        if (uid !== null && confirmed(`sell-${uid}`)) {
          const price = sell(profile, uid);
          state.feedback = price ? `Venduto per ${price} monete` : "";
          state.selected = null;
        }
        break;
      case "sell-commons":
        if (confirmed("commons")) {
          const { count, total } = sellCommons(profile);
          state.feedback = `Venduti ${count} pezzi comuni per ${total} monete`;
          if (state.selected !== null && !itemByUid(profile, state.selected)) state.selected = null;
        }
        break;
      default:
        return;
    }
    render();
  };

  function onClick(ev: Event) {
    const target = (ev.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!target || target.hasAttribute("disabled") || target.tagName === "SELECT") return;
    ev.stopPropagation();
    handle(target.dataset.action!, target.dataset.id, target.dataset.uid ? Number(target.dataset.uid) : null);
  }

  render();
};

// ---------- Esito missione ----------

export const showMissionResult = (
  result: {
    mission: MissionDef;
    victory: boolean;
    coins: number;
    bonus: number;
    items: GearItem[];
    firstClear: boolean;
    stars: number;
    difficulty: string;
    kills: number;
    time: number;
    contract?: { text: string; done: boolean; reward: number };
  },
  actions: { map: () => void; retry: () => void },
) => {
  closeScreen();
  const loot = result.items.length
    ? result.items
        .map((item) => {
          const def = mustGearDef(item.defId);
          return `<li style="--c:${hex(def.color)};--r:${rarityColor(item)}">${icon(def.icon)}<span><b>${esc(def.title)}</b><small>${RARITIES[item.rarity].label} · ${SLOT_LABELS[def.slot]}</small></span></li>`;
        })
        .join("")
    : `<li class="muted">Nessun bottino questa volta.</li>`;
  const root = el(`
    <div class="screen over">
      <div class="panel over__panel">
        <img class="result__ship" src="${asset("assets/images/starship.png")}" alt="" />
        <h2 class="title ${result.victory ? "title--good" : "title--danger"}">${result.victory ? "MISSIONE COMPIUTA" : "MISSIONE FALLITA"}</h2>
        <p class="muted">${result.mission.code} · ${esc(result.mission.title)} · ${esc(result.difficulty)}${result.firstClear ? " · prima vittoria!" : ""}</p>
        ${result.victory ? `<p class="result__stars mission-stars">${starsHtml(result.stars)}</p>` : ""}
        <div class="stats">
          <div><small>Abbattuti</small><b>${result.kills}</b></div>
          <div><small>Tempo</small><b>${formatTime(result.time)}</b></div>
          <div><small>Monete</small><b>${result.coins}</b></div>
          <div><small>Bonus</small><b>${result.bonus}</b></div>
        </div>
        ${result.contract ? `<p class="result__contract ${result.contract.done ? "is-done" : ""}">${icon(result.contract.done ? "check" : "flag")} Contratto: ${esc(result.contract.text)}${result.contract.done ? ` · +${result.contract.reward} monete` : " · non riuscito"}</p>` : ""}
        <section class="result__loot"><h3>Bottino</h3><ul class="build-list">${loot}</ul></section>
        ${result.victory ? "" : `<p class="muted">Monete e bottino raccolti restano tuoi: riprova quando vuoi.</p>`}
        <div class="pause__actions">
          <button class="btn btn--primary" data-act="map">${icon("map")} Hangar e mappa</button>
          <button class="btn" data-act="retry">${icon("reroll")} Riprova</button>
        </div>
      </div>
    </div>
  `);
  layer("screen").appendChild(root);
  root.querySelector("[data-act=map]")?.addEventListener("click", actions.map);
  root.querySelector("[data-act=retry]")?.addEventListener("click", actions.retry);
};
