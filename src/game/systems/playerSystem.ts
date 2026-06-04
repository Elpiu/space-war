import { Input, Math as PhaserMath } from "phaser";
import { PLAYER_HIT_COOLDOWN, PLAYER_RADIUS } from "../config/gameplay";
import type { MapSectorState, PlayerStats, ShopItem } from "../types/gameplay";
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
  points: readonly [number, number, number, number, number, number];
  color: number;
  strokeColor: number;
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
    .triangle(
      x,
      y,
      visual.points[0],
      visual.points[1],
      visual.points[2],
      visual.points[3],
      visual.points[4],
      visual.points[5],
      visual.color,
      1,
    )
    .setStrokeStyle(2, visual.strokeColor, 0.92)
    .setDepth(30);

  return { player, trail };
};

export const updatePlayerMovement = (options: {
  scene: Phaser.Scene;
  player: Phaser.GameObjects.Triangle;
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

export const getShipVisual = (item: ShopItem | undefined): ShipVisual => {
  const iconKind = item?.iconKind ?? "shipStandard";

  if (iconKind === "shipTank") {
    return {
      points: [0, -22, 24, 21, -24, 21],
      color: item?.accentColor ?? 0x2dd4bf,
      strokeColor: 0xccfbf1,
      trailColor: 0x2dd4bf,
      trailRadius: PLAYER_RADIUS + 12,
    };
  }

  if (iconKind === "shipLight") {
    return {
      points: [0, -27, 14, 22, -14, 22],
      color: item?.accentColor ?? 0xfacc15,
      strokeColor: 0xfef9c3,
      trailColor: 0xfacc15,
      trailRadius: PLAYER_RADIUS + 7,
    };
  }

  return {
    points: [0, -24, 18, 20, -18, 20],
    color: item?.accentColor ?? 0x93c5fd,
    strokeColor: 0xe0f2fe,
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
