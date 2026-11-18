import { icon } from "../../../art/svg";
import { DIFFICULTIES, type DifficultyId } from "../../../config";
import { esc } from "../../../ui/dom";
import { hex } from "../../../utils";
import { nodeContent } from "../events";
import { ilvlMul, mustGearDef } from "../gear";
import { MISSIONS, SECTOR, type MissionDef } from "../missions";
import { difficultyUnlocked, isMissionUnlocked, itemByUid, slotKeys, summarize, type CampaignProfile } from "../profile";
import {
  LAYERS,
  MUTATORS,
  NODE_KINDS,
  generateSector,
  isCombat,
  mutatorReward,
  nodeState,
  resolveMission,
  sectorOfId,
  type Sector,
  type SectorNode,
} from "../sectors";
import { starsHtml, type HubState } from "./common";

const DIFF_ORDER: DifficultyId[] = ["normal", "hard", "nightmare"];

/** Titolo e sottotitolo del settore mostrato. */
export const sectorHeading = (profile: CampaignProfile, n: number) =>
  n <= 1 ? { title: SECTOR.title, subtitle: SECTOR.subtitle } : { title: generateSector(profile.seed, n).title, subtitle: `Settore ${n}` };

// ---------- Settore 1 (fatto a mano) ----------

const handmadeMap = (profile: CampaignProfile, selectedId: string) => {
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
    return `<button class="map-node ${state} ${m.boss ? "is-boss" : ""} ${m.id === selectedId ? "is-selected" : ""}" style="left:${m.x}%;top:${m.y}%" data-action="mission" data-id="${m.id}" ${unlocked ? "" : "disabled"}>
      ${icon(done ? "check" : m.boss ? "boss" : unlocked ? "flag" : "lock")}<span>${m.code}</span>${starRow}${secret}
    </button>`;
  }).join("");
  return `<div class="map-inner"><svg class="map-edges" viewBox="0 0 100 100" preserveAspectRatio="none">${edges}</svg>${nodes}</div>`;
};

// ---------- Settori generati (mappa a nodi) ----------

const dagMap = (profile: CampaignProfile, sector: Sector, selectedId: string) => {
  const done = new Set(profile.completed);
  const all = [...sector.nodes.values()];
  const edges = all
    .flatMap((a) =>
      a.next.map((id) => {
        const b = sector.nodes.get(id)!;
        const walked = done.has(a.id) && done.has(b.id);
        const reachable = done.has(a.id) && nodeState(sector, b, done) === "open";
        return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${walked ? "is-walked" : reachable ? "is-open" : ""}"/>`;
      }),
    )
    .join("");
  const nodes = all
    .map((node) => {
      const state = nodeState(sector, node, done);
      const kind = NODE_KINDS[node.kind];
      const playable = state === "open" || state === "done";
      const stars = profile.stars[node.id] ?? 0;
      const starRow = state === "done" && isCombat(node.kind) ? `<i class="map-stars">${starsHtml(stars)}</i>` : "";
      const mutated = node.mission?.mutators?.length ? `<i class="map-mut" title="Mutatori">${node.mission.mutators.length}</i>` : "";
      return `<button class="map-node kind-${node.kind} is-${state} ${node.kind === "boss" ? "is-boss" : ""} ${node.id === selectedId ? "is-selected" : ""}" style="left:${node.x}%;top:${node.y}%" data-action="mission" data-id="${node.id}" ${playable ? "" : "disabled"} title="${kind.label}">
        ${icon(state === "done" ? "check" : kind.icon)}<span>${node.mission?.code ?? kind.label}</span>${starRow}${mutated}
      </button>`;
    })
    .join("");
  return `<div class="map-inner map-inner--dag"><svg class="map-edges" viewBox="0 0 100 100" preserveAspectRatio="none">${edges}</svg>${nodes}</div>`;
};

