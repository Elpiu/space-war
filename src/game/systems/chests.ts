import { Math as PhaserMath } from "phaser";
import { PLAYER_RADIUS } from "../config/gameplay";
import { IMAGE_KEYS } from "../data/imageAssets";
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
  const body = scene.add
    .image(x, y, IMAGE_KEYS.chest)
    .setDisplaySize(44, 44)
    .setTint(kind === "reward" ? 0xa7f3d0 : 0xffffff)
    .setDepth(16);
  const label = scene.add
    .text(x, y - 34, cost > 0 ? `${cost}` : "FREE", {
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
  player: Phaser.GameObjects.Image,
  coins: number,
  openChest: (chest: Chest, index: number) => void,
  cannotAfford: (cost: number) => void,
) => {
  for (let index = chests.length - 1; index >= 0; index -= 1) {
    const chest = chests[index];

    chest.label.setPosition(chest.body.x, chest.body.y - 34);

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
