import { Math as PhaserMath } from 'phaser';
import {
    DRONE_DAMAGE,
    DRONE_FIRE_RATE,
    DRONE_RANGE
} from '../config/gameplay';
import type { Drone, Enemy, RunUpgradeState } from '../types/gameplay';
import { createPulse } from './effects';

export const createDrone = (
    scene: Phaser.Scene,
    x: number,
    y: number,
    runUpgrades: RunUpgradeState,
    orbitAngle: number
): Drone => {
    const body = scene.add
        .triangle(x, y, 0, -9, 7, 8, -7, 8, 0x67e8f9, 0.96)
        .setStrokeStyle(1, 0xe0f2fe, 0.9)
        .setDepth(26);

    return {
        body,
        orbitAngle,
        range: DRONE_RANGE,
        fireRate: DRONE_FIRE_RATE * runUpgrades.droneFireRateMultiplier,
        damage: DRONE_DAMAGE + runUpgrades.droneDamageBonus,
        nextShotAt: 0
    };
};

export const syncDroneCount = (
    scene: Phaser.Scene,
    drones: Drone[],
    player: Phaser.GameObjects.Triangle,
    runUpgrades: RunUpgradeState
) => {
    while (drones.length < runUpgrades.droneLimit) {
        drones.push(
            createDrone(
                scene,
                player.x,
                player.y,
                runUpgrades,
                (Math.PI * 2 * drones.length) / Math.max(1, runUpgrades.droneLimit)
            )
        );
    }
};

export const updateDrones = (
    scene: Phaser.Scene,
    drones: Drone[],
    player: Phaser.GameObjects.Triangle,
    enemies: Enemy[],
    time: number,
    dt: number,
    damageEnemy: (enemyIndex: number, damage: number) => void
) => {
    drones.forEach((drone, index) => {
        drone.orbitAngle += dt * (1.15 + index * 0.08);
        const desiredX = player.x + Math.cos(drone.orbitAngle) * 54;
        const desiredY = player.y + Math.sin(drone.orbitAngle) * 42;

        drone.body.x += (desiredX - drone.body.x) * 0.16;
        drone.body.y += (desiredY - drone.body.y) * 0.16;
        drone.body.rotation = drone.orbitAngle + Math.PI / 2;

        if (time < drone.nextShotAt) {
            return;
        }

        const targetIndex = findNearestEnemyInRange(drone.body.x, drone.body.y, drone.range, enemies);

        if (targetIndex === -1) {
            return;
        }

        const target = enemies[targetIndex];
        const beam = scene.add
            .line(
                0,
                0,
                drone.body.x,
                drone.body.y,
                target.body.x,
                target.body.y,
                0x67e8f9,
                0.62
            )
            .setOrigin(0, 0)
            .setDepth(22);

        scene.tweens.add({
            targets: beam,
            alpha: 0,
            duration: 95,
            onComplete: () => {
                beam.destroy();
            }
        });

        createPulse(scene, drone.body.x, drone.body.y, 12, 0x67e8f9, 0.18);
        damageEnemy(targetIndex, drone.damage);
        drone.nextShotAt = time + drone.fireRate;
    });
};

export const destroyDrone = (drone: Drone) => {
    drone.body.destroy();
};

const findNearestEnemyInRange = (
    x: number,
    y: number,
    range: number,
    enemies: Enemy[]
) => {
    let nearestIndex = -1;
    let nearestDistance = range * range;

    enemies.forEach((enemy, index) => {
        const distance = PhaserMath.Distance.Squared(x, y, enemy.body.x, enemy.body.y);

        if (distance <= nearestDistance) {
            nearestIndex = index;
            nearestDistance = distance;
        }
    });

    return nearestIndex;
};
