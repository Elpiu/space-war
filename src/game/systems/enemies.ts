import { Math as PhaserMath } from "phaser";
import { PLAYER_RADIUS } from "../config/gameplay";
import { getEnemyDefinition, getEnemyWaveScale } from "../data/enemies";
import type {
  Barricade,
  Enemy,
  EnemyDefinition,
  EnemyProjectile,
  EnemyTypeId,
  MapSectorState,
} from "../types/gameplay";
import {
  circleHitsHazard,
  circlesOverlap,
  clampInsideMap,
  isInsideMap,
  resolveCircleHazardCollisions,
} from "../utils/geometry";
import { createPulse } from "./effects";
import { getBlockingHazards } from "./mapSectors";

export const createEnemy = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  typeId: EnemyTypeId,
  wave: number,
  mapState: MapSectorState,
): Enemy => {
  const definition = getEnemyDefinition(typeId);
  const scale = getEnemyWaveScale(typeId, wave);
  const radius = definition.radius;
  const body = scene.add
    .circle(x, y, radius, definition.color, 1)
    .setStrokeStyle(2, definition.strokeColor, 0.88)
    .setDepth(15);
  const marker = createEnemyMarker(scene, x, y, typeId, definition);

  resolveCircleHazardCollisions(body, radius, getBlockingHazards(mapState));
  clampInsideMap(body, radius, mapState.sectors);
  marker?.setPosition(body.x, body.y);

  return {
    body,
    marker,
    typeId,
    definition,
    hp: definition.hp + scale.hpBonus,
    speed: definition.speed + scale.speedBonus,
    damage: definition.damage,
    xpValue: definition.xpValue,
    coinValue: definition.coinValue,
    radius,
    nextAttackAt: 0,
    attackCooldown:
      (definition.attackCooldown ?? 1900) * scale.cooldownMultiplier,
  };
};

export const destroyEnemy = (enemy: Enemy) => {
  enemy.body.scene.tweens.killTweensOf(enemy.body);
  enemy.marker?.destroy();
  enemy.body.destroy();
};

export const updateEnemies = (
  scene: Phaser.Scene,
  enemies: Enemy[],
  enemyProjectiles: EnemyProjectile[],
  player: Phaser.GameObjects.Triangle,
  mapState: MapSectorState,
  barricades: Barricade[],
  dt: number,
  time: number,
  invulnerableUntil: number,
  takeDamage: (damage: number, time: number) => void,
) => {
  for (const enemy of enemies) {
    updateEnemyMovement(enemy, player, mapState, barricades, dt);
    updateEnemyAttack(scene, enemy, enemyProjectiles, player, time);
    enemy.marker?.setPosition(enemy.body.x, enemy.body.y);

    if (
      circlesOverlap(player, PLAYER_RADIUS, enemy.body, enemy.radius) &&
      time > invulnerableUntil
    ) {
      takeDamage(enemy.damage, time);
    }
  }
};

export const updateEnemyProjectiles = (
  scene: Phaser.Scene,
  enemyProjectiles: EnemyProjectile[],
  player: Phaser.GameObjects.Triangle,
  mapState: MapSectorState,
  barricades: Barricade[],
  dt: number,
  time: number,
  invulnerableUntil: number,
  takeDamage: (damage: number, time: number) => void,
) => {
  for (
    let projectileIndex = enemyProjectiles.length - 1;
    projectileIndex >= 0;
    projectileIndex -= 1
  ) {
    const projectile = enemyProjectiles[projectileIndex];
    const movement = projectile.velocity.clone().scale(dt);

    projectile.body.x += movement.x;
    projectile.body.y += movement.y;
    projectile.distanceLeft -= movement.length();

    if (
      circlesOverlap(player, PLAYER_RADIUS, projectile.body, projectile.radius)
    ) {
      createPulse(
        scene,
        projectile.body.x,
        projectile.body.y,
        18,
        0xa78bfa,
        0.26,
      );
      removeEnemyProjectile(enemyProjectiles, projectileIndex);

      if (time > invulnerableUntil) {
        takeDamage(projectile.damage, time);
      }

      continue;
    }

    if (
      circleHitsHazard(
        projectile.body,
        projectile.radius,
        getBlockingHazards(mapState),
      )
    ) {
      removeEnemyProjectile(enemyProjectiles, projectileIndex);
      continue;
    }

    const hitsBarricade = barricades.some((barricade) =>
      circlesOverlap(
        projectile.body,
        projectile.radius,
        barricade.body,
        barricade.radius,
      ),
    );

    if (hitsBarricade) {
      createPulse(
        scene,
        projectile.body.x,
        projectile.body.y,
        14,
        0xcbd5e1,
        0.22,
      );
      removeEnemyProjectile(enemyProjectiles, projectileIndex);
      continue;
    }

    if (
      projectile.distanceLeft <= 0 ||
      !isInsideMap(projectile.body.x, projectile.body.y, 24, mapState.sectors)
    ) {
      removeEnemyProjectile(enemyProjectiles, projectileIndex);
    }
  }
};

export const destroyEnemyProjectile = (projectile: EnemyProjectile) => {
  projectile.body.destroy();
};

