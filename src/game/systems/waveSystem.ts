import { Math as PhaserMath } from "phaser";
import {
  WAVE_BREAK_DURATION,
  WAVE_DURATION,
  WAVE_FINAL_SPAWN_INTERVAL,
  WAVE_MID_SPAWN_INTERVAL,
  WAVE_START_SPAWN_INTERVAL,
} from "../config/gameplay";
import { pickEnemyTypeForSpawn } from "../data/enemies";
import type { Enemy, MapSector, MapSectorState } from "../types/gameplay";
import { expandMapForWave, getSectorCenter } from "./mapSectors";
import type { RunState } from "./runState";

export const updateWaveSystem = (options: {
  run: RunState;
  mapState: MapSectorState;
  player: Phaser.GameObjects.Image | null;
  time: number;
  spawnEnemyAt: (x: number, y: number, enemyType: Enemy["typeId"]) => void;
  onMapExpanded: () => void;
  renderMap: () => void;
}) => {
  if (options.run.waveEndsAt > 0 && options.time >= options.run.waveEndsAt) {
    finishWave(options.run, options.time, options.mapState, options.renderMap);
    return;
  }

  if (options.run.waveEndsAt === 0 && options.time >= options.run.nextWaveAt) {
    startWave(options);
    return;
  }

  if (
    options.run.waveEndsAt > 0 &&
    options.time >= options.run.nextSpawnPulseAt
  ) {
    spawnWavePulse(options);
  }
};

export const startWave = (options: {
  run: RunState;
  mapState: MapSectorState;
  player: Phaser.GameObjects.Image | null;
  time: number;
  spawnEnemyAt: (x: number, y: number, enemyType: Enemy["typeId"]) => void;
  onMapExpanded: () => void;
  renderMap: () => void;
}) => {
  options.run.wave += 1;
  options.run.waveEndsAt = options.time + WAVE_DURATION;

  const expanded = expandMapForWave(options.mapState, options.run.wave);

  if (expanded) {
    options.onMapExpanded();
  }

  options.mapState.activeSpawnSectorIds = pickFarSpawnSectors(
    options.mapState,
    options.player,
    options.run.wave,
  ).map((sector) => sector.id);
  options.run.nextSpawnPulseAt = options.time;
  options.run.wavePhase = "inizio";
  options.renderMap();
  spawnWavePulse(options);
};

export const finishWave = (
  run: RunState,
  time: number,
  mapState: MapSectorState,
  renderMap: () => void,
) => {
  run.waveEndsAt = 0;
  run.nextWaveAt = time + WAVE_BREAK_DURATION;
  run.nextSpawnPulseAt = 0;
  run.wavePhase = "pausa";
  mapState.activeSpawnSectorIds = [];
  renderMap();
};

export const spawnWavePulse = (options: {
  run: RunState;
  mapState: MapSectorState;
  player: Phaser.GameObjects.Image | null;
  time: number;
  spawnEnemyAt: (x: number, y: number, enemyType: Enemy["typeId"]) => void;
}) => {
  const phase = getWavePhase(options.run, options.time);
  const spawnSectors = getActiveSpawnSectors(options.mapState, options.player);

  //const multiplier = Math.random() < 1 / 3 ? 2 : 1;

  const pulseCount = Math.round(
    (phase.count + options.run.wave) *
      options.run.difficulty.spawnDensityMultiplier *
      (spawnSectors.reduce((total, sector) => total + sector.risk, 0) /
        Math.max(1, spawnSectors.length)),
  );

  options.run.wavePhase = phase.label;

  for (let i = 0; i < pulseCount; i += 1) {
    const sector = spawnSectors[i % spawnSectors.length];
    const spawnPoint = getEnemySpawnPoint(sector, i);
    const enemyType = pickEnemyTypeForSpawn(options.run.wave, i, pulseCount);

    options.spawnEnemyAt(spawnPoint.x, spawnPoint.y, enemyType);
  }

  options.run.nextSpawnPulseAt = options.time + phase.interval;
};

