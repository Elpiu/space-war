import { icon } from "../../../art/svg";
import { DIFFICULTIES, type DifficultyId } from "../../../config";
import { esc } from "../../../ui/dom";
import { hex } from "../../../utils";
import { mustGearDef } from "../gear";
import { MISSIONS, SECTOR, type MissionDef } from "../missions";
import { difficultyUnlocked, isMissionUnlocked, itemByUid, slotKeys, summarize, type CampaignProfile } from "../profile";
import { starsHtml, type HubState } from "./common";

const DIFF_ORDER: DifficultyId[] = ["normal", "hard", "nightmare"];

const sectorMap = (profile: CampaignProfile, selectedId: string) => {
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

const missionPanel = (profile: CampaignProfile, m: MissionDef, difficulty: DifficultyId) => {
  const unlocked = isMissionUnlocked(profile, m);
  const done = profile.completed.includes(m.id);
  const stars = profile.stars[m.id] ?? 0;
  const diffs = DIFF_ORDER.map((d) => {
    const open = difficultyUnlocked(profile, m.id, d);
    return `<button class="seg ${d === difficulty ? "is-on" : ""}" data-action="difficulty" data-id="${d}" ${open ? "" : "disabled"} title="${open ? esc(DIFFICULTIES[d].description) : "Vinci la difficoltà precedente per sbloccarla"}">${open ? "" : icon("lock")}${DIFFICULTIES[d].label}</button>`;
  }).join("");
  const firstAtDiff = stars < DIFF_ORDER.indexOf(difficulty) + 1;
  const bonus = Math.round(40 * m.tier * DIFFICULTIES[difficulty].reward * (firstAtDiff ? 2 : 1));
  const threat = Array.from({ length: 5 }, (_, i) => `<i class="${i < m.tier ? "on" : ""}"></i>`).join("");
  return `
    <small class="muted">Missione ${m.code}${done ? " · completata" : ""}</small>
    <h3 class="hq-mission__title">${esc(m.title)}</h3>
    <p>${esc(m.description)}</p>
    <div class="threat"><span>Minaccia</span><span class="pips">${threat}</span><span class="mission-stars">${starsHtml(stars)}</span></div>
    <div class="segmented segmented--small">${diffs}</div>
    <ul class="mission-facts">
      <li>${icon("coin")} Bonus vittoria: ${bonus} monete${firstAtDiff ? " (prima vittoria x2)" : ""}</li>
      <li>${icon("crate")} ${difficulty === "nightmare" ? "Bottino garantito raro o migliore" : difficulty === "hard" || firstAtDiff ? "Bottino garantito non comune o migliore" : "Bottino garantito a fine missione"}</li>
      ${m.miniBoss ? `<li>${icon("warning")} Mini-boss lungo il percorso</li>` : ""}
      ${m.boss ? `<li>${icon("boss")} Boss a fine percorso</li>` : `<li>${icon("flag")} Raggiungi l'uscita in fondo al corridoio</li>`}
      <li>${icon("star")} Capsula segreta: ${profile.secrets.includes(m.id) ? "trovata" : "da trovare"}</li>
    </ul>
    <button class="btn btn--primary" data-action="launch" ${unlocked ? "" : "disabled"}>${icon("play")} Lancia missione</button>`;
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
  const mission = MISSIONS.find((m) => m.id === state.missionId) ?? MISSIONS[0];
  return `<div class="hq-map">
    <section class="hq-map__board panel">
      <small class="hq-map__label">${icon("map")} ${esc(SECTOR.subtitle)} · ${esc(SECTOR.title)}</small>
      ${sectorMap(profile, mission.id)}
    </section>
    <aside class="hq-map__side">
      <section class="panel hq-mission">${missionPanel(profile, mission, state.difficulty)}</section>
      ${shipStrip(profile)}
    </aside>
  </div>`;
};
