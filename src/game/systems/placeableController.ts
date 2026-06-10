import { Input } from "phaser";
import {
  MAX_MINES,
  MAX_TURRETS,
  PLACEABLE_MOVE_COST,
} from "../config/gameplay";
import type {
  Barricade,
  MapSectorState,
  Mine,
  MetaProgressionState,
  PlaceableKind,
  RunUpgradeState,
  Turret,
} from "../types/gameplay";
import {
  canUpgradePlaceable,
  createBarricade,
  createMine,
  createTurret,
  getBarricadeCost,
  getMineCost,
  getPlaceableUpgradeCost,
  getRepairCost,
  getTurretCost,
  movePlaceableToCell,
  removeNearestPlaceable,
  removePlaceableById,
  repairPlaceable,
  upgradePlaceable,
} from "./placeables";
import {
  findPlaceableAtCell,
  getKindRadius,
  getPlaceableById,
  getPlaceableCellFromGrid,
  getPlaceableCellFromWorld,
  validatePlaceableCell,
  type PlaceableEntity,
  type PlaceableGridCell,
} from "./placeableGrid";

type PlaceableMode =
  | {
      kind: "place";
      target: PlaceableKind;
    }
  | {
      kind: "move";
      target: PlaceableKind;
      placeableId: string;
    };

type PlaceablePreview = {
  body: Phaser.GameObjects.Arc | Phaser.GameObjects.Rectangle;
  range: Phaser.GameObjects.Arc | null;
  cell: PlaceableGridCell | null;
  valid: boolean;
  message: string;
};

export type PlaceableControllerState = {
  mode: PlaceableMode | null;
  preview: PlaceablePreview | null;
  selectedId: string | null;
  selectionUi: Phaser.GameObjects.Container | null;
  selectionSignature: string;
  pendingFeedback: PlaceableFeedback[];
};

export type PlaceableActionKind =
  | "place"
  | "preview"
  | "move"
  | "repair"
  | "remove"
  | "upgrade";

export type PlaceableActionRequest = {
  kind: PlaceableActionKind;
  target: PlaceableKind;
  x: number;
  y: number;
};

export type PlaceableActionResult = {
  coins: number;
  message: string;
  changed: boolean;
  x?: number;
  y?: number;
};

export type PlaceableInputKeys = {
  turretKey: Phaser.Input.Keyboard.Key;
  mineKey: Phaser.Input.Keyboard.Key;
  barricadeKey: Phaser.Input.Keyboard.Key;
  removePlaceableKey: Phaser.Input.Keyboard.Key;
  cancelPlaceableKey: Phaser.Input.Keyboard.Key;
};

export type PlaceableFeedback = {
  result: PlaceableActionResult;
  pulseColor?: number;
  pulseRadius?: number;
};

type PlaceableInputOptions = {
  scene: Phaser.Scene;
  state: PlaceableControllerState;
  keys: PlaceableInputKeys;
  player: Phaser.GameObjects.Triangle;
  metaState: MetaProgressionState;
  runUpgrades: RunUpgradeState;
  mapState: MapSectorState;
  turrets: Turret[];
  mines: Mine[];
  barricades: Barricade[];
  coins: number;
};

export const createPlaceableControllerState = (): PlaceableControllerState => ({
  mode: null,
  preview: null,
  selectedId: null,
  selectionUi: null,
  selectionSignature: "",
  pendingFeedback: [],
});

export const destroyPlaceableControllerState = (
  state: PlaceableControllerState,
) => {
  clearPreview(state);
  clearSelectionUi(state);
  state.mode = null;
  state.selectedId = null;
  state.pendingFeedback = [];
};

export const getMaxTurrets = (runUpgrades: RunUpgradeState) =>
  MAX_TURRETS + runUpgrades.maxTurretBonus;

export const getMaxMines = (runUpgrades: RunUpgradeState) =>
  MAX_MINES + runUpgrades.maxMineBonus;

