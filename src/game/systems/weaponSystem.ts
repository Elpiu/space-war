import { Math as PhaserMath } from "phaser";
import { BULLET_RADIUS } from "../config/gameplay";
import type {
  Bullet,
  Enemy,
  MapSectorState,
  PlayerStats,
} from "../types/gameplay";
import { circleHitsHazard, circlesOverlap, isInsideMap } from "../utils/geometry";
import { createPulse } from "./effects";
import { getBlockingHazards } from "./mapSectors";

export const updatePlayerShooting = (options: {
  scene: Phaser.Scene;
  player: Phaser.GameObjects.Image;
  enemies: Enemy[];
  bullets: Bullet[];
  stats: PlayerStats;
  time: number;
  nextShotAt: number;
  damageMultiplier?: number;
}) => {
  if (options.time < options.nextShotAt || options.enemies.length === 0) {
    return options.nextShotAt;
  }

  const target = findNearestEnemy(options.player, options.enemies);

  if (!target) {
    return options.nextShotAt;
  }

  const direction = new PhaserMath.Vector2(
    target.body.x - options.player.x,
    target.body.y - options.player.y,
  ).normalize();
  const angles = getShotAngles(direction.angle(), options.stats.multiShot);

  angles.forEach((angle) => {
    const velocity = new PhaserMath.Vector2(
      Math.cos(angle),
      Math.sin(angle),
    ).scale(options.stats.bulletSpeed);
    const bullet = options.scene.add
      .circle(options.player.x, options.player.y, BULLET_RADIUS, 0xfef08a, 1)
      .setDepth(20);

    options.bullets.push({
      body: bullet,
      velocity,
      damage: options.stats.damage * (options.damageMultiplier ?? 1),
      distanceLeft: options.stats.bulletRange,
      radius: BULLET_RADIUS,
    });
  });

  createPulse(options.scene, options.player.x, options.player.y, 12, 0xfacc15, 0.35);

  return options.time + options.stats.fireRate;
};

export const updatePlayerBullets = (options: {
  bullets: Bullet[];
  enemies: Enemy[];
  mapState: MapSectorState;
  dt: number;
  damageEnemy: (enemyIndex: number, damage: number) => void;
}) => {
  for (
    let bulletIndex = options.bullets.length - 1;
    bulletIndex >= 0;
    bulletIndex -= 1
  ) {
    const bullet = options.bullets[bulletIndex];
    const movement = bullet.velocity.clone().scale(options.dt);

    bullet.body.x += movement.x;
    bullet.body.y += movement.y;
    bullet.distanceLeft -= movement.length();

    const enemyIndex = options.enemies.findIndex((enemy) =>
      circlesOverlap(bullet.body, bullet.radius, enemy.body, enemy.radius),
    );

    if (enemyIndex !== -1) {
      options.damageEnemy(enemyIndex, bullet.damage);
      removeBullet(options.bullets, bulletIndex);
      continue;
    }

    if (
      circleHitsHazard(
        bullet.body,
        bullet.radius,
        getBlockingHazards(options.mapState),
      )
    ) {
      removeBullet(options.bullets, bulletIndex);
      continue;
    }

    if (
      bullet.distanceLeft <= 0 ||
      !isInsideMap(
        bullet.body.x,
        bullet.body.y,
        24,
        options.mapState.sectors,
      )
    ) {
      removeBullet(options.bullets, bulletIndex);
    }
  }
};

export const findNearestEnemy = (
  player: Phaser.GameObjects.Image,
  enemies: Enemy[],
) => {
  let nearest: Enemy | null = null;
  let nearestDistance = Number.MAX_VALUE;

  for (const enemy of enemies) {
    const distance = PhaserMath.Distance.Squared(
      player.x,
      player.y,
      enemy.body.x,
      enemy.body.y,
    );

    if (distance < nearestDistance) {
      nearest = enemy;
      nearestDistance = distance;
    }
  }

  return nearest;
};

const getShotAngles = (baseAngle: number, multiShot: number) => {
  if (multiShot === 1) {
    return [baseAngle];
  }

  const step = 0.22;
  const offset = ((multiShot - 1) * step) / 2;

  return Array.from(
    { length: multiShot },
    (_, index) => baseAngle - offset + index * step,
  );
};

const removeBullet = (bullets: Bullet[], index: number) => {
  bullets[index].body.destroy();
  bullets.splice(index, 1);
};
