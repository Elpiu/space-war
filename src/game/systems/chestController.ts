import {
  BUYABLE_CHEST_INTERVAL,
  CHEST_COST,
  MAX_BUYABLE_CHESTS,
} from "../config/gameplay";
import type { Chest, MapSectorState, ShopLoadout, Upgrade } from "../types/gameplay";
import { clampInsideMap } from "../utils/geometry";
import {
  createChest,
  getChestSpawnPoint,
  updateChests as updateChestSystem,
} from "./chests";
import { createPulse } from "./effects";
import { getSectorAt } from "./mapSectors";
import { getPlaceableCellFromWorld } from "./placeableGrid";
import { pickChestUpgrade } from "./upgradeSystem";
import { pickChestSector } from "./waveSystem";
import type { RunState } from "./runState";

export const updateChestController = (options: {
  scene: Phaser.Scene;
  run: RunState;
  mapState: MapSectorState;
  player: Phaser.GameObjects.Triangle;
  time: number;
  showMessage: (message: string) => void;
  renderMap: () => void;
  applyUpgrade: (upgrade: Upgrade) => void;
  loadout?: ShopLoadout;
}) => {
  spawnBuyableChestIfNeeded(options);
  updateChestSystem(
    options.scene,
    options.run.chests,
    options.player,
    options.run.coins,
    (chest, index) => openChest({ ...options, chest, index }),
    (cost) => options.showMessage(`Chest: servono ${cost} risorse`),
  );
  options.renderMap();
};

export const spawnChest = (options: {
  scene: Phaser.Scene;
  run: RunState;
  mapState: MapSectorState;
  x: number;
  y: number;
  kind: Chest["kind"];
}) => {
  const cost =
    options.kind === "shop"
      ? CHEST_COST + Math.max(0, options.run.wave - 1) * 2
      : 0;
  const cell = getPlaceableCellFromWorld(options.x, options.y, "turret");
  const chest = createChest(options.scene, cell.x, cell.y, options.kind, cost);

  clampInsideMap(chest.body, chest.radius, options.mapState.sectors);
  chest.label.setPosition(chest.body.x, chest.body.y - 28);
  options.run.chests.push(chest);
  createPulse(
    options.scene,
    chest.body.x,
    chest.body.y,
    30,
    options.kind === "shop" ? 0xfacc15 : 0x22c55e,
    0.2,
  );
};

const spawnBuyableChestIfNeeded = (options: {
  scene: Phaser.Scene;
  run: RunState;
  mapState: MapSectorState;
  player: Phaser.GameObjects.Triangle;
  time: number;
  renderMap: () => void;
}) => {
  if (
    options.time < options.run.nextBuyableChestAt ||
    options.run.chests.filter((chest) => chest.kind === "shop").length >=
      MAX_BUYABLE_CHESTS
  ) {
    return;
  }

  const sector = pickChestSector(options.mapState, options.player);
  const spawnPoint = getChestSpawnPoint(
    sector,
    options.run.chests.length + options.run.wave,
  );

  spawnChest({
    scene: options.scene,
    run: options.run,
    mapState: options.mapState,
    x: spawnPoint.x,
    y: spawnPoint.y,
    kind: "shop",
  });
  options.renderMap();
  options.run.nextBuyableChestAt = options.time + BUYABLE_CHEST_INTERVAL;
};

const openChest = (options: {
  scene: Phaser.Scene;
  run: RunState;
  chest: Chest;
  index: number;
  showMessage: (message: string) => void;
  applyUpgrade: (upgrade: Upgrade) => void;
  mapState: MapSectorState;
  loadout?: ShopLoadout;
}) => {
  if (options.chest.opened) {
    return;
  }

  options.chest.opened = true;
  options.run.coins -= options.chest.cost;
  const upgrade = pickChestUpgrade({
    runUpgrades: options.run.runUpgrades,
    loadout: options.loadout,
  });
  const sector = getSectorAt(
    options.mapState,
    options.chest.body.x,
    options.chest.body.y,
  );

  if (upgrade) {
    options.applyUpgrade(upgrade);
    const bonusCoins = sector ? Math.floor((sector.rewardMultiplier - 1) * 6) : 0;

    if (bonusCoins > 0) {
      options.run.coins += bonusCoins;
    }

    options.showMessage(
      bonusCoins > 0
        ? `Chest ${sector?.name}: ${upgrade.title} (+${bonusCoins} risorse)`
        : `Chest: ${upgrade.title}`,
    );
  }

  options.chest.body.destroy();
  options.chest.label.destroy();
  options.run.chests.splice(options.index, 1);
};
