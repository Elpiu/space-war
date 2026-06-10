import {
    DEFAULT_MAP_GENERATION_PROFILE,
    MAP_EXPANSION_INTERVAL,
    MAP_FIRST_EXPANSION_WAVE,
    SECTOR_CELL_SIZE,
    SECTOR_SIZE_CONFIG
} from '../config/gameplay';
import {
    SECTOR_ARCHETYPES,
    SECTOR_NAMES,
    chooseGrowthPattern,
    createRunSeed,
    createSeededRng,
    createSectorHazards,
    createSectorOpenings,
    getRandomSectorArchetype,
    getRandomSectorSize,
    pickWeighted,
    randomInt,
    shuffleWithRng
} from '../data/mapGeneration';
import type {
    MapGenerationPattern,
    MapGenerationProfile,
    MapDirection,
    MapSector,
    MapSectorBlueprint,
    MapSectorState,
    SectorArchetypeId,
    SectorSize
} from '../types/gameplay';

export const MAP_DIRECTIONS: MapDirection[] = [
    'north',
    'east',
    'south',
    'west'
];

export const DIRECTION_VECTORS: Record<MapDirection, { x: number; y: number }> = {
    north: { x: 0, y: -1 },
    east: { x: 1, y: 0 },
    south: { x: 0, y: 1 },
    west: { x: -1, y: 0 }
};

type SectorPlacement = {
    gridX: number;
    gridY: number;
    cellWidth: number;
    cellHeight: number;
    direction?: MapDirection;
};

type BlueprintAnchor = MapSectorBlueprint & {
    childCount: number;
};

export const createInitialMapSectors = (): MapSectorState => {
    const seed = createRunSeed();
    const profile = { ...DEFAULT_MAP_GENERATION_PROFILE };
    const startSector = createMapSector({
        id: 'sector-0',
        number: 0,
        gridX: -1,
        gridY: 0,
        size: 'medium',
        cellWidth: SECTOR_SIZE_CONFIG.medium.cellWidth,
        cellHeight: SECTOR_SIZE_CONFIG.medium.cellHeight,
        archetype: 'balanced',
        depth: 0,
        sectorSeed: seed
    });

    startSector.name = 'Settore centrale';

    return {
        sectors: [startSector],
        seed,
        profile,
        plannedSectors: createMapBlueprint(seed, profile, startSector),
        nextPlannedSectorIndex: 0,
        nextSectorNumber: 1,
        lastExpandedWave: 0,
        activeSpawnSectorIds: []
    };
};

export const expandMapForWave = (
    state: MapSectorState,
    wave: number
): boolean => {
    if (
        wave < MAP_FIRST_EXPANSION_WAVE ||
        wave % MAP_EXPANSION_INTERVAL !== 0 ||
        state.lastExpandedWave === wave ||
        state.sectors.length >= state.profile.maxSectors
    ) {
        return false;
    }

    const blueprint = state.plannedSectors[state.nextPlannedSectorIndex];

    if (!blueprint) {
        state.lastExpandedWave = wave;
        return false;
    }

    const newSector = createMapSector(blueprint);

    state.sectors.push(newSector);
    state.nextPlannedSectorIndex += 1;
    state.nextSectorNumber = blueprint.number + 1;
    state.lastExpandedWave = wave;

    return true;
};

export const getSectorAt = (
    state: MapSectorState,
    x: number,
    y: number
): MapSector | null => {
    return state.sectors.find((sector) =>
        x >= sector.x &&
        x <= sector.x + sector.width &&
        y >= sector.y &&
        y <= sector.y + sector.height
    ) ?? null;
};

export const getStartPosition = (state: MapSectorState) => {
    const startSector = state.sectors[0];

    return getSectorCenter(startSector);
};

export const getSectorCenter = (sector: MapSector) => {
    return {
        x: sector.x + sector.width / 2,
        y: sector.y + sector.height / 2
    };
};

