import {
  GAME_WIDTH,
  SCREEN_CENTER_X,
  SECTOR_SIZE_CONFIG,
} from "../config/gameplay";
import { getMapBounds } from "./mapSectors";
import type {
  MapDirection,
  MapHazard,
  MapSector,
  MapSectorState,
} from "../types/gameplay";

export type MapArenaRenderer = {
  arena: Phaser.GameObjects.Graphics;
  minimap: Phaser.GameObjects.Graphics;
  sectorLabel: Phaser.GameObjects.Text;
};

export const createMapArenaRenderer = (
  scene: Phaser.Scene,
): MapArenaRenderer => {
  scene.cameras.main.setBackgroundColor("#070b1f");

  const arena = scene.add.graphics().setDepth(1);
  const minimap = scene.add.graphics().setDepth(180).setScrollFactor(0);
  const sectorLabel = scene.add
    .text(SCREEN_CENTER_X, 44, "", {
      fontFamily: "Arial",
      fontSize: 18,
      color: "#7dd3fc",
    })
    .setOrigin(0.5)
    .setDepth(180)
    .setScrollFactor(0);

  scene.add
    .text(GAME_WIDTH - 146, 28, "Mappa", {
      fontFamily: "Arial Black",
      fontSize: 14,
      color: "#cbd5e1",
    })
    .setOrigin(0.5)
    .setDepth(180)
    .setScrollFactor(0);

  return {
    arena,
    minimap,
    sectorLabel,
  };
};

export const renderMapArena = (
  renderer: MapArenaRenderer,
  state: MapSectorState,
  currentSector: MapSector,
  chests: { body: { x: number; y: number } }[] = [],
) => {
  renderWorldSectors(renderer.arena, state);
  renderMinimap(renderer.minimap, state, currentSector, chests);

  const sizeLabel = SECTOR_SIZE_CONFIG[currentSector.size].label;

  renderer.sectorLabel.setText(`${currentSector.name} - Settore ${sizeLabel}`);
};

const renderWorldSectors = (
  graphics: Phaser.GameObjects.Graphics,
  state: MapSectorState,
) => {
  graphics.clear();

  state.sectors.forEach((sector) => {
    const isSpawnSector = state.activeSpawnSectorIds.includes(sector.id);

    graphics.fillStyle(sector.color, 0.08);
    graphics.fillRect(sector.x, sector.y, sector.width, sector.height);
    graphics.lineStyle(3, sector.accentColor, 0.5);
    graphics.strokeRect(sector.x, sector.y, sector.width, sector.height);

    if (isSpawnSector) {
      graphics.fillStyle(0xef4444, 0.08);
      graphics.fillRect(sector.x, sector.y, sector.width, sector.height);
      graphics.lineStyle(5, 0xfb7185, 0.78);
      graphics.strokeRect(
        sector.x + 8,
        sector.y + 8,
        sector.width - 16,
        sector.height - 16,
      );
    }

    graphics.lineStyle(1, sector.accentColor, 0.13);

    for (let x = sector.x + 84; x < sector.x + sector.width; x += 84) {
      graphics.lineBetween(x, sector.y, x, sector.y + sector.height);
    }

    for (let y = sector.y + 84; y < sector.y + sector.height; y += 84) {
      graphics.lineBetween(sector.x, y, sector.x + sector.width, y);
    }

    sector.hazards.forEach((hazard) => {
      drawHazard(graphics, hazard);
    });
  });

  drawSectorPassages(graphics, state.sectors);
};