export const readPlaceableInput = (
  options: PlaceableInputOptions,
): PlaceableFeedback[] => {
  const feedback = drainPendingFeedback(options.state);

  if (Input.Keyboard.JustDown(options.keys.cancelPlaceableKey)) {
    cancelMode(options.state);
  }

  if (Input.Keyboard.JustDown(options.keys.turretKey)) {
    startPlaceMode(options, "turret");
  }

  if (Input.Keyboard.JustDown(options.keys.mineKey)) {
    startPlaceMode(options, "mine");
  }

  if (Input.Keyboard.JustDown(options.keys.barricadeKey)) {
    if (!options.runUpgrades.barricadeUnlocked) {
      feedback.push(createMessage(options.coins, "Serve un upgrade barricata"));
    } else {
      startPlaceMode(options, "barricade");
    }
  }

  if (Input.Keyboard.JustDown(options.keys.removePlaceableKey)) {
    feedback.push(removeSelectedOrNearest(options));
  }

  updatePreview(options);
  syncSelectionUi(options);

  return feedback.concat(drainPendingFeedback(options.state));
};

export const handlePlaceablePointerDown = (
  options: PlaceableInputOptions & { pointer: Phaser.Input.Pointer },
): PlaceableFeedback[] => {
  const { state, pointer } = options;

  if (!pointer.leftButtonDown()) {
    return [];
  }

  const feedback = drainPendingFeedback(state);

  if (state.mode) {
    feedback.push(commitActiveMode(options));
    return feedback.concat(drainPendingFeedback(state));
  }

  const cell = getPlaceableCellFromWorld(pointer.worldX, pointer.worldY);
  const selected = findPlaceableAtCell(
    cell,
    options.turrets,
    options.mines,
    options.barricades,
  );

  if (!selected) {
    clearSelection(options.state);
    return feedback;
  }

  const validation = validatePlaceableCell({
    cell: getPlaceableCellFromGrid(selected.gridX, selected.gridY),
    player: options.player,
    mapState: options.mapState,
    turrets: [],
    mines: [],
    barricades: [],
    ignoreId: selected.id,
    radius: getKindRadius(selected.kind),
  });

  if (!validation.valid && validation.reason === "Fuori raggio operativo") {
    feedback.push(createMessage(options.coins, "Piazzabile fuori raggio"));
    clearSelection(options.state);
    return feedback;
  }

  state.selectedId = selected.id;
  state.selectionSignature = "";
  return feedback;
};

const startPlaceMode = (
  options: PlaceableInputOptions,
  target: PlaceableKind,
) => {
  options.state.mode = { kind: "place", target };
  options.state.selectedId = null;
  clearSelectionUi(options.state);
  createPreview(options.scene, options.state, target);
};

const startMoveMode = (
  options: PlaceableInputOptions,
  placeable: PlaceableEntity,
) => {
  if (options.coins < PLACEABLE_MOVE_COST) {
    options.state.pendingFeedback.push(
      createMessage(options.coins, `Servono ${PLACEABLE_MOVE_COST} risorse`),
    );
    return;
  }

  options.state.mode = {
    kind: "move",
    target: placeable.kind,
    placeableId: placeable.id,
  };
  options.state.selectedId = null;
  clearSelectionUi(options.state);
  createPreview(options.scene, options.state, placeable.kind);
};

const commitActiveMode = (
  options: PlaceableInputOptions & { pointer: Phaser.Input.Pointer },
): PlaceableFeedback => {
  const { state } = options;
  const mode = state.mode;
  const cell = state.preview?.cell;

  if (!mode || !cell) {
    return createMessage(options.coins, "");
  }

  const validation = validatePlaceableCell({
    cell,
    player: options.player,
    mapState: options.mapState,
    turrets: options.turrets,
    mines: options.mines,
    barricades: options.barricades,
    ignoreId: mode.kind === "move" ? mode.placeableId : undefined,
    radius: getKindRadius(mode.target),
  });

  if (!validation.valid) {
    return createMessage(options.coins, validation.reason);
  }

  if (mode.kind === "move") {
    return commitMove(options, mode.placeableId, cell);
  }

  if (mode.target === "turret") {
    return createFeedback(
      tryPlaceTurret(options, cell),
      0x38bdf8,
      28,
    );
  }

  if (mode.target === "mine") {
    return createFeedback(tryPlaceMine(options, cell), 0xfacc15, 22);
  }

  return createFeedback(tryPlaceBarricade(options, cell), 0xcbd5e1, 24);
};

