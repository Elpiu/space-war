import type { Scene } from "phaser";
import { ENEMY_IMAGE_ASSETS } from "./enemyVisuals";

export const IMAGE_KEYS = {
  health: "icon-health",
  magnet: "icon-magnet",
  starship: "icon-starship",
  dogeTurret: "icon-doge-turret",
  chest: "icon-treasure-chest",
  venom: "icon-venom",
} as const;

const IMAGE_ASSETS = [
  { key: IMAGE_KEYS.health, path: "assets/images/health.png" },
  { key: IMAGE_KEYS.magnet, path: "assets/images/magnet.png" },
  { key: IMAGE_KEYS.starship, path: "assets/images/starship.png" },
  { key: IMAGE_KEYS.dogeTurret, path: "assets/images/doge-turret.png" },
  { key: IMAGE_KEYS.chest, path: "assets/images/treasure-chest.png" },
  { key: IMAGE_KEYS.venom, path: "assets/images/venom.png" },
  ...ENEMY_IMAGE_ASSETS,
  { key: "icon-magnet-overload", path: "assets/images/magnet-overload.png" },
];

export const preloadImageAssets = (scene: Scene) => {
  IMAGE_ASSETS.forEach(({ key, path }) => scene.load.image(key, path));
};
