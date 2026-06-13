import { MIN_ACTIVE_POOL_SIZE } from "../data/upgrades";
import {
  getShopContent,
  isContentActive,
  isContentUnlocked,
  SHOP_CATEGORIES,
} from "./metaProgression";
import type {
  ContentKind,
  MetaProgressionState,
  ShopContentEntry,
} from "../types/gameplay";

export type ShopOverlayActions = {
  selectCategory: (category: ContentKind) => void;
  selectContent: (entry: ShopContentEntry) => void;
  menu: () => void;
  play: () => void;
};

export const createShopDomOverlay = (
  metaState: MetaProgressionState,
  selectedCategory: ContentKind,
  feedback: string,
  actions: ShopOverlayActions,
) => {
  document.getElementById("shop-overlay")?.remove();
  const root = document.createElement("section");
  root.id = "shop-overlay";
  root.className = "hangar-overlay";
  root.innerHTML = renderShop(metaState, selectedCategory, feedback);

  root.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-shop-action]",
    );

    if (!target) return;
    const action = target.dataset.shopAction;

    if (action === "category") {
      actions.selectCategory(target.dataset.category as ContentKind);
    } else if (action === "content") {
      const entry = getShopContent(selectedCategory).find(
        (candidate) => candidate.id === target.dataset.contentId,
      );
      if (entry) actions.selectContent(entry);
    } else if (action === "menu") {
      actions.menu();
    } else if (action === "play") {
      actions.play();
    }
  });

  (document.getElementById("game-container") ?? document.body).appendChild(root);
  return () => root.remove();
};

const renderShop = (
  state: MetaProgressionState,
  selectedCategory: ContentKind,
  feedback: string,
) => {
  const entries = getShopContent(selectedCategory);
  const activeCount =
    selectedCategory === "tome"
      ? state.activeTomes.length
      : state.activeChestItems.length;
  const unlockedCount =
    selectedCategory === "tome"
      ? state.unlockedTomes.length
      : state.unlockedChestItems.length;

  return `
    <div class="hangar-shell codex-shop">
      <header class="hangar-header">
        <div>
          <p>Archivio di bordo</p>
          <h1>Tomi e Oggetti</h1>
        </div>
        <div class="hangar-header__actions">
          <div class="hangar-wallet"><span>Crediti</span><strong>${state.postRunCredits}</strong></div>
          <button data-shop-action="menu" class="hangar-button">MENU</button>
          <button data-shop-action="play" class="hangar-button hangar-button--primary">PLAY</button>
        </div>
      </header>

      <nav class="codex-shop__tabs">
        ${SHOP_CATEGORIES.map(
          (category) => `
            <button
              data-shop-action="category"
              data-category="${category.id}"
              class="${category.id === selectedCategory ? "is-selected" : ""}"
            >${category.label}</button>
          `,
        ).join("")}
      </nav>

      <section class="codex-shop__summary">
        <div>
          <span>Pool attivo</span>
          <strong>${activeCount}/${unlockedCount}</strong>
        </div>
        <p>Puoi escludere contenuti sbloccati mantenendone almeno ${MIN_ACTIVE_POOL_SIZE} attivi.</p>
        <small class="${feedback.includes("Servono") || feedback.includes("insufficienti") ? "is-warning" : ""}">${escapeHtml(feedback)}</small>
      </section>

      <main class="codex-shop__grid shop-scrollbar">
        ${entries.map((entry) => renderEntry(entry, state)).join("")}
      </main>
    </div>
  `;
};

const renderEntry = (
  entry: ShopContentEntry,
  state: MetaProgressionState,
) => {
  const unlocked = isContentUnlocked(state, entry.kind, entry.id);
  const active = isContentActive(state, entry.kind, entry.id);
  const accent = toHex(entry.accentColor);
  const action = !unlocked
    ? `Sblocca ${entry.cost}`
    : active
      ? "Escludi dal pool"
      : "Includi nel pool";

  return `
    <article class="codex-card ${active ? "is-active" : ""} ${unlocked ? "" : "is-locked"}" style="--accent:${accent}">
      <div class="codex-card__top">
        <span>${entry.kind === "tome" ? "TOMO" : "OGGETTO"}</span>
        <strong>${unlocked ? (active ? "ATTIVO" : "ESCLUSO") : "BLOCCATO"}</strong>
      </div>
      <div class="codex-card__icon">${entry.title.charAt(0)}</div>
      <h2>${escapeHtml(entry.title)}</h2>
      <h3>${escapeHtml(entry.shortEffect)}</h3>
      <p>${escapeHtml(entry.description)}</p>
      <button data-shop-action="content" data-content-id="${entry.id}">${action}</button>
    </article>
  `;
};

const toHex = (color: number) => `#${color.toString(16).padStart(6, "0")}`;

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] ?? char;
  });
