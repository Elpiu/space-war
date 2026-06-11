import {
  PLACEABLE_CELL_SIZE,
  PLACEABLE_INTERACTION_RANGE,
  PLACEABLE_UNIT_SIZE,
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
  size: number;
};

export type PlaceableValidation = {
  valid: boolean;
  reason: string;
};

export type PlaceableEntity = Turret | Mine | Barricade;

export const getPlaceableCellFromWorld = (
  x: number,
  y: number,
  kind: PlaceableKind = "turret",
): PlaceableGridCell => {
  const cellSize = getPlacementCellSize(kind);
  const gridX = Math.floor(x / cellSize);
  const gridY = Math.floor(y / cellSize);

  return getPlaceableCellFromGrid(gridX, gridY, kind);
};

export const getPlaceableCellFromGrid = (
  gridX: number,
  gridY: number,
  kind: PlaceableKind = "turret",
): PlaceableGridCell => ({
  gridX,
  gridY,
  x: gridX * getPlacementCellSize(kind) + getPlacementCellSize(kind) / 2,
  y: gridY * getPlacementCellSize(kind) + getPlacementCellSize(kind) / 2,
  size: getPlacementCellSize(kind),
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
  kind: PlaceableKind;
  player: Position;
  mapState: MapSectorState;
  turrets: Turret[];
  mines: Mine[];
  barricades: Barricade[];
  ignoreId?: string;
  radius?: number;
}): PlaceableValidation => {
  const { cell } = options;
  const radius = options.radius ?? getKindRadius(options.kind);

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
  ).some((placeable) => {
    if (placeable.id === options.ignoreId) {
      return false;
    }

    return cellsOverlap(
      getOccupiedGridKeys(cell, options.kind),
      getOccupiedGridKeys(
        getPlaceableCellFromGrid(placeable.gridX, placeable.gridY, placeable.kind),
        placeable.kind,
      ),
    );
  });

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
  const targetKeys = getOccupiedGridKeys(cell, "turret");

  return (
    getAllPlaceables(turrets, mines, barricades).find(
      (placeable) => cellsOverlap(
        targetKeys,
        getOccupiedGridKeys(
          getPlaceableCellFromGrid(placeable.gridX, placeable.gridY, placeable.kind),
          placeable.kind,
        ),
      ),
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
    return 40;
  }

  return 20;
};

export const getPlacementCellSize = (kind: PlaceableKind) =>
  kind === "barricade" ? PLACEABLE_UNIT_SIZE : PLACEABLE_CELL_SIZE;

export const getPlaceableUnitBounds = (cell: PlaceableGridCell) => {
  const unitGridX =
    cell.size === PLACEABLE_UNIT_SIZE ? cell.gridX : Math.floor(cell.gridX / 2);
  const unitGridY =
    cell.size === PLACEABLE_UNIT_SIZE ? cell.gridY : Math.floor(cell.gridY / 2);

  return {
    x: unitGridX * PLACEABLE_UNIT_SIZE,
    y: unitGridY * PLACEABLE_UNIT_SIZE,
    size: PLACEABLE_UNIT_SIZE,
  };
};

export const getSubcellBounds = (cell: PlaceableGridCell) => ({
  x: cell.gridX * PLACEABLE_CELL_SIZE,
  y: cell.gridY * PLACEABLE_CELL_SIZE,
  size: PLACEABLE_CELL_SIZE,
});

const getOccupiedGridKeys = (
  cell: PlaceableGridCell,
  kind: PlaceableKind,
) => {
  if (kind !== "barricade") {
    return [getPlaceableGridKey(cell.gridX, cell.gridY)];
  }

  const originX = cell.gridX * 2;
  const originY = cell.gridY * 2;

  return [
    getPlaceableGridKey(originX, originY),
    getPlaceableGridKey(originX + 1, originY),
    getPlaceableGridKey(originX, originY + 1),
    getPlaceableGridKey(originX + 1, originY + 1),
  ];
};

const cellsOverlap = (from: string[], to: string[]) =>
  from.some((key) => to.includes(key));

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
