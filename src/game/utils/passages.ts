import { PLACEABLE_UNIT_SIZE } from "../config/gameplay";
import type { MapDirection, MapOpening, MapSector } from "../types/gameplay";

const PASSAGE_QUARTER_SIZE = PLACEABLE_UNIT_SIZE / 4;
const MIN_PASSAGE_SIZE = PLACEABLE_UNIT_SIZE;
const MAX_PASSAGE_SIZE = PLACEABLE_UNIT_SIZE * 4;

export const getSharedSectorPassage = (
  from: MapSector,
  to: MapSector,
  fromDirection: MapDirection,
  toDirection: MapDirection,
  overlapStart: number,
  overlapEnd: number,
) => {
  const overlap = overlapEnd - overlapStart;
  const fromOpening = findOpening(from.openings, fromDirection);
  const toOpening = findOpening(to.openings, toDirection);
  const sizeRatio =
    ((fromOpening?.sizeRatio ?? 0.34) + (toOpening?.sizeRatio ?? 0.34)) / 2;
  const centerRatio =
    ((fromOpening?.centerRatio ?? 0.5) + (toOpening?.centerRatio ?? 0.5)) / 2;
  const size = quantizePassageSize(overlap * sizeRatio, overlap);
  const center = quantizePassageCenter(
    overlapStart + overlap * centerRatio,
    size,
    overlapStart,
    overlapEnd,
  );

  return {
    center,
    size,
  };
};

const quantizePassageSize = (rawSize: number, overlap: number) => {
  const maxSize = Math.min(MAX_PASSAGE_SIZE, overlap);
  const quantizedMax =
    Math.floor(maxSize / PASSAGE_QUARTER_SIZE) * PASSAGE_QUARTER_SIZE;
  const quantizedSize =
    Math.round(rawSize / PASSAGE_QUARTER_SIZE) * PASSAGE_QUARTER_SIZE;

  if (quantizedMax < MIN_PASSAGE_SIZE) {
    return Math.max(PASSAGE_QUARTER_SIZE, quantizedMax);
  }

  return clamp(quantizedSize, MIN_PASSAGE_SIZE, quantizedMax);
};

const quantizePassageCenter = (
  rawCenter: number,
  size: number,
  overlapStart: number,
  overlapEnd: number,
) => {
  const minStart = overlapStart;
  const maxStart = overlapEnd - size;
  const rawStart = rawCenter - size / 2;
  const snappedStart =
    Math.round(rawStart / PASSAGE_QUARTER_SIZE) * PASSAGE_QUARTER_SIZE;
  const start = clamp(snappedStart, minStart, maxStart);

  return start + size / 2;
};

const findOpening = (openings: MapOpening[], direction: MapDirection) =>
  openings.find((opening) => opening.direction === direction);

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
