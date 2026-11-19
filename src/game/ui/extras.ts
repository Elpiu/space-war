import { ENEMY_SPRITES } from "../art/enemySprites";
import { SPRITES, icon } from "../art/svg";
import { svgUrl } from "../art/textures";
import { MEDALS, PAINTS, getArchive, paintUnlocked, totalKills, type MedalContext } from "../archive";
import { audio } from "../audio";
import { ENEMIES } from "../data/enemies";
import { GEAR, SLOT_LABELS } from "../modes/campaign/gear";
import { applySave, exportSave, readSave } from "../savefile";
import { getSettings, saveSettings } from "../settings";
import { asset, el, esc, layer, morph } from "./dom";
import { closeScreen } from "./screens";
import { hex } from "../utils";

// ---------- Impostazioni (finestra sopra il menu o la pausa) ----------

/**
 * Finestra delle impostazioni: volumi, tremolio, numeri di danno, avvisi ad
 * alto contrasto, esporta/importa del salvataggio.
 */
export const showSettings = (onClose?: () => void) => {
  layer("modal").innerHTML = "";
  let feedback = "";
  let pending: Record<string, string> | null = null;

  const html = () => {
    const s = getSettings();
    const seg = (key: "shake", value: number, label: string) =>
      `<button class="seg ${s[key] === value ? "is-on" : ""}" data-set="${key}" data-value="${value}">${label}</button>`;
    const toggle = (key: "damageNumbers" | "contrast", label: string, hint: string) =>
      `<label class="set-row set-row--toggle"><span><b>${label}</b><small>${hint}</small></span><input type="checkbox" data-toggle="${key}" ${s[key] ? "checked" : ""}/></label>`;
    return `<div class="panel settings__panel">
      <h2 class="title title--sm">IMPOSTAZIONI</h2>
      <label class="set-row"><span><b>Musica</b></span><input type="range" min="0" max="100" value="${Math.round(s.music * 100)}" data-range="music"/></label>
      <label class="set-row"><span><b>Effetti</b></span><input type="range" min="0" max="100" value="${Math.round(s.sfx * 100)}" data-range="sfx"/></label>
      <div class="set-row"><span><b>Tremolio dello schermo</b></span><div class="segmented segmented--small">${seg("shake", 0, "Spento")}${seg("shake", 0.5, "Ridotto")}${seg("shake", 1, "Pieno")}</div></div>
      ${toggle("damageNumbers", "Numeri di danno", "Mostra il danno sopra i nemici colpiti")}
      ${toggle("contrast", "Avvisi ad alto contrasto", "Linee d'attacco più spesse e luminose")}
      <h3>${icon("crate")} Salvataggio</h3>
      <p class="muted">Un file JSON con survival, campagna, archivio e impostazioni.</p>
      <div class="settings__save">
        <button class="btn btn--small" data-act="export">${icon("arrow-up")} Esporta</button>
        <label class="btn btn--small">${icon("reroll")} Importa<input type="file" accept="application/json,.json" data-act="import" hidden/></label>
        ${pending ? `<button class="btn btn--small btn--danger" data-act="confirm">Conferma: sostituisci tutto</button>` : ""}
      </div>
      ${feedback ? `<p class="hub__feedback">${esc(feedback)}</p>` : ""}
      <div class="pause__actions"><button class="btn btn--primary" data-act="close">${icon("check")} Fatto</button></div>
    </div>`;
  };

  const root = el(`<div class="modal settings">${html()}</div>`);
  layer("modal").appendChild(root);
  const render = () => morph(root, html());
  const close = () => {
    root.remove();
    window.removeEventListener("keydown", onKey);
    onClose?.();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
    }
  };
  window.addEventListener("keydown", onKey);

  root.addEventListener("input", (ev) => {
    const input = ev.target as HTMLInputElement;
    const key = input.dataset.range as "music" | "sfx" | undefined;
    if (!key) return;
    const s = saveSettings({ [key]: Number(input.value) / 100 });
    audio.setVolumes(s.music, s.sfx);
  });
  root.addEventListener("change", async (ev) => {
    const input = ev.target as HTMLInputElement;
    if (input.dataset.toggle) {
      saveSettings({ [input.dataset.toggle]: input.checked });
      return;
    }
    if (input.dataset.act === "import" && input.files?.[0]) {
      const result = await readSave(input.files[0]);
      if ("error" in result) {
        feedback = result.error;
        pending = null;
      } else {
        pending = result.data;
        feedback = `File valido (${Object.keys(result.data).length} sezioni). Conferma per sostituire i salvataggi attuali.`;
      }
      render();
    }
  });
  root.addEventListener("click", (ev) => {
    const node = (ev.target as HTMLElement).closest<HTMLElement>("[data-set], [data-act]");
    if (!node) return;
    if (node.dataset.set) {
      saveSettings({ shake: Number(node.dataset.value) });
      render();
      return;
    }
    switch (node.dataset.act) {
      case "close":
        return close();
      case "export":
        feedback = `Esportate ${exportSave()} sezioni di salvataggio.`;
        return render();
      case "confirm":
        if (pending && applySave(pending)) {
          feedback = "Salvataggio importato: ricarico il gioco…";
          render();
          window.setTimeout(() => window.location.reload(), 600);
        }
        return;
    }
  });
};

// ---------- Archivio: bestiario, catalogo, medaglie ----------

type ArchiveTab = "bestiary" | "catalog" | "medals";

const spriteUrl = (texture: string) => {
  const svg = ENEMY_SPRITES[texture] ?? SPRITES[texture];
  return svg ? svgUrl(svg) : asset("assets/images/starship.png");
};

