import { icon } from "../art/svg";
import { DIFFICULTIES, LIMITS, type DifficultyId } from "../config";
import { ITEMS, RARITIES, TOMES, isEvolved, itemLevel, tomeLevel } from "../data/upgrades";
import type { Meta } from "../meta";
import type { DamageSource, Run, TomeOffer } from "../types";
import { fmt, formatTime, hex } from "../utils";
import { asset, el, esc, layer, morph } from "./dom";

let cleanupKeys: (() => void) | null = null;

export const closeScreen = () => {
  cleanupKeys?.();
  cleanupKeys = null;
  layer("screen").innerHTML = "";
};

const mount = (html: string, onKey?: (e: KeyboardEvent) => void) => {
  closeScreen();
  const node = el(html);
  layer("screen").appendChild(node);
  if (onKey) {
    const handler = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", handler);
    cleanupKeys = () => window.removeEventListener("keydown", handler);
  }
  return node;
};

const on = (root: HTMLElement, selector: string, fn: (node: HTMLElement) => void) =>
  root.querySelectorAll<HTMLElement>(selector).forEach((node) => node.addEventListener("click", () => fn(node)));

// ---------- Menu principale ----------

export const showMenu = (
  meta: Meta,
  actions: {
    play: (difficulty: DifficultyId) => void;
    campaign: () => void;
    shop: () => void;
    toggleSound: () => boolean;
    archive: () => void;
    settings: () => void;
  },
) => {
  let difficulty = meta.difficulty;
  const segs = (Object.keys(DIFFICULTIES) as DifficultyId[])
    .map((id) => `<button class="seg ${id === difficulty ? "is-on" : ""}" data-diff="${id}">${DIFFICULTIES[id].label}</button>`)
    .join("");

  const root = mount(
    `<div class="screen menu">
      <div class="menu__hero">
        <img class="menu__ship" src="${asset("assets/images/starship.png")}" alt="" />
        <h1 class="title">SPACE<span>WAR</span></h1>
        <p class="menu__tag">Orbital Survivor</p>
      </div>
      <div class="menu__modes">
        <section class="menu__panel panel mode-card mode-card--survival">
          <header>${icon("wave")}<div><b>Survival</b><small>Roguelite a wave infinite: tomi, oggetti, boss.</small></div></header>
          <button class="btn btn--primary" data-act="play">${icon("play")} Gioca</button>
          <div class="segmented">${segs}</div>
          <p class="menu__diff" data-diff-desc>${esc(DIFFICULTIES[difficulty].description)}</p>
          <button class="btn" data-act="shop">${icon("wrench")} Hangar <span class="pill">${icon("credits")}${meta.credits}</span></button>
          <div class="menu__stats">
            <span>${icon("trophy")} Record: wave <b>${meta.bestWave}</b></span>
            <span>${icon("clock")} Run: <b>${meta.runs}</b></span>
          </div>
        </section>
        <section class="menu__panel panel mode-card mode-card--campaign">
          <header>${icon("map")}<div><b>Campagna</b><small>Attraversa i settori, raccogli equipaggiamento e potenzialo.</small></div></header>
          <button class="btn btn--primary btn--campaign" data-act="campaign">${icon("flag")} Apri la mappa</button>
          <ul class="mode-card__list">
            <li>${icon("gear-blaster")} Armi, secondari, moduli e scafi</li>
            <li>${icon("arrow-up")} Potenzia o vendi il bottino</li>
            <li>${icon("boss")} Dopo il Dreadnought, settori infiniti generati</li>
          </ul>
        </section>
      </div>
      <div class="menu__corner">
        <button class="btn btn--small" data-act="archive">${icon("trophy")} Archivio</button>
        <button class="btn btn--small" data-act="settings">${icon("wrench")} Impostazioni</button>
        <button class="icon-btn" data-act="sound" title="Audio">${icon(meta.muted ? "soundOff" : "soundOn")}</button>
      </div>
      <div class="menu__keys">
        <span><kbd>WASD</kbd> muovi</span>
        <span><kbd>SPAZIO</kbd> scatto</span>
        <span><kbd>Q</kbd> torretta</span>
        <span><kbd>E</kbd> mina</span>
        <span><kbd>P</kbd> pausa</span>
        <span>la nave spara da sola</span>
      </div>
    </div>`,
    (e) => {
      if (e.key === "Enter") actions.play(difficulty);
    },
  );

  on(root, "[data-diff]", (node) => {
    difficulty = node.dataset.diff as DifficultyId;
    root.querySelectorAll(".seg").forEach((seg) => seg.classList.toggle("is-on", seg === node));
    root.querySelector("[data-diff-desc]")!.textContent = DIFFICULTIES[difficulty].description;
  });
  on(root, "[data-act=play]", () => actions.play(difficulty));
  on(root, "[data-act=shop]", actions.shop);
  on(root, "[data-act=campaign]", actions.campaign);
  on(root, "[data-act=archive]", actions.archive);
  on(root, "[data-act=settings]", actions.settings);
  on(root, "[data-act=sound]", (node) => (node.innerHTML = icon(actions.toggleSound() ? "soundOff" : "soundOn")));
};