export const getMapBounds = (state: MapSectorState, padding = 120) => {
    const minX = Math.min(...state.sectors.map((sector) => sector.x)) - padding;
    const minY = Math.min(...state.sectors.map((sector) => sector.y)) - padding;
    const maxX = Math.max(
        ...state.sectors.map((sector) => sector.x + sector.width)
    ) + padding;
    const maxY = Math.max(
        ...state.sectors.map((sector) => sector.y + sector.height)
    ) + padding;

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
};

export const getBlockingHazards = (state: MapSectorState) => {
    return state.sectors
        .flatMap((sector) => sector.hazards)
        .filter((hazard) => hazard.kind === 'asteroid');
};

export const getSlowMultiplierAt = (
    state: MapSectorState,
    x: number,
    y: number
) => {
    return state.sectors
        .flatMap((sector) => sector.hazards)
        .filter((hazard) => hazard.kind === 'nebula' || hazard.kind === 'gravityWell')
        .reduce((multiplier, hazard) => {
            const inside = distanceSquared(x, y, hazard.x, hazard.y) <=
                hazard.radius * hazard.radius;

            if (!inside) {
                return multiplier;
            }

            return Math.min(multiplier, hazard.slowMultiplier ?? 0.72);
        }, 1);
};

export const getPlasmaDamageAt = (
    state: MapSectorState,
    x: number,
    y: number
) => {
    const damagingHazard = state.sectors
        .flatMap((sector) => sector.hazards)
        .find((hazard) =>
            (hazard.kind === 'plasma' || hazard.kind === 'radiation') &&
            distanceSquared(x, y, hazard.x, hazard.y) <= hazard.radius * hazard.radius
        );

    return damagingHazard?.damage ?? 0;
};

const createMapSector = (blueprint: MapSectorBlueprint): MapSector => {
    const {
        id,
        number,
        gridX,
        gridY,
        size,
        archetype,
        depth,
        sectorSeed,
        entryDirection
    } = blueprint;
    const cellWidth = blueprint.cellWidth ?? SECTOR_SIZE_CONFIG[size].cellWidth;
    const cellHeight = blueprint.cellHeight ?? SECTOR_SIZE_CONFIG[size].cellHeight;
    const config = SECTOR_SIZE_CONFIG[size];
    const archetypeConfig = SECTOR_ARCHETYPES[archetype];
    const width = cellWidth * SECTOR_CELL_SIZE;
    const height = cellHeight * SECTOR_CELL_SIZE;
    const x = gridX * SECTOR_CELL_SIZE;
    const y = gridY * SECTOR_CELL_SIZE;
    const names = archetype === 'balanced' ? SECTOR_NAMES[size] : archetypeConfig.names;

    return {
        id,
        name: names[number % names.length],
        size,
        depth,
        archetype,
        gridX,
        gridY,
        cellWidth,
        cellHeight,
        x,
        y,
        width,
        height,
        risk: Number((config.risk * archetypeConfig.riskMultiplier).toFixed(2)),
        rewardMultiplier: archetypeConfig.rewardMultiplier,
        color: archetypeConfig.color ?? config.color,
        accentColor: archetypeConfig.accentColor ?? config.accentColor,
        hazards: createSectorHazards({
            sectorId: id,
            sectorNumber: number,
            x,
            y,
            width,
            height,
            size,
            archetype,
            sectorSeed
        }),
        openings: createSectorOpenings(number, archetype, entryDirection, sectorSeed)
    };
};

