import {
  getShopItemLevel,
  getShopItemUpgradeCost,
  SHOP_CATEGORIES,
  SHOP_ITEMS,
} from "./metaProgression";
import type {
  MetaProgressionState,
  ShopCategory,
  ShopItem,
  ShopItemId,
} from "../types/gameplay";

export type ShopOverlayActions = {
  selectCategory: (category: ShopCategory) => void;
  selectItem: (itemId: ShopItemId) => void;
  upgradeItem: (itemId: ShopItemId) => void;
  menu: () => void;
  play: () => void;
};

export const createShopDomOverlay = (
  metaState: MetaProgressionState,
  selectedCategory: ShopCategory,
  feedback: string,
  actions: ShopOverlayActions,
) => {
  const root = document.createElement("section");

  root.id = "shop-overlay";
  root.className =
    "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 px-4 py-5 text-slate-100";
  root.innerHTML = renderShopOverlay(metaState, selectedCategory, feedback);

  root.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const actionTarget = target?.closest<HTMLElement>("[data-shop-action]");

    if (!actionTarget) {
      return;
    }

    const action = actionTarget.dataset.shopAction;
    const itemId = actionTarget.dataset.itemId as ShopItemId | undefined;
    const category = actionTarget.dataset.category as ShopCategory | undefined;

    if (action === "category" && category) {
      actions.selectCategory(category);
    } else if (action === "item" && itemId) {
      actions.selectItem(itemId);
    } else if (action === "upgrade" && itemId) {
      actions.upgradeItem(itemId);
    } else if (action === "menu") {
      actions.menu();
    } else if (action === "play") {
      actions.play();
    }
  });

  document.body.appendChild(root);

  return () => root.remove();
};

const renderShopOverlay = (
  metaState: MetaProgressionState,
  selectedCategory: ShopCategory,
  feedback: string,
) => {
  const items = SHOP_ITEMS.filter((item) => item.category === selectedCategory);

  return `
    <div class="flex h-full w-full max-w-6xl flex-col overflow-hidden">
      <header class="flex shrink-0 items-center justify-between gap-4 border-b border-slate-700/70 pb-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Hangar</p>
          <h1 class="mt-1 text-3xl font-black tracking-normal text-white">Shop / Hangar</h1>
        </div>
        <div class="flex items-center gap-3">
          <div class="rounded border border-amber-300/50 bg-amber-300/10 px-4 py-2 text-right">
            <div class="text-xs uppercase tracking-[0.12em] text-amber-200">Crediti</div>
            <div class="font-mono text-2xl font-bold text-amber-100">${metaState.postRunCredits}</div>
          </div>
          <button data-shop-action="menu" class="rounded border border-slate-600 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-100 hover:border-cyan-300 hover:text-cyan-100">MENU</button>
          <button data-shop-action="play" class="rounded border border-cyan-300/70 bg-cyan-500 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-300">PLAY</button>
        </div>
      </header>

      <nav class="mt-4 flex shrink-0 flex-wrap gap-2">
        ${SHOP_CATEGORIES.map((category) =>
          renderCategoryTab(category, selectedCategory),
        ).join("")}
      </nav>

      <div class="mt-3 min-h-6 shrink-0 text-sm font-medium ${feedback.includes("insufficienti") ? "text-red-200" : "text-emerald-200"}">
        ${escapeHtml(feedback)}
      </div>

      <main class="shop-scrollbar mt-2 grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto pr-2 sm:grid-cols-2 xl:grid-cols-3">
        ${items.map((item) => renderShopCard(item, metaState)).join("")}
      </main>
    </div>
  `;
};

const renderCategoryTab = (
  category: { id: ShopCategory; label: string },
  selectedCategory: ShopCategory,
) => {
  const selected = category.id === selectedCategory;

  return `
    <button
      data-shop-action="category"
      data-category="${category.id}"
      class="rounded border px-4 py-2 text-sm font-bold transition ${
        selected
          ? "border-cyan-300 bg-cyan-300/15 text-cyan-100"
          : "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-500 hover:text-white"
      }"
    >
      ${escapeHtml(category.label)}
    </button>
  `;
};

