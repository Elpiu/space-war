import { Math as PhaserMath } from "phaser";
import { SPECIAL_DROPS } from "../data/specialDrops";
import type {
  DamageSource,
  MapSectorState,
} from "../types/gameplay";
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
  source: DamageSource;
  getNextChestKillThreshold: () => number;
}) => {
  const enemy = options.run.enemies[options.enemyIndex];

  enemy.hp -= options.damage;
  options.scene.tweens.killTweensOf(enemy.body);
  enemy.body.setScale(enemy.baseScaleX * 1.12, enemy.baseScaleY * 1.12);
  options.scene.tweens.add({
    targets: enemy.body,
    scaleX: enemy.baseScaleX,
    scaleY: enemy.baseScaleY,
    duration: 90,
  });

  if (
    options.source === "shipProjectile" &&
    options.run.stats.lifeStealPercent > 0
  ) {
    const effectiveDamage = Math.min(options.damage, enemy.hp + options.damage);
    const healing =
      (effectiveDamage * options.run.stats.lifeStealPercent) / 100;
    options.run.stats.hp = Math.min(
      options.run.stats.maxHp,
      options.run.stats.hp + healing,
    );
  }

  if (enemy.hp > 0) {
    return;
  }

  const deathX = enemy.body.x;
  const deathY = enemy.body.y;
  const sector = getSectorAt(options.mapState, deathX, deathY);
  const rewardMultiplier = sector?.rewardMultiplier ?? 1;
  const runRewardMultiplier = options.run.difficulty.rewardMultiplier;

  dropPickup(
    options.scene,
    options.run.pickups,
    deathX,
    deathY,
    "xp",
    Math.max(
      1,
      Math.ceil(enemy.xpValue * rewardMultiplier * runRewardMultiplier),
    ),
  );

  const luckDropBonus = Math.min(24, options.run.stats.luck * 0.12);

  if (PhaserMath.Between(0, 100) < 48 + luckDropBonus) {
    dropPickup(
      options.scene,
      options.run.pickups,
      deathX + PhaserMath.Between(-8, 8),
      deathY + PhaserMath.Between(-8, 8),
      "coin",
      Math.max(
        1,
        Math.ceil(enemy.coinValue * rewardMultiplier * runRewardMultiplier),
      ),
    );
  }

  const hpDropChance = Math.min(8, 1.25 + options.run.stats.luck * 0.035);

  if (Math.random() * 100 < hpDropChance) {
    dropPickup(
      options.scene,
      options.run.pickups,
      deathX + PhaserMath.Between(-6, 6),
      deathY + PhaserMath.Between(-6, 6),
      "hp",
      1,
    );
  }

  const specialDropChance = Math.min(
    1.2,
    0.25 + options.run.stats.luck * 0.004,
  );

  if (Math.random() * 100 < specialDropChance) {
    const special =
      SPECIAL_DROPS[PhaserMath.Between(0, SPECIAL_DROPS.length - 1)];
    dropPickup(
      options.scene,
      options.run.pickups,
      deathX + PhaserMath.Between(-10, 10),
      deathY + PhaserMath.Between(-10, 10),
      "special",
      1,
      special.id,
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
  options.run.totalKills += 1;

  if (
    options.run.runUpgrades.maxHpPer100Kills > 0 &&
    options.run.totalKills % 100 === 0
  ) {
    const hp = options.run.runUpgrades.maxHpPer100Kills;
    options.run.stats.maxHp += hp;
    options.run.stats.hp += hp;
  }

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