export const pickFarSpawnSectors = (
  mapState: MapSectorState,
  player: Phaser.GameObjects.Image | null,
  wave: number,
) => {
  if (!player) {
    return [mapState.sectors[0]];
  }

  const desiredCount = wave >= 6 ? 3 : wave >= 3 ? 2 : 1;

  return [...mapState.sectors]
    .sort((a, b) => {
      const aCenter = getSectorCenter(a);
      const bCenter = getSectorCenter(b);
      const aDistance = PhaserMath.Distance.Squared(
        player.x,
        player.y,
        aCenter.x,
        aCenter.y,
      );
      const bDistance = PhaserMath.Distance.Squared(
        player.x,
        player.y,
        bCenter.x,
        bCenter.y,
      );

      return bDistance - aDistance;
    })
    .slice(0, Math.min(desiredCount, mapState.sectors.length));
};

export const pickChestSector = (
  mapState: MapSectorState,
  player: Phaser.GameObjects.Image | null,
) => {
  if (!player) {
    return mapState.sectors[0];
  }

  return (
    [...mapState.sectors].sort((a, b) => {
      const aCenter = getSectorCenter(a);
      const bCenter = getSectorCenter(b);
      const aDistance = PhaserMath.Distance.Squared(
        player.x,
        player.y,
        aCenter.x,
        aCenter.y,
      );
      const bDistance = PhaserMath.Distance.Squared(
        player.x,
        player.y,
        bCenter.x,
        bCenter.y,
      );
      const aScore = aDistance * (0.75 + a.rewardMultiplier * 0.25);
      const bScore = bDistance * (0.75 + b.rewardMultiplier * 0.25);

      return bScore - aScore;
    })[0] ?? mapState.sectors[0]
  );
};

const getActiveSpawnSectors = (
  mapState: MapSectorState,
  player: Phaser.GameObjects.Image | null,
) => {
  const sectors = mapState.activeSpawnSectorIds
    .map((sectorId) =>
      mapState.sectors.find((sector) => sector.id === sectorId),
    )
    .filter((sector): sector is MapSector => Boolean(sector));

  if (sectors.length > 0) {
    return sectors;
  }

  if (!player) {
    return [mapState.sectors[0]];
  }

  return [
    mapState.sectors.find(
      (sector) =>
        player.x >= sector.x &&
        player.x <= sector.x + sector.width &&
        player.y >= sector.y &&
        player.y <= sector.y + sector.height,
    ) ?? mapState.sectors[0],
  ];
};

const getWavePhase = (run: RunState, time: number) => {
  const elapsed = Math.max(0, time - (run.waveEndsAt - WAVE_DURATION));
  const progress = elapsed / WAVE_DURATION;

  if (progress < 0.34) {
    return {
      label: "inizio",
      interval: WAVE_START_SPAWN_INTERVAL,
      count: 2,
    };
  }

  if (progress < 0.72) {
    return {
      label: "medio",
      interval: WAVE_MID_SPAWN_INTERVAL,
      count: 3,
    };
  }

  return {
    label: "finale",
    interval: WAVE_FINAL_SPAWN_INTERVAL,
    count: 4,
  };
};

const getEnemySpawnPoint = (currentSector: MapSector, index: number) => {
  const side = index % 4;
  const inset = 36;

  if (side === 0) {
    return {
      x: PhaserMath.Between(
        currentSector.x + inset,
        currentSector.x + currentSector.width - inset,
      ),
      y: currentSector.y + inset,
    };
  }

  if (side === 1) {
    return {
      x: currentSector.x + currentSector.width - inset,
      y: PhaserMath.Between(
        currentSector.y + inset,
        currentSector.y + currentSector.height - inset,
      ),
    };
  }

  if (side === 2) {
    return {
      x: PhaserMath.Between(
        currentSector.x + inset,
        currentSector.x + currentSector.width - inset,
      ),
      y: currentSector.y + currentSector.height - inset,
    };
  }

  return {
    x: currentSector.x + inset,
    y: PhaserMath.Between(
      currentSector.y + inset,
      currentSector.y + currentSector.height - inset,
    ),
  };
};
