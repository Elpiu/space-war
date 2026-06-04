import { Input } from "phaser";
import { MAX_MINES, MAX_TURRETS } from "../config/gameplay";
import type {
  Barricade,
  Mine,
  MetaProgressionState,
  RunUpgradeState,
  Turret,
} from "../types/gameplay";
import {
  createBarricade,
  createMine,
  createTurret,
  getBarricadeCost,
  getMineCost,
  getTurretCost,
  removeNearestPlaceable,
} from "./placeables";

export type PlaceableActionKind =
  | "place"
  | "preview"
  | "move"
  | "repair"
  | "remove"
  | "upgrade";

export type PlaceableActionRequest = {
  kind: PlaceableActionKind;
  target: "turret" | "mine" | "barricade";
  x: number;
  y: number;
};

export type PlaceableActionResult = {
  coins: number;
  message: string;
  changed: boolean;
};

export type PlaceableInputKeys = {
  turretKey: Phaser.Input.Keyboard.Key;
  mineKey: Phaser.Input.Keyboard.Key;
  barricadeKey: Phaser.Input.Keyboard.Key;
  removePlaceableKey: Phaser.Input.Keyboard.Key;
};

export type PlaceableFeedback = {
  result: PlaceableActionResult;
  pulseColor?: number;
  pulseRadius?: number;
};

export const getMaxTurrets = (runUpgrades: RunUpgradeState) =>
  MAX_TURRETS + runUpgrades.maxTurretBonus;

export const getMaxMines = (runUpgrades: RunUpgradeState) =>
  MAX_MINES + runUpgrades.maxMineBonus;

export const readPlaceableInput = (options: {
  scene: Phaser.Scene;
  keys: PlaceableInputKeys;
  player: Phaser.GameObjects.Triangle;
  metaState: MetaProgressionState;
  runUpgrades: RunUpgradeState;
  turrets: Turret[];
  mines: Mine[];
  barricades: Barricade[];
  coins: number;
}): PlaceableFeedback[] => {
  const actions: PlaceableFeedback[] = [];

  if (Input.Keyboard.JustDown(options.keys.turretKey)) {
    actions.push({
      result: tryPlaceTurret(options),
      pulseColor: 0x38bdf8,
      pulseRadius: 28,
    });
  }

  if (Input.Keyboard.JustDown(options.keys.mineKey)) {
    actions.push({
      result: tryPlaceMine(options),
      pulseColor: 0xfacc15,
      pulseRadius: 22,
    });
  }

  if (Input.Keyboard.JustDown(options.keys.barricadeKey)) {
    actions.push({
      result: tryPlaceBarricade(options),
      pulseColor: 0xcbd5e1,
      pulseRadius: 24,
    });
  }

  if (Input.Keyboard.JustDown(options.keys.removePlaceableKey)) {
    actions.push({
      result: tryRemoveNearestPlaceable(options),
    });
  }

  return actions;
};

export const tryPlaceTurret = (options: {
  scene: Phaser.Scene;
  player: Phaser.GameObjects.Triangle;
  metaState: MetaProgressionState;
  runUpgrades: RunUpgradeState;
  turrets: Turret[];
  coins: number;
}): PlaceableActionResult => {
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
      options.player.x,
      options.player.y,
      options.metaState.loadout.turrets,
      options.runUpgrades,
    ),
  );

  return {
    coins: options.coins - turretCost,
    message: "",
    changed: true,
  };
};

export const tryPlaceMine = (options: {
  scene: Phaser.Scene;
  player: Phaser.GameObjects.Triangle;
  metaState: MetaProgressionState;
  runUpgrades: RunUpgradeState;
  mines: Mine[];
  coins: number;
}): PlaceableActionResult => {
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
      options.player.x,
      options.player.y,
      options.metaState.loadout.mines,
      options.runUpgrades,
    ),
  );

  return {
    coins: options.coins - mineCost,
    message: "",
    changed: true,
  };
};

export const tryPlaceBarricade = (options: {
  scene: Phaser.Scene;
  player: Phaser.GameObjects.Triangle;
  runUpgrades: RunUpgradeState;
  barricades: Barricade[];
  coins: number;
}): PlaceableActionResult => {
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
    createBarricade(
      options.scene,
      options.player.x,
      options.player.y,
      options.runUpgrades,
    ),
  );

  return {
    coins: options.coins - cost,
    message: "",
    changed: true,
  };
};

export const tryRemoveNearestPlaceable = (options: {
  player: Phaser.GameObjects.Triangle;
  turrets: Turret[];
  mines: Mine[];
  barricades: Barricade[];
  coins: number;
}): PlaceableActionResult => {
  const removed = removeNearestPlaceable(
    options.player.x,
    options.player.y,
    options.turrets,
    options.mines,
    options.barricades,
  );

  return {
    coins: options.coins,
    message: removed ? "Piazzabile rimosso" : "Nessun piazzabile vicino",
    changed: removed,
  };
};