const commitMove = (
  options: PlaceableInputOptions,
  placeableId: string,
  cell: PlaceableGridCell,
): PlaceableFeedback => {
  const placeable = getPlaceableById(
    placeableId,
    options.turrets,
    options.mines,
    options.barricades,
  );

  if (!placeable) {
    cancelMode(options.state);
    return createMessage(options.coins, "Piazzabile non trovato");
  }

  if (options.coins < PLACEABLE_MOVE_COST) {
    return createMessage(
      options.coins,
      `Servono ${PLACEABLE_MOVE_COST} risorse`,
    );
  }

  movePlaceableToCell(placeable, cell);
  cancelMode(options.state);

  return createFeedback(
    {
      coins: options.coins - PLACEABLE_MOVE_COST,
      message: "",
      changed: true,
      x: cell.x,
      y: cell.y,
    },
    getPulseColor(placeable.kind),
    24,
  );
};

const tryPlaceTurret = (
  options: PlaceableInputOptions,
  cell: PlaceableGridCell,
): PlaceableActionResult => {
  const maxTurrets = getMaxTurrets(options.runUpgrades);
  const turretCost = getTurretCost(options.metaState.loadout.turrets);

  if (options.turrets.length >= maxTurrets) {
    return {
      coins: options.coins,
      message: `Limite torrette ${maxTurrets}/${maxTurrets}`,
      changed: false,
    };
  }

  if (options.coins < turretCost) {
    return {
      coins: options.coins,
      message: `Servono ${turretCost} risorse per una torretta`,
      changed: false,
    };
  }

  options.turrets.push(
    createTurret(
      options.scene,
      cell.x,
      cell.y,
      options.metaState.loadout.turrets,
      options.runUpgrades,
      { gridX: cell.gridX, gridY: cell.gridY },
    ),
  );
  cancelMode(options.state);

  return {
    coins: options.coins - turretCost,
    message: "",
    changed: true,
    x: cell.x,
    y: cell.y,
  };
};

const tryPlaceMine = (
  options: PlaceableInputOptions,
  cell: PlaceableGridCell,
): PlaceableActionResult => {
  const maxMines = getMaxMines(options.runUpgrades);
  const mineCost = getMineCost(
    options.metaState.loadout.mines,
    options.runUpgrades,
  );

  if (options.mines.length >= maxMines) {
    return {
      coins: options.coins,
      message: `Limite mine ${maxMines}/${maxMines}`,
      changed: false,
    };
  }

  if (options.coins < mineCost) {
    return {
      coins: options.coins,
      message: `Servono ${mineCost} risorse per una mina`,
      changed: false,
    };
  }

  options.mines.push(
    createMine(
      options.scene,
      cell.x,
      cell.y,
      options.metaState.loadout.mines,
      options.runUpgrades,
      { gridX: cell.gridX, gridY: cell.gridY },
    ),
  );
  cancelMode(options.state);

  return {
    coins: options.coins - mineCost,
    message: "",
    changed: true,
    x: cell.x,
    y: cell.y,
  };
};

