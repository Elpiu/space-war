import type {
  MapGenerationPattern,
  MapDirection,
  MapHazard,
  MapOpening,
  SectorArchetypeId,
  SectorSize,
} from "../types/gameplay";

export type SeededRng = () => number;

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

export const createRunSeed = () => Math.floor(Math.random() * 0x7fffffff);

export const createSeededRng = (seed: number): SeededRng => {
  let state = positiveModulo(Math.floor(seed), 2147483647);

  if (state === 0) {
    state = 1;
  }

  return () => {
    state = (state * 16807) % 2147483647;

    return (state - 1) / 2147483646;
  };
};

export const randomInt = (rng: SeededRng, min: number, max: number) =>
  Math.floor(rng() * (max - min + 1)) + min;

export const shuffleWithRng = <T>(rng: SeededRng, values: T[]) => {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(rng, 0, index);
    const current = shuffled[index];
    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = current;
  }

  return shuffled;
};

export const pickWeighted = <T>(
  rng: SeededRng,
  options: { value: T; weight: number }[],
) => {
  const available = options.filter((option) => option.weight > 0);
  const totalWeight = available.reduce((total, option) => total + option.weight, 0);
  let roll = rng() * totalWeight;

  for (const option of available) {
    roll -= option.weight;

    if (roll <= 0) {
      return option.value;
    }
  }

  return available[available.length - 1].value;
};

export const chooseGrowthPattern = (
  rng: SeededRng,
  pattern: MapGenerationPattern,
): Exclude<MapGenerationPattern, "mixed"> => {
  if (pattern !== "mixed") {
    return pattern;
  }

  return pickWeighted<Exclude<MapGenerationPattern, "mixed">>(rng, [
    { value: "compact", weight: 3 },
    { value: "branching", weight: 4 },
    { value: "spine", weight: 3 },
  ]);
};

export const getRandomSectorSize = (
  rng: SeededRng,
  depth: number,
  maxDepth: number,
  growthPattern: Exclude<MapGenerationPattern, "mixed">,
): SectorSize => {
  const nearEdge = depth >= maxDepth - 1;

  return pickWeighted<SectorSize>(rng, [
    { value: "small", weight: nearEdge ? 6 : growthPattern === "compact" ? 4 : 3 },
    { value: "medium", weight: growthPattern === "spine" ? 6 : 5 },
    { value: "large", weight: nearEdge ? 1 : growthPattern === "branching" ? 4 : 2 },
  ]);
};

export const getRandomSectorArchetype = (
  rng: SeededRng,
  depth: number,
  maxDepth: number,
): SectorArchetypeId => {
  const depthRatio = maxDepth <= 0 ? 0 : depth / maxDepth;

  return pickWeighted<SectorArchetypeId>(rng, [
    { value: "balanced", weight: Math.max(1, 5 - depth) },
    { value: "salvage", weight: 4 },
    { value: "nebula", weight: 3 + depth },
    { value: "plasma", weight: depthRatio > 0.35 ? 2 + depth : 1 },
    { value: "fortress", weight: depthRatio > 0.55 ? 2 + depth : 0.4 },
  ]);
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
  sectorSeed = sectorNumber * 8191 + 17,
): MapOpening[] => {
  const rng = createSeededRng(sectorSeed);
  const config = SECTOR_ARCHETYPES[archetype];
  const directions: MapDirection[] = ["north", "east", "south", "west"];
  const baseSize = clamp(0.24 + rng() * 0.18 + config.openingSizeBias, 0.18, 0.44);
  const centerOffset = (rng() - 0.5) * config.openingDrift;
  const primaryDirection =
    preferredDirection ?? directions[randomInt(rng, 0, directions.length - 1)];
  const secondaryDirections = shuffleWithRng(
    rng,
    directions.filter((direction) => direction !== primaryDirection),
  );
  const primary: MapOpening = {
    direction: primaryDirection,
    centerRatio: clamp(0.5 + centerOffset, 0.28, 0.72),
    sizeRatio: baseSize,
  };
  const secondaryDirection = secondaryDirections[0];
  const tertiaryDirection = secondaryDirections[1];
  const openings: MapOpening[] = [
    primary,
    {
      direction: secondaryDirection,
      centerRatio: clamp(0.32 + rng() * 0.36 - centerOffset, 0.24, 0.76),
      sizeRatio: Math.max(0.16, baseSize - 0.04 - rng() * 0.05),
    },
  ];

  if (archetype === "nebula" || archetype === "salvage" || rng() > 0.68) {
    openings.push({
      direction: tertiaryDirection,
      centerRatio: clamp(0.32 + rng() * 0.36 - centerOffset * 0.8, 0.28, 0.72),
      sizeRatio: Math.max(0.18, baseSize - 0.08 - rng() * 0.04),
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
  sectorSeed?: number;
}): MapHazard[] => {
  if (options.sectorNumber === 0) {
    return [];
  }

  const rng = createSeededRng(options.sectorSeed ?? options.sectorNumber * 104729 + 31);
  const archetype = SECTOR_ARCHETYPES[options.archetype];
  const baseCount = options.size === "small" ? 1 : options.size === "medium" ? 2 : 3;
  const count =
    baseCount +
    (options.archetype === "fortress" || options.archetype === "plasma" ? 1 : 0) +
    (rng() > 0.78 && options.size !== "small" ? 1 : 0);
  const pattern = archetype.hazardPattern;
  const patternOffset = randomInt(rng, 0, pattern.length - 1);

  return Array.from({ length: count }, (_, index) => {
    const kind = pattern[(patternOffset + index) % pattern.length];
    const centerX =
      options.x +
      options.width *
        clamp((index + 1) / (count + 1) + (rng() - 0.5) * 0.22, 0.18, 0.82);
    const centerY =
      options.y +
      options.height * clamp(0.22 + rng() * 0.56, 0.18, 0.82);
    const radius = getHazardRadius(kind, rng);

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

const getHazardRadius = (kind: MapHazard["kind"], rng: SeededRng) => {
  const variance = 0.82 + rng() * 0.4;

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

const positiveModulo = (value: number, divisor: number) =>
  ((value % divisor) + divisor) % divisor;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