const renderShopCard = (item: ShopItem, metaState: MetaProgressionState) => {
  const unlocked = item.isDefault || metaState.unlockedItems.includes(item.id);
  const equipped = metaState.loadout[item.category] === item.id;
  const affordable = metaState.postRunCredits >= item.cost;
  const level = getShopItemLevel(metaState, item.id);
  const upgradeCost = getShopItemUpgradeCost(item, level);
  const upgradeAffordable = metaState.postRunCredits >= upgradeCost;
  const status = equipped
    ? "EQUIP"
    : unlocked
      ? "ACQUISTATO"
      : affordable
        ? "COMPRA"
        : "BLOCCATO";
  const statusClass = equipped
    ? "border-cyan-200 bg-cyan-300 text-slate-950"
    : unlocked
      ? "border-emerald-300/60 bg-emerald-400/15 text-emerald-100"
      : affordable
        ? "border-blue-300/60 bg-blue-400/15 text-blue-100"
        : "border-red-300/40 bg-red-500/10 text-red-100";
  const cardClass =
    unlocked || affordable
      ? "border-slate-700 bg-slate-900/95 hover:border-cyan-300/70"
      : "border-slate-800 bg-slate-950/80 opacity-75";
  const accent = toHexColor(item.accentColor);

  return `
    <article class="group relative flex min-h-[320px] flex-col rounded-lg border p-4 transition ${cardClass}">
      <button
        data-shop-action="item"
        data-item-id="${item.id}"
        class="absolute inset-0 cursor-pointer rounded-lg"
        aria-label="${escapeHtml(status)} ${escapeHtml(item.title)}"
      ></button>

      <div class="relative z-10 flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-slate-600 font-black" style="background:${accent}22;color:${accent};border-color:${accent}88">
            ${getShopGlyph(item)}
          </div>
          <div class="min-w-0">
            <h2 class="truncate text-base font-black text-white">${escapeHtml(item.title)}</h2>
            <p class="text-xs font-medium text-slate-400">${escapeHtml(getCategoryLabel(item.category))}</p>
          </div>
        </div>
        <span class="shrink-0 rounded border px-2 py-1 text-[10px] font-black ${statusClass}">${status}</span>
      </div>

      <p class="relative z-10 mt-3 text-sm leading-5 text-slate-300">${escapeHtml(item.description)}</p>

      <div class="relative z-10 mt-3 rounded border border-slate-700 bg-slate-950/75 px-3 py-2 font-mono text-xs font-semibold text-amber-100">
        ${escapeHtml(item.statLine)}
      </div>

      <div class="relative z-10 mt-3 flex items-center justify-between gap-3 text-xs">
        <div>
          <div class="font-mono text-sm font-black text-cyan-100">Lv.${level}</div>
          <div class="mt-1 max-w-[12rem] text-slate-400">${escapeHtml(item.upgrade?.label ?? "Upgrade non disponibile")}</div>
        </div>
        <div class="text-right">
          <div class="${unlocked ? "text-emerald-200" : affordable ? "text-cyan-200" : "text-red-200"}">${escapeHtml(getPurchaseLabel(item, unlocked))}</div>
        </div>
      </div>

      <div class="relative z-10 mt-auto flex items-end justify-between gap-3 pt-4">
        <button
          data-shop-action="item"
          data-item-id="${item.id}"
          class="rounded border px-3 py-2 text-xs font-black ${
            equipped
              ? "border-cyan-300 bg-cyan-300 text-slate-950"
              : unlocked
                ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100 hover:border-emerald-200"
                : affordable
                  ? "border-blue-300/70 bg-blue-400/20 text-blue-100 hover:border-blue-100"
                  : "border-red-300/40 bg-red-500/10 text-red-100"
          }"
        >
          ${equipped ? "EQUIP" : unlocked ? "EQUIPAGGIA" : "COMPRA"}
        </button>
        ${
          unlocked
            ? `
              <button
                data-shop-action="upgrade"
                data-item-id="${item.id}"
                class="rounded border px-3 py-2 text-right text-xs font-black ${
                  upgradeAffordable
                    ? "border-cyan-300/70 bg-cyan-300/15 text-cyan-100 hover:border-cyan-100"
                    : "border-orange-300/50 bg-orange-500/10 text-orange-100"
                }"
              >
                UPGRADE
                <span class="block font-mono text-[10px] font-semibold">${upgradeCost} crediti</span>
              </button>
            `
            : ""
        }
      </div>
    </article>
  `;
};

const getPurchaseLabel = (item: ShopItem, unlocked: boolean) => {
  if (item.isDefault) {
    return "Default";
  }

  if (unlocked) {
    return "Acquistato";
  }

  return `${item.cost} crediti`;
};

const getCategoryLabel = (category: ShopCategory) => {
  return SHOP_CATEGORIES.find((entry) => entry.id === category)?.label ?? category;
};

const getShopGlyph = (item: ShopItem) => {
  if (item.category === "ships") {
    return "S";
  }

  if (item.category === "weapons") {
    return "W";
  }

  if (item.category === "boosters") {
    return "B";
  }

  if (item.category === "turrets") {
    return "T";
  }

  return "M";
};

const toHexColor = (color: number) => `#${color.toString(16).padStart(6, "0")}`;

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
