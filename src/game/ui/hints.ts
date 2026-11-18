import { icon, type IconId } from "../art/svg";
import { ENEMIES } from "../data/enemies";
import { saveMeta, type Meta } from "../meta";
import type { EnemyId } from "../types";
import { el, esc, layer } from "./dom";

// Il vecchio tutorial diventa una serie di suggerimenti contestuali,
// mostrati una sola volta e salvati nel profilo.
const HINTS: Record<string, { title: string; text: string; icon: IconId }> = {
  move: { title: "Pilota la nave", text: "Muoviti con WASD o le frecce. Il cannone spara da solo al nemico più vicino.", icon: "play" },
  dash: { title: "Scatto", text: "Premi SPAZIO per scattare: per un istante sei invulnerabile.", icon: "dash" },
  xp: { title: "Gemme", text: "Raccogli le gemme per salire di livello e scegliere un tomo.", icon: "xp" },
  coins: { title: "Monete", text: "Con le monete piazzi difese: Q torretta, E mina, dove si trova la nave.", icon: "coin" },
  chest: { title: "Chest in arrivo", text: "Segui la freccia dorata: ogni chest contiene un oggetto.", icon: "star" },
  evolve: { title: "Evoluzioni", text: "Un tomo al livello 5 si evolve e cambia il modo di combattere.", icon: "star" },
  "turret-placed": { title: "Torretta", text: "Le torrette durano 30 secondi: piazzale dove vuoi combattere.", icon: "turret" },
};

export class Hints {
  private queue: { title: string; text: string; icon: IconId }[] = [];
  private busyUntil = 0;

  constructor(private readonly meta: Meta) {}

  trigger(id: string) {
    if (this.meta.hintsSeen.includes(id) || !HINTS[id]) return;
    this.meta.hintsSeen.push(id);
    saveMeta(this.meta);
    this.queue.push(HINTS[id]);
    this.flush();
  }

  enemy(id: EnemyId) {
    const key = `enemy:${id}`;
    if (this.meta.hintsSeen.includes(key)) return;
    this.meta.hintsSeen.push(key);
    saveMeta(this.meta);
    this.queue.push({ title: `Nuovo nemico: ${ENEMIES[id].label}`, text: ENEMIES[id].hint, icon: id === "boss" ? "boss" : "warning" });
    this.flush();
  }

  clear() {
    this.queue = [];
    layer("hint").innerHTML = "";
    this.busyUntil = 0;
  }

  private flush() {
    const now = performance.now();
    if (now < this.busyUntil) {
      window.setTimeout(() => this.flush(), this.busyUntil - now + 50);
      return;
    }
    const next = this.queue.shift();
    if (!next) return;
    this.busyUntil = now + 4600;
    const host = layer("hint");
    host.innerHTML = "";
    const node = el(`<div class="hint">${icon(next.icon)}<div><b>${esc(next.title)}</b><p>${esc(next.text)}</p></div></div>`);
    host.appendChild(node);
    window.setTimeout(() => node.classList.add("is-out"), 4200);
    window.setTimeout(() => node.remove(), 4600);
  }
}
