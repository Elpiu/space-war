import { Math as PhaserMath } from "phaser";
import {
  BARRICADE_COST,
  BARRICADE_HP,
  PLACEABLE_UNIT_SIZE,
} from "../config/gameplay";
import { IMAGE_KEYS } from "../data/imageAssets";
import type {
  Barricade,
  Enemy,
  Mine,
  MineDefinition,
  PlaceableKind,
  RunUpgradeState,
  Turret,
  TurretDefinition,
} from "../types/gameplay";
import { circlesOverlap } from "../utils/geometry";
import { createPulse } from "./effects";
import { getKindRadius, getPlaceableCellFromWorld } from "./placeableGrid";

type PlaceableCreateOptions = {
  gridX?: number;
  gridY?: number;
  level?: number;
};

let nextPlaceableId = 1;

const BASE_TURRET_DEFINITION: TurretDefinition = {
  cost: 6,
  range: 100,
  fireRate: 1000,
  damage: 5,
  hp: 20,
  radius: 18,
  bodySize: 22,
  color: 0x38bdf8,
  strokeColor: 0xe0f2fe,
  beamColor: 0x67e8f9,
  pulseColor: 0x38bdf8,
};

const BASE_MINE_DEFINITION: MineDefinition = {
  cost: 3,
  triggerRadius: 34,
  damageRadius: 92,
  damage: 4,
  hp: 3,
  radius: 12,
  color: 0xfacc15,
  strokeColor: 0xfef3c7,
  pulseColor: 0xfacc15,
};

export const createTurret = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  runUpgrades: RunUpgradeState,
  options: PlaceableCreateOptions = {},
): Turret => {
  const config = BASE_TURRET_DEFINITION;
  const engineering = runUpgrades.engineeringMultiplier;
  const range = (config.range + runUpgrades.turretRangeBonus) * engineering;
  const fireRate = config.fireRate * runUpgrades.turretFireRateMultiplier;
  const damage = (config.damage + runUpgrades.turretDamageBonus) * engineering;
  const hp = (config.hp + runUpgrades.turretHpBonus) * engineering;
  const cell = getCreateCell(x, y, options, "turret");

  const rangeIndicator = scene.add
    .circle(x, y, range, config.color, 0.035)
    .setStrokeStyle(1, config.color, 0.12)
    .setDepth(8);

  const body = scene.add
    .image(x, y, IMAGE_KEYS.dogeTurret)
    .setDisplaySize(52, 46)
    .setDepth(18);
  const hpBar = scene.add.graphics().setDepth(31);
  const levelText = scene.add
    .text(x, y - 28, "", {
      fontFamily: "Arial Black",
      fontSize: 11,
      color: "#e0f2fe",
      stroke: "#020617",
      strokeThickness: 3,
    })
    .setOrigin(0.5);

  const turret: Turret = {
    id: createPlaceableId("turret"),
    kind: "turret",
    body,
    rangeIndicator,
    hpBar,
    levelText,
    gridX: cell.gridX,
    gridY: cell.gridY,
    level: options.level ?? getAvailablePlaceableLevel("turret", runUpgrades),
    label: "Torretta base",
    baseCost: config.cost,
    range,
    fireRate,
    damage,
    beamColor: config.beamColor,
    pulseColor: config.pulseColor,
    nextShotAt: 0,
    hp,
    maxHp: hp,
    radius: config.radius,
    damageCooldownUntil: 0,
  };

  updateTurretVisuals(turret);

  return turret;
};

export const createMine = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  runUpgrades: RunUpgradeState,
  options: PlaceableCreateOptions = {},
): Mine => {
  const config = BASE_MINE_DEFINITION;
  const engineering = runUpgrades.engineeringMultiplier;
  const damageRadius =
    (config.damageRadius + runUpgrades.mineRadiusBonus) * engineering;
  const cell = getCreateCell(x, y, options, "mine");
  const body = scene.add
    .circle(x, y, config.radius, config.color, 0.95)
    .setStrokeStyle(2, config.strokeColor, 0.9)
    .setDepth(17);

  scene.tweens.add({
    targets: body,
    scale: 1.16,
    yoyo: true,
    repeat: -1,
    duration: 520,
  });

  return {
    id: createPlaceableId("mine"),
    kind: "mine",
    body,
    gridX: cell.gridX,
    gridY: cell.gridY,
    level: options.level ?? getAvailablePlaceableLevel("mine", runUpgrades),
    label: "Mina base",
    baseCost: config.cost,
    triggerRadius: config.triggerRadius,
    damageRadius,
    damage: (config.damage + runUpgrades.mineDamageBonus) * engineering,
    pulseColor: config.pulseColor,
    isExploding: false,
    hp: config.hp * engineering,
    maxHp: config.hp * engineering,
    radius: config.radius,
    damageCooldownUntil: 0,
  };
};

