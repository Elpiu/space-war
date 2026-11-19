import { icon, type IconId } from "../art/svg";
import { isEvolved } from "../data/upgrades";
import type { GameScene } from "../scenes/GameScene";
import type { Enemy } from "../types";
import { fmt, hex } from "../utils";
import { el, esc, layer, setText } from "./dom";

export type ToastTone = "info" | "good" | "warning" | "epic";

export class Hud {
  private root: HTMLElement;
  private q: Record<string, HTMLElement> = {};
  private buildKey = "";
  private effectsKey = "";
  private skillIds = "";
  private marksKey = "";
  private boss: Enemy | null = null;
  private nextTick = 0;

  constructor(actions: { pause: () => void; toggleSound: () => boolean }) {
    this.root = el(`
      <div class="hud is-hidden">
        <div class="hud-xp"><div class="hud-xp__fill" data-q="xpFill"></div><div class="hud-xp__marks" data-q="marks"></div><span class="hud-xp__lv" data-q="level">LV 1</span></div>
        <div class="hud-vitals panel">
          <div class="hud-hp">
            <span class="hud-hp__icon">${icon("heart")}</span>
            <div class="bar bar--hp"><i data-q="hpFill"></i></div>
            <b data-q="hp">10/10</b>
          </div>
          <div class="hud-hp hud-shield is-hidden" data-q="shieldRow">
            <span class="hud-hp__icon hud-shield__icon">${icon("shield")}</span>
            <div class="bar bar--shield"><i data-q="shieldFill"></i></div>
            <b data-q="shield">0</b>
          </div>
          <div class="hud-res">
            <span class="chip chip--coin">${icon("coin")}<b data-q="coins">0</b></span>
            <span class="chip">${icon("skull")}<b data-q="kills">0</b></span>
            <span class="chip">${icon("enemy")}<b data-q="enemies">0</b></span>
          </div>
        </div>
        <div class="hud-wave panel">
          <span class="hud-wave__label">${icon("wave")} <span data-q="waveLabel">WAVE</span> <b data-q="wave">0</b></span>
          <span class="hud-wave__timer" data-q="timer">0:00</span>
          <span class="hud-wave__event" data-q="event"></span>
        </div>
        <div class="hud-actions">
          <button class="icon-btn" data-act="sound" title="Audio (M)">${icon("soundOn")}</button>
          <button class="icon-btn" data-act="pause" title="Pausa (P)">${icon("pause")}</button>
        </div>
        <div class="hud-boss is-hidden" data-q="boss">
          <div class="hud-boss__name">${icon("boss")}<span data-q="bossName">Dreadnought</span><small data-q="bossPhase">FASE 1</small></div>
          <div class="bar bar--boss"><i data-q="bossFill"></i></div>
        </div>
        <div class="hud-skills" data-q="skills"></div>
        <div class="hud-effects" data-q="effects"></div>
        <div class="hud-build" data-q="build"></div>
        <div class="hud-hurt" data-q="hurt"></div>
      </div>
    `);
    this.root.querySelectorAll<HTMLElement>("[data-q]").forEach((node) => (this.q[node.dataset.q!] = node));
    this.root.querySelector("[data-act=pause]")!.addEventListener("click", actions.pause);
    const soundBtn = this.root.querySelector<HTMLElement>("[data-act=sound]")!;
    soundBtn.addEventListener("click", () => this.setMuted(actions.toggleSound()));
    layer("hud").appendChild(this.root);
  }

  setMuted(muted: boolean) {
    const btn = this.root.querySelector<HTMLElement>("[data-act=sound]");
    if (btn) btn.innerHTML = icon(muted ? "soundOff" : "soundOn");
  }

  show() {
    this.root.classList.remove("is-hidden");
    this.buildKey = "";
  }

  hide() {
    this.root.classList.add("is-hidden");
    this.setBoss(null);
  }

  setBoss(enemy: Enemy | null) {
    this.boss = enemy;
    this.q.boss.classList.toggle("is-hidden", !enemy);
    if (enemy) setText(this.q.bossName, enemy.def.label);
  }

  hurt() {
    const node = this.q.hurt;
    node.classList.remove("is-on");
    void node.offsetWidth;
    node.classList.add("is-on");
  }

