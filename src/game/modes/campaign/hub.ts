import { icon } from "../../art/svg";
import { DIFFICULTIES, type DifficultyId } from "../../config";
import { RARITIES } from "../../data/upgrades";
import { asset, el, esc, layer } from "../../ui/dom";
import { closeScreen } from "../../ui/screens";
import { formatTime, hex } from "../../utils";
import {
  GEAR_MAX_LEVEL,
  SLOT_LABELS,
  buyPrice,
  describeGear,
  milestonesOf,
  mustGearDef,
  sellPrice,
  upgradeCost,
  weaponDps,
  weaponHeat,
  weaponSpec,
  type GearDef,
  type GearItem,
} from "./gear";
import { MISSIONS, SECTOR, type MissionDef } from "./missions";
import {
  buildLoadout,
  buy,
  canUnequip,
  commonsValue,
  difficultyUnlocked,
  equip,
  equippedOfType,
  equippedSlotOf,
  saveProfile,
  sellCommons,
  isMissionUnlocked,
  itemByUid,
  loadProfile,
  nextMission,
  sell,
  shopCatalog,
  slotKeys,
  slotType,
  unequip,
  upgrade,
  type CampaignProfile,
  type SlotKey,
} from "./profile";

const SLOT_SHORT: Record<string, string> = {
  hull: "Scafo",
  front: "Frontale",
  rear: "Coda",
  missile: "Missili",
  bomb: "Bombe",
  device: "Dispositivo",
};

const slotLabel = (key: SlotKey) => {
  const type = slotType(key);
  const index = Number(key.replace(/\D/g, ""));
  return type === "front" || type === "device" ? `${SLOT_SHORT[type]} ${index + 1}` : SLOT_SHORT[type];
};

/** Tre stelle: piene per le difficoltà vinte, spente per le altre. */
const starsHtml = (stars: number) => [1, 2, 3].map((n) => `<b class="${n <= stars ? "on" : ""}">★</b>`).join("");

const rarityColor = (item: GearItem) => hex(RARITIES[item.rarity].color);

const itemTile = (item: GearItem, selected: boolean, equipped: boolean) => {
  const def = mustGearDef(item.defId);
  return `<button class="gear-tile ${selected ? "is-selected" : ""}" style="--c:${hex(def.color)};--r:${rarityColor(item)}" data-item="${item.uid}" title="${esc(def.title)}">
    ${icon(def.icon)}<b>${item.level}</b>${equipped ? `<i>${icon("check")}</i>` : ""}${item.fresh ? `<em class="badge-new">NUOVO</em>` : ""}
  </button>`;
};