const createMapBlueprint = (
    seed: number,
    profile: MapGenerationProfile,
    startSector: MapSector
): MapSectorBlueprint[] => {
    const rng = createSeededRng(seed);
    const growthPattern = chooseGrowthPattern(rng, profile.pattern);
    const occupiedCells = new Set<string>();
    const exhaustedAnchorIds = new Set<string>();
    const anchors: BlueprintAnchor[] = [
        {
            id: startSector.id,
            number: 0,
            size: startSector.size,
            archetype: startSector.archetype,
            depth: startSector.depth,
            gridX: startSector.gridX,
            gridY: startSector.gridY,
            cellWidth: startSector.cellWidth,
            cellHeight: startSector.cellHeight,
            sectorSeed: seed,
            childCount: 0
        }
    ];
    const plannedSectors: MapSectorBlueprint[] = [];
    let attempts = 0;

    addOccupiedCells(occupiedCells, startSector);

    while (
        plannedSectors.length < profile.maxSectors - 1 &&
        attempts < profile.maxSectors * 100
    ) {
        attempts += 1;

        const candidateAnchors = anchors.filter((anchor) =>
            anchor.depth < profile.maxDepth && !exhaustedAnchorIds.has(anchor.id)
        );

        if (candidateAnchors.length === 0) {
            break;
        }

        const anchor = pickBlueprintAnchor(rng, candidateAnchors, growthPattern);
        const depth = anchor.depth + 1;
        const sectorNumber = plannedSectors.length + 1;
        const archetype = getRandomSectorArchetype(rng, depth, profile.maxDepth);
        const preferredSize = getRandomSectorSize(
            rng,
            depth,
            profile.maxDepth,
            growthPattern
        );
        const blueprint = createBlueprintNearAnchor({
            rng,
            anchor,
            occupiedCells,
            sectorNumber,
            depth,
            archetype,
            preferredSize
        });

        if (!blueprint) {
            exhaustedAnchorIds.add(anchor.id);
            continue;
        }

        plannedSectors.push(blueprint);
        anchor.childCount += 1;
        anchors.push({
            ...blueprint,
            childCount: 0
        });
        addOccupiedCells(occupiedCells, blueprint);
    }

    return plannedSectors;
};

const pickBlueprintAnchor = (
    rng: ReturnType<typeof createSeededRng>,
    anchors: BlueprintAnchor[],
    growthPattern: Exclude<MapGenerationPattern, 'mixed'>
) => {
    return pickWeighted(rng, anchors.map((anchor) => ({
        value: anchor,
        weight: getAnchorWeight(anchor, growthPattern)
    })));
};

const getAnchorWeight = (
    anchor: BlueprintAnchor,
    growthPattern: Exclude<MapGenerationPattern, 'mixed'>
) => {
    if (growthPattern === 'compact') {
        return Math.max(0.8, 5 - anchor.depth * 0.9 - anchor.childCount * 0.7);
    }

    if (growthPattern === 'branching') {
        return Math.max(0.8, 4 - anchor.childCount * 1.2 + anchor.depth * 0.35);
    }

    return Math.max(0.8, 1 + anchor.depth * 1.8 - anchor.childCount * 0.45);
};

const createBlueprintNearAnchor = (options: {
    rng: ReturnType<typeof createSeededRng>;
    anchor: BlueprintAnchor;
    occupiedCells: Set<string>;
    sectorNumber: number;
    depth: number;
    archetype: SectorArchetypeId;
    preferredSize: SectorSize;
}): MapSectorBlueprint | null => {
    const sizes = getSizeFallbacks(options.preferredSize);

    for (const size of sizes) {
        const directions = shuffleWithRng(options.rng, MAP_DIRECTIONS);

        for (const direction of directions) {
            const footprint = getSectorFootprint(
                size,
                direction,
                options.sectorNumber,
                options.archetype
            );
            const placement = getAdjacentPlacement(options.anchor, direction, footprint);

            if (!canPlaceSector(options.occupiedCells, placement)) {
                continue;
            }

            return {
                id: `sector-${options.sectorNumber}`,
                number: options.sectorNumber,
                size,
                archetype: options.archetype,
                depth: options.depth,
                gridX: placement.gridX,
                gridY: placement.gridY,
                cellWidth: placement.cellWidth,
                cellHeight: placement.cellHeight,
                entryDirection: getOppositeDirection(direction),
                sectorSeed: randomInt(options.rng, 1, 0x7ffffffe)
            };
        }
    }

    return null;
};

