import type { MapDirection, MapHazard, MapSector } from '../types/gameplay';
import { getSharedSectorPassage } from './passages';

type Position = {
    x: number;
    y: number;
};

type RectBounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export const clampInsideMap = (
    object: Position,
    padding: number,
    sectors: MapSector[]
) => {
    const accessibleAreas = getAccessibleAreas(sectors, padding);

    if (isInsideAreas(object.x, object.y, accessibleAreas)) {
        return;
    }

    let nearest = {
        x: object.x,
        y: object.y,
        distance: Number.MAX_VALUE
    };

    accessibleAreas.forEach((bounds) => {
        const x = clamp(object.x, bounds.x, bounds.x + bounds.width);
        const y = clamp(object.y, bounds.y, bounds.y + bounds.height);
        const distance = distanceSquared(object.x, object.y, x, y);

        if (distance < nearest.distance) {
            nearest = { x, y, distance };
        }
    });

    object.x = nearest.x;
    object.y = nearest.y;
};

export const isInsideMap = (
    x: number,
    y: number,
    padding: number,
    sectors: MapSector[]
) => {
    if (padding < 0) {
        return isInsideAreas(x, y, getAccessibleAreas(sectors, Math.abs(padding)));
    }

    return isInsideAreas(x, y, sectors.map((sector) => expandRect(sector, padding)));
};

export const resolveCircleHazardCollisions = (
    object: Position,
    radius: number,
    hazards: MapHazard[]
) => {
    hazards.forEach((hazard) => {
        const minDistance = radius + hazard.radius;
        const offsetX = object.x - hazard.x;
        const offsetY = object.y - hazard.y;
        const distance = Math.hypot(offsetX, offsetY);

        if (distance >= minDistance) {
            return;
        }

        if (distance === 0) {
            object.x += minDistance;
            return;
        }

        const push = (minDistance - distance) / distance;

        object.x += offsetX * push;
        object.y += offsetY * push;
    });
};

export const circleHitsHazard = (
    object: Position,
    radius: number,
    hazards: MapHazard[]
) => {
    return hazards.some((hazard) =>
        distanceSquared(object.x, object.y, hazard.x, hazard.y) <=
        (radius + hazard.radius) * (radius + hazard.radius)
    );
};

export const circlesOverlap = (a: Position, aRadius: number, b: Position, bRadius: number) => {
    const radius = aRadius + bRadius;
    const offsetX = a.x - b.x;
    const offsetY = a.y - b.y;

    return offsetX * offsetX + offsetY * offsetY <= radius * radius;
};

const expandRect = (bounds: RectBounds, padding: number): RectBounds => {
    return {
        x: bounds.x - padding,
        y: bounds.y - padding,
        width: bounds.width + padding * 2,
        height: bounds.height + padding * 2
    };
};

const shrinkRect = (bounds: RectBounds, padding: number): RectBounds => {
    return {
        x: bounds.x + padding,
        y: bounds.y + padding,
        width: Math.max(1, bounds.width - padding * 2),
        height: Math.max(1, bounds.height - padding * 2)
    };
};

const getAccessibleAreas = (
    sectors: MapSector[],
    padding: number
): RectBounds[] => {
    return [
        ...sectors.map((sector) => shrinkRect(sector, padding)),
        ...getSectorPassages(sectors, padding)
    ];
};

const getSectorPassages = (
    sectors: MapSector[],
    padding: number
): RectBounds[] => {
    const passages: RectBounds[] = [];

    sectors.forEach((from, fromIndex) => {
        sectors.slice(fromIndex + 1).forEach((to) => {
            const sharedVertical =
                from.x + from.width === to.x || to.x + to.width === from.x;
            const sharedHorizontal =
                from.y + from.height === to.y || to.y + to.height === from.y;

            if (sharedVertical) {
                const overlapStart = Math.max(from.y, to.y) + padding;
                const overlapEnd = Math.min(from.y + from.height, to.y + to.height) - padding;
                const overlap = overlapEnd - overlapStart;

                if (overlap <= 0) {
                    return;
                }

                const fromDirection = from.x + from.width === to.x ? 'east' : 'west';
                const passage = getSharedSectorPassage(
                    from,
                    to,
                    fromDirection,
                    getOppositeDirection(fromDirection),
                    overlapStart,
                    overlapEnd
                );
                const sharedX = from.x + from.width === to.x ? to.x : from.x;

                passages.push({
                    x: sharedX - padding,
                    y: passage.center - passage.size / 2,
                    width: padding * 2,
                    height: passage.size
                });
            }

            if (sharedHorizontal) {
                const overlapStart = Math.max(from.x, to.x) + padding;
                const overlapEnd = Math.min(from.x + from.width, to.x + to.width) - padding;
                const overlap = overlapEnd - overlapStart;

                if (overlap <= 0) {
                    return;
                }

                const fromDirection = from.y + from.height === to.y ? 'south' : 'north';
                const passage = getSharedSectorPassage(
                    from,
                    to,
                    fromDirection,
                    getOppositeDirection(fromDirection),
                    overlapStart,
                    overlapEnd
                );
                const sharedY = from.y + from.height === to.y ? to.y : from.y;

                passages.push({
                    x: passage.center - passage.size / 2,
                    y: sharedY - padding,
                    width: passage.size,
                    height: padding * 2
                });
            }
        });
    });

    return passages;
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

const isInsideAreas = (
    x: number,
    y: number,
    areas: RectBounds[]
) => {
    return areas.some((bounds) =>
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
    );
};

const clamp = (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value));
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
