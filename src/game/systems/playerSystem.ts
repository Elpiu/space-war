import { Input, Math as PhaserMath } from "phaser";
import { PLAYER_HIT_COOLDOWN, PLAYER_RADIUS } from "../config/gameplay";
import { IMAGE_KEYS } from "../data/imageAssets";
import type { MapSectorState, PlayerStats } from "../types/gameplay";
import {
  clampInsideMap,
  resolveCircleHazardCollisions,
} from "../utils/geometry";
import {
  getBlockingHazards,
  getPlasmaDamageAt,
  getSlowMultiplierAt,
} from "./mapSectors";

export type ShipVisual = {
  imageKey: string;
  displaySize: number;
  trailColor: number;
  trailRadius: number;
};

export type PlayerInput = {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd: Record<"w" | "a" | "s" | "d", Phaser.Input.Keyboard.Key>;
};

export const createPlayerShip = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  visual: ShipVisual,
) => {
  const trail = scene.add
    .circle(x, y, visual.trailRadius, visual.trailColor, 0.18)
    .setDepth(25);
  const player = scene.add
    .image(x, y, visual.imageKey)
    .setDisplaySize(visual.displaySize, visual.displaySize)
    .setDepth(30);

  return { player, trail };
};

export const updatePlayerMovement = (options: {
  scene: Phaser.Scene;
  player: Phaser.GameObjects.Image;
  trail: Phaser.GameObjects.Arc;
  input: PlayerInput;
  stats: PlayerStats;
  mapState: MapSectorState;
  invulnerableUntil: number;
  dt: number;
  takeDamage: (damage: number, time: number) => void;
}) => {
  const movement = new PhaserMath.Vector2(0, 0);

  if (options.input.cursors.left?.isDown || options.input.wasd.a.isDown) {
    movement.x -= 1;
  }

  if (options.input.cursors.right?.isDown || options.input.wasd.d.isDown) {
    movement.x += 1;
  }

  if (options.input.cursors.up?.isDown || options.input.wasd.w.isDown) {
    movement.y -= 1;
  }

  if (options.input.cursors.down?.isDown || options.input.wasd.s.isDown) {
    movement.y += 1;
  }

  if (movement.lengthSq() > 0) {
    const speedMultiplier = getSlowMultiplierAt(
      options.mapState,
      options.player.x,
      options.player.y,
    );

    movement.normalize().scale(options.stats.speed * speedMultiplier * options.dt);
    options.player.x += movement.x;
    options.player.y += movement.y;
    options.player.rotation = movement.angle() + Math.PI / 2;
  }

  resolveCircleHazardCollisions(
    options.player,
    PLAYER_RADIUS,
    getBlockingHazards(options.mapState),
  );
  clampInsideMap(options.player, PLAYER_RADIUS, options.mapState.sectors);

  const plasmaDamage = getPlasmaDamageAt(
    options.mapState,
    options.player.x,
    options.player.y,
  );

  if (plasmaDamage > 0 && options.scene.time.now > options.invulnerableUntil) {
    options.takeDamage(plasmaDamage, options.scene.time.now);
  }

  options.trail.setPosition(options.player.x, options.player.y);
  options.trail.setAlpha(
    options.invulnerableUntil > options.scene.time.now ? 0.34 : 0.18,
  );
  options.player.setAlpha(options.invulnerableUntil > options.scene.time.now ? 0.55 : 1);
};

export const applyPlayerDamage = (options: {
  scene: Phaser.Scene;
  stats: PlayerStats;
  damage: number;
  time: number;
  onDeath: () => void;
}) => {
  options.stats.hp -= options.damage;
  options.scene.cameras.main.shake(90, 0.006);

  if (options.stats.hp <= 0) {
    options.onDeath();
  }

  return options.time + PLAYER_HIT_COOLDOWN;
};

export const getShipVisual = (): ShipVisual => {
  return {
    imageKey: IMAGE_KEYS.starship,
    displaySize: PLAYER_RADIUS * 2.4,
    trailColor: 0x38bdf8,
    trailRadius: PLAYER_RADIUS + 9,
  };
};

export const createMovementInput = (scene: Phaser.Scene): PlayerInput => ({
  cursors: scene.input.keyboard!.createCursorKeys(),
  wasd: scene.input.keyboard!.addKeys({
    w: Input.Keyboard.KeyCodes.W,
    a: Input.Keyboard.KeyCodes.A,
    s: Input.Keyboard.KeyCodes.S,
    d: Input.Keyboard.KeyCodes.D,
  }) as Record<"w" | "a" | "s" | "d", Phaser.Input.Keyboard.Key>,
});
