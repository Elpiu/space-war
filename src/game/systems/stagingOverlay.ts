import type {
  ChestItemDefinition,
  EnemyTypeId,
  Rarity,
  TomeDefinition,
} from "../types/gameplay";

export type StagingSnapshot = {
  godMode: boolean;
  automaticWaves: boolean;
  hp: number;
  maxHp: number;
  coins: number;
  xp: number;
  xpToNext: number;
  wave: number;
  enemies: number;
  sectors: { id: string; name: string }[];
  seed: number;
};

export type StagingActions = {
  reset: () => void;
  menu: () => void;
  clearAll: () => void;
  toggleGodMode: () => void;
  heal: () => void;
  damage: () => void;
  setMaxHp: (value: number) => void;
  addCoins: (value: number) => void;
  addXp: (value: number) => void;
  toggleAutomaticWaves: () => void;
  setWave: (value: number) => void;
  startWave: () => void;
  spawnEnemy: (type: EnemyTypeId, count: number) => void;
  clear: (kind: "enemies" | "projectiles" | "pickups" | "chests") => void;
  applyTome: (id: string, rarity: Rarity) => void;
  applyItem: (id: string, rarity: Rarity) => void;
  spawnChest: (kind: "reward" | "shop") => void;
  activateEffect: (id: "magnet-overload" | "venom-rounds") => void;
  regenerateMap: (seed: number) => void;
  revealMap: () => void;
  teleport: (sectorId: string) => void;
  applyPreset: (preset: "clean" | "early" | "mid" | "boss" | "stress") => void;
};

export type StagingOverlay = {
  refresh: (snapshot: StagingSnapshot) => void;
  toggle: () => void;
  destroy: () => void;
};

const ROOT_ID = "staging-overlay";

