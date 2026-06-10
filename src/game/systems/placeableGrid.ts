import {
  PLACEABLE_CELL_SIZE,
  PLACEABLE_INTERACTION_RANGE,
} from "../config/gameplay";
import type {
  Barricade,
  MapSectorState,
  Mine,
  PlaceableKind,
  Turret,
} from "../types/gameplay";
import { circleHitsHazard, isInsideMap } from "../utils/geometry";
import { getBlockingHazards } from "./mapSectors";

type Position = {
  x: number;
  y: number;
};

export type PlaceableGridCell = {
  gridX: number;
  gridY: number;
  x: number;
  y: number;
};

export type PlaceableValidation = {
  valid: boolean;
  reason: string;
};

export type PlaceableEntity = Turret | Mine | Barricade;

export const getPlaceableCellFromWorld = (
  x: number,
  y: number,
): PlaceableGridCell => {
  const gridX = Math.round(x / PLACEABLE_CELL_SIZE);
  const gridY = Math.round(y / PLACEABLE_CELL_SIZE);

  return getPlaceableCellFromGrid(gridX, gridY);
};

export const getPlaceableCellFromGrid = (
  gridX: number,
  gridY: number,
): PlaceableGridCell => ({
  gridX,
  gridY,
  x: gridX * PLACEABLE_CELL_SIZE,
  y: gridY * PLACEABLE_CELL_SIZE,
});

export const getPlaceableGridKey = (gridX: number, gridY: number) =>
  `${gridX}:${gridY}`;

export const getAllPlaceables = (
  turrets: Turret[],
  mines: Mine[],
  barricades: Barricade[],
): PlaceableEntity[] => [...turrets, ...mines, ...barricades];

export const validatePlaceableCell = (options: {
  cell: PlaceableGridCell;
  player: Position;
  mapState: MapSectorState;
  turrets: Turret[];
  mines: Mine[];
  barricades: Barricade[];
  ignoreId?: string;
  radius?: number;
}): PlaceableValidation => {
  const { cell } = options;
  const radius = options.radius ?? getPlacementRadius();

  if (
    distanceSquared(cell.x, cell.y, options.player.x, options.player.y) >
    PLACEABLE_INTERACTION_RANGE * PLACEABLE_INTERACTION_RANGE
  ) {
    return { valid: false, reason: "Fuori raggio operativo" };
  }

  if (!isInsideMap(cell.x, cell.y, -radius, options.mapState.sectors)) {
    return { valid: false, reason: "Fuori dalla mappa" };
  }

  if (circleHitsHazard(cell, radius, getBlockingHazards(options.mapState))) {
    return { valid: false, reason: "Cella bloccata" };
  }

  const occupied = getAllPlaceables(
    options.turrets,
    options.mines,
    options.barricades,
  ).some(
    (placeable) =>
      placeable.id !== options.ignoreId &&
      placeable.gridX === cell.gridX &&
      placeable.gridY === cell.gridY,
  );

  if (occupied) {
    return { valid: false, reason: "Cella occupata" };
  }

  return { valid: true, reason: "" };
};

export const findPlaceableAtCell = (
  cell: PlaceableGridCell,
  turrets: Turret[],
  mines: Mine[],
  barricades: Barricade[],
): PlaceableEntity | null => {
  return (
    getAllPlaceables(turrets, mines, barricades).find(
      (placeable) =>
        placeable.gridX === cell.gridX && placeable.gridY === cell.gridY,
    ) ?? null
  );
};

export const getPlaceableById = (
  placeableId: string,
  turrets: Turret[],
  mines: Mine[],
  barricades: Barricade[],
): PlaceableEntity | null => {
  return (
    getAllPlaceables(turrets, mines, barricades).find(
      (placeable) => placeable.id === placeableId,
    ) ?? null
  );
};

export const getKindRadius = (kind: PlaceableKind) => {
  if (kind === "mine") {
    return 14;
  }

  if (kind === "barricade") {
    return 28;
  }

  return 20;
};

const getPlacementRadius = () => PLACEABLE_CELL_SIZE * 0.38;

const distanceSquared = (
  ax: number,
  ay: number,
  bx: number,
  by: number,
) => {
  const dx = ax - bx;
  const dy = ay - by;

  return dx * dx + dy * dy;
};