/** Hub della campagna: mappa del settore + equipaggiamento + hangar/negozio. */
export const openCampaignHub = (actions: { launch: (missionId: string, difficulty: DifficultyId) => void; back: () => void }) => {
  const profile = loadProfile();
  let missionId = nextMission(profile).id;
  let selected: number | null = profile.equipped.front0 ?? null;
  let tab: "hangar" | "shop" = "hangar";
  let feedback = "";
  let preview: string | null = null;
  let difficulty: DifficultyId = "normal";
  let confirmSell = false;

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
          <aside class="hub__mission panel">${renderMission(profile, mission, difficulty)}</aside>
        </div>
        <div class="hub__bottom">
          <section class="hub__loadout panel">${renderLoadout(profile, selected)}</section>
          <section class="hub__inventory panel">
            <div class="hub__tabs">
              <button class="tab ${tab === "hangar" ? "is-on" : ""}" data-tab="hangar">${icon("crate")} Hangar · ${profile.inventory.length}</button>
              <button class="tab ${tab === "shop" ? "is-on" : ""}" data-tab="shop">${icon("coin")} Negozio</button>
            </div>
            ${tab === "hangar" ? renderInventory(profile, selected, confirmSell) : renderShop(profile, preview)}
          </section>
          <aside class="hub__detail panel">${preview ? renderPreview(profile, mustGearDef(preview), feedback) : renderDetail(profile, selected, feedback)}</aside>
        </div>
      </div>
    `);
    layer("screen").appendChild(root);

    const click = (selector: string, fn: (node: HTMLElement) => void) =>
      root.querySelectorAll<HTMLElement>(selector).forEach((node) =>
        node.addEventListener("click", () => {
          fn(node);
          render();
        }),
      );

    root.querySelector("[data-act=back]")?.addEventListener("click", actions.back);
    root.querySelector("[data-act=launch]")?.addEventListener("click", () => actions.launch(missionId, difficulty));
    click("[data-mission]", (node) => {
      missionId = node.dataset.mission!;
      difficulty = "normal";
    });
    click("[data-mdiff]", (node) => (difficulty = node.dataset.mdiff as DifficultyId));
    click("[data-tab]", (node) => {
      tab = node.dataset.tab as typeof tab;
      preview = null;
      confirmSell = false;
    });
    click("[data-item]", (node) => {
      selected = Number(node.dataset.item);
      preview = null;
      feedback = "";
      const item = itemByUid(profile, selected);
      if (item?.fresh) {
        item.fresh = false;
        saveProfile(profile);
      }
    });
    click("[data-slot]", (node) => {
      const uid = profile.equipped[node.dataset.slot!];
      if (uid !== null && uid !== undefined) selected = uid;
      preview = null;
      feedback = "";
    });
    click("[data-preview]", (node) => {
      preview = node.dataset.preview!;
      feedback = "";
      if (!profile.seenShop.includes(preview)) {
        profile.seenShop.push(preview);
        saveProfile(profile);
      }
    });
    const purchase = (mount: boolean) => {
      if (!preview) return;
      const item = buy(profile, preview);
      if (!item) {
        feedback = "Monete insufficienti";
        return;
      }
      item.fresh = false;
      feedback = `Acquistato: ${mustGearDef(item.defId).title}`;
      if (mount) feedback = equip(profile, item.uid) || `${mustGearDef(item.defId).title} montato`;
      saveProfile(profile);
      selected = item.uid;
      preview = null;
      tab = "hangar";
    };
    click("[data-buy]", () => purchase(false));
    click("[data-buy-mount]", () => purchase(true));
    click("[data-sell-commons]", () => {
      if (!confirmSell) {
        confirmSell = true;
        return;
      }
      const { count, total } = sellCommons(profile);
      feedback = `Venduti ${count} pezzi comuni per ${total} monete`;
      confirmSell = false;
      if (selected !== null && !itemByUid(profile, selected)) selected = null;
    });
    click("[data-gear=equip]", () => {
      if (selected !== null) feedback = equip(profile, selected);
    });
    click("[data-gear=unequip]", () => {
      const key = selected !== null ? equippedSlotOf(profile, selected) : undefined;
      if (key) unequip(profile, key);
    });
    click("[data-gear=upgrade]", () => {
      if (selected !== null) feedback = upgrade(profile, selected) ? "Potenziato!" : "Monete insufficienti";
    });
    click("[data-gear=sell]", () => {
      if (selected === null) return;
      const price = sell(profile, selected);
      feedback = price ? `Venduto per ${price} monete` : "";
      selected = null;
    });
  };

  render();
};

const sortedInventory = (profile: CampaignProfile) => {
  const slotOrder = ["front", "rear", "missile", "bomb", "device", "hull"];
  const rarityOrder = ["legendary", "rare", "uncommon", "common"];
  return [...profile.inventory].sort((a, b) => {
    const da = mustGearDef(a.defId);
    const db = mustGearDef(b.defId);
    return (
      slotOrder.indexOf(da.slot) - slotOrder.indexOf(db.slot) ||
      rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity) ||
      b.level - a.level
    );
  });
};

const renderInventory = (profile: CampaignProfile, selected: number | null, confirmSell: boolean) => {
  const commons = commonsValue(profile);
  const sellButton = commons.count
    ? `<button class="btn btn--small ${confirmSell ? "btn--danger" : ""}" data-sell-commons>${icon("coin")} ${confirmSell ? `Conferma: vendi ${commons.count} per ${commons.total}` : `Vendi comuni liberi (${commons.count}) +${commons.total}`}</button>`
    : "";
  return `${sellButton}<div class="gear-grid">${sortedInventory(profile)
    .map((item) => itemTile(item, item.uid === selected, Boolean(equippedSlotOf(profile, item.uid))))
    .join("")}</div>`;
};

const renderShop = (profile: CampaignProfile, preview: string | null) => {
  const rows = shopCatalog(profile)
    .map((def) => {
      const price = buyPrice(def);
      const isNew = !profile.seenShop.includes(def.id);
      return `<button class="shop-row ${def.id === preview ? "is-selected" : ""}" style="--c:${hex(def.color)}" data-preview="${def.id}">
        <span class="shop-row__icon">${icon(def.icon)}</span>
        <span class="shop-row__body"><b>${esc(def.title)} ${isNew ? `<em class="badge-new">NUOVO</em>` : ""}</b><small>${SLOT_LABELS[def.slot]} · ${esc(def.description)}</small></span>
        <span class="shop-row__price ${profile.coins < price ? "is-poor" : ""}">${icon("coin")} ${price}</span>
      </button>`;
    })
    .join("");
  return `<p class="muted shop-note">Il catalogo si allarga completando missioni. Le rarità migliori si trovano solo nel bottino.</p><div class="shop-list">${rows}</div>`;
};

/** Riga di confronto per le armi: danno al secondo e calore al secondo. */
const weaponSummary = (item: GearItem) => {
  const spec = weaponSpec(item);
  if (!spec) return "";
  return `${weaponDps(spec).toFixed(1)} danno/s · ${weaponHeat(spec).toFixed(0)} calore/s`;
};

const renderPreview = (profile: CampaignProfile, def: GearDef, feedback: string) => {
  const item: GearItem = { uid: -1, defId: def.id, rarity: "common", level: 1 };
  const price = buyPrice(def);
  const current = equippedOfType(profile, def.slot);
  const fits = def.slot === "hull" || slotKeys(profile).some((key) => slotType(key) === def.slot);
  const isWeapon = Boolean(def.weapon);
  const compare = current
    ? `<div class="compare">
        <small>Montato ora: <b>${esc(mustGearDef(current.defId).title)}</b> Liv. ${current.level}</small>
        ${isWeapon ? `<p>${weaponSummary(current)} → <b>${weaponSummary(item)}</b></p>` : `<ul class="gear-stats gear-stats--muted">${describeGear(current).map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`}
      </div>`
    : `<p class="muted">${fits ? "Slot libero: si monta subito." : "Lo scafo montato non ha slot di questo tipo."}</p>`;
  return `
    <div class="gear-detail" style="--c:${hex(def.color)};--r:${hex(RARITIES.common.color)}">
      <span class="gear-detail__icon">${icon(def.icon)}</span>
      <div><small>Negozio · ${SLOT_LABELS[def.slot]}</small><h3>${esc(def.title)}</h3></div>
    </div>
    <p class="muted">${esc(def.description)}</p>
    <ul class="gear-stats">${describeGear(item).map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
    ${milestonesOf(item).length ? `<ul class="gear-milestones">${milestonesOf(item).map((m) => `<li>${icon("lock")} Liv. ${m.level}: ${esc(m.text)}</li>`).join("")}</ul>` : ""}
    ${compare}
    <div class="gear-actions">
      <button class="btn" data-buy ${profile.coins < price ? "disabled" : ""}>${icon("coin")} Compra ${price}</button>
      <button class="btn btn--primary btn--small" data-buy-mount ${profile.coins < price || !fits ? "disabled" : ""}>${icon("check")} Compra e monta</button>
    </div>
    ${feedback ? `<p class="hub__feedback">${esc(feedback)}</p>` : ""}`;
};

/** Cosa cambia al prossimo livello di upgrade. */
const upgradePreview = (item: GearItem) => {
  if (item.level >= GEAR_MAX_LEVEL) return "";
  const now = describeGear(item);
  const next = describeGear({ ...item, level: item.level + 1 });
  const diffs = now
    .map((line, i) => (next[i] && next[i] !== line ? `${line} → ${next[i].slice(next[i].lastIndexOf(" ") + 1)}` : ""))
    .filter(Boolean);
  const unlock = milestonesOf(item).find((m) => m.level === item.level + 1);
  if (diffs.length === 0 && !unlock) return "";
  return `<div class="compare"><small>Al livello ${item.level + 1}</small><ul class="gear-stats">${diffs.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>${unlock ? `<p class="unlock">${icon("star")} Sblocca: ${esc(unlock.text)}</p>` : ""}</div>`;
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
    const stars = profile.stars[m.id] ?? 0;
    const starRow = done ? `<i class="map-stars">${starsHtml(stars)}</i>` : "";
    const secret = profile.secrets.includes(m.id) ? `<i class="map-secret" title="Capsula trovata">${icon("star")}</i>` : "";
    return `<button class="map-node ${state} ${m.boss ? "is-boss" : ""} ${m.id === selectedId ? "is-selected" : ""}" style="left:${m.x}%;top:${m.y}%" data-mission="${m.id}" ${unlocked ? "" : "disabled"}>
      ${icon(done ? "check" : m.boss ? "boss" : unlocked ? "flag" : "lock")}<span>${m.code}</span>${starRow}${secret}
    </button>`;
  }).join("");
  return `<div class="map-inner"><svg class="map-edges" viewBox="0 0 100 100" preserveAspectRatio="none">${edges}</svg>${nodes}</div>`;
};

const DIFF_ORDER: DifficultyId[] = ["normal", "hard", "nightmare"];

const renderMission = (profile: CampaignProfile, m: MissionDef, difficulty: DifficultyId) => {
  const unlocked = isMissionUnlocked(profile, m);
  const done = profile.completed.includes(m.id);
  const stars = profile.stars[m.id] ?? 0;
  const diffs = DIFF_ORDER.map((d) => {
    const open = difficultyUnlocked(profile, m.id, d);
    return `<button class="seg ${d === difficulty ? "is-on" : ""}" data-mdiff="${d}" ${open ? "" : "disabled"} title="${open ? esc(DIFFICULTIES[d].description) : "Vinci la difficoltà precedente per sbloccarla"}">${open ? "" : icon("lock")}${DIFFICULTIES[d].label}</button>`;
  }).join("");
  const firstAtDiff = (profile.stars[m.id] ?? 0) < DIFF_ORDER.indexOf(difficulty) + 1;
  const bonus = Math.round(40 * m.tier * DIFFICULTIES[difficulty].reward * (firstAtDiff ? 2 : 1));
  const secretFound = profile.secrets.includes(m.id);
  const threat = Array.from({ length: 5 }, (_, i) => `<i class="${i < m.tier ? "on" : ""}"></i>`).join("");
  return `
    <small class="muted">Missione ${m.code}${done ? " · completata" : ""}</small>
    <h3>${esc(m.title)}</h3>
    <p>${esc(m.description)}</p>
    <div class="threat"><span>Minaccia</span><span class="pips">${threat}</span><span class="mission-stars">${starsHtml(stars)}</span></div>
    <div class="segmented segmented--small">${diffs}</div>
    <ul class="mission-facts">
      <li>${icon("coin")} Bonus vittoria: ${bonus} monete${firstAtDiff ? " (prima vittoria x2)" : ""}</li>
      <li>${icon("crate")} ${difficulty === "nightmare" ? "Bottino garantito raro o migliore" : difficulty === "hard" || firstAtDiff ? "Bottino garantito non comune o migliore" : "Bottino garantito a fine missione"}</li>
      ${m.miniBoss ? `<li>${icon("warning")} Mini-boss lungo il percorso</li>` : ""}
      ${m.boss ? `<li>${icon("boss")} Boss a fine percorso</li>` : `<li>${icon("flag")} Raggiungi l'uscita in fondo al corridoio</li>`}
      <li>${icon("star")} Capsula segreta: ${secretFound ? "trovata" : "da trovare"}</li>
    </ul>
    <button class="btn btn--primary" data-act="launch" ${unlocked ? "" : "disabled"}>${icon("play")} Lancia missione</button>`;
};

const renderLoadout = (profile: CampaignProfile, selected: number | null) => {
  const slots = slotKeys(profile)
    .map((key) => {
      const item = itemByUid(profile, profile.equipped[key]);
      if (!item) return `<button class="loadout-slot is-empty" data-slot="${key}"><span>${slotLabel(key)}</span><em>vuoto</em></button>`;
      const def = mustGearDef(item.defId);
      return `<button class="loadout-slot ${item.uid === selected ? "is-selected" : ""}" style="--c:${hex(def.color)};--r:${rarityColor(item)}" data-slot="${key}">
        <span>${slotLabel(key)}</span>${icon(def.icon)}<b>${esc(def.title)}</b><small>Liv. ${item.level}</small>
      </button>`;
    })
    .join("");
  const { ship, rack, mounts } = buildLoadout(profile);
  const dps = mounts
    .filter((m) => m.slot === "front")
    .reduce((sum, m) => sum + weaponDps(m.spec) * rack.damageMul * rack.rateMul, 0);
  return `
    <h3>${icon("gear-hull")} Equipaggiamento</h3>
    <div class="loadout">${slots}</div>
    <div class="loadout-stats">
      <span>${icon("heart")} ${ship.maxHp.toFixed(1)} HP</span>
      <span>${icon("tome-power")} ${dps.toFixed(1)} danno/s</span>
      <span>${icon("heat")} ${Math.round(rack.heatCap)} · ${Math.round(rack.heatSink)}/s</span>
      <span>${icon("tome-mobility")} ${Math.round(ship.speed)} velocità</span>
    </div>`;
};

const renderDetail = (profile: CampaignProfile, uid: number | null, feedback: string) => {
  const item = itemByUid(profile, uid);
  const fb = feedback ? `<p class="hub__feedback">${esc(feedback)}</p>` : "";
  if (!item) return `<p class="muted">Seleziona un oggetto o uno slot per vederne le statistiche.</p>${fb}`;
  const def = mustGearDef(item.defId);
  const key = equippedSlotOf(profile, item.uid);
  const cost = upgradeCost(item);
  const maxed = item.level >= GEAR_MAX_LEVEL;
  const milestones = milestonesOf(item)
    .map((m) => `<li class="${m.reached ? "is-reached" : ""}">${icon(m.reached ? "check" : "lock")} Liv. ${m.level}: ${esc(m.text)}</li>`)
    .join("");
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
    ${milestones ? `<ul class="gear-milestones">${milestones}</ul>` : ""}
    ${upgradePreview(item)}
    <div class="gear-actions">
      ${
        key
          ? canUnequip(profile, key)
            ? `<button class="btn" data-gear="unequip">Rimuovi</button>`
            : `<span class="muted">Montato</span>`
          : `<button class="btn" data-gear="equip">${icon("check")} Monta</button>`
      }
      <button class="btn" data-gear="upgrade" ${maxed || profile.coins < cost ? "disabled" : ""}>${icon("arrow-up")} ${maxed ? "Livello max" : `Potenzia ${cost}`}</button>
      <button class="btn btn--danger" data-gear="sell" ${key ? "disabled" : ""}>${icon("coin")} Vendi ${sellPrice(item)}</button>
    </div>
    ${fb}`;
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
