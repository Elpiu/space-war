export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const uiRoot = () => document.getElementById("ui") as HTMLElement;

export const el = <T extends HTMLElement = HTMLElement>(html: string): T => {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild as T;
};

/** Uno strato nominato dentro #ui (hud, screen, toasts...), creato al bisogno. */
export const layer = (name: string) => {
  const root = uiRoot();
  let node = root.querySelector<HTMLElement>(`:scope > .layer-${name}`);
  if (!node) {
    node = el(`<div class="layer layer-${name}"></div>`);
    root.appendChild(node);
  }
  return node;
};

export const esc = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

/** Imposta il testo solo se cambiato, per non toccare il DOM a ogni frame. */
export const setText = (node: Element | null, value: string) => {
  if (node && node.textContent !== value) node.textContent = value;
};
