import { Math as PhaserMath } from "phaser";
import {
  BARRICADE_COST,
  BARRICADE_HP,
  MINE_DAMAGE,
  MINE_DAMAGE_RADIUS,
  MINE_HP,
  MINE_COST,
  MINE_TRIGGER_RADIUS,
  TURRET_COST,
  TURRET_DAMAGE,
  TURRET_FIRE_RATE,
  TURRET_HP,
  TURRET_RANGE,
  TURRET_CONFIGS,
} from "../config/gameplay";
import type {
  Barricade,
  Enemy,
  Mine,
  RunUpgradeState,
  ShopItemId,
  Turret,
} from "../types/gameplay";
import { circlesOverlap } from "../utils/geometry";
import { createPulse } from "./effects";

export const createTurret = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  turretId: ShopItemId,
  runUpgrades: RunUpgradeState,
): Turret => {
  // Recupera la configurazione o usa una di default
  const config = TURRET_CONFIGS[turretId] || TURRET_CONFIGS.turretBasic;

  // Calcola i valori finali applicando i bonus delle run
  const range = config.range + runUpgrades.turretRangeBonus;
  const fireRate = config.fireRate * runUpgrades.turretFireRateMultiplier;
  const damage = config.damage + runUpgrades.turretDamageBonus;
  const hp = config.hp + runUpgrades.turretHpBonus;

  const rangeIndicator = scene.add
    .circle(x, y, range, config.color, 0.035)
    .setStrokeStyle(1, config.color, 0.12)
    .setDepth(8);

  const body = scene.add
    .rectangle(x, y, 22, 22, config.color, 0.95)
    .setStrokeStyle(2, 0xe0f2fe, 0.9)
    .setDepth(18);

  return {
    body,
    rangeIndicator,
    range,
    fireRate,
    damage,
    nextShotAt: 0,
    hp,
    maxHp: hp,
    radius: 18,
    damageCooldownUntil: 0,
  };
};

export const createMine = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  mineId: ShopItemId,
  runUpgrades: RunUpgradeState,
): Mine => {
  const isBlast = mineId === "mineBlast";
  const damageRadius =
    (isBlast ? MINE_DAMAGE_RADIUS + 42 : MINE_DAMAGE_RADIUS) +
    runUpgrades.mineRadiusBonus;
  const body = scene.add
    .circle(x, y, isBlast ? 14 : 12, isBlast ? 0xfb923c : 0xfacc15, 0.95)
    .setStrokeStyle(2, 0xfef3c7, 0.9)
    .setDepth(17);

  scene.tweens.add({
    targets: body,
    scale: 1.16,
    yoyo: true,
    repeat: -1,
    duration: 520,
  });

  return {
    body,
    triggerRadius: MINE_TRIGGER_RADIUS,
    damageRadius,
    damage:
      (isBlast ? MINE_DAMAGE - 1 : MINE_DAMAGE) + runUpgrades.mineDamageBonus,
    isExploding: false,
    hp: MINE_HP,
    maxHp: MINE_HP,
    radius: isBlast ? 14 : 12,
    damageCooldownUntil: 0,
  };
};

export const createBarricade = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  runUpgrades: RunUpgradeState,
): Barricade => {
  const body = scene.add
    .rectangle(x, y, 50, 50, 0x64748b, 0.96)
    .setStrokeStyle(2, 0xcbd5e1, 0.9)
    .setDepth(18);
  const hp = BARRICADE_HP + runUpgrades.barricadeHpBonus;

  return {
    body,
    hp,
    maxHp: hp,
    radius: 28,
    damageCooldownUntil: 0,
  };
};