const updateEnemyMovement = (
  enemy: Enemy,
  player: Phaser.GameObjects.Triangle,
  mapState: MapSectorState,
  barricades: Barricade[],
  dt: number,
) => {
  const toPlayer = new PhaserMath.Vector2(
    player.x - enemy.body.x,
    player.y - enemy.body.y,
  );

  if (toPlayer.lengthSq() > 0) {
    const distance = toPlayer.length();
    const direction = toPlayer.normalize();
    const movement = getMovementDirection(enemy, direction, distance);

    enemy.body.x += movement.x * enemy.speed * dt;
    enemy.body.y += movement.y * enemy.speed * dt;
  }

  resolveCircleHazardCollisions(
    enemy.body,
    enemy.radius,
    getBlockingHazards(mapState),
  );
  clampInsideMap(enemy.body, enemy.radius, mapState.sectors);
  barricades.forEach((barricade) => {
    const minDistance = enemy.radius + barricade.radius;
    const offset = new PhaserMath.Vector2(
      enemy.body.x - barricade.body.x,
      enemy.body.y - barricade.body.y,
    );

    if (offset.lengthSq() > minDistance * minDistance) {
      return;
    }

    if (offset.lengthSq() === 0) {
      enemy.body.x += minDistance;
      return;
    }

    offset.normalize().scale(minDistance);
    enemy.body.x = barricade.body.x + offset.x;
    enemy.body.y = barricade.body.y + offset.y;
  });
};

const getMovementDirection = (
  enemy: Enemy,
  directionToPlayer: PhaserMath.Vector2,
  distanceToPlayer: number,
) => {
  if (enemy.definition.behavior !== "shooter") {
    return directionToPlayer;
  }

  const preferredDistance = enemy.definition.preferredDistance ?? 240;

  if (distanceToPlayer < preferredDistance * 0.72) {
    return directionToPlayer.clone().scale(-1);
  }

  if (distanceToPlayer > preferredDistance * 1.22) {
    return directionToPlayer;
  }

  return new PhaserMath.Vector2(-directionToPlayer.y, directionToPlayer.x)
    .scale(0.55)
    .normalize();
};

const updateEnemyAttack = (
  scene: Phaser.Scene,
  enemy: Enemy,
  enemyProjectiles: EnemyProjectile[],
  player: Phaser.GameObjects.Triangle,
  time: number,
) => {
  if (enemy.definition.behavior !== "shooter" || !enemy.definition.projectile) {
    return;
  }

  const attackRange = enemy.definition.attackRange ?? 360;
  const distance = PhaserMath.Distance.Between(
    enemy.body.x,
    enemy.body.y,
    player.x,
    player.y,
  );

  if (distance > attackRange || time < enemy.nextAttackAt) {
    return;
  }

  const projectileDefinition = enemy.definition.projectile;
  const direction = new PhaserMath.Vector2(
    player.x - enemy.body.x,
    player.y - enemy.body.y,
  ).normalize();
  const projectile = scene.add
    .circle(
      enemy.body.x,
      enemy.body.y,
      projectileDefinition.radius,
      projectileDefinition.color,
      1,
    )
    .setStrokeStyle(1, 0xede9fe, 0.82)
    .setDepth(21);

  enemyProjectiles.push({
    body: projectile,
    velocity: direction.scale(projectileDefinition.speed),
    damage: projectileDefinition.damage,
    distanceLeft: projectileDefinition.range,
    radius: projectileDefinition.radius,
  });

  createPulse(
    scene,
    enemy.body.x,
    enemy.body.y,
    16,
    projectileDefinition.color,
    0.24,
  );

  enemy.nextAttackAt = time + enemy.attackCooldown;
};

const createEnemyMarker = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  typeId: EnemyTypeId,
  definition: EnemyDefinition,
) => {
  const color = definition.strokeColor;

  if (definition.behavior === "shooter" && definition.projectile) {
    return scene.add
      .triangle(x, y, 0, -10, 10, 8, -10, 8, definition.projectile.color, 0.96)
      .setStrokeStyle(2, 0x312e81, 0.94)
      .setDepth(17);
  }

  if (typeId === "swarm") {
    return scene.add.circle(x, y, 3, color, 0.92).setDepth(16);
  }

  if (typeId === "brute") {
    return scene.add.rectangle(x, y, 17, 7, color, 0.9).setDepth(16);
  }

  if (typeId === "charger") {
    return scene.add
      .triangle(x, y, 11, 0, -7, -8, -7, 8, color, 0.92)
      .setDepth(16);
  }

  if (typeId === "sniper") {
    return scene.add.rectangle(x, y, 22, 4, color, 0.92).setDepth(16);
  }

  if (typeId === "eliteBrute") {
    return scene.add.rectangle(x, y, 24, 10, color, 0.94).setDepth(16);
  }

  if (typeId === "bossDreadnought") {
    return scene.add.rectangle(x, y, 34, 16, color, 0.96).setDepth(16);
  }

  return scene.add.circle(x, y, 5, color, 0.64).setDepth(16);
};

const removeEnemyProjectile = (
  enemyProjectiles: EnemyProjectile[],
  projectileIndex: number,
) => {
  destroyEnemyProjectile(enemyProjectiles[projectileIndex]);
  enemyProjectiles.splice(projectileIndex, 1);
};
