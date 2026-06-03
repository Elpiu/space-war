import {
    NODE_CENTER_X,
    NODE_CENTER_Y,
    NODE_RADIUS
} from '../config/gameplay';

export const createCentralNodeArena = (scene: Phaser.Scene) => {
    scene.cameras.main.setBackgroundColor('#070b1f');

    const graphics = scene.add.graphics();

    graphics.lineStyle(2, 0x2dd4bf, 0.35);
    graphics.strokeCircle(NODE_CENTER_X, NODE_CENTER_Y, NODE_RADIUS);

    graphics.lineStyle(1, 0x38bdf8, 0.16);

    for (let radius = 80; radius <= NODE_RADIUS; radius += 80)
    {
        graphics.strokeCircle(NODE_CENTER_X, NODE_CENTER_Y, radius);
    }

    graphics.lineStyle(2, 0x64748b, 0.28);
    graphics.lineBetween(NODE_CENTER_X - NODE_RADIUS, NODE_CENTER_Y, NODE_CENTER_X + NODE_RADIUS, NODE_CENTER_Y);
    graphics.lineBetween(NODE_CENTER_X, NODE_CENTER_Y - NODE_RADIUS, NODE_CENTER_X, NODE_CENTER_Y + NODE_RADIUS);

    scene.add.text(NODE_CENTER_X, 44, 'Nodo centrale', {
        fontFamily: 'Arial',
        fontSize: 18,
        color: '#7dd3fc'
    }).setOrigin(0.5);

    return graphics;
};