export const updateTurrets = (
  scene: Phaser.Scene,
  turrets: Turret[],
  enemies: Enemy[],
  time: number,
  damageEnemy: (enemyIndex: number, damage: number) => void,
) => {
  turrets.forEach((turret) => {
    if (time < turret.nextShotAt) {
      return;
    }

    const targetIndex = findNearestEnemyInRange(
      turret.body.x,
      turret.body.y,
      turret.range,
      enemies,
    );

    if (targetIndex === -1) {
      return;
    }

    const target = enemies[targetIndex];

    const beam = scene.add
      .line(
        0,
        0,
        turret.body.x,
        turret.body.y,
        target.body.x,
        target.body.y,
        0x67e8f9,
        0.78,
      )
      .setOrigin(0, 0)
      .setDepth(19);

    scene.tweens.add({
      targets: beam,
      alpha: 0,
      duration: 110,
      onComplete: () => {
        beam.destroy();
      },
    });

    createPulse(scene, turret.body.x, turret.body.y, 18, 0x38bdf8, 0.22);
    damageEnemy(targetIndex, turret.damage);
    turret.nextShotAt = time + turret.fireRate;
  });
};

export const updateMines = (
  scene: Phaser.Scene,
  mines: Mine[],
  enemies: Enemy[],
  damageEnemy: (enemyIndex: number, damage: number) => void,
) => {
  for (let mineIndex = mines.length - 1; mineIndex >= 0; mineIndex -= 1) {
    const mine = mines[mineIndex];

    if (mine.isExploding) {
      continue;
    }

    const triggered = enemies.some((enemy) =>
      circlesOverlap(mine.body, mine.triggerRadius, enemy.body, enemy.radius),
    );

    if (!triggered) {
      continue;
    }

    mine.isExploding = true;
    createPulse(
      scene,
      mine.body.x,
      mine.body.y,
      mine.damageRadius,
      0xfacc15,
      0.26,
    );

    for (
      let enemyIndex = enemies.length - 1;
      enemyIndex >= 0;
      enemyIndex -= 1
    ) {
      const enemy = enemies[enemyIndex];

      if (
        circlesOverlap(mine.body, mine.damageRadius, enemy.body, enemy.radius)
      ) {
        damageEnemy(enemyIndex, mine.damage);
      }
    }

    destroyMine(mine);
    mines.splice(mineIndex, 1);
  }
};

export const updatePlaceableEnemyPressure = (
  scene: Phaser.Scene,
  enemies: Enemy[],
  turrets: Turret[],
  mines: Mine[],
  barricades: Barricade[],
  time: number,
) => {
  enemies.forEach((enemy) => {
    damageTurretsNearEnemy(scene, enemy, turrets, time);
    damageMinesNearEnemy(scene, enemy, mines, time);
    damageBarricadesNearEnemy(scene, enemy, barricades, time);
  });
};

export const removeNearestPlaceable = (
  x: number,
  y: number,
  turrets: Turret[],
  mines: Mine[],
  barricades: Barricade[],
) => {
  const candidates = [
    ...turrets.map((placeable, index) => ({
      kind: "turret" as const,
      index,
      placeable,
    })),
    ...mines.map((placeable, index) => ({
      kind: "mine" as const,
      index,
      placeable,
    })),
    ...barricades.map((placeable, index) => ({
      kind: "barricade" as const,
      index,
      placeable,
    })),
  ];
  let nearest = {
    kind: "none" as "none" | "turret" | "mine" | "barricade",
    index: -1,
    distance: 58 * 58,
  };

  candidates.forEach((candidate) => {
    const distance = PhaserMath.Distance.Squared(
      x,
      y,
      candidate.placeable.body.x,
      candidate.placeable.body.y,
    );

    if (distance <= nearest.distance) {
      nearest = {
        kind: candidate.kind,
        index: candidate.index,
        distance,
      };
    }
  });

  if (nearest.kind === "turret") {
    destroyTurret(turrets[nearest.index]);
    turrets.splice(nearest.index, 1);
    return true;
  }

  if (nearest.kind === "mine") {
    destroyMine(mines[nearest.index]);
    mines.splice(nearest.index, 1);
    return true;
  }

  if (nearest.kind === "barricade") {
    destroyBarricade(barricades[nearest.index]);
    barricades.splice(nearest.index, 1);
    return true;
  }

  return false;
};

export const destroyTurret = (turret: Turret) => {
  turret.body.destroy();
  turret.rangeIndicator.destroy();
};

