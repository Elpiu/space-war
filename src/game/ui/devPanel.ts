import { el, layer } from "./dom";

/** Console di test, disponibile solo con il server di sviluppo. Tasto: ` */
export const mountDevPanel = (actions: Record<string, () => void>) => {
  if (!import.meta.env.DEV) return;
  const buttons = Object.keys(actions)
    .map((label) => `<button data-dev="${label}">${label}</button>`)
    .join("");
  const panel = el(`<div class="dev is-hidden"><b>DEV</b>${buttons}<small>tasto \` per chiudere</small></div>`);
  panel.querySelectorAll<HTMLElement>("[data-dev]").forEach((node) =>
    node.addEventListener("click", () => actions[node.dataset.dev!]()),
  );
  layer("dev").appendChild(panel);
  window.addEventListener("keydown", (e) => {
    if (e.key === "`" || e.key === "\\") panel.classList.toggle("is-hidden");
  });
};
