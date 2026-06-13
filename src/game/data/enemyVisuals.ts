import type { Scene } from "phaser";
import type { EnemyTypeId } from "../types/gameplay";

const toFileName = (value: string) =>
  value.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);

const MAX_BOSS_VARIANTS = 12;

const ENEMY_VISUAL_MAX_SIZE: Record<EnemyTypeId, number> = {
  chaser: 110,
  swarm: 100,
  brute: 200,
  shooter: 70,
  charger: 88,
  sniper: 160,
  eliteBrute: 120,
  bossDreadnought: 208,
};

const ENEMY_IMAGE_KEYS: Record<
  Exclude<EnemyTypeId, "bossDreadnought">,
  string
> = {
  chaser: "enemy-chaser",
  swarm: "enemy-swarm",
  brute: "enemy-brute",
  shooter: "enemy-shooter",
  charger: "enemy-charger",
  sniper: "enemy-sniper",
  eliteBrute: "enemy-elite-brute",
};

const BOSS_IMAGE_KEYS = Array.from(
  { length: MAX_BOSS_VARIANTS },
  (_, index) => `enemy-boss-${index + 1}`,
);

const PROJECTILE_IMAGE_KEYS: Record<EnemyTypeId, string> = {
  chaser: "enemy-projectile-chaser",
  swarm: "enemy-projectile-swarm",
  brute: "enemy-projectile-brute",
  shooter: "enemy-projectile-shooter",
  charger: "enemy-projectile-charger",
  sniper: "enemy-projectile-sniper",
  eliteBrute: "enemy-projectile-elite-brute",
  bossDreadnought: "enemy-projectile-boss",
};

const PROJECTILE_FILE_NAMES: Record<EnemyTypeId, string> = {
  chaser: "projectile-chaser",
  swarm: "projectile-swarm",
  brute: "projectile-brute",
  shooter: "projectile-shooter",
  charger: "projectile-charger",
  sniper: "projectile-sniper",
  eliteBrute: "projectile-elite-brute",
  bossDreadnought: "projectile-boss",
};

const BOSS_PROJECTILE_IMAGE_KEYS = Array.from(
  { length: MAX_BOSS_VARIANTS },
  (_, index) => `enemy-projectile-boss-${index + 1}`,
);

export const ENEMY_IMAGE_ASSETS = [
  ...Object.entries(ENEMY_IMAGE_KEYS).map(([name, key]) => ({
    key,
    path: `assets/images/enemy/${toFileName(name)}.png`,
  })),
  ...BOSS_IMAGE_KEYS.map((key, index) => ({
    key,
    path: `assets/images/enemy/boss${index + 1}.png`,
  })),
  ...Object.entries(PROJECTILE_IMAGE_KEYS).map(([name, key]) => ({
    key,
    path: `assets/images/enemy/${PROJECTILE_FILE_NAMES[name as EnemyTypeId]}.png`,
  })),
  ...BOSS_PROJECTILE_IMAGE_KEYS.map((key, index) => ({
    key,
    path: `assets/images/enemy/projectile-boss${index + 1}.png`,
  })),
];

export const pickEnemyVisual = (
  scene: Scene,
  typeId: EnemyTypeId,
): { imageKey?: string; projectileImageKey?: string } => {
  if (typeId !== "bossDreadnought") {
    return {
      imageKey: getLoadedTexture(scene, ENEMY_IMAGE_KEYS[typeId]),
      projectileImageKey: getLoadedTexture(
        scene,
        PROJECTILE_IMAGE_KEYS[typeId],
      ),
    };
  }

  const loadedBosses = BOSS_IMAGE_KEYS.filter((key) =>
    scene.textures.exists(key),
  );
  const imageKey = pickRandom(loadedBosses);
  const variantIndex = imageKey ? BOSS_IMAGE_KEYS.indexOf(imageKey) : -1;
  const matchingProjectile =
    variantIndex >= 0
      ? getLoadedTexture(scene, BOSS_PROJECTILE_IMAGE_KEYS[variantIndex])
      : undefined;

  return {
    imageKey,
    projectileImageKey:
      matchingProjectile ??
      pickRandom(
        BOSS_PROJECTILE_IMAGE_KEYS.filter((key) => scene.textures.exists(key)),
      ) ??
      getLoadedTexture(scene, PROJECTILE_IMAGE_KEYS.bossDreadnought),
  };
};

export const getEnemyVisualMaxSize = (typeId: EnemyTypeId) =>
  ENEMY_VISUAL_MAX_SIZE[typeId];

const getLoadedTexture = (scene: Scene, key: string) =>
  scene.textures.exists(key) ? key : undefined;

const pickRandom = <T>(values: T[]) =>
  values.length > 0
    ? values[Math.floor(Math.random() * values.length)]
    : undefined;