const sectorNav = (profile: CampaignProfile, n: number) => {
  const head = sectorHeading(profile, n);
  let info = "";
  if (n >= 2) {
    const first = generateSector(profile.seed, n).layers[0][0].mission!;
    const boss = generateSector(profile.seed, n).layers[LAYERS - 1][0].mission!;
    info = `<span class="hq-sector__info">${icon("skull")} Minaccia ×${first.threat!.hp.toFixed(2)}–${boss.threat!.hp.toFixed(2)} · ${icon("crate")} iL ${first.ilvl}–${boss.ilvl}</span>`;
  }
  return `<div class="hq-sector">
    <button class="btn btn--small btn--icon" data-action="sector" data-id="${n - 1}" ${n <= 1 ? "disabled" : ""} title="Settore precedente">‹</button>
    <span class="hq-map__label">${icon("map")} ${esc(head.subtitle)} · ${esc(head.title)}</span>
    <button class="btn btn--small btn--icon" data-action="sector" data-id="${n + 1}" ${n >= profile.sector ? "disabled" : ""} title="${n >= profile.sector ? "Batti il boss per sbloccare il settore successivo" : "Settore successivo"}">›</button>
    ${info}
  </div>`;
};

// ---------- Pannelli laterali ----------

const missionPanel = (profile: CampaignProfile, m: MissionDef, difficulty: DifficultyId) => {
  const unlocked = isMissionUnlocked(profile, m);
  const done = profile.completed.includes(m.id);
  const stars = profile.stars[m.id] ?? 0;
  const diffs = DIFF_ORDER.map((d) => {
    const open = difficultyUnlocked(profile, m.id, d);
    return `<button class="seg ${d === difficulty ? "is-on" : ""}" data-action="difficulty" data-id="${d}" ${open ? "" : "disabled"} title="${open ? esc(DIFFICULTIES[d].description) : "Vinci la difficoltà precedente per sbloccarla"}">${open ? "" : icon("lock")}${DIFFICULTIES[d].label}</button>`;
  }).join("");
  const firstAtDiff = stars < DIFF_ORDER.indexOf(difficulty) + 1;
  const scale = ilvlMul(m.ilvl) * mutatorReward(m.mutators) * (m.elite ? 1.3 : 1);
  const bonus = Math.round(40 * m.tier * DIFFICULTIES[difficulty].reward * (firstAtDiff ? 2 : 1) * scale);
  const threat = Array.from({ length: 5 }, (_, i) => `<i class="${i < m.tier ? "on" : ""}"></i>`).join("");
  const kind = m.boss ? "Boss" : m.elite ? "Élite" : "Missione";
  const mutators = (m.mutators ?? [])
    .map((id) => `<span class="hq-mut" title="${esc(MUTATORS[id].text)}">${icon("warning")} ${esc(MUTATORS[id].label)}<small>${esc(MUTATORS[id].text)}</small></span>`)
    .join("");
  return `
    <small class="muted">${kind} ${m.code}${done ? " · completata" : ""}</small>
    <h3 class="hq-mission__title">${esc(m.title)}</h3>
    <p>${esc(m.description)}</p>
    ${
      m.sector
        ? `<div class="threat"><span>Minaccia</span><b class="hq-threat">×${m.threat!.hp.toFixed(2)} HP · ×${m.threat!.damage.toFixed(2)} danno</b><span class="mission-stars">${starsHtml(stars)}</span></div>`
        : `<div class="threat"><span>Minaccia</span><span class="pips">${threat}</span><span class="mission-stars">${starsHtml(stars)}</span></div>`
    }
    ${mutators ? `<div class="hq-muts">${mutators}</div>` : ""}
    <div class="segmented segmented--small">${diffs}</div>
    <ul class="mission-facts">
      <li>${icon("coin")} Bonus vittoria: ${bonus} monete${firstAtDiff ? " (prima vittoria x2)" : ""}</li>
      <li>${icon("crate")} ${difficulty === "nightmare" ? "Bottino garantito raro o migliore" : difficulty === "hard" || firstAtDiff || m.elite ? "Bottino garantito non comune o migliore" : "Bottino garantito a fine missione"}${m.ilvl ? ` · item level ${m.ilvl}` : ""}</li>
      ${m.miniBoss ? `<li>${icon("warning")} Mini-boss lungo il percorso</li>` : ""}
      ${m.boss ? `<li>${icon("boss")} Boss a fine percorso${m.sector ? ` · apre il settore ${m.sector + 1}` : ""}</li>` : `<li>${icon("flag")} Raggiungi l'uscita in fondo al corridoio</li>`}
      ${m.biome === "toxic" ? `<li>${icon("warning")} Le nebulose tossiche tolgono HP</li>` : ""}
      <li>${icon("star")} Capsula segreta: ${profile.secrets.includes(m.id) ? "trovata" : "da trovare"}</li>
    </ul>
    <button class="btn btn--primary" data-action="launch" ${unlocked ? "" : "disabled"}>${icon("play")} Lancia missione</button>`;
};

const nodePanel = (profile: CampaignProfile, sector: Sector, node: SectorNode, feedback: string) => {
  const state = nodeState(sector, node, new Set(profile.completed));
  const content = nodeContent(profile, node);
  const kind = NODE_KINDS[node.kind];
  const head = `<small class="muted">${icon(kind.icon)} ${kind.label} · strato ${node.layer + 1}</small>
    <h3 class="hq-mission__title">${esc(content.title)}</h3>
    <p>${esc(content.text)}</p>`;
  if (state === "done") {
    return `${head}<p class="hq-outcome">${icon("check")} ${esc(feedback || profile.nodeOutcomes[node.id] || "Già risolto")}</p>`;
  }
  if (state !== "open") {
    return `${head}<p class="muted">${state === "skipped" ? "Hai scelto un'altra rotta in questo strato." : "Raggiungilo completando un nodo collegato."}</p>`;
  }
  const choices = content.choices
    .map(
      (c, i) => `<button class="hq-choice" data-action="node-choice" data-id="${i}" ${c.blocked ? "disabled" : ""}>
        <b>${esc(c.label)}</b><small>${esc(c.blocked ?? c.detail)}</small>
      </button>`,
    )
    .join("");
  return `${head}<div class="hq-choices">${choices}</div><p class="muted">Una sola scelta: poi il nodo è risolto e la rotta prosegue.</p>`;
};

/** Riepilogo compatto della nave nella vista Mappa, con scorciatoia all'hangar. */
const shipStrip = (profile: CampaignProfile) => {
  const s = summarize(profile);
  const chips = slotKeys(profile)
    .map((key) => itemByUid(profile, profile.equipped[key]))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => {
      const def = mustGearDef(item.defId);
      return `<span class="hq-chip" style="--c:${hex(def.color)}" title="${esc(def.title)}">${icon(def.icon)}</span>`;
    })
    .join("");
  return `<div class="hq-strip panel">
    <div class="hq-strip__gear">${chips}</div>
    <span>${icon("heart")} ${s.hp.toFixed(0)}</span>
    <span>${icon("tome-power")} ${s.dps.toFixed(1)}/s</span>
    <span class="${s.sink - s.heat < 0 ? "is-hot" : ""}">${icon("heat")} ${(s.sink - s.heat).toFixed(0)}/s</span>
    <button class="btn btn--small" data-action="tab" data-id="hangar">${icon("wrench")} Modifica nave</button>
  </div>`;
};

export const mapView = (profile: CampaignProfile, state: HubState) => {
  const n = state.sector;
  let board: string;
  let side: string;
  if (n <= 1) {
    const mission = MISSIONS.find((m) => m.id === state.missionId) ?? MISSIONS[0];
    board = handmadeMap(profile, mission.id);
    side = missionPanel(profile, mission, state.difficulty);
  } else {
    const sector = generateSector(profile.seed, n);
    const node = (sectorOfId(state.missionId) === n && sector.nodes.get(state.missionId)) || sector.layers[0][0];
    board = dagMap(profile, sector, node.id);
    side = isCombat(node.kind)
      ? missionPanel(profile, resolveMission(profile.seed, node.id), state.difficulty)
      : nodePanel(profile, sector, node, state.feedback);
  }
  return `<div class="hq-map">
    <section class="hq-map__board panel ${n >= 2 ? `biome-${generateSector(profile.seed, n).biome.id}` : ""}">
      ${sectorNav(profile, n)}
      ${board}
    </section>
    <aside class="hq-map__side">
      <section class="panel hq-mission">${side}</section>
      ${shipStrip(profile)}
    </aside>
  </div>`;
};
