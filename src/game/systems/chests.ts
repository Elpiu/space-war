import { Math as PhaserMath } from "phaser";
import { PLAYER_RADIUS } from "../config/gameplay";
import type { Chest, ChestKind, MapSector } from "../types/gameplay";
import { circlesOverlap } from "../utils/geometry";
import { createPulse } from "./effects";
import { getPlaceableCellFromWorld } from "./placeableGrid";

export const createChest = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  kind: ChestKind,
  cost: number,
): Chest => {
  const color = kind === "reward" ? 0x22c55e : 0xfacc15;
  const body = scene.add
    .rectangle(x, y, 32, 24, color, 0.96)
    .setStrokeStyle(2, 0xf8fafc, 0.88)
    .setDepth(16);
  const label = scene.add
    .text(x, y - 28, cost > 0 ? `${cost}` : "FREE", {
      fontFamily: "Arial Black",
      fontSize: 13,
      color: cost > 0 ? "#fde68a" : "#bbf7d0",
      stroke: "#0f172a",
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setDepth(17);

  return {
    body,
    label,
    kind,
    cost,
    radius: 24,
    opened: false,
  };
};

export const updateChests = (
  scene: Phaser.Scene,
  chests: Chest[],
  player: Phaser.GameObjects.Triangle,
  coins: number,
  openChest: (chest: Chest, index: number) => void,
  cannotAfford: (cost: number) => void,
) => {
  for (let index = chests.length - 1; index >= 0; index -= 1) {
    const chest = chests[index];

    chest.label.setPosition(chest.body.x, chest.body.y - 28);

    if (!circlesOverlap(player, PLAYER_RADIUS, chest.body, chest.radius)) {
      continue;
    }

    if (coins < chest.cost) {
      cannotAfford(chest.cost);
      continue;
    }

    createPulse(scene, chest.body.x, chest.body.y, 34, 0xfacc15, 0.26);
    openChest(chest, index);
  }
};

export const destroyChest = (chest: Chest) => {
  chest.body.destroy();
  chest.label.destroy();
};

export const getChestSpawnPoint = (sector: MapSector, seed = 0) => {
  const inset = 72;
  const centerBias = seed % 2 === 0 ? 0.42 : 0.58;

  const cell = getPlaceableCellFromWorld(
    PhaserMath.Between(
      Math.floor(sector.x + inset),
      Math.floor(sector.x + sector.width - inset),
    ),
    PhaserMath.Between(
      Math.floor(sector.y + sector.height * centerBias - 80),
      Math.floor(sector.y + sector.height * centerBias + 80),
    ),
    "turret",
  );

  return {
    x: cell.x,
    y: cell.y,
  };
};