const tryPlaceBarricade = (
  options: PlaceableInputOptions,
  cell: PlaceableGridCell,
): PlaceableActionResult => {
  if (!options.runUpgrades.barricadeUnlocked) {
    return {
      coins: options.coins,
      message: "Serve un upgrade barricata",
      changed: false,
    };
  }

  if (options.barricades.length >= options.runUpgrades.maxBarricades) {
    return {
      coins: options.coins,
      message: `Limite barricate ${options.runUpgrades.maxBarricades}/${options.runUpgrades.maxBarricades}`,
      changed: false,
    };
  }

  const cost = getBarricadeCost(options.runUpgrades);

  if (options.coins < cost) {
    return {
      coins: options.coins,
      message: `Servono ${cost} risorse per una barricata`,
      changed: false,
    };
  }

  options.barricades.push(
    createBarricade(options.scene, cell.x, cell.y, options.runUpgrades, {
      gridX: cell.gridX,
      gridY: cell.gridY,
    }),
  );
  cancelMode(options.state);

  return {
    coins: options.coins - cost,
    message: "",
    changed: true,
    x: cell.x,
    y: cell.y,
  };
};

const removeSelectedOrNearest = (
  options: PlaceableInputOptions,
): PlaceableFeedback => {
  if (options.state.selectedId) {
    const removed = removePlaceableById(
      options.state.selectedId,
      options.turrets,
      options.mines,
      options.barricades,
    );
    clearSelection(options.state);

    return createFeedback({
      coins: options.coins,
      message: removed ? "Piazzabile rimosso" : "Nessun piazzabile vicino",
      changed: removed,
    });
  }

  const removed = removeNearestPlaceable(
    options.player.x,
    options.player.y,
    options.turrets,
    options.mines,
    options.barricades,
  );

  return createFeedback({
    coins: options.coins,
    message: removed ? "Piazzabile rimosso" : "Nessun piazzabile vicino",
    changed: removed,
  });
};

const updatePreview = (options: PlaceableInputOptions) => {
  const { state } = options;

  if (!state.mode || !state.preview) {
    return;
  }

  const pointer = options.scene.input.activePointer;
  const cell = getPlaceableCellFromWorld(pointer.worldX, pointer.worldY);
  const validation = validatePlaceableCell({
    cell,
    player: options.player,
    mapState: options.mapState,
    turrets: options.turrets,
    mines: options.mines,
    barricades: options.barricades,
    ignoreId: state.mode.kind === "move" ? state.mode.placeableId : undefined,
    radius: getKindRadius(state.mode.target),
  });

  state.preview.cell = cell;
  state.preview.valid = validation.valid;
  state.preview.message = validation.reason;
  state.preview.body.setPosition(cell.x, cell.y);
  state.preview.body.setAlpha(validation.valid ? 0.72 : 0.36);
  state.preview.body.setStrokeStyle(
    2,
    validation.valid ? 0xe0f2fe : 0xfb7185,
    0.92,
  );

  if (state.preview.range) {
    state.preview.range.setPosition(cell.x, cell.y);
    state.preview.range.setAlpha(validation.valid ? 0.12 : 0.06);
  }
};

const createPreview = (
  scene: Phaser.Scene,
  state: PlaceableControllerState,
  target: PlaceableKind,
) => {
  clearPreview(state);

  const pointer = scene.input.activePointer;
  const cell = getPlaceableCellFromWorld(pointer.worldX, pointer.worldY);
  const color = getPulseColor(target);
  const body =
    target === "mine"
      ? scene.add.circle(cell.x, cell.y, 13, color, 0.55)
      : scene.add.rectangle(
          cell.x,
          cell.y,
          target === "barricade" ? 50 : 24,
          target === "barricade" ? 50 : 24,
          color,
          0.55,
        );
  const range =
    target === "turret"
      ? scene.add.circle(cell.x, cell.y, 116, color, 0.08)
      : null;

  body.setDepth(70).setStrokeStyle(2, 0xe0f2fe, 0.92);
  range?.setDepth(69).setStrokeStyle(1, color, 0.16);

  state.preview = {
    body,
    range,
    cell,
    valid: false,
    message: "",
  };
};

