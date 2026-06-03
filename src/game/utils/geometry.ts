import {
    NODE_CENTER_X,
    NODE_CENTER_Y,
    NODE_RADIUS
} from '../config/gameplay';

type Position = {
    x: number;
    y: number;
};

export const clampInsideNode = (object: Position, padding: number) => {
    const offsetX = object.x - NODE_CENTER_X;
    const offsetY = object.y - NODE_CENTER_Y;
    const distance = Math.hypot(offsetX, offsetY);
    const maxDistance = NODE_RADIUS - padding;

    if (distance > maxDistance)
    {
        const scale = maxDistance / distance;

        object.x = NODE_CENTER_X + offsetX * scale;
        object.y = NODE_CENTER_Y + offsetY * scale;
    }
};

export const isInsideNode = (x: number, y: number, padding: number) => {
    return Math.hypot(x - NODE_CENTER_X, y - NODE_CENTER_Y) <= NODE_RADIUS + padding;
};

export const circlesOverlap = (a: Position, aRadius: number, b: Position, bRadius: number) => {
    const radius = aRadius + bRadius;
    const offsetX = a.x - b.x;
    const offsetY = a.y - b.y;

    return offsetX * offsetX + offsetY * offsetY <= radius * radius;
};