export const createStagingOverlay = (
  parent: HTMLElement,
  tomes: TomeDefinition[],
  items: ChestItemDefinition[],
  enemyTypes: EnemyTypeId[],
  actions: StagingActions,
): StagingOverlay => {
  document.getElementById(ROOT_ID)?.remove();

  const root = document.createElement("aside");
  root.id = ROOT_ID;
  root.className = "staging-panel";
  root.innerHTML = `
    <header class="staging-panel__header">
      <div><small>DEV TOOL</small><strong>STAGING</strong></div>
      <button type="button" data-panel-toggle title="Comprimi">\`</button>
    </header>
    <div class="staging-panel__body">
      <div class="staging-panel__status" data-staging-status></div>
      ${section("Sessione", `
        ${button("reset", "Reset")} ${button("menu", "Menu")} ${button("clear-all", "Pulisci tutto")}
        ${button("god", "God mode")} ${button("waves", "Wave auto")}
      `)}
      ${section("Pilota", `
        ${button("heal", "Cura")} ${button("damage", "Danno")}
        <label>HP max <input data-field="max-hp" type="number" min="1" value="20"></label>
        ${button("set-max-hp", "Applica HP")}
        <label>Risorse <input data-field="coins" type="number" value="100"></label>
        ${button("add-coins", "Aggiungi")}
        <label>XP <input data-field="xp" type="number" value="10"></label>
        ${button("add-xp", "Aggiungi XP")}
      `)}
      ${section("Wave e nemici", `
        <label>Wave <input data-field="wave" type="number" min="0" value="1"></label>
        ${button("set-wave", "Imposta")} ${button("start-wave", "Avvia wave")}
        <label>Tipo <select data-field="enemy">${enemyTypes.map((id) => option(id, id)).join("")}</select></label>
        <label>Quantita <input data-field="enemy-count" type="number" min="1" max="200" value="5"></label>
        ${button("spawn-enemy", "Spawn")}
        ${button("clear-enemies", "Rimuovi nemici")}
        ${button("clear-projectiles", "Rimuovi proiettili")}
        ${button("clear-pickups", "Rimuovi pickup")}
        ${button("clear-chests", "Rimuovi chest")}
      `)}
      ${section("Build", `
        <label>Rarita <select data-field="rarity">
          ${option("common", "Comune")}
          ${option("uncommon", "Non comune")}
          ${option("rare", "Rara")}
          ${option("legendary", "Leggendaria")}
        </select></label>
        <label>Tomo <select data-field="tome">${tomes.map((entry) => option(entry.id, entry.title)).join("")}</select></label>
        ${button("apply-tome", "Applica tomo")}
        <label>Oggetto <select data-field="item">${items.map((entry) => option(entry.id, entry.title)).join("")}</select></label>
        ${button("apply-item", "Applica oggetto")}
        ${button("chest-reward", "Chest free")} ${button("chest-shop", "Chest shop")}
        ${button("magnet", "Magnet")} ${button("venom", "Venom")}
      `)}
      ${section("Mappa", `
        <label>Seed <input data-field="seed" type="number" value="1"></label>
        ${button("regenerate-map", "Rigenera")} ${button("reveal-map", "Rivela tutto")}
        <label>Settore <select data-field="sector"></select></label>
        ${button("teleport", "Teletrasporta")}
      `)}
      ${section("Preset", `
        ${button("preset-clean", "Clean")}
        ${button("preset-early", "Early")}
        ${button("preset-mid", "Mid Build")}
        ${button("preset-boss", "Boss")}
        ${button("preset-stress", "Stress")}
      `)}
    </div>
  `;
  parent.appendChild(root);

  const field = <T extends HTMLInputElement | HTMLSelectElement>(name: string) =>
    root.querySelector<T>(`[data-field="${name}"]`);
  const numberValue = (name: string, fallback: number) => {
    const value = Number(field<HTMLInputElement>(name)?.value);
    return Number.isFinite(value) ? value : fallback;
  };
  const selectValue = (name: string) =>
    field<HTMLSelectElement>(name)?.value ?? "";
  let sectorSignature = "";
  const run = (action: () => void) => {
    action();
  };

  root.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
    const action = target?.dataset.action;

    if (!action) {
      return;
    }

    const handlers: Record<string, () => void> = {
      reset: actions.reset,
      menu: actions.menu,
      "clear-all": actions.clearAll,
      god: actions.toggleGodMode,
      waves: actions.toggleAutomaticWaves,
      heal: actions.heal,
      damage: actions.damage,
      "set-max-hp": () => actions.setMaxHp(numberValue("max-hp", 20)),
      "add-coins": () => actions.addCoins(numberValue("coins", 100)),
      "add-xp": () => actions.addXp(numberValue("xp", 10)),
      "set-wave": () => actions.setWave(numberValue("wave", 1)),
      "start-wave": actions.startWave,
      "spawn-enemy": () =>
        actions.spawnEnemy(
          selectValue("enemy") as EnemyTypeId,
          numberValue("enemy-count", 5),
        ),
      "clear-enemies": () => actions.clear("enemies"),
      "clear-projectiles": () => actions.clear("projectiles"),
      "clear-pickups": () => actions.clear("pickups"),
      "clear-chests": () => actions.clear("chests"),
      "apply-tome": () =>
        actions.applyTome(
          selectValue("tome"),
          selectValue("rarity") as Rarity,
        ),
      "apply-item": () =>
        actions.applyItem(
          selectValue("item"),
          selectValue("rarity") as Rarity,
        ),
      "chest-reward": () => actions.spawnChest("reward"),
      "chest-shop": () => actions.spawnChest("shop"),
      magnet: () => actions.activateEffect("magnet-overload"),
      venom: () => actions.activateEffect("venom-rounds"),
      "regenerate-map": () => actions.regenerateMap(numberValue("seed", 1)),
      "reveal-map": actions.revealMap,
      teleport: () => actions.teleport(selectValue("sector")),
      "preset-clean": () => actions.applyPreset("clean"),
      "preset-early": () => actions.applyPreset("early"),
      "preset-mid": () => actions.applyPreset("mid"),
      "preset-boss": () => actions.applyPreset("boss"),
      "preset-stress": () => actions.applyPreset("stress"),
    };

    const handler = handlers[action];

    if (handler) {
      run(handler);
    }
  });
  root.querySelector("[data-panel-toggle]")?.addEventListener("click", () => {
    root.classList.toggle("is-collapsed");
  });

  return {
    refresh: (snapshot) => {
      const status = root.querySelector<HTMLElement>("[data-staging-status]");

      if (status) {
        status.textContent =
          `HP ${format(snapshot.hp)}/${format(snapshot.maxHp)} | XP ${snapshot.xp}/${snapshot.xpToNext} | ` +
          `R ${snapshot.coins} | W ${snapshot.wave} | E ${snapshot.enemies} | ` +
          `GOD ${snapshot.godMode ? "ON" : "OFF"} | AUTO ${snapshot.automaticWaves ? "ON" : "OFF"}`;
      }

      const seed = field<HTMLInputElement>("seed");

      if (seed !== document.activeElement) {
        seed!.value = `${snapshot.seed}`;
      }

      const sector = field<HTMLSelectElement>("sector");
      const selected = sector?.value;
      const nextSectorSignature = snapshot.sectors
        .map((entry) => `${entry.id}:${entry.name}`)
        .join("|");

      if (sector && nextSectorSignature !== sectorSignature) {
        sector.innerHTML = snapshot.sectors
          .map((entry) => option(entry.id, entry.name))
          .join("");
        sectorSignature = nextSectorSignature;

        if (selected && snapshot.sectors.some((entry) => entry.id === selected)) {
          sector.value = selected;
        }
      }
    },
    toggle: () => root.classList.toggle("is-collapsed"),
    destroy: () => root.remove(),
  };
};

const section = (title: string, content: string) => `
  <section class="staging-panel__section">
    <h3>${title}</h3>
    <div class="staging-panel__controls">${content}</div>
  </section>
`;

const button = (action: string, label: string) =>
  `<button type="button" data-action="${action}">${label}</button>`;

const option = (value: string, label: string) =>
  `<option value="${value}">${label}</option>`;

const format = (value: number) =>
  Number.isInteger(value) ? `${value}` : value.toFixed(1);