// ---------- Hangar (sblocchi) ----------

export const showShop = (meta: Meta, actions: { buy: (key: string, cost: number) => boolean; back: () => void }) => {
  const card = (key: string, title: string, description: string, color: number, iconId: Parameters<typeof icon>[0], cost: number) => {
    const owned = meta.unlocked.includes(key);
    const affordable = meta.credits >= cost;
    return `<button class="shop-card ${owned ? "is-owned" : ""} ${!owned && !affordable ? "is-poor" : ""}" style="--c:${hex(color)}" data-key="${key}" data-cost="${cost}" ${owned ? "disabled" : ""}>
      <span class="shop-card__icon">${icon(iconId)}</span>
      <span class="shop-card__body"><b>${esc(title)}</b><small>${esc(description)}</small></span>
      <span class="shop-card__state">${owned ? `${icon("check")} Nel pool` : `${icon("lock")} ${cost}`}</span>
    </button>`;
  };

  const html = () => `
        <header class="shop__head">
          <h2 class="title title--sm">HANGAR</h2>
          <span class="pill pill--big">${icon("credits")}${meta.credits} crediti</span>
        </header>
        <p class="shop__intro">I crediti si guadagnano a fine run. Gli sblocchi aggiungono tomi e oggetti ai pool: nessun bonus iniziale.</p>
        <h3>Tomi</h3>
        <div class="shop__grid">${TOMES.map((t) => card(`tome:${t.id}`, t.title, `+${t.increment}% ${t.stat}. Evolve in ${t.evolution.title}.`, t.color, t.icon, t.cost)).join("")}</div>
        <h3>Oggetti</h3>
        <div class="shop__grid">${ITEMS.map((i) => card(`item:${i.id}`, i.title, i.description, i.color, i.icon, i.cost)).join("")}</div>
        <div class="shop__actions"><button class="btn" data-act="back">${icon("home")} Menu</button></div>`;

  // Creata una volta: gli acquisti aggiornano la schermata sul posto.
  const root = mount(`<div class="screen shop">${html()}</div>`, (e) => {
    if (e.key === "Escape") actions.back();
  });
  root.addEventListener("click", (ev) => {
    const node = (ev.target as HTMLElement).closest<HTMLElement>("[data-key], [data-act=back]");
    if (!node || node.hasAttribute("disabled")) return;
    if (node.dataset.act === "back") return actions.back();
    if (actions.buy(node.dataset.key!, Number(node.dataset.cost))) {
      morph(root, html());
      return;
    }
    node.classList.add("shake");
    window.setTimeout(() => node.classList.remove("shake"), 400);
  });
};

// ---------- Level-up ----------

