import { Math as PhaserMath } from "phaser";
import { PICKUP_RADIUS, PLAYER_RADIUS } from "../config/gameplay";
import type { Pickup, PlayerStats } from "../types/gameplay";

export const dropPickup = (
  scene: Phaser.Scene,
  pickups: Pickup[],
  x: number,
  y: number,
  kind: Pickup["kind"],
  value: number,
) => {
  const color = kind === "xp" ? 0x22d3ee : kind === "hp" ? 0xf87171 : 0xfacc15;
  const pickup = scene.add.circle(x, y, PICKUP_RADIUS, color, 1).setDepth(10);

  pickups.push({
    body: pickup,
    kind,
    value,
    radius: PICKUP_RADIUS,
  });
};

export const updatePickups = (options: {
  player: Phaser.GameObjects.Triangle;
  pickups: Pickup[];
  stats: PlayerStats;
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

    if (distance < options.stats.pickupRadius) {
      const pull = new PhaserMath.Vector2(
        options.player.x - pickup.body.x,
        options.player.y - pickup.body.y,
      );

      if (pull.lengthSq() > 0) {
        pull.normalize().scale(360 * options.dt);
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