const ROLE = (id: string) => {
  const d = ENEMIES[id as keyof typeof ENEMIES];
  if (d.boss) return "Boss";
  if (d.miniBoss) return "Mini-boss";
  if (d.campaignOnly) return d.structure ? "Struttura" : "Campagna";
  return `Dalla wave ${d.minWave}`;
};

export const showArchive = (context: MedalContext, back: () => void) => {
  let tab: ArchiveTab = "bestiary";
  const a = getArchive();

  const bestiary = () => {
    const defs = Object.values(ENEMIES).filter((d) => !d.part);
    const seen = defs.filter((d) => a.seen.includes(d.id)).length;
    const cards = defs
      .map((d) => {
        const known = a.seen.includes(d.id);
        return `<div class="arc-card ${known ? "" : "is-unknown"}" style="--c:${hex(d.color)}">
          <img src="${spriteUrl(d.textures[0])}" alt="" loading="lazy"/>
          <b>${known ? esc(d.label) : "???"}</b>
          <small>${known ? esc(ROLE(d.id)) : "Non ancora incontrato"}</small>
          ${known ? `<p>${esc(d.hint)}</p><em>${icon("skull")} ${a.kills[d.id] ?? 0}</em>` : ""}
        </div>`;
      })
      .join("");
    return `<p class="muted">${seen}/${defs.length} nemici scoperti · ${totalKills(a)} abbattuti in tutto</p><div class="arc-grid">${cards}</div>`;
  };

  const catalog = () => {
    const found = GEAR.filter((g) => a.gear.includes(g.id)).length;
    const cards = GEAR.map((g) => {
      const known = a.gear.includes(g.id);
      return `<div class="arc-card arc-card--gear ${known ? "" : "is-unknown"}" style="--c:${hex(g.color)}">
        <span class="arc-card__icon">${known ? icon(g.icon) : icon("lock")}</span>
        <b>${known ? esc(g.title) : "???"}</b>
        <small>${SLOT_LABELS[g.slot]}</small>
        ${known ? `<p>${esc(g.description)}</p>` : ""}
      </div>`;
    }).join("");
    return `<p class="muted">${found}/${GEAR.length} pezzi trovati (${Math.round((found / GEAR.length) * 100)}%)</p><div class="arc-grid arc-grid--gear">${cards}</div>`;
  };

  const medals = () => {
    const paint = getSettings().paint;
    const rows = MEDALS.map((m) => {
      const done = a.medals.includes(m.id);
      const progress = Math.min(1, m.progress(a, context));
      const p = PAINTS[m.paint];
      return `<div class="arc-medal ${done ? "is-done" : ""}">
        <span class="arc-medal__icon">${icon(done ? "trophy" : "lock")}</span>
        <span class="arc-medal__body"><b>${esc(m.title)}</b><small>${esc(m.text)}</small><i class="arc-bar"><i style="width:${Math.round(progress * 100)}%"></i></i></span>
        <span class="arc-medal__paint" style="--p:${hex(p.tint ?? 0xffffff)}" title="Verniciatura ${esc(p.label)}"><i></i>${esc(p.label)}</span>
      </div>`;
    }).join("");
    const swatches = Object.entries(PAINTS)
      .map(([id, p]) => {
        const open = paintUnlocked(id, a);
        return `<button class="arc-paint ${paint === id ? "is-on" : ""}" data-paint="${id}" ${open ? "" : "disabled"} title="${open ? esc(p.label) : "Sblocca con la medaglia"}">
          <i style="--p:${hex(p.tint ?? 0xf8fafc)}"></i>${open ? esc(p.label) : icon("lock")}
        </button>`;
      })
      .join("");
    return `<p class="muted">${a.medals.length}/${MEDALS.length} medaglie · ogni medaglia sblocca una verniciatura della nave</p>
      <div class="arc-medals">${rows}</div>
      <h3>Verniciatura</h3><div class="arc-paints">${swatches}</div>`;
  };

  const inner = () => `
    <header class="hq-head">
      <div class="hq-brand"><small>${icon("trophy")} ARCHIVIO</small><b>Diario di bordo</b></div>
      <nav class="hq-tabs">
        <button class="hq-tab ${tab === "bestiary" ? "is-on" : ""}" data-tab="bestiary">${icon("skull")} Bestiario</button>
        <button class="hq-tab ${tab === "catalog" ? "is-on" : ""}" data-tab="catalog">${icon("crate")} Catalogo</button>
        <button class="hq-tab ${tab === "medals" ? "is-on" : ""}" data-tab="medals">${icon("trophy")} Medaglie</button>
      </nav>
      <button class="btn btn--small" data-act="back">${icon("home")} Menu</button>
    </header>
    <main class="archive__body panel">${tab === "bestiary" ? bestiary() : tab === "catalog" ? catalog() : medals()}</main>`;

  closeScreen();
  const root = el(`<div class="screen archive">${inner()}</div>`);
  layer("screen").appendChild(root);
  root.addEventListener("click", (ev) => {
    const node = (ev.target as HTMLElement).closest<HTMLElement>("[data-tab], [data-act], [data-paint]");
    if (!node || node.hasAttribute("disabled")) return;
    if (node.dataset.act === "back") return back();
    if (node.dataset.tab) tab = node.dataset.tab as ArchiveTab;
    if (node.dataset.paint) saveSettings({ paint: node.dataset.paint });
    morph(root, inner());
    if (node.dataset.tab) root.querySelector(".archive__body")?.scrollTo(0, 0);
  });
};
