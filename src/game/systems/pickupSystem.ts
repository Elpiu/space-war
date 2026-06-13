import { Math as PhaserMath } from "phaser";
import { PICKUP_RADIUS, PLAYER_RADIUS } from "../config/gameplay";
import { IMAGE_KEYS } from "../data/imageAssets";
import { getSpecialDropById } from "../data/specialDrops";
import type { Pickup, PlayerStats, SpecialDropId } from "../types/gameplay";

export const dropPickup = (
  scene: Phaser.Scene,
  pickups: Pickup[],
  x: number,
  y: number,
  kind: Pickup["kind"],
  value: number,
  specialEffectId?: SpecialDropId,
) => {
  const special = specialEffectId
    ? getSpecialDropById(specialEffectId)
    : undefined;
  const radius = kind === "special" ? PICKUP_RADIUS + 5 : PICKUP_RADIUS;
  const imageKey =
    kind === "hp" ? IMAGE_KEYS.health : special?.iconKey;
  const body = imageKey
    ? createIconPickup(scene, x, y, radius, imageKey, special?.color)
    : scene.add
        .circle(
          x,
          y,
          radius,
          kind === "xp" ? 0x22d3ee : 0xfacc15,
          1,
        )
        .setDepth(10);

  pickups.push({
    body,
    kind,
    value,
    radius,
    specialEffectId,
  });
};

export const updatePickups = (options: {
  player: Phaser.GameObjects.Image;
  pickups: Pickup[];
  stats: PlayerStats;
  globalMagnetActive?: boolean;
  dt: number;
  collect: (pickup: Pickup) => void;
}) => {
  for (let index = options.pickups.length - 1; index >= 0; index -= 1) {
    const pickup = options.pickups[index];
    const distance = PhaserMath.Distance.Between(
      options.player.x,
      options.player.y,
      pickup.body.x,
      pickup.body.y,
    );

    if (options.globalMagnetActive || distance < options.stats.pickupRadius) {
      const pull = new PhaserMath.Vector2(
        options.player.x - pickup.body.x,
        options.player.y - pickup.body.y,
      );

      if (pull.lengthSq() > 0) {
        pull
          .normalize()
          .scale((options.globalMagnetActive ? 820 : 360) * options.dt);
        pickup.body.x += pull.x;
        pickup.body.y += pull.y;
      }
    }

    if (distance < PLAYER_RADIUS + pickup.radius) {
      options.collect(pickup);
      pickup.body.destroy();
      options.pickups.splice(index, 1);
    }
  }
};

const createIconPickup = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  radius: number,
  imageKey: string,
  accentColor = 0xf87171,
) => {
  const container = scene.add.container(x, y).setDepth(10);
  const halo = scene.add
    .circle(0, 0, radius + 3, accentColor, 0.24)
    .setStrokeStyle(2, accentColor, 0.9);
  const icon = scene.add
    .image(0, 0, imageKey)
    .setDisplaySize(radius * 2, radius * 2);

  container.add([halo, icon]);
  scene.tweens.add({
    targets: container,
    scale: 1.12,
    yoyo: true,
    repeat: -1,
    duration: 520,
  });

  return container;
};
