import type { HudState, UpgradeCategory } from "../types/gameplay";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y } from "../config/gameplay";
import { getCategoryCardVisual, toHexColor } from "../data/upgradeVisuals";

export type HudElements = {
  hudText: Phaser.GameObjects.Text;
  stateText: Phaser.GameObjects.Text;
};

const HUD_ROOT_ID = "run-hud-overlay";

export const createHud = (scene: Phaser.Scene): HudElements => {
  const hudText = scene.add
    .text(0, 0, "", {
      fontFamily: "Arial",
      fontSize: 1,
      color: "#000000",
    })
    .setAlpha(0)
    .setDepth(200)
    .setScrollFactor(0);

  const existingRoot = document.getElementById(HUD_ROOT_ID);
  existingRoot?.remove();

  const root = document.createElement("section");
  root.id = HUD_ROOT_ID;
  root.className = "run-hud is-hidden";
  root.innerHTML = renderHudShell();

  const parent = scene.game.canvas.parentElement ?? document.body;
  parent.appendChild(root);
  root.querySelector("[data-hud-fullscreen]")?.addEventListener("click", () => {
    toggleFullscreen(parent);
  });

  const stateText = scene.add
    .text(SCREEN_CENTER_X, SCREEN_CENTER_Y - 12, "", {
      fontFamily: "Arial Black",
      fontSize: 40,
      color: "#ffffff",
      stroke: "#0f172a",
      strokeThickness: 8,
      align: "center",
    })
    .setOrigin(0.5)
    .setDepth(250)
    .setScrollFactor(0);

  return {
    hudText,
    stateText,
  };
};

export const updateHud = (
  hudText: Phaser.GameObjects.Text,
  state: HudState,
) => {
  hudText.setText("");

  const root = document.getElementById(HUD_ROOT_ID);

  if (!root) {
    return;
  }

  root.classList.remove("is-hidden");

  const hpRatio = state.maxHp > 0 ? clamp01(state.hp / state.maxHp) : 0;
  const xpClamped = Math.min(state.xp, state.xpToNext);
  const xpRatio = state.xpToNext > 0 ? clamp01(xpClamped / state.xpToNext) : 0;

  setText(
    root,
    "[data-hud-hp]",
    `${formatMetric(state.hp)}/${formatMetric(state.maxHp)}`,
  );
  setText(root, "[data-hud-xp]", `${xpClamped}/${state.xpToNext}`);
  setText(root, "[data-hud-level]", `LV ${state.level}`);
  setText(root, "[data-hud-coins]", `${state.coins}`);
  setText(root, "[data-hud-wave]", `${state.wave}`);
  setText(root, "[data-hud-wave-phase]", `${state.wavePhase}  /  P: pausa`);
  setText(root, "[data-hud-enemies]", `${state.enemyCount}`);
  setText(
    root,
    "[data-hud-placeables]",
    `${state.sectorName}  /  ${state.discoveredSectors} settori`,
  );
  setText(
    root,
    "[data-hud-support]",
    `T ${state.turretCount}/${state.maxTurrets}  M ${state.mineCount}/${state.maxMines}  B ${state.barricadeCount}/${state.maxBarricades}  D ${state.droneCount}  Chest ${state.chestCount}${state.activeEffects.length > 0 ? `  /  ${state.activeEffects.join("  ")}` : ""}`,
  );

  setBar(root, "[data-hud-hp-bar]", hpRatio);
  setBar(root, "[data-hud-xp-bar]", xpRatio);
  renderProgressionStrip(root, state);
};

export const hideHud = () => {
  document.getElementById(HUD_ROOT_ID)?.classList.add("is-hidden");
};

export const destroyHud = () => {
  document.getElementById(HUD_ROOT_ID)?.remove();
};