const drawHazard = (
  graphics: Phaser.GameObjects.Graphics,
  hazard: MapHazard,
) => {
  if (hazard.kind === "asteroid") {
    graphics.fillStyle(0x475569, 0.92);
    graphics.fillCircle(hazard.x, hazard.y, hazard.radius);
    graphics.lineStyle(3, 0xcbd5e1, 0.45);
    graphics.strokeCircle(hazard.x, hazard.y, hazard.radius);
    return;
  }

  if (hazard.kind === "nebula") {
    graphics.fillStyle(0x22d3ee, 0.14);
    graphics.fillCircle(hazard.x, hazard.y, hazard.radius);
    graphics.lineStyle(2, 0x67e8f9, 0.32);
    graphics.strokeCircle(hazard.x, hazard.y, hazard.radius);
    return;
  }

  if (hazard.kind === "gravityWell") {
    graphics.fillStyle(0x6366f1, 0.16);
    graphics.fillCircle(hazard.x, hazard.y, hazard.radius);
    graphics.lineStyle(2, 0xa5b4fc, 0.38);
    graphics.strokeCircle(hazard.x, hazard.y, hazard.radius);
    graphics.strokeCircle(hazard.x, hazard.y, hazard.radius * 0.48);
    return;
  }

  if (hazard.kind === "radiation") {
    graphics.fillStyle(0xa3e635, 0.14);
    graphics.fillCircle(hazard.x, hazard.y, hazard.radius);
    graphics.lineStyle(2, 0xd9f99d, 0.42);
    graphics.strokeCircle(hazard.x, hazard.y, hazard.radius);
    graphics.lineStyle(1, 0x84cc16, 0.5);
    graphics.strokeCircle(hazard.x, hazard.y, hazard.radius * 0.7);
    return;
  }

  graphics.fillStyle(0xf97316, 0.16);
  graphics.fillCircle(hazard.x, hazard.y, hazard.radius);
  graphics.lineStyle(2, 0xfacc15, 0.42);
  graphics.strokeCircle(hazard.x, hazard.y, hazard.radius);
  graphics.lineStyle(1, 0xfb7185, 0.5);
  graphics.strokeCircle(hazard.x, hazard.y, hazard.radius * 0.64);
};

const drawSectorPassages = (
  graphics: Phaser.GameObjects.Graphics,
  sectors: MapSector[],
) => {
  const passageDepth = 18;

  sectors.forEach((from, fromIndex) => {
    sectors.slice(fromIndex + 1).forEach((to) => {
      const sharedVertical =
        from.x + from.width === to.x || to.x + to.width === from.x;
      const sharedHorizontal =
        from.y + from.height === to.y || to.y + to.height === from.y;

      if (sharedVertical) {
        const overlapStart = Math.max(from.y, to.y) + 24;
        const overlapEnd =
          Math.min(from.y + from.height, to.y + to.height) - 24;
        const overlap = overlapEnd - overlapStart;

        if (overlap <= 0) {
          return;
        }

        const fromDirection = from.x + from.width === to.x ? "east" : "west";
        const passage = getSharedPassage(
          from,
          to,
          fromDirection,
          getOppositeDirection(fromDirection),
          overlapStart,
          overlapEnd,
        );
        const sharedX = fromDirection === "east" ? to.x : from.x;

        graphics.fillStyle(0x070b1f, 1);
        graphics.fillRect(
          sharedX - 8,
          passage.center - passage.size / 2,
          16,
          passage.size,
        );
        graphics.lineStyle(3, 0x67e8f9, 0.82);
        graphics.lineBetween(
          sharedX - passageDepth,
          passage.center - passage.size / 2,
          sharedX + passageDepth,
          passage.center - passage.size / 2,
        );
        graphics.lineBetween(
          sharedX - passageDepth,
          passage.center + passage.size / 2,
          sharedX + passageDepth,
          passage.center + passage.size / 2,
        );
      }

      if (sharedHorizontal) {
        const overlapStart = Math.max(from.x, to.x) + 24;
        const overlapEnd = Math.min(from.x + from.width, to.x + to.width) - 24;
        const overlap = overlapEnd - overlapStart;

        if (overlap <= 0) {
          return;
        }

        const fromDirection = from.y + from.height === to.y ? "south" : "north";
        const passage = getSharedPassage(
          from,
          to,
          fromDirection,
          getOppositeDirection(fromDirection),
          overlapStart,
          overlapEnd,
        );
        const sharedY = fromDirection === "south" ? to.y : from.y;

        graphics.fillStyle(0x070b1f, 1);
        graphics.fillRect(
          passage.center - passage.size / 2,
          sharedY - 8,
          passage.size,
          16,
        );
        graphics.lineStyle(3, 0x67e8f9, 0.82);
        graphics.lineBetween(
          passage.center - passage.size / 2,
          sharedY - passageDepth,
          passage.center - passage.size / 2,
          sharedY + passageDepth,
        );
        graphics.lineBetween(
          passage.center + passage.size / 2,
          sharedY - passageDepth,
          passage.center + passage.size / 2,
          sharedY + passageDepth,
        );
      }
    });
  });
};