const syncSelectionUi = (options: PlaceableInputOptions) => {
  const selected = options.state.selectedId
    ? getPlaceableById(
        options.state.selectedId,
        options.turrets,
        options.mines,
        options.barricades,
      )
    : null;

  if (!selected) {
    clearSelection(options.state);
    return;
  }

  const repairCost = getRepairCost(selected);
  const upgradeCost = getPlaceableUpgradeCost(selected);
  const canRepair = repairCost > 0 && options.coins >= repairCost;
  const canMove = options.coins >= PLACEABLE_MOVE_COST;
  const canUpgrade =
    canUpgradePlaceable(selected, options.runUpgrades) &&
    options.coins >= upgradeCost;
  const signature = [
    selected.id,
    selected.level,
    Math.ceil(selected.hp),
    Math.ceil(selected.maxHp),
    options.coins,
    canUpgrade ? "u" : "nu",
  ].join(":");

  if (signature === options.state.selectionSignature) {
    options.state.selectionUi?.setPosition(selected.body.x, selected.body.y - 78);
    return;
  }

  clearSelectionUi(options.state);
  options.state.selectionSignature = signature;
  options.state.selectionUi = createSelectionUi(options, selected, {
    repairCost,
    upgradeCost,
    canRepair,
    canMove,
    canUpgrade,
  });
};

const createSelectionUi = (
  options: PlaceableInputOptions,
  placeable: PlaceableEntity,
  state: {
    repairCost: number;
    upgradeCost: number;
    canRepair: boolean;
    canMove: boolean;
    canUpgrade: boolean;
  },
) => {
  const container = options.scene.add
    .container(placeable.body.x, placeable.body.y - 78)
    .setDepth(260);
  const bg = options.scene.add
    .rectangle(0, 0, 230, 78, 0x020617, 0.82)
    .setStrokeStyle(1, 0x67e8f9, 0.5);
  const title = options.scene.add
    .text(-104, -30, `${placeable.label} Lv.${placeable.level}`, {
      fontFamily: "Arial Black",
      fontSize: 12,
      color: "#e2e8f0",
    })
    .setOrigin(0, 0.5);
  const hp = options.scene.add
    .text(
      -104,
      -12,
      `HP ${Math.ceil(placeable.hp)}/${Math.ceil(placeable.maxHp)}`,
      {
        fontFamily: "Arial",
        fontSize: 11,
        color: "#94a3b8",
      },
    )
    .setOrigin(0, 0.5);

  container.add([bg, title, hp]);
  container.add(
    createActionButton(options.scene, -74, 22, "Ripara", state.canRepair, () =>
      handleRepair(options, placeable.id, state.repairCost),
    ),
  );
  container.add(
    createActionButton(options.scene, -24, 22, "Sposta", state.canMove, () =>
      handleMove(options, placeable.id),
    ),
  );
  container.add(
    createActionButton(options.scene, 33, 22, "Upgrade", state.canUpgrade, () =>
      handleUpgrade(options, placeable.id, state.upgradeCost),
    ),
  );
  container.add(
    createActionButton(options.scene, 88, 22, "X", true, () =>
      handleRemove(options, placeable.id),
    ),
  );

  return container;
};

const createActionButton = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  enabled: boolean,
  action: () => void,
) => {
  const button = scene.add.container(x, y);
  const width = label === "X" ? 28 : 48;
  const bg = scene.add
    .rectangle(0, 0, width, 22, enabled ? 0x0f172a : 0x111827, 0.94)
    .setStrokeStyle(1, enabled ? 0x7dd3fc : 0x475569, 0.78);
  const text = scene.add
    .text(0, 0, label, {
      fontFamily: "Arial Black",
      fontSize: label === "Upgrade" ? 9 : 10,
      color: enabled ? "#e0f2fe" : "#64748b",
    })
    .setOrigin(0.5);

  bg.setInteractive({ useHandCursor: enabled });
  bg.on(
    "pointerdown",
    (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();

      if (enabled) {
        action();
      }
    },
  );

  button.add([bg, text]);

  return button;
};

