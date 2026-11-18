import { icon, type IconId } from "../art/svg";
import { el, layer } from "./dom";

/**
 * Comandi touch: joystick virtuale (metà sinistra, appare dove appoggi il
 * pollice) e pulsanti a destra. Lo stato viene letto dalla scena a ogni frame.
 */
/** Cattura il puntatore se possibile (alcuni browser la rifiutano: non è essenziale). */
const capture = (node: Element, id: number) => {
  try {
    node.setPointerCapture(id);
  } catch {
    // Ignorato: il pulsante funziona anche senza cattura.
  }
};

export const touch = {
  enabled: false,
  move: { x: 0, y: 0 },
  /** Pulsanti tenuti premuti (fuoco). */
  held: new Set<string>(),
  /** Pressioni non ancora consumate (scatto, bomba, torretta...). */
  pressed: new Set<string>(),
  consume(name: string) {
    const was = this.pressed.has(name);
    this.pressed.delete(name);
    return was;
  },
};

type Button = { id: string; icon: IconId; label: string; hold?: boolean; big?: boolean };

const BUTTONS: Record<"survival" | "campaign", Button[]> = {
  survival: [
    { id: "dash", icon: "dash", label: "Scatto", big: true },
    { id: "turret", icon: "turret", label: "Torretta" },
    { id: "mine", icon: "mine", label: "Mina" },
  ],
  campaign: [
    { id: "fire", icon: "heat", label: "Fuoco", hold: true, big: true },
    { id: "bomb", icon: "gear-bomb", label: "Bomba" },
    { id: "profile", icon: "gear-blaster", label: "Profilo" },
  ],
};

const RADIUS = 60;
let root: HTMLElement | null = null;

const build = () => {
  root = el(`<div class="touch is-hidden">
    <div class="touch__zone" data-zone></div>
    <div class="touch__stick" data-stick><i data-knob></i></div>
    <div class="touch__buttons" data-buttons></div>
  </div>`);
  layer("touch").appendChild(root);

  const zone = root.querySelector<HTMLElement>("[data-zone]")!;
  const stick = root.querySelector<HTMLElement>("[data-stick]")!;
  const knob = root.querySelector<HTMLElement>("[data-knob]")!;
  let pointer: number | null = null;
  let origin = { x: 0, y: 0 };

  // Le coordinate del puntatore sono dello schermo: si riportano nel palco scalato.
  const local = (ev: PointerEvent) => {
    const rect = root!.getBoundingClientRect();
    const scale = rect.width / root!.offsetWidth || 1;
    return { x: (ev.clientX - rect.left) / scale, y: (ev.clientY - rect.top) / scale };
  };

  zone.addEventListener("pointerdown", (ev) => {
    if (pointer !== null) return;
    pointer = ev.pointerId;
    capture(zone, ev.pointerId);
    origin = local(ev);
    stick.style.left = `${origin.x}px`;
    stick.style.top = `${origin.y}px`;
    stick.classList.add("is-on");
    knob.style.transform = "translate(-50%, -50%)";
  });
  zone.addEventListener("pointermove", (ev) => {
    if (ev.pointerId !== pointer) return;
    const p = local(ev);
    let dx = p.x - origin.x;
    let dy = p.y - origin.y;
    const d = Math.hypot(dx, dy);
    if (d > RADIUS) {
      dx = (dx / d) * RADIUS;
      dy = (dy / d) * RADIUS;
    }
    // Piccola zona morta al centro, poi risposta analogica.
    const strength = d < 8 ? 0 : 1;
    touch.move.x = (dx / RADIUS) * strength;
    touch.move.y = (dy / RADIUS) * strength;
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  });
  const release = (ev: PointerEvent) => {
    if (ev.pointerId !== pointer) return;
    pointer = null;
    touch.move.x = 0;
    touch.move.y = 0;
    stick.classList.remove("is-on");
  };
  zone.addEventListener("pointerup", release);
  zone.addEventListener("pointercancel", release);
};

const bindButtons = (buttons: Button[]) => {
  const host = root!.querySelector<HTMLElement>("[data-buttons]")!;
  host.innerHTML = buttons
    .map((b) => `<button class="touch__btn ${b.big ? "is-big" : ""}" data-touch="${b.id}">${icon(b.icon)}<span>${b.label}</span></button>`)
    .join("");
  host.querySelectorAll<HTMLElement>("[data-touch]").forEach((node) => {
    const def = buttons.find((b) => b.id === node.dataset.touch)!;
    node.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      capture(node, ev.pointerId);
      node.classList.add("is-down");
      if (def.hold) touch.held.add(def.id);
      else touch.pressed.add(def.id);
    });
    const up = () => {
      node.classList.remove("is-down");
      touch.held.delete(def.id);
    };
    node.addEventListener("pointerup", up);
    node.addEventListener("pointercancel", up);
  });
};

/** Mostra i comandi touch per la modalità indicata (null = nasconde). */
export const showTouchControls = (mode: "survival" | "campaign" | null) => {
  if (!touch.enabled) return;
  if (!root) build();
  touch.move.x = 0;
  touch.move.y = 0;
  touch.held.clear();
  touch.pressed.clear();
  root!.classList.toggle("is-hidden", mode === null);
  if (mode) bindButtons(BUTTONS[mode]);
};