export const showLevelUp = (
  run: Run,
  offers: TomeOffer[],
  reroll: { label: string; enabled: boolean },
  actions: { pick: (offer: TomeOffer) => void; reroll: () => void },
) => {
  const cards = offers
    .map((offer, i) => {
      const { tome, rarity, value } = offer;
      const level = tomeLevel(run, tome.id);
      const next = level + 1;
      const pips = Array.from({ length: LIMITS.tomeMaxLevel }, (_, p) => `<i class="${p < level ? "on" : p === level ? "next" : ""}"></i>`).join("");
      const evolves = next >= LIMITS.tomeMaxLevel;
      const r = RARITIES[rarity];
      return `<button class="card" style="--c:${hex(tome.color)};--r:${hex(r.color)}" data-i="${i}">
        <span class="card__key">${i + 1}</span>
        <span class="card__rarity">${r.label}</span>
        ${level === 0 ? `<span class="card__new">Nuovo</span>` : ""}
        <span class="card__icon">${icon(tome.icon)}</span>
        <h3>${esc(tome.title)}</h3>
        <p class="card__value">+${fmt(Math.round(value * 10) / 10)}% ${esc(tome.stat)}</p>
        <span class="pips">${pips}</span>
        <p class="card__evo ${evolves ? "is-now" : ""}">${evolves ? `${icon("star")} EVOLVE: ` : "Liv. 5: "}<b>${esc(tome.evolution.title)}</b><br/><small>${esc(tome.evolution.description)}</small></p>
      </button>`;
    })
    .join("");

  let armed = false;
  const root = mount(
    `<div class="screen levelup">
      <h2 class="title title--sm">LIVELLO ${run.level}</h2>
      <p class="levelup__sub">Scegli un tomo · ${Object.keys(run.tomes).length}/${LIMITS.maxRunTomes} discipline</p>
      <div class="cards">${cards}</div>
      <button class="btn btn--ghost" data-act="reroll" ${reroll.enabled ? "" : "disabled"}>${icon("reroll")} ${esc(reroll.label)} <kbd>R</kbd></button>
    </div>`,
    (e) => {
      if (!armed) return;
      const index = Number(e.key) - 1;
      if (offers[index]) actions.pick(offers[index]);
      if (e.key.toLowerCase() === "r" && reroll.enabled) actions.reroll();
    },
  );
  // Protezione dai click/tasti ereditati dal gameplay.
  root.classList.add("is-arming");
  window.setTimeout(() => {
    armed = true;
    root.classList.remove("is-arming");
  }, 380);
  on(root, "[data-i]", (node) => armed && actions.pick(offers[Number(node.dataset.i)]));
  on(root, "[data-act=reroll]", () => armed && actions.reroll());
};

// ---------- Pausa ----------

const buildList = (run: Run) => {
  const tomes = TOMES.filter((t) => run.tomes[t.id]).map((t) => {
    const evolved = isEvolved(run, t.id);
    return `<li style="--c:${hex(t.color)}">${icon(t.icon)}<span><b>${esc(evolved ? t.evolution.title : t.title)}</b><small>Liv. ${tomeLevel(run, t.id)} · +${fmt(Math.round(run.tomes[t.id]!.bonus))}% ${esc(t.stat)}</small></span></li>`;
  });
  const items = ITEMS.filter((i) => run.items[i.id]).map(
    (i) => `<li style="--c:${hex(i.color)}">${icon(i.icon)}<span><b>${esc(i.title)}</b><small>Liv. ${itemLevel(run, i.id)} · ${esc(i.perLevel)}</small></span></li>`,
  );
  const all = [...tomes, ...items];
  return all.length ? `<ul class="build-list">${all.join("")}</ul>` : `<p class="muted">Nessun tomo o oggetto, per ora.</p>`;
};

/** Contenuto della pausa fornito dalla modalità (la campagna mostra l'equipaggiamento). */
export interface PauseContent {
  subtitle: string;
  body: string;
  quitLabel: string;
}