const getSharedPassage = (
  from: MapSector,
  to: MapSector,
  fromDirection: MapDirection,
  toDirection: MapDirection,
  overlapStart: number,
  overlapEnd: number,
) => {
  const overlap = overlapEnd - overlapStart;
  const fromOpening = from.openings.find(
    (opening) => opening.direction === fromDirection,
  );
  const toOpening = to.openings.find(
    (opening) => opening.direction === toDirection,
  );
  const sizeRatio =
    ((fromOpening?.sizeRatio ?? 0.34) + (toOpening?.sizeRatio ?? 0.34)) / 2;
  const centerRatio =
    ((fromOpening?.centerRatio ?? 0.5) + (toOpening?.centerRatio ?? 0.5)) / 2;

  return {
    center: overlapStart + overlap * centerRatio,
    size: Math.min(Math.max(72, overlap * sizeRatio), overlap),
  };
};

const getOppositeDirection = (direction: MapDirection): MapDirection => {
  if (direction === "north") {
    return "south";
  }

  if (direction === "south") {
    return "north";
  }

  return direction === "east" ? "west" : "east";
};

const renderMinimap = (
  graphics: Phaser.GameObjects.Graphics,
  state: MapSectorState,
  currentSector: MapSector,
  chests: { body: { x: number; y: number } }[],
) => {
  const originX = GAME_WIDTH - 146;
  const originY = 92;
  const bounds = getMapBounds(state, 0);
  const scale = Math.min(136 / bounds.width, 92 / bounds.height);

  graphics.clear();
  graphics.fillStyle(0x020617, 0.58);
  graphics.fillRoundedRect(originX - 86, originY - 52, 172, 126, 8);

  state.sectors.forEach((sector) => {
    const isCurrent = sector.id === currentSector.id;
    const isSpawnSector = state.activeSpawnSectorIds.includes(sector.id);
    const x =
      originX + (sector.x - bounds.x) * scale - (bounds.width * scale) / 2;
    const y =
      originY + (sector.y - bounds.y) * scale - (bounds.height * scale) / 2;
    const width = Math.max(6, sector.width * scale);
    const height = Math.max(6, sector.height * scale);

    graphics.fillStyle(
      isSpawnSector ? 0xef4444 : sector.color,
      isCurrent ? 0.95 : 0.52,
    );
    graphics.fillRect(x, y, width, height);
    graphics.lineStyle(
      isSpawnSector ? 3 : isCurrent ? 3 : 1,
      isSpawnSector ? 0xfb7185 : sector.accentColor,
      0.95,
    );
    graphics.strokeRect(x, y, width, height);
  });

  chests.forEach((chest) => {
    const cx =
      originX + (chest.body.x - bounds.x) * scale - (bounds.width * scale) / 2;
    const cy =
      originY + (chest.body.y - bounds.y) * scale - (bounds.height * scale) / 2;

    graphics.fillStyle(0xfacc15, 0.95);
    graphics.fillRect(cx - 3, cy - 3, 6, 6);
    graphics.lineStyle(1, 0xfef08a, 0.9);
    graphics.strokeRect(cx - 3, cy - 3, 6, 6);
  });
};
