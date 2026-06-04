import {
    MAP_EXPANSION_INTERVAL,
    MAP_FIRST_EXPANSION_WAVE,
    MAP_SECTOR_LIMIT,
    SECTOR_CELL_SIZE,
    SECTOR_SIZE_CONFIG
} from '../config/gameplay';
import type {
    MapDirection,
    MapHazard,
    MapSector,
    MapSectorState,
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

const SECTOR_SIZE_SEQUENCE: SectorSize[] = [
    'small',
    'medium',
    'large',
    'medium',
    'small',
    'large'
];

const SECTOR_NAMES: Record<SectorSize, string[]> = {
    small: ['Settore compatto', 'Tasca mineraria', 'Cella rotta'],
    medium: ['Settore mediano', 'Fascia ionica', 'Campo di rottami'],
    large: ['Settore vasto', 'Distesa plasma', 'Cantiere orbitale']
};

type SectorPlacement = {
    gridX: number;
    gridY: number;
    cellWidth: number;
    cellHeight: number;
};

export const createInitialMapSectors = (): MapSectorState => {
    const startSector = createMapSector('sector-0', 0, -1, 0, 'medium');

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
    const size = SECTOR_SIZE_SEQUENCE[
        (sectorNumber - 1) % SECTOR_SIZE_SEQUENCE.length
    ];

    for (const anchor of getExpansionAnchors(state)) {
        const placement = findOpenPlacement(state, anchor, size);

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
            placement.cellHeight
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
        .filter((hazard) => hazard.kind === 'nebula')
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
    const plasma = state.sectors
        .flatMap((sector) => sector.hazards)
        .find((hazard) =>
            hazard.kind === 'plasma' &&
            distanceSquared(x, y, hazard.x, hazard.y) <= hazard.radius * hazard.radius
        );

    return plasma?.damage ?? 0;
};

const createMapSector = (
    id: string,
    number: number,
    gridX: number,
    gridY: number,
    size: SectorSize,
    cellWidth = SECTOR_SIZE_CONFIG[size].cellWidth,
    cellHeight = SECTOR_SIZE_CONFIG[size].cellHeight
): MapSector => {
    const config = SECTOR_SIZE_CONFIG[size];
    const width = cellWidth * SECTOR_CELL_SIZE;
    const height = cellHeight * SECTOR_CELL_SIZE;
    const x = gridX * SECTOR_CELL_SIZE;
    const y = gridY * SECTOR_CELL_SIZE;
    const names = SECTOR_NAMES[size];

    return {
        id,
        name: names[number % names.length],
        size,
        gridX,
        gridY,
        cellWidth,
        cellHeight,
        x,
        y,
        width,
        height,
        risk: config.risk,
        color: config.color,
        accentColor: config.accentColor,
        hazards: createSectorHazards(id, number, x, y, width, height, size)
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
    size: SectorSize
): SectorPlacement | null => {
    const options = rotateDirections(anchor.id.length + state.sectors.length);

    for (const direction of options) {
        const footprint = getSectorFootprint(size, direction);
        const placement = getAdjacentPlacement(anchor, direction, {
            cellWidth: footprint.cellWidth,
            cellHeight: footprint.cellHeight
        });

        if (canPlaceSector(state, placement)) {
            return placement;
        }
    }

    return null;
};

const getSectorFootprint = (size: SectorSize, direction: MapDirection) => {
    if (size !== 'medium') {
        return {
            cellWidth: SECTOR_SIZE_CONFIG[size].cellWidth,
            cellHeight: SECTOR_SIZE_CONFIG[size].cellHeight
        };
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

const createSectorHazards = (
    sectorId: string,
    sectorNumber: number,
    x: number,
    y: number,
    width: number,
    height: number,
    size: SectorSize
): MapHazard[] => {
    if (sectorNumber === 0) {
        return [];
    }

    const count = size === 'small' ? 1 : size === 'medium' ? 2 : 3;
    const pattern: MapHazard['kind'][] = ['asteroid', 'nebula', 'plasma'];

    return Array.from({ length: count }, (_, index) => {
        const kind = pattern[(sectorNumber + index) % pattern.length];
        const centerX = x + width * ((index + 1) / (count + 1));
        const centerY = y + height * (0.34 + ((sectorNumber + index) % 3) * 0.16);
        const radius = kind === 'asteroid' ? 42 : kind === 'nebula' ? 74 : 58;

        return {
            id: `${sectorId}-hazard-${index}`,
            kind,
            x: centerX,
            y: centerY,
            radius,
            damage: kind === 'plasma' ? 1 : undefined,
            slowMultiplier: kind === 'nebula' ? 0.62 : undefined
        };
    });
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
