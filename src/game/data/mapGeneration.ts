import type {
  MapDirection,
  MapHazard,
  MapOpening,
  SectorArchetypeId,
  SectorSize,
} from "../types/gameplay";

export const SECTOR_SIZE_SEQUENCE: SectorSize[] = [
  "small",
  "medium",
  "large",
  "medium",
  "small",
  "large",
];

export const SECTOR_NAMES: Record<SectorSize, string[]> = {
  small: ["Settore compatto", "Tasca mineraria", "Cella rotta"],
  medium: ["Settore mediano", "Fascia ionica", "Campo di rottami"],
  large: ["Settore vasto", "Distesa plasma", "Cantiere orbitale"],
};

export const SECTOR_ARCHETYPES: Record<
  SectorArchetypeId,
  {
    names: string[];
    riskMultiplier: number;
    rewardMultiplier: number;
    hazardPattern: MapHazard["kind"][];
    openingSizeBias: number;
    openingDrift: number;
    color?: number;
    accentColor?: number;
  }
> = {
  balanced: {
    names: ["Settore mediano", "Corridoio orbitale", "Fascia neutra"],
    riskMultiplier: 1,
    rewardMultiplier: 1,
    hazardPattern: ["asteroid", "nebula", "plasma"],
    openingSizeBias: 0,
    openingDrift: 0.08,
  },
  salvage: {
    names: ["Cimitero di rottami", "Deposito relitti", "Tasca mineraria"],
    riskMultiplier: 1.08,
    rewardMultiplier: 1.24,
    hazardPattern: ["asteroid", "asteroid", "radiation"],
    openingSizeBias: -0.04,
    openingDrift: 0.18,
    color: 0x854d0e,
    accentColor: 0xfbbf24,
  },
  nebula: {
    names: ["Nebulosa cieca", "Fascia ionica", "Nube gravitica"],
    riskMultiplier: 1.15,
    rewardMultiplier: 1.18,
    hazardPattern: ["nebula", "gravityWell", "asteroid"],
    openingSizeBias: 0.03,
    openingDrift: 0.24,
    color: 0x0e7490,
    accentColor: 0x67e8f9,
  },
  plasma: {
    names: ["Distesa plasma", "Faglia solare", "Reattore disperso"],
    riskMultiplier: 1.32,
    rewardMultiplier: 1.36,
    hazardPattern: ["plasma", "radiation", "nebula"],
    openingSizeBias: -0.08,
    openingDrift: 0.16,
    color: 0xbe123c,
    accentColor: 0xfb7185,
  },
  fortress: {
    names: ["Cantiere orbitale", "Bastione spento", "Anello corazzato"],
    riskMultiplier: 1.42,
    rewardMultiplier: 1.52,
    hazardPattern: ["asteroid", "gravityWell", "plasma", "radiation"],
    openingSizeBias: -0.1,
    openingDrift: 0.28,
    color: 0x4338ca,
    accentColor: 0xa5b4fc,
  },
};

export const getSectorSizeForExpansion = (
  sectorNumber: number,
  anchorSeed: number,
) => {
  const index = positiveModulo(
    sectorNumber - 1 + Math.floor(anchorSeed % SECTOR_SIZE_SEQUENCE.length),
    SECTOR_SIZE_SEQUENCE.length,
  );

  return SECTOR_SIZE_SEQUENCE[index];
};

export const getSectorArchetype = (
  sectorNumber: number,
  anchorSeed: number,
): SectorArchetypeId => {
  if (sectorNumber === 0) {
    return "balanced";
  }

  const archetypes: SectorArchetypeId[] = [
    "balanced",
    "salvage",
    "nebula",
    "plasma",
    "fortress",
    "salvage",
  ];
  const index = positiveModulo(
    sectorNumber + Math.floor(anchorSeed % archetypes.length),
    archetypes.length,
  );

  return archetypes[index];
};