export const createBarricade = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  runUpgrades: RunUpgradeState,
  options: PlaceableCreateOptions = {},
): Barricade => {
  const cell = getCreateCell(x, y, options, "barricade");
  const bodySize = PLACEABLE_UNIT_SIZE - 6;
  const body = scene.add
    .rectangle(x, y, bodySize, bodySize, 0x64748b, 0.96)
    .setStrokeStyle(2, 0xcbd5e1, 0.9)
    .setDepth(18);
  const hp =
    (BARRICADE_HP + runUpgrades.barricadeHpBonus) *
    runUpgrades.engineeringMultiplier;
  const hpBar = scene.add.graphics().setDepth(31);
  const levelText = scene.add
    .text(x, y - 34, "", {
      fontFamily: "Arial Black",
      fontSize: 11,
      color: "#f8fafc",
      stroke: "#020617",
      strokeThickness: 3,
    })
    .setOrigin(0.5);

  const barricade: Barricade = {
    id: createPlaceableId("barricade"),
    kind: "barricade",
    body,
    hpBar,
    levelText,
    gridX: cell.gridX,
    gridY: cell.gridY,
    level: options.level ?? getAvailablePlaceableLevel("barricade", runUpgrades),
    label: "Barricata",
    baseCost: getBarricadeCost(runUpgrades),
    hp,
    maxHp: hp,
    radius: getKindRadius("barricade"),
    damageCooldownUntil: 0,
  };

  updateBarricadeVisuals(barricade);

  return barricade;
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
        turret.beamColor,
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

    createPulse(scene, turret.body.x, turret.body.y, 18, turret.pulseColor, 0.22);
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
      mine.pulseColor,
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

export const updatePlaceableVisuals = (
  turrets: Turret[],
  barricades: Barricade[],
) => {
  turrets.forEach(updateTurretVisuals);
  barricades.forEach(updateBarricadeVisuals);
};

export const movePlaceableToCell = (
  placeable: Turret | Mine | Barricade,
  cell: { gridX: number; gridY: number; x: number; y: number },
) => {
  placeable.gridX = cell.gridX;
  placeable.gridY = cell.gridY;
  placeable.body.setPosition(cell.x, cell.y);

  if (placeable.kind === "turret") {
    placeable.rangeIndicator.setPosition(cell.x, cell.y);
    updateTurretVisuals(placeable);
    return;
  }

  if (placeable.kind === "barricade") {
    updateBarricadeVisuals(placeable);
  }
};

export const getRepairCost = (placeable: Turret | Mine | Barricade) => {
  const missingHp = Math.max(0, placeable.maxHp - placeable.hp);

  if (missingHp <= 0) {
    return 0;
  }

  return Math.max(
    1,
    Math.ceil((missingHp / placeable.maxHp) * placeable.baseCost * 0.6),
  );
};

export const repairPlaceable = (placeable: Turret | Mine | Barricade) => {
  placeable.hp = placeable.maxHp;

  if (placeable.kind === "turret") {
    updateTurretVisuals(placeable);
  } else if (placeable.kind === "barricade") {
    updateBarricadeVisuals(placeable);
  }
};

export const getPlaceableUpgradeCost = (placeable: Turret | Mine | Barricade) =>
  Math.max(1, Math.ceil(placeable.baseCost * 0.75));

export const canUpgradePlaceable = (
  placeable: Turret | Mine | Barricade,
  runUpgrades: RunUpgradeState,
) => placeable.level < getAvailablePlaceableLevel(placeable.kind, runUpgrades);

export const upgradePlaceable = (
  placeable: Turret | Mine | Barricade,
  runUpgrades: RunUpgradeState,
) => {
  const nextLevel = getAvailablePlaceableLevel(placeable.kind, runUpgrades);

  if (placeable.level >= nextLevel) {
    return false;
  }

  placeable.level = nextLevel;

  if (placeable.kind === "turret") {
    const config = BASE_TURRET_DEFINITION;
    const engineering = runUpgrades.engineeringMultiplier;
    const oldMaxHp = placeable.maxHp;

    placeable.range =
      (config.range + runUpgrades.turretRangeBonus) * engineering;
    placeable.fireRate = config.fireRate * runUpgrades.turretFireRateMultiplier;
    placeable.damage =
      (config.damage + runUpgrades.turretDamageBonus) * engineering;
    placeable.maxHp =
      (config.hp + runUpgrades.turretHpBonus) * engineering;
    placeable.hp = Math.min(
      placeable.maxHp,
      placeable.hp + Math.max(0, placeable.maxHp - oldMaxHp),
    );
    placeable.rangeIndicator.setRadius(placeable.range);
    updateTurretVisuals(placeable);
    return true;
  }

  if (placeable.kind === "mine") {
    const config = BASE_MINE_DEFINITION;
    const engineering = runUpgrades.engineeringMultiplier;

    placeable.damage =
      (config.damage + runUpgrades.mineDamageBonus) * engineering;
    placeable.damageRadius =
      (config.damageRadius + runUpgrades.mineRadiusBonus) * engineering;
    return true;
  }

  const oldMaxHp = placeable.maxHp;

  placeable.maxHp = BARRICADE_HP + runUpgrades.barricadeHpBonus;
  placeable.hp = Math.min(
    placeable.maxHp,
    placeable.hp + Math.max(0, placeable.maxHp - oldMaxHp),
  );
  updateBarricadeVisuals(placeable);

  return true;
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

export const removePlaceableById = (
  placeableId: string,
  turrets: Turret[],
  mines: Mine[],
  barricades: Barricade[],
) => {
  const turretIndex = turrets.findIndex((turret) => turret.id === placeableId);

  if (turretIndex >= 0) {
    destroyTurret(turrets[turretIndex]);
    turrets.splice(turretIndex, 1);
    return true;
  }

  const mineIndex = mines.findIndex((mine) => mine.id === placeableId);

  if (mineIndex >= 0) {
    destroyMine(mines[mineIndex]);
    mines.splice(mineIndex, 1);
    return true;
  }

  const barricadeIndex = barricades.findIndex(
    (barricade) => barricade.id === placeableId,
  );

  if (barricadeIndex >= 0) {
    destroyBarricade(barricades[barricadeIndex]);
    barricades.splice(barricadeIndex, 1);
    return true;
  }

  return false;
};

export const destroyTurret = (turret: Turret) => {
  turret.body.active && turret.body.destroy();
  turret.rangeIndicator.active && turret.rangeIndicator.destroy();
  turret.hpBar.active && turret.hpBar.destroy();
  turret.levelText.active && turret.levelText.destroy();
};

export const destroyMine = (mine: Mine) => {
  mine.body.scene?.tweens?.killTweensOf(mine.body);

  if (mine.body.active) {
    mine.body.destroy();
  }
};

export const destroyBarricade = (barricade: Barricade) => {
  barricade.body.active && barricade.body.destroy();
  barricade.hpBar.active && barricade.hpBar.destroy();
  barricade.levelText.active && barricade.levelText.destroy();
};

export const getTurretCost = () => BASE_TURRET_DEFINITION.cost;

export const getMineCost = (runUpgrades: RunUpgradeState) => {
  return Math.max(
    1,
    BASE_MINE_DEFINITION.cost - runUpgrades.mineCostReduction,
  );
};

export const getBarricadeCost = (runUpgrades: RunUpgradeState) => {
  return Math.max(1, BARRICADE_COST - runUpgrades.barricadeCostReduction);
};

export const getAvailablePlaceableLevel = (
  kind: PlaceableKind,
  runUpgrades: RunUpgradeState,
) => {
  if (kind === "turret") {
    return 1 + Math.max(0, Math.round(runUpgrades.maxTurretBonus / 2));
  }

  if (kind === "mine") {
    return 1 + Math.max(0, Math.round(runUpgrades.maxMineBonus / 2));
  }

  return 1 + Math.max(0, Math.round(runUpgrades.maxBarricades / 4));
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
      createPulse(scene, turret.body.x, turret.body.y, 20, turret.pulseColor, 0.18);
      updateTurretVisuals(turret);

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
      createPulse(scene, mine.body.x, mine.body.y, 16, mine.pulseColor, 0.18);

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
      updateBarricadeVisuals(barricade);
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

const getCreateCell = (
  x: number,
  y: number,
  options: PlaceableCreateOptions,
  kind: PlaceableKind,
) => {
  const fallback = getPlaceableCellFromWorld(x, y, kind);

  if (typeof options.gridX !== "number" || typeof options.gridY !== "number") {
    return fallback;
  }

  return {
    ...fallback,
    gridX: options.gridX,
    gridY: options.gridY,
  };
};

const createPlaceableId = (kind: PlaceableKind) => {
  const id = `${kind}-${nextPlaceableId}`;

  nextPlaceableId += 1;

  return id;
};

const updateTurretVisuals = (turret: Turret) => {
  const x = turret.body.x;
  const y = turret.body.y;
  const ratio = Math.max(0, Math.min(1, turret.hp / turret.maxHp));

  turret.hpBar.clear();
  turret.hpBar.fillStyle(0x020617, 0.82);
  turret.hpBar.fillRect(x - 24, y + 22, 48, 6);
  turret.hpBar.fillStyle(0x38bdf8, 0.95);
  turret.hpBar.fillRect(x - 23, y + 23, 46 * ratio, 4);
  turret.hpBar.lineStyle(1, 0xe0f2fe, 0.68);
  turret.hpBar.strokeRect(x - 24, y + 22, 48, 6);
  turret.levelText.setPosition(x, y - 28);
  turret.levelText.setText(`Lv.${turret.level}`);
};

const updateBarricadeVisuals = (barricade: Barricade) => {
  const x = barricade.body.x;
  const y = barricade.body.y;
  const ratio = Math.max(0, Math.min(1, barricade.hp / barricade.maxHp));

  barricade.hpBar.clear();
  barricade.hpBar.fillStyle(0x020617, 0.82);
  barricade.hpBar.fillRect(x - 36, y + 45, 72, 7);
  barricade.hpBar.fillStyle(0xcbd5e1, 0.96);
  barricade.hpBar.fillRect(x - 35, y + 46, 70 * ratio, 5);
  barricade.hpBar.lineStyle(1, 0xf8fafc, 0.72);
  barricade.hpBar.strokeRect(x - 36, y + 45, 72, 7);
  barricade.levelText.setPosition(x, y - 47);
  barricade.levelText.setText(`Lv.${barricade.level}`);
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
