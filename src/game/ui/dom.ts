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

/**
 * Aggiorna sul posto i figli di `target` perché corrispondano a `html`.
 * Gli elementi che restano uguali non vengono ricreati, quindi scorrimento,
 * hover e animazioni in corso si conservano (niente "lampo" a ogni clic).
 */
export const morph = (target: Element, html: string) => {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  patchChildren(target, template.content);
};

const patchChildren = (current: Node, next: Node) => {
  const before = Array.from(current.childNodes);
  const after = Array.from(next.childNodes);
  after.forEach((node, i) => {
    const existing = before[i];
    if (!existing) current.appendChild(node);
    else patchNode(existing, node);
  });
  for (let i = after.length; i < before.length; i += 1) current.removeChild(before[i]);
};

const patchNode = (current: Node, next: Node) => {
  if (current.nodeType !== next.nodeType || current.nodeName !== next.nodeName) {
    current.parentNode?.replaceChild(next, current);
    return;
  }
  if (current.nodeType !== Node.ELEMENT_NODE) {
    if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue;
    return;
  }
  const a = current as Element;
  const b = next as Element;
  for (const attr of Array.from(a.attributes)) if (!b.hasAttribute(attr.name)) a.removeAttribute(attr.name);
  for (const attr of Array.from(b.attributes)) if (a.getAttribute(attr.name) !== attr.value) a.setAttribute(attr.name, attr.value);
  patchChildren(a, b);
  // Lo stato dei controlli non segue gli attributi: lo si riallinea a mano.
  if (a instanceof HTMLSelectElement) {
    const selected = b.querySelector("option[selected]") as HTMLOptionElement | null;
    if (selected) a.value = selected.value;
  }
};

/** Imposta il testo solo se cambiato, per non toccare il DOM a ogni frame. */
export const setText = (node: Element | null, value: string) => {
  if (node && node.textContent !== value) node.textContent = value;
};
