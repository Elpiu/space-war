import { Math as PhaserMath } from "phaser";
import type { MapSectorState } from "../types/gameplay";
import { createPulse } from "./effects";
import { destroyEnemy } from "./enemies";
import { getSectorAt } from "./mapSectors";
import { dropPickup } from "./pickupSystem";
import type { RunState } from "./runState";
import { spawnChest } from "./chestController";

export const damageEnemyAndApplyRewards = (options: {
  scene: Phaser.Scene;
  run: RunState;
  mapState: MapSectorState;
  enemyIndex: number;
  damage: number;
  getNextChestKillThreshold: () => number;
}) => {
  const enemy = options.run.enemies[options.enemyIndex];

  enemy.hp -= options.damage;
  enemy.body.setScale(1.18);
  options.scene.tweens.add({ targets: enemy.body, scale: 1, duration: 90 });

  if (enemy.hp > 0) {
    return;
  }

  const deathX = enemy.body.x;
  const deathY = enemy.body.y;
  const sector = getSectorAt(options.mapState, deathX, deathY);
  const rewardMultiplier = sector?.rewardMultiplier ?? 1;

  dropPickup(
    options.scene,
    options.run.pickups,
    deathX,
    deathY,
    "xp",
    Math.max(1, Math.ceil(enemy.xpValue * rewardMultiplier)),
  );

  if (PhaserMath.Between(0, 100) < 48) {
    dropPickup(
      options.scene,
      options.run.pickups,
      deathX + PhaserMath.Between(-8, 8),
      deathY + PhaserMath.Between(-8, 8),
      "coin",
      Math.max(1, Math.ceil(enemy.coinValue * rewardMultiplier)),
    );
  }

  if (PhaserMath.Between(0, 79) === 0) {
    dropPickup(
      options.scene,
      options.run.pickups,
      deathX + PhaserMath.Between(-6, 6),
      deathY + PhaserMath.Between(-6, 6),
      "hp",
      1,
    );
  }

  if (options.run.stats.lifeSteal > 0) {
    options.run.stats.hp = Math.min(
      options.run.stats.maxHp,
      options.run.stats.hp + options.run.stats.lifeSteal,
    );
  }

  createPulse(options.scene, deathX, deathY, 28, enemy.definition.color, 0.32);
  destroyEnemy(enemy);
  options.run.enemies.splice(options.enemyIndex, 1);
  registerEnemyKill({
    ...options,
    x: deathX,
    y: deathY,
  });
};

const registerEnemyKill = (options: {
  scene: Phaser.Scene;
  run: RunState;
  mapState: MapSectorState;
  x: number;
  y: number;
  getNextChestKillThreshold: () => number;
}) => {
  options.run.killsSinceLastChest += 1;

  if (options.run.killsSinceLastChest < options.run.nextChestKillThreshold) {
    return;
  }

  options.run.killsSinceLastChest = 0;
  options.run.nextChestKillThreshold = options.getNextChestKillThreshold();
  spawnChest({
    scene: options.scene,
    run: options.run,
    mapState: options.mapState,
    x: options.x,
    y: options.y,
    kind: "reward",
  });
};