export const destroyMine = (mine: Mine) => {
  mine.body.scene.tweens.killTweensOf(mine.body);
  mine.body.destroy();
};

export const destroyBarricade = (barricade: Barricade) => {
  barricade.body.destroy();
};

export const getTurretCost = () => {
  return TURRET_COST;
};

export const getMineCost = (runUpgrades: RunUpgradeState) => {
  return Math.max(1, MINE_COST - runUpgrades.mineCostReduction);
};

export const getBarricadeCost = (runUpgrades: RunUpgradeState) => {
  return Math.max(1, BARRICADE_COST - runUpgrades.barricadeCostReduction);
};

const damageTurretsNearEnemy = (
  scene: Phaser.Scene,
  enemy: Enemy,
  turrets: Turret[],
  time: number,
) => {
  for (let index = turrets.length - 1; index >= 0; index -= 1) {
    const turret = turrets[index];

    if (
      time >= turret.damageCooldownUntil &&
      circlesOverlap(enemy.body, enemy.radius, turret.body, turret.radius)
    ) {
      turret.hp -= enemy.damage;
      turret.damageCooldownUntil = time + 780;
      createPulse(scene, turret.body.x, turret.body.y, 20, 0x38bdf8, 0.18);

      if (turret.hp <= 0) {
        destroyTurret(turret);
        turrets.splice(index, 1);
      }
    }
  }
};

const damageMinesNearEnemy = (
  scene: Phaser.Scene,
  enemy: Enemy,
  mines: Mine[],
  time: number,
) => {
  for (let index = mines.length - 1; index >= 0; index -= 1) {
    const mine = mines[index];

    if (
      !mine.isExploding &&
      time >= mine.damageCooldownUntil &&
      circlesOverlap(enemy.body, enemy.radius, mine.body, mine.radius)
    ) {
      mine.hp -= enemy.damage;
      mine.damageCooldownUntil = time + 780;
      createPulse(scene, mine.body.x, mine.body.y, 16, 0xfacc15, 0.18);

      if (mine.hp <= 0) {
        destroyMine(mine);
        mines.splice(index, 1);
      }
    }
  }
};

const damageBarricadesNearEnemy = (
  scene: Phaser.Scene,
  enemy: Enemy,
  barricades: Barricade[],
  time: number,
) => {
  for (let index = barricades.length - 1; index >= 0; index -= 1) {
    const barricade = barricades[index];

    if (
      time >= barricade.damageCooldownUntil &&
      circlesOverlap(enemy.body, enemy.radius, barricade.body, barricade.radius)
    ) {
      barricade.hp -= enemy.damage;
      barricade.damageCooldownUntil = time + 640;
      repelEnemyFromBarricade(enemy, barricade);
      createPulse(
        scene,
        barricade.body.x,
        barricade.body.y,
        24,
        0xcbd5e1,
        0.16,
      );

      if (barricade.hp <= 0) {
        destroyBarricade(barricade);
        barricades.splice(index, 1);
      }
    }
  }
};

const repelEnemyFromBarricade = (enemy: Enemy, barricade: Barricade) => {
  const direction = new PhaserMath.Vector2(
    enemy.body.x - barricade.body.x,
    enemy.body.y - barricade.body.y,
  );

  if (direction.lengthSq() === 0) {
    enemy.body.x += barricade.radius;
    return;
  }

  direction.normalize().scale(18);
  enemy.body.x += direction.x;
  enemy.body.y += direction.y;
};

const findNearestEnemyInRange = (
  x: number,
  y: number,
  range: number,
  enemies: Enemy[],
) => {
  let nearestIndex = -1;
  let nearestDistance = range * range;

  enemies.forEach((enemy, index) => {
    const distance = PhaserMath.Distance.Squared(
      x,
      y,
      enemy.body.x,
      enemy.body.y,
    );

    if (distance <= nearestDistance) {
      nearestIndex = index;
      nearestDistance = distance;
    }
  });

  return nearestIndex;
};
