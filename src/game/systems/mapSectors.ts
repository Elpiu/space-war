import {
    MAP_EXPANSION_INTERVAL,
    MAP_FIRST_EXPANSION_WAVE,
    MAP_SECTOR_LIMIT,
    SECTOR_CELL_SIZE,
    SECTOR_SIZE_CONFIG
} from '../config/gameplay';
import {
    SECTOR_ARCHETYPES,
    SECTOR_NAMES,
    createSectorHazards,
    createSectorOpenings,
    getSectorArchetype,
    getSectorSizeForExpansion
} from '../data/mapGeneration';
import type {
    MapDirection,
    MapSector,
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

export const createInitialMapSectors = (): MapSectorState => {
    const startSector = createMapSector('sector-0', 0, -1, 0, 'medium', undefined, undefined, undefined, 'balanced');

    startSector.name = 'Settore centrale';

    return {
        sectors: [startSector],
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
        state.sectors.length >= MAP_SECTOR_LIMIT
    ) {
        return false;
    }

    const sectorNumber = state.nextSectorNumber;

    for (const anchor of getExpansionAnchors(state)) {
        const anchorSeed = anchor.gridX * 7 + anchor.gridY * 11 + state.sectors.length;
        const size = getSectorSizeForExpansion(
            sectorNumber,
            anchorSeed
        );
        const archetype = getSectorArchetype(sectorNumber, anchorSeed);
        const placement = findOpenPlacement(state, anchor, size, sectorNumber, archetype);

        if (!placement) {
            continue;
        }

        const newSector = createMapSector(
            `sector-${sectorNumber}`,
            sectorNumber,
            placement.gridX,
            placement.gridY,
            size,
            placement.cellWidth,
            placement.cellHeight,
            placement.direction,
            archetype
        );

        state.sectors.push(newSector);
        state.nextSectorNumber += 1;
        state.lastExpandedWave = wave;

        return true;
    }

    state.lastExpandedWave = wave;

    return false;
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

const createMapSector = (
    id: string,
    number: number,
    gridX: number,
    gridY: number,
    size: SectorSize,
    cellWidth = SECTOR_SIZE_CONFIG[size].cellWidth,
    cellHeight = SECTOR_SIZE_CONFIG[size].cellHeight,
    entryDirection?: MapDirection,
    archetype: SectorArchetypeId = 'balanced'
): MapSector => {
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
            archetype
        }),
        openings: createSectorOpenings(number, archetype, entryDirection)
    };
};

const getExpansionAnchors = (state: MapSectorState) => {
    const newestFirst = [...state.sectors].reverse();
    const oldestFirst = [...state.sectors];

    return newestFirst.concat(oldestFirst);
};

const findOpenPlacement = (
    state: MapSectorState,
    anchor: MapSector,
    size: SectorSize,
    sectorNumber: number,
    archetype: MapSector['archetype']
): SectorPlacement | null => {
    const options = rotateDirections(anchor.id.length + state.sectors.length);

    for (const direction of options) {
        const footprint = getSectorFootprint(size, direction, sectorNumber, archetype);
        const placement = getAdjacentPlacement(anchor, direction, {
            cellWidth: footprint.cellWidth,
            cellHeight: footprint.cellHeight
        });

        if (canPlaceSector(state, placement)) {
            return {
                ...placement,
                direction
            };
        }
    }

    return null;
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
    anchor: MapSector,
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
    state: MapSectorState,
    placement: SectorPlacement
) => {
    const occupiedCells = new Set<string>();

    state.sectors.forEach((sector) => {
        for (let x = 0; x < sector.cellWidth; x += 1) {
            for (let y = 0; y < sector.cellHeight; y += 1) {
                occupiedCells.add(`${sector.gridX + x},${sector.gridY + y}`);
            }
        }
    });

    for (let x = 0; x < placement.cellWidth; x += 1) {
        for (let y = 0; y < placement.cellHeight; y += 1) {
            if (occupiedCells.has(`${placement.gridX + x},${placement.gridY + y}`)) {
                return false;
            }
        }
    }

    return true;
};

const rotateDirections = (offset: number) => {
    return MAP_DIRECTIONS.map((_, index) =>
        MAP_DIRECTIONS[(index + offset) % MAP_DIRECTIONS.length]
    );
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