const handleRepair = (
  options: PlaceableInputOptions,
  placeableId: string,
  cost: number,
) => {
  const placeable = getPlaceableById(
    placeableId,
    options.turrets,
    options.mines,
    options.barricades,
  );

  if (!placeable) {
    return;
  }

  if (cost <= 0) {
    options.state.pendingFeedback.push(createMessage(options.coins, "Gia integro"));
    return;
  }

  if (options.coins < cost) {
    options.state.pendingFeedback.push(
      createMessage(options.coins, `Servono ${cost} risorse`),
    );
    return;
  }

  repairPlaceable(placeable);
  options.state.pendingFeedback.push(
    createFeedback(
      {
        coins: options.coins - cost,
        message: "Piazzabile riparato",
        changed: true,
        x: placeable.body.x,
        y: placeable.body.y,
      },
      getPulseColor(placeable.kind),
      22,
    ),
  );
};

const handleMove = (options: PlaceableInputOptions, placeableId: string) => {
  const placeable = getPlaceableById(
    placeableId,
    options.turrets,
    options.mines,
    options.barricades,
  );

  if (placeable) {
    startMoveMode(options, placeable);
  }
};

const handleUpgrade = (
  options: PlaceableInputOptions,
  placeableId: string,
  cost: number,
) => {
  const placeable = getPlaceableById(
    placeableId,
    options.turrets,
    options.mines,
    options.barricades,
  );

  if (!placeable) {
    return;
  }

  if (!canUpgradePlaceable(placeable, options.runUpgrades)) {
    options.state.pendingFeedback.push(
      createMessage(options.coins, "Nessun upgrade disponibile"),
    );
    return;
  }

  if (options.coins < cost) {
    options.state.pendingFeedback.push(
      createMessage(options.coins, `Servono ${cost} risorse`),
    );
    return;
  }

  upgradePlaceable(placeable, options.runUpgrades);
  options.state.pendingFeedback.push(
    createFeedback(
      {
        coins: options.coins - cost,
        message: "Piazzabile potenziato",
        changed: true,
        x: placeable.body.x,
        y: placeable.body.y,
      },
      getPulseColor(placeable.kind),
      26,
    ),
  );
};

const handleRemove = (options: PlaceableInputOptions, placeableId: string) => {
  const placeable = getPlaceableById(
    placeableId,
    options.turrets,
    options.mines,
    options.barricades,
  );
  const x = placeable?.body.x;
  const y = placeable?.body.y;
  const removed = removePlaceableById(
    placeableId,
    options.turrets,
    options.mines,
    options.barricades,
  );

  clearSelection(options.state);
  options.state.pendingFeedback.push(
    createFeedback({
      coins: options.coins,
      message: removed ? "Piazzabile rimosso" : "Nessun piazzabile vicino",
      changed: removed,
      x,
      y,
    }),
  );
};

const clearSelection = (state: PlaceableControllerState) => {
  state.selectedId = null;
  clearSelectionUi(state);
};

const clearSelectionUi = (state: PlaceableControllerState) => {
  state.selectionUi?.destroy();
  state.selectionUi = null;
  state.selectionSignature = "";
};

const cancelMode = (state: PlaceableControllerState) => {
  state.mode = null;
  clearPreview(state);
};

const clearPreview = (state: PlaceableControllerState) => {
  state.preview?.body.destroy();
  state.preview?.range?.destroy();
  state.preview = null;
};

const drainPendingFeedback = (state: PlaceableControllerState) => {
  const feedback = [...state.pendingFeedback];

  state.pendingFeedback = [];

  return feedback;
};

const createFeedback = (
  result: PlaceableActionResult,
  pulseColor?: number,
  pulseRadius?: number,
): PlaceableFeedback => ({
  result,
  pulseColor,
  pulseRadius,
});

const createMessage = (
  coins: number,
  message: string,
): PlaceableFeedback => createFeedback({ coins, message, changed: false });

const getPulseColor = (kind: PlaceableKind) => {
  if (kind === "mine") {
    return 0xfacc15;
  }

  if (kind === "barricade") {
    return 0xcbd5e1;
  }

  return 0x38bdf8;
};