const getSizeFallbacks = (size: SectorSize): SectorSize[] => {
    if (size === 'large') {
        return ['large', 'medium', 'small'];
    }

    if (size === 'medium') {
        return ['medium', 'small'];
    }

    return ['small'];
};

const getSectorFootprint = (
    size: SectorSize,
    direction: MapDirection,
    sectorNumber: number,
    archetype: MapSector['archetype']
) => {
    if (size === 'small') {
        return {
            cellWidth: 1,
            cellHeight: 1
        };
    }

    if (size === 'large') {
        if (archetype === 'fortress') {
            return { cellWidth: 2, cellHeight: 2 };
        }

        if (sectorNumber % 3 === 0) {
            return direction === 'north' || direction === 'south'
                ? { cellWidth: 3, cellHeight: 2 }
                : { cellWidth: 2, cellHeight: 3 };
        }

        return { cellWidth: 2, cellHeight: 2 };
    }

    if (sectorNumber % 4 === 0 && archetype !== 'plasma') {
        return { cellWidth: 2, cellHeight: 2 };
    }

    return direction === 'north' || direction === 'south'
        ? { cellWidth: 2, cellHeight: 1 }
        : { cellWidth: 1, cellHeight: 2 };
};

const getAdjacentPlacement = (
    anchor: Pick<MapSectorBlueprint, 'gridX' | 'gridY' | 'cellWidth' | 'cellHeight'>,
    direction: MapDirection,
    size: { cellWidth: number; cellHeight: number }
): SectorPlacement => {
    if (direction === 'east') {
        return {
            gridX: anchor.gridX + anchor.cellWidth,
            gridY: anchor.gridY + Math.floor((anchor.cellHeight - size.cellHeight) / 2),
            ...size
        };
    }

    if (direction === 'west') {
        return {
            gridX: anchor.gridX - size.cellWidth,
            gridY: anchor.gridY + Math.floor((anchor.cellHeight - size.cellHeight) / 2),
            ...size
        };
    }

    if (direction === 'south') {
        return {
            gridX: anchor.gridX + Math.floor((anchor.cellWidth - size.cellWidth) / 2),
            gridY: anchor.gridY + anchor.cellHeight,
            ...size
        };
    }

    return {
        gridX: anchor.gridX + Math.floor((anchor.cellWidth - size.cellWidth) / 2),
        gridY: anchor.gridY - size.cellHeight,
        ...size
    };
};

const canPlaceSector = (
    occupiedCells: Set<string>,
    placement: SectorPlacement
) => {
    for (let x = 0; x < placement.cellWidth; x += 1) {
        for (let y = 0; y < placement.cellHeight; y += 1) {
            if (occupiedCells.has(`${placement.gridX + x},${placement.gridY + y}`)) {
                return false;
            }
        }
    }

    return true;
};

const addOccupiedCells = (
    occupiedCells: Set<string>,
    sector: Pick<MapSectorBlueprint, 'gridX' | 'gridY' | 'cellWidth' | 'cellHeight'>
) => {
    for (let x = 0; x < sector.cellWidth; x += 1) {
        for (let y = 0; y < sector.cellHeight; y += 1) {
            occupiedCells.add(`${sector.gridX + x},${sector.gridY + y}`);
        }
    }
};

const getOppositeDirection = (direction: MapDirection): MapDirection => {
    if (direction === 'north') {
        return 'south';
    }

    if (direction === 'south') {
        return 'north';
    }

    return direction === 'east' ? 'west' : 'east';
};

const distanceSquared = (
    ax: number,
    ay: number,
    bx: number,
    by: number
) => {
    const dx = ax - bx;
    const dy = ay - by;

    return dx * dx + dy * dy;
};