export const showPause = (
  run: Run,
  muted: boolean,
  actions: { resume: () => void; quit: () => void; toggleSound: () => boolean; settings: () => void },
  content?: PauseContent,
) => {
  const root = mount(
    `<div class="screen pause">
      <div class="panel pause__panel">
        <h2 class="title title--sm">PAUSA</h2>
        <p class="muted">${content ? esc(content.subtitle) : `Wave ${run.wave} · ${formatTime(run.time)} · ${run.kills} abbattuti`}</p>
        ${content ? content.body : buildList(run)}
        <div class="pause__actions">
          <button class="btn btn--primary" data-act="resume">${icon("play")} Riprendi <kbd>P</kbd></button>
          <button class="btn" data-act="sound">${icon(muted ? "soundOff" : "soundOn")} Audio</button>
          <button class="btn" data-act="settings">${icon("wrench")} Impostazioni</button>
          <button class="btn btn--danger" data-act="quit">${icon("skull")} ${content ? esc(content.quitLabel) : "Abbandona run"}</button>
        </div>
      </div>
    </div>`,
  );
  on(root, "[data-act=resume]", actions.resume);
  on(root, "[data-act=quit]", actions.quit);
  on(root, "[data-act=settings]", actions.settings);
  on(root, "[data-act=sound]", (node) => (node.innerHTML = `${icon(actions.toggleSound() ? "soundOff" : "soundOn")} Audio`));
};

// ---------- Fine run ----------

const SOURCE_LABELS: Record<DamageSource, string> = {
  blaster: "Cannone",
  drone: "Droni",
  blade: "Lame",
  arc: "Arco elettrico",
  turret: "Torrette",
  mine: "Mine",
  trail: "Scia al plasma",
  pulse: "Repulsore",
  emp: "EMP",
  blast: "Esplosioni",
  missile: "Missili",
  bomb: "Bombe",
};

export const showGameOver = (
  run: Run,
  result: { credits: number; totalCredits: number; record: boolean },
  actions: { retry: () => void; shop: () => void; menu: () => void },
) => {
  const sources = (Object.entries(run.damageBySource) as [DamageSource, number][]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const max = sources[0]?.[1] ?? 1;
  const bars = sources
    .map(
      ([source, value]) =>
        `<div class="dmg-row"><span>${SOURCE_LABELS[source]}</span><div class="dmg-bar"><i style="width:${(value / max) * 100}%"></i></div><b>${Math.round(value)}</b></div>`,
    )
    .join("");

  const root = mount(
    `<div class="screen over">
      <div class="panel over__panel">
        <h2 class="title title--danger">NAVE DISTRUTTA</h2>
        ${result.record ? `<p class="over__record">${icon("trophy")} Nuovo record!</p>` : ""}
        <div class="stats">
          <div><small>Wave</small><b>${run.wave}</b></div>
          <div><small>Livello</small><b>${run.level}</b></div>
          <div><small>Abbattuti</small><b>${run.kills}</b></div>
          <div><small>Tempo</small><b>${formatTime(run.time)}</b></div>
        </div>
        <p class="over__credits">${icon("credits")} +${result.credits} crediti <small>(totale ${result.totalCredits})</small></p>
        <div class="over__cols">
          <section><h3>Danni per fonte</h3>${bars || `<p class="muted">Nessun danno inflitto.</p>`}</section>
          <section><h3>Build</h3>${buildList(run)}</section>
        </div>
        <div class="pause__actions">
          <button class="btn btn--primary" data-act="retry">${icon("reroll")} Riprova <kbd>R</kbd></button>
          <button class="btn" data-act="shop">${icon("wrench")} Hangar</button>
          <button class="btn" data-act="menu">${icon("home")} Menu</button>
        </div>
      </div>
    </div>`,
    (e) => {
      if (e.key.toLowerCase() === "r") actions.retry();
    },
  );
  on(root, "[data-act=retry]", actions.retry);
  on(root, "[data-act=shop]", actions.shop);
  on(root, "[data-act=menu]", actions.menu);
};