  update(g: GameScene, force = false) {
    const now = performance.now();
    if (!force && now < this.nextTick) return;
    this.nextTick = now + 50;
    const { run } = g;
    const s = run.stats;

    const info = g.mode.hud(g);
    setText(this.q.level, info.bar.text);
    this.q.xpFill.style.width = `${Math.min(100, Math.max(0, info.bar.ratio) * 100)}%`;
    this.q.xpFill.parentElement!.classList.toggle("is-route", info.bar.kind === "route");
    const marks = (info.bar.marks ?? []).map((m) => `<i style="left:${(m * 100).toFixed(2)}%"></i>`).join("");
    if (marks !== this.marksKey) {
      this.marksKey = marks;
      this.q.marks.innerHTML = marks;
    }
    setText(this.q.hp, `${fmt(Math.max(0, Math.ceil(run.hp * 10) / 10))}/${fmt(Math.round(s.maxHp * 10) / 10)}`);
    this.q.hpFill.style.width = `${Math.max(0, (run.hp / s.maxHp) * 100)}%`;
    this.q.hpFill.parentElement!.classList.toggle("is-low", run.hp / s.maxHp < 0.3);
    this.q.shieldRow.classList.toggle("is-hidden", !info.shield || info.shield.max <= 0);
    if (info.shield && info.shield.max > 0) {
      this.q.shieldFill.style.width = `${(info.shield.value / info.shield.max) * 100}%`;
      setText(this.q.shield, `${fmt(Math.floor(info.shield.value * 10) / 10)}`);
    }
    setText(this.q.coins, `${run.coins}`);
    setText(this.q.kills, `${run.kills}`);
    setText(this.q.enemies, `${g.enemies.length}`);
    setText(this.q.waveLabel, info.label);
    setText(this.q.wave, info.value);
    setText(this.q.timer, info.detail);
    setText(this.q.event, info.event);
    this.q.event.classList.toggle("is-on", Boolean(info.event));

    if (this.boss) {
      this.q.bossFill.style.width = `${Math.max(0, (this.boss.hp / this.boss.maxHp) * 100)}%`;
      setText(this.q.bossPhase, this.boss.def.boss ? `FASE ${this.boss.bossPhase}` : "MINI-BOSS");
    }

    this.renderSkills(g);

    const effects: { id: IconId; label: string; color: number; left: number }[] = [];
    if (g.now < run.magnetUntil) effects.push({ id: "special-magnet", label: "Magnete", color: 0x22d3ee, left: run.magnetUntil - g.now });
    if (g.now < run.venomUntil) effects.push({ id: "special-venom", label: "Venom", color: 0xa3e635, left: run.venomUntil - g.now });
    if (isEvolved(run, "vitality")) {
      const ready = g.now >= run.shieldReadyAt;
      effects.push({ id: "shield", label: ready ? "Scudo" : "Scudo in ricarica", color: 0x7dd3fc, left: ready ? 0 : run.shieldReadyAt - g.now });
    }
    const effectsHtml = effects
      .map(
        (e) =>
          `<span class="effect" style="--c:${hex(e.color)}">${icon(e.id)}${e.label}${e.left > 0 ? ` <b>${Math.ceil(e.left / 1000)}s</b>` : ""}</span>`,
      )
      .join("");
    if (this.effectsKey !== effectsHtml) {
      this.effectsKey = effectsHtml;
      this.q.effects.innerHTML = effectsHtml;
    }

    this.renderBuild(g);
  }

  /** Anelli delle abilità: la struttura si ricrea solo quando cambia l'elenco. */
  private renderSkills(g: GameScene) {
    const skills = g.mode.skills(g);
    const ids = skills.map((sk) => sk.id).join(",");
    if (ids !== this.skillIds) {
      this.skillIds = ids;
      this.q.skills.innerHTML = skills
        .map((sk) => `<div class="skill" data-skill="${sk.id}"><div class="skill__ring">${icon(sk.icon)}</div><kbd>${esc(sk.key)}</kbd><small></small></div>`)
        .join("");
    }
    skills.forEach((sk) => {
      const node = this.q.skills.querySelector<HTMLElement>(`[data-skill="${sk.id}"]`);
      if (!node) return;
      node.classList.toggle("is-ready", sk.ready);
      node.classList.toggle("is-hot", Boolean(sk.hot));
      (node.firstElementChild as HTMLElement).style.setProperty("--p", `${Math.max(0, Math.min(1, sk.ratio)) * 360}deg`);
      setText(node.querySelector("small"), sk.info ?? "");
    });
  }

  private renderBuild(g: GameScene) {
    const html = g.mode.build(g);
    if (html === this.buildKey) return;
    this.buildKey = html;
    this.q.build.innerHTML = html;
  }
}

/** Notifiche brevi in alto e banner grandi al centro. */
export const toast = (text: string, iconId: IconId = "star", tone: ToastTone = "info") => {
  const host = layer("toasts");
  const node = el(`<div class="toast toast--${tone}">${icon(iconId)}<span>${esc(text)}</span></div>`);
  host.appendChild(node);
  while (host.children.length > 4) host.firstElementChild?.remove();
  window.setTimeout(() => node.classList.add("is-out"), 2400);
  window.setTimeout(() => node.remove(), 2800);
};

export const banner = (title: string, subtitle = "", tone: ToastTone = "info") => {
  const host = layer("banner");
  host.innerHTML = "";
  const node = el(`<div class="banner banner--${tone}"><h2>${esc(title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ""}</div>`);
  host.appendChild(node);
  window.setTimeout(() => node.remove(), 2600);
};