const renderHudShell = () => `
  <div class="run-hud__top">
    <div class="run-hud__cluster run-hud__vitals">
      <div class="run-hud__row">
        <span class="run-hud__icon run-hud__icon--hp"></span>
        <span class="run-hud__label">HP</span>
        <strong data-hud-hp>0/0</strong>
      </div>
      <div class="run-hud__bar"><span data-hud-hp-bar></span></div>
      <div class="run-hud__row run-hud__row--xp">
        <span class="run-hud__icon run-hud__icon--xp"></span>
        <span class="run-hud__label" data-hud-level>LV 1</span>
        <strong data-hud-xp>0/0</strong>
      </div>
      <div class="run-hud__bar run-hud__bar--xp"><span data-hud-xp-bar></span></div>
      <div class="run-hud__row run-hud__row--coins">
        <span class="run-hud__icon run-hud__icon--coin"></span>
        <span class="run-hud__label">Risorse run</span>
        <strong data-hud-coins>0</strong>
      </div>
    </div>

    <div class="run-hud__cluster run-hud__combat">
      <div class="run-hud__metric"><span class="run-hud__icon run-hud__icon--wave"></span><span>Wave</span><strong data-hud-wave>0</strong></div>
      <div class="run-hud__metric"><span class="run-hud__icon run-hud__icon--enemy"></span><span>Nemici</span><strong data-hud-enemies>0</strong></div>
      <button class="run-hud__fullscreen" data-hud-fullscreen type="button" title="Fullscreen">[]</button>
      <div class="run-hud__phase" data-hud-wave-phase>inizio</div>
    </div>
  </div>

  <div class="run-hud__bottom">
    <div class="run-hud__placeables">
      <span data-hud-placeables>T 0/0 M 0/0 B 0/0</span>
      <span data-hud-support>Droni 0 Chest 0</span>
    </div>
    <div class="run-hud__upgrade-strip" data-hud-upgrades></div>
  </div>
`;

const renderProgressionStrip = (root: HTMLElement, state: HudState) => {
  const strip = root.querySelector<HTMLElement>("[data-hud-upgrades]");

  if (!strip) {
    return;
  }

  if (
    state.acquiredTomes.length === 0 &&
    state.acquiredItems.length === 0
  ) {
    strip.innerHTML = `<span class="run-hud__empty">Tomi e oggetti: nessuno</span>`;
    return;
  }

  const tomes = state.acquiredTomes.map(
    (tome) => `
      <div class="upgrade-chip upgrade-chip--tome" style="--accent:${toHexColor(tome.accentColor)}" title="${escapeHtml(tome.title)}">
        <span class="upgrade-chip__icon upgrade-chip__icon--tome">T</span>
        <span class="upgrade-chip__title">${escapeHtml(tome.title.replace("Tomo ", ""))}</span>
        <span class="upgrade-chip__stack">Lv.${tome.level}</span>
      </div>
    `,
  );
  const items = state.acquiredItems.map((item) => {
    const visual = getCategoryCardVisual(item.category);
    const accent = toHexColor(item.accentColor || visual.accentColor);

    return `
        <div class="upgrade-chip upgrade-chip--item" style="--accent:${accent}" title="${escapeHtml(item.title)} - ${escapeHtml(visual.shortEffect)}">
          <span class="upgrade-chip__icon ${getCategoryIconClass(item.category)}"></span>
          <span class="upgrade-chip__title">${escapeHtml(item.title)}</span>
          <span class="upgrade-chip__stack">Lv.${item.level}</span>
        </div>
      `;
  });

  strip.innerHTML = [...tomes, ...items].join("");
};

const setText = (root: HTMLElement, selector: string, value: string) => {
  const element = root.querySelector<HTMLElement>(selector);

  if (element) {
    element.textContent = value;
  }
};

const setBar = (root: HTMLElement, selector: string, ratio: number) => {
  const element = root.querySelector<HTMLElement>(selector);

  if (element) {
    element.style.width = `${Math.round(ratio * 100)}%`;
  }
};

const getCategoryIconClass = (category: UpgradeCategory) =>
  `upgrade-chip__icon--${category}`;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const formatMetric = (value: number) =>
  Number.isInteger(value) ? `${value}` : value.toFixed(1);

const toggleFullscreen = (target: HTMLElement) => {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => undefined);
    return;
  }

  target.requestFullscreen?.().catch(() => undefined);
};

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