export const createSectorOpenings = (
  sectorNumber: number,
  archetype: SectorArchetypeId,
  preferredDirection?: MapDirection,
): MapOpening[] => {
  const config = SECTOR_ARCHETYPES[archetype];
  const baseSize = clamp(0.28 + (sectorNumber % 3) * 0.04 + config.openingSizeBias, 0.18, 0.42);
  const centerOffset = ((sectorNumber % 5) - 2) * config.openingDrift * 0.22;
  const primary: MapOpening = {
    direction: preferredDirection ?? "south",
    centerRatio: clamp(0.5 + centerOffset, 0.28, 0.72),
    sizeRatio: baseSize,
  };
  const secondaryDirection = rotateDirection(primary.direction, sectorNumber);
  const tertiaryDirection = rotateDirection(secondaryDirection, sectorNumber + 1);
  const openings: MapOpening[] = [
    primary,
    {
      direction: secondaryDirection,
      centerRatio: clamp(0.38 + (sectorNumber % 2) * 0.24 - centerOffset, 0.24, 0.76),
      sizeRatio: Math.max(0.16, baseSize - 0.06),
    },
  ];

  if (archetype === "nebula" || archetype === "salvage") {
    openings.push({
      direction: tertiaryDirection,
      centerRatio: clamp(0.5 - centerOffset * 0.8, 0.28, 0.72),
      sizeRatio: Math.max(0.18, baseSize - 0.1),
    });
  }

  return openings;
};

export const createSectorHazards = (options: {
  sectorId: string;
  sectorNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  size: SectorSize;
  archetype: SectorArchetypeId;
}): MapHazard[] => {
  if (options.sectorNumber === 0) {
    return [];
  }

  const archetype = SECTOR_ARCHETYPES[options.archetype];
  const baseCount = options.size === "small" ? 1 : options.size === "medium" ? 2 : 3;
  const count = baseCount + (options.archetype === "fortress" || options.archetype === "plasma" ? 1 : 0);
  const pattern = archetype.hazardPattern;

  return Array.from({ length: count }, (_, index) => {
    const kind = pattern[(options.sectorNumber + index) % pattern.length];
    const centerX =
      options.x + options.width * clamp((index + 1) / (count + 1) + seededOffset(options.sectorNumber, index, 0.09), 0.18, 0.82);
    const centerY =
      options.y +
      options.height * clamp(0.34 + ((options.sectorNumber + index) % 3) * 0.16 + seededOffset(index, options.sectorNumber, 0.08), 0.18, 0.82);
    const radius = getHazardRadius(kind, options.sectorNumber + index);

    return {
      id: `${options.sectorId}-hazard-${index}`,
      kind,
      x: centerX,
      y: centerY,
      radius,
      damage: kind === "plasma" ? 1 : kind === "radiation" ? 2 : undefined,
      slowMultiplier:
        kind === "nebula" ? 0.62 : kind === "gravityWell" ? 0.48 : undefined,
    };
  });
};

const getHazardRadius = (kind: MapHazard["kind"], seed: number) => {
  const variance = 1 + seededOffset(seed, seed + 3, 0.22);

  if (kind === "asteroid") {
    return 38 * variance;
  }

  if (kind === "nebula") {
    return 78 * variance;
  }

  if (kind === "gravityWell") {
    return 56 * variance;
  }

  if (kind === "radiation") {
    return 66 * variance;
  }

  return 58 * variance;
};

const rotateDirection = (direction: MapDirection, seed: number): MapDirection => {
  const directions: MapDirection[] = ["north", "east", "south", "west"];
  const index = directions.indexOf(direction);

  return directions[positiveModulo(index + 1 + seed, directions.length)];
};

const positiveModulo = (value: number, divisor: number) =>
  ((value % divisor) + divisor) % divisor;

const seededOffset = (a: number, b: number, range: number) => {
  const value = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;

  return (value - Math.floor(value) - 0.5) * range * 2;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
