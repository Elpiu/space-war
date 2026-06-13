import { Input, Math as PhaserMath, Scene } from "phaser";
import { CHEST_KILL_THRESHOLD, GAME_HEIGHT, GAME_WIDTH } from "../config/gameplay";
import {
  createMapArenaRenderer,
  renderMapArena,
  type MapArenaRenderer,
} from "../systems/arenaRenderer";
import { updateChestController } from "../systems/chestController";
import { damageEnemyAndApplyRewards } from "../systems/combatRewards";
import { syncDroneCount, updateDrones as updateDroneSystem } from "../systems/drones";
import {
  createEnemy,
  updateEnemies as updateEnemySystem,
  updateEnemyProjectiles,
} from "../systems/enemies";
import { createPulse } from "../systems/effects";
import { createHud, destroyHud, hideHud, updateHud } from "../systems/hud";
import { createInitialMapSectors, getMapBounds, getSectorAt, getStartPosition } from "../systems/mapSectors";
import {
  calculatePostRunReward,
  isContentUnlocked,
  grantPostRunCredits,
  loadMetaProgression,
  toggleContentActive,
  unlockContent,
} from "../systems/metaProgression";
import { MusicController, preloadMusic } from "../systems/musicSystem";
import {
  createPlaceableControllerState,
  destroyPlaceableControllerState,
  getMaxMines,
  getMaxTurrets,
  handlePlaceablePointerDown,
  readPlaceableInput,
  type PlaceableActionResult,
  type PlaceableControllerState,
} from "../systems/placeableController";
import { updateMines, updatePlaceableEnemyPressure, updatePlaceableVisuals, updateTurrets } from "../systems/placeables";
import {
  applyPlayerDamage,
  createMovementInput,
  createPlayerShip,
  getShipVisual,
  updatePlayerMovement,
  type PlayerInput,
} from "../systems/playerSystem";
import { updatePickups } from "../systems/pickupSystem";
import { createInitialRunState, destroyRunEntities, type RunState } from "../systems/runState";
import {
  createChestRewardToast,
  createUpgradeOverlay,
  showGameOverOverlay,
  showMainMenuOverlay,
  showPauseOverlay,
} from "../systems/screenSystem";
import { createShopDomOverlay } from "../systems/shopOverlay";
import {
  addXpAndCheckLevelUp,
  applyChestItemToRun,
  applyTomeOfferToRun,
  getLevelUpChoices,
} from "../systems/upgradeSystem";
import { updatePlayerBullets, updatePlayerShooting } from "../systems/weaponSystem";
import { updateWaveSystem } from "../systems/waveSystem";
import {
  getChestItemById,
  getItemLevel,
  getTomeById,
  getTomeLevel,
} from "../data/upgrades";
import { getSpecialDropById } from "../data/specialDrops";
import { preloadImageAssets } from "../data/imageAssets";
import type {
  ChestItemReward,
  ContentKind,
  DamageSource,
  Enemy,
  MapSectorState,
  MetaProgressionState,
  Pickup,
  PostRunRewardPreview,
  ShopContentEntry,
  TomeOffer,
} from "../types/gameplay";

export type ScreenMode = "mainMenu" | "shop" | "running" | "gameOver";

export type GameplaySceneData = {
  startRun?: boolean;
  seed?: number;
};

export type GameplayPolicy = {
  automaticWaves: boolean;
  persistPostRunRewards: boolean;
  invulnerable: boolean;
};

export class GameplayScene extends Scene {
  protected screenMode: ScreenMode = "mainMenu";
  protected player: Phaser.GameObjects.Image | null = null;
  protected playerTrail: Phaser.GameObjects.Arc | null = null;
  protected inputState!: PlayerInput;
  protected restartKey!: Phaser.Input.Keyboard.Key;
  protected turretKey!: Phaser.Input.Keyboard.Key;
  protected mineKey!: Phaser.Input.Keyboard.Key;
  protected barricadeKey!: Phaser.Input.Keyboard.Key;
  protected removePlaceableKey!: Phaser.Input.Keyboard.Key;
  protected cancelPlaceableKey!: Phaser.Input.Keyboard.Key;
  protected zoomInKey!: Phaser.Input.Keyboard.Key;
  protected zoomOutKey!: Phaser.Input.Keyboard.Key;
  protected fullscreenKey!: Phaser.Input.Keyboard.Key;
  protected pauseKey!: Phaser.Input.Keyboard.Key;
  protected placeableState: PlaceableControllerState = createPlaceableControllerState();
  protected run: RunState = createInitialRunState();
  protected upgradeOverlay: Phaser.GameObjects.Container | null = null;
  protected screenOverlay: Phaser.GameObjects.Container | null = null;
  protected pauseOverlay: Phaser.GameObjects.Container | null = null;
  protected shopDomOverlay: (() => void) | null = null;
  protected mapRenderer!: MapArenaRenderer;
  protected mapState: MapSectorState = createInitialMapSectors();
  protected currentRenderedSectorId = "";
  protected metaState!: MetaProgressionState;
  protected selectedShopCategory: ContentKind = "tome";
  protected lastPostRunReward: PostRunRewardPreview | null = null;
  protected shopFeedback = "";
  protected hudText!: Phaser.GameObjects.Text;
  protected stateText!: Phaser.GameObjects.Text;
  protected cameraZoom = 1;
  protected music!: MusicController;

  protected policy: GameplayPolicy = {
    automaticWaves: true,
    persistPostRunRewards: true,
    invulnerable: false,
  };
  protected runSeed?: number;

  constructor(key: string) {
    super(key);
  }

  preload() {
    preloadMusic(this);
    preloadImageAssets(this);
  }

  create(data: GameplaySceneData = {}) {
    this.createInput();
    this.mapRenderer = createMapArenaRenderer(this);
    this.music = new MusicController(this);

    const hud = createHud(this);
    this.hudText = hud.hudText;
    this.stateText = hud.stateText;
    this.metaState = loadMetaProgression();

    this.runSeed = data.seed;
    this.events.once("shutdown", this.shutdownGameplayScene, this);
    this.bootMode(data);
  }

  update(time: number, delta: number) {
    this.updatePauseInput(time);
    this.updateViewportControls();

    if (this.screenMode === "gameOver") {
      if (Input.Keyboard.JustDown(this.restartKey)) {
        this.startRun();
      }

      return;
    }

    if (
      this.screenMode !== "running" ||
      this.run.isLevelingUp ||
      this.run.isPaused
    ) {
      return;
    }

    const dt = delta / 1000;

    this.updatePlayer(dt);
    this.updatePlaceableInput();
    this.updateShooting(time);
    this.updatePlaceables(time);
    this.updateDrones(time, dt);
    this.updateBullets(dt);
    this.updateEnemies(dt, time);
    this.updateEnemyProjectiles(dt, time);
    this.updatePickups(dt);
    this.updateChests(time);
    this.updateWave(time);
    this.refreshHud();
  }

  protected createInput() {
    this.inputState = createMovementInput(this);
    this.restartKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.R);
    this.turretKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.T);
    this.mineKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.F);
    this.barricadeKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.B);
    this.removePlaceableKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.E);
    this.cancelPlaceableKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.ESC);
    this.zoomOutKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.Z);
    this.zoomInKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.X);
    this.fullscreenKey = this.input.keyboard!.addKey(122);
    this.pauseKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.P);
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handlePlaceablePointerDown(pointer);
    });
    this.input.on(
      "wheel",
      (
        _pointer: Phaser.Input.Pointer,
        _gameObjects: Phaser.GameObjects.GameObject[],
        _deltaX: number,
        deltaY: number,
      ) => {
        if (this.screenMode === "running" && !this.run.isPaused) {
          this.setCameraZoom(this.cameraZoom + (deltaY > 0 ? -0.08 : 0.08));
        }
      },
    );
  }

  protected startRun() {
    this.clearRunObjects();
    this.clearScreenOverlay();
    this.screenMode = "running";
    this.music.play("game");
    this.mapState = createInitialMapSectors(this.runSeed);
    this.currentRenderedSectorId = "";
    this.updateCameraBounds();
    this.run = createInitialRunState();
    this.lastPostRunReward = null;
    this.shopFeedback = "";
    this.run.nextChestKillThreshold = this.getNextChestKillThreshold();
    this.stateText.setText("");

    const startPosition = getStartPosition(this.mapState);
    const shipVisual = getShipVisual();
    const ship = createPlayerShip(
      this,
      startPosition.x,
      startPosition.y,
      shipVisual,
    );

    this.player = ship.player;
    this.playerTrail = ship.trail;
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.setCameraZoom(this.cameraZoom);
    this.renderMap();
    this.updateWave(0);
    this.refreshHud();
    this.onRunStarted();
  }

  protected clearRunObjects() {
    destroyRunEntities(this.run);
    destroyPlaceableControllerState(this.placeableState);
    this.upgradeOverlay?.destroy();
    this.upgradeOverlay = null;
    this.pauseOverlay?.destroy();
    this.pauseOverlay = null;
    this.player?.destroy();
    this.playerTrail?.destroy();
    this.player = null;
    this.playerTrail = null;
    this.cameras?.main?.stopFollow();
  }

  protected updatePlayer(dt: number) {
    if (!this.player || !this.playerTrail) {
      return;
    }

    updatePlayerMovement({
      scene: this,
      player: this.player,
      trail: this.playerTrail,
      input: this.inputState,
      stats: this.run.stats,
      mapState: this.mapState,
      invulnerableUntil: this.run.invulnerableUntil,
      dt,
      takeDamage: (damage, time) => this.takeDamage(damage, time),
    });

    const currentSector = this.getCurrentMapSector();

    if (currentSector.id !== this.currentRenderedSectorId) {
      const previousSectorId = this.currentRenderedSectorId;
      this.renderMap();
      this.onSectorChanged(previousSectorId, currentSector.id);
    }
  }

  protected updateShooting(time: number) {
    if (!this.player) {
      return;
    }

    this.run.nextShotAt = updatePlayerShooting({
      scene: this,
      player: this.player,
      enemies: this.run.enemies,
      bullets: this.run.bullets,
      stats: this.run.stats,
      time,
      nextShotAt: this.run.nextShotAt,
      damageMultiplier:
        time < this.run.temporaryEffects.venomRoundsUntil ? 1.2 : 1,
    });
  }

  protected updatePlaceableInput() {
    if (!this.player) {
      return;
    }

    readPlaceableInput({
      scene: this,
      keys: {
        turretKey: this.turretKey,
        mineKey: this.mineKey,
        barricadeKey: this.barricadeKey,
        removePlaceableKey: this.removePlaceableKey,
        cancelPlaceableKey: this.cancelPlaceableKey,
      },
      state: this.placeableState,
      player: this.player,
      runUpgrades: this.run.runUpgrades,
      mapState: this.mapState,
      turrets: this.run.turrets,
      mines: this.run.mines,
      barricades: this.run.barricades,
      coins: this.run.coins,
    }).forEach(({ result, pulseColor, pulseRadius }) => {
      this.handlePlaceableResult(result, pulseColor, pulseRadius);
    });
  }

  protected handlePlaceablePointerDown(pointer: Phaser.Input.Pointer) {
    if (
      this.screenMode !== "running" ||
      this.run.isPaused ||
      this.run.isLevelingUp ||
      !this.player
    ) {
      return;
    }

    handlePlaceablePointerDown({
      scene: this,
      state: this.placeableState,
      keys: {
        turretKey: this.turretKey,
        mineKey: this.mineKey,
        barricadeKey: this.barricadeKey,
        removePlaceableKey: this.removePlaceableKey,
        cancelPlaceableKey: this.cancelPlaceableKey,
      },
      player: this.player,
      runUpgrades: this.run.runUpgrades,
      mapState: this.mapState,
      turrets: this.run.turrets,
      mines: this.run.mines,
      barricades: this.run.barricades,
      coins: this.run.coins,
      pointer,
    }).forEach(({ result, pulseColor, pulseRadius }) => {
      this.handlePlaceableResult(result, pulseColor, pulseRadius);
    });
  }

  protected handlePlaceableResult(
    result: PlaceableActionResult,
    pulseColor?: number,
    pulseRadius?: number,
  ) {
    this.run.coins = result.coins;

    if (result.message) {
      this.showTemporaryState(result.message);
    }

    if (result.changed && pulseColor && pulseRadius) {
      createPulse(
        this,
        result.x ?? this.player?.x ?? 0,
        result.y ?? this.player?.y ?? 0,
        pulseRadius,
        pulseColor,
        0.22,
      );
    }

    if (result.changed) {
      this.refreshHud();
      this.onPlaceablesChanged();
    }
  }

  protected updatePlaceables(time: number) {
    updateTurrets(this, this.run.turrets, this.run.enemies, time, (enemyIndex, damage) =>
      this.damageEnemy(enemyIndex, damage, "turret"),
    );
    updateMines(this, this.run.mines, this.run.enemies, (enemyIndex, damage) =>
      this.damageEnemy(enemyIndex, damage, "mine"),
    );
    updatePlaceableEnemyPressure(
      this,
      this.run.enemies,
      this.run.turrets,
      this.run.mines,
      this.run.barricades,
      time,
    );
    updatePlaceableVisuals(this.run.turrets, this.run.barricades);
  }

  protected updateDrones(time: number, dt: number) {
    if (!this.player) {
      return;
    }

    syncDroneCount(this, this.run.drones, this.player, this.run.runUpgrades);
    updateDroneSystem(
      this,
      this.run.drones,
      this.player,
      this.run.enemies,
      time,
      dt,
      (enemyIndex, damage) => this.damageEnemy(enemyIndex, damage, "drone"),
    );
  }

  protected updateBullets(dt: number) {
    updatePlayerBullets({
      bullets: this.run.bullets,
      enemies: this.run.enemies,
      mapState: this.mapState,
      dt,
      damageEnemy: (enemyIndex, damage) =>
        this.damageEnemy(enemyIndex, damage, "shipProjectile"),
    });
  }

  protected updateEnemies(dt: number, time: number) {
    if (!this.player) {
      return;
    }

    updateEnemySystem(
      this,
      this.run.enemies,
      this.run.enemyProjectiles,
      this.player,
      this.mapState,
      this.run.barricades,
      dt,
      time,
      this.run.invulnerableUntil,
      (damage, hitTime) => this.takeDamage(damage, hitTime),
    );
  }

  protected updateEnemyProjectiles(dt: number, time: number) {
    if (!this.player) {
      return;
    }

    updateEnemyProjectiles(
      this,
      this.run.enemyProjectiles,
      this.player,
      this.mapState,
      this.run.barricades,
      dt,
      time,
      this.run.invulnerableUntil,
      (damage, hitTime) => this.takeDamage(damage, hitTime),
    );
  }

  protected updatePickups(dt: number) {
    if (!this.player) {
      return;
    }

    updatePickups({
      player: this.player,
      pickups: this.run.pickups,
      stats: this.run.stats,
      globalMagnetActive:
        this.time.now < this.run.temporaryEffects.magnetOverloadUntil,
      dt,
      collect: (pickup) => this.collectPickup(pickup),
    });
  }

  protected updateWave(time: number, force = false) {
    if (!force && !this.policy.automaticWaves) {
      return;
    }

    updateWaveSystem({
      run: this.run,
      mapState: this.mapState,
      player: this.player,
      time,
      spawnEnemyAt: (x, y, enemyType) => this.spawnEnemyAt(x, y, enemyType),
      onMapExpanded: () => this.updateCameraBounds(),
      renderMap: () => this.renderMap(),
    });
  }

  protected spawnEnemyAt(x: number, y: number, enemyType: Enemy["typeId"]) {
    this.run.enemies.push(
      createEnemy(
        this,
        x,
        y,
        enemyType,
        this.run.wave,
        this.mapState,
        this.run.difficulty,
      ),
    );
  }

  protected damageEnemy(
    enemyIndex: number,
    damage: number,
    source: DamageSource,
  ) {
    const previousKills = this.run.totalKills;
    damageEnemyAndApplyRewards({
      scene: this,
      run: this.run,
      mapState: this.mapState,
      enemyIndex,
      damage,
      source,
      getNextChestKillThreshold: () => this.getNextChestKillThreshold(),
    });

    if (this.run.totalKills > previousKills) {
      this.onEnemyKilled(this.run.totalKills - previousKills);
    }
  }

  protected collectPickup(pickup: Pickup) {
    if (pickup.kind === "xp") {
      if (addXpAndCheckLevelUp(this.run, pickup.value)) {
        this.showUpgradeChoices();
      }
    } else if (pickup.kind === "hp") {
      this.run.stats.hp = Math.min(
        this.run.stats.hp + pickup.value,
        this.run.stats.maxHp,
      );
    } else if (pickup.kind === "coin") {
      this.run.coins += pickup.value;
    } else if (pickup.specialEffectId) {
      const effect = getSpecialDropById(pickup.specialEffectId);

      if (effect?.id === "magnet-overload") {
        this.run.temporaryEffects.magnetOverloadUntil =
          Math.max(
            this.time.now,
            this.run.temporaryEffects.magnetOverloadUntil,
          ) + effect.durationMs;
      } else if (effect?.id === "venom-rounds") {
        this.run.temporaryEffects.venomRoundsUntil =
          Math.max(this.time.now, this.run.temporaryEffects.venomRoundsUntil) +
          effect.durationMs;
      }

      if (effect) {
        this.showTemporaryState(`${effect.title}: ${effect.description}`);
      }
    }

    this.onPickupCollected(pickup);
    this.refreshHud();
  }

  protected showUpgradeChoices() {
    this.run.isLevelingUp = true;
    this.music.playEffect("levelUp");
    this.renderUpgradeChoices();
    this.refreshHud();
  }

  protected renderUpgradeChoices() {
    this.upgradeOverlay?.destroy();
    this.upgradeOverlay = createUpgradeOverlay(
      this,
      this.getTomeChoices(),
      this.run.tomes,
      (offer) => {
        this.applyTome(offer);
        this.closeUpgradeOverlay();
      },
      () => this.rerollTomeChoices(),
      this.getTomeRerollLabel(),
    );
  }

  protected rerollTomeChoices() {
    if (!this.run.isLevelingUp) {
      return;
    }

    if (this.run.freeTomeRerolls > 0) {
      this.run.freeTomeRerolls -= 1;
      this.renderUpgradeChoices();
      return;
    }

    const cost = this.getPaidTomeRerollCost();

    if (this.run.coins < cost) {
      return;
    }

    this.run.coins -= cost;
    this.run.paidTomeRerolls += 1;
    this.renderUpgradeChoices();
    this.refreshHud();
  }

  protected getPaidTomeRerollCost() {
    const roll = this.run.paidTomeRerolls + 1;
    return 25 * roll * (roll + 1);
  }

  protected getTomeRerollLabel() {
    if (this.run.freeTomeRerolls > 0) {
      return `REROLL GRATIS (${this.run.freeTomeRerolls})`;
    }

    const cost = this.getPaidTomeRerollCost();
    return `REROLL ${cost} RISORSE  /  HAI ${this.run.coins}`;
  }

  protected applyTome(offer: TomeOffer) {
    const oldEngineering = this.run.runUpgrades.engineeringMultiplier;
    const oldSwarm = this.run.runUpgrades.swarmMultiplier;
    applyTomeOfferToRun({ run: this.run, offer });

    if (offer.tome.id === "engineering") {
      const ratio =
        this.run.runUpgrades.engineeringMultiplier / oldEngineering;
      this.run.turrets.forEach((turret) => {
        turret.range *= ratio;
        turret.damage *= ratio;
        turret.maxHp *= ratio;
        turret.hp *= ratio;
        turret.rangeIndicator.setRadius(turret.range);
      });
      this.run.mines.forEach((mine) => {
        mine.damage *= ratio;
        mine.damageRadius *= ratio;
        mine.maxHp *= ratio;
        mine.hp *= ratio;
      });
      this.run.barricades.forEach((barricade) => {
        barricade.maxHp *= ratio;
        barricade.hp *= ratio;
      });
    }

    if (offer.tome.id === "swarm") {
      const ratio = this.run.runUpgrades.swarmMultiplier / oldSwarm;
      this.run.drones.forEach((drone) => {
        drone.damage *= ratio;
        drone.fireRate /= ratio;
      });
    }

    this.onTomeApplied(offer);
  }

  protected applyChestReward(reward: ChestItemReward) {
    const before = { ...this.run.runUpgrades };
    applyChestItemToRun({
      scene: this,
      run: this.run,
      reward,
      player: this.player,
    });
    const after = this.run.runUpgrades;
    const engineering = after.engineeringMultiplier;
    const turretRangeDelta =
      (after.turretRangeBonus - before.turretRangeBonus) * engineering;
    const turretHpDelta =
      (after.turretHpBonus - before.turretHpBonus) * engineering;
    const mineDamageDelta =
      (after.mineDamageBonus - before.mineDamageBonus) * engineering;
    const mineRadiusDelta =
      (after.mineRadiusBonus - before.mineRadiusBonus) * engineering;
    const barricadeHpDelta =
      (after.barricadeHpBonus - before.barricadeHpBonus) * engineering;

    this.run.turrets.forEach((turret) => {
      turret.range += turretRangeDelta;
      turret.rangeIndicator.setRadius(turret.range);
      turret.maxHp += turretHpDelta;
      turret.hp += turretHpDelta;
    });
    this.run.mines.forEach((mine) => {
      mine.damage += mineDamageDelta;
      mine.damageRadius += mineRadiusDelta;
    });
    this.run.barricades.forEach((barricade) => {
      barricade.maxHp += barricadeHpDelta;
      barricade.hp += barricadeHpDelta;
    });

    const droneDamageRatio =
      before.droneDamageBonus === after.droneDamageBonus
        ? 1
        : (1 + after.droneDamageBonus) / (1 + before.droneDamageBonus);
    const droneFireRateRatio =
      after.droneFireRateMultiplier / before.droneFireRateMultiplier;
    this.run.drones.forEach((drone) => {
      drone.damage *= droneDamageRatio;
      drone.fireRate *= droneFireRateRatio;
    });
    this.onChestRewardApplied(reward);
  }

  protected closeUpgradeOverlay() {
    this.upgradeOverlay?.destroy();
    this.upgradeOverlay = null;
    this.run.isLevelingUp = false;
    this.refreshHud();
  }

  protected updateChests(time: number) {
    if (!this.player) {
      return;
    }

    updateChestController({
      scene: this,
      run: this.run,
      metaState: this.metaState,
      mapState: this.mapState,
      player: this.player,
      time,
      showMessage: (message) => this.showTemporaryState(message),
      showChestReward: (reward, detail) => {
        this.music.playEffect("reward");
        createChestRewardToast(this, reward, this.run.items, detail);
      },
      pickReward: () => this.pickChestReward(),
      renderMap: () => this.renderMap(),
      applyReward: (reward) => this.applyChestReward(reward),
    });
    this.refreshHud();
  }

  protected takeDamage(damage: number, time: number) {
    if (this.policy.invulnerable) {
      const effectiveDamage = Math.min(
        damage,
        Math.max(0, this.run.stats.hp - 1),
      );
      this.run.invulnerableUntil = applyPlayerDamage({
        scene: this,
        stats: this.run.stats,
        damage: effectiveDamage,
        time,
        onDeath: () => undefined,
      });
      this.onPlayerDamaged(effectiveDamage);
      this.refreshHud();
      return;
    }

    this.run.invulnerableUntil = applyPlayerDamage({
      scene: this,
      stats: this.run.stats,
      damage,
      time,
      onDeath: () => this.endRun(),
    });
    this.refreshHud();
  }

  protected endRun() {
    if (this.run.isGameOver) {
      return;
    }

    this.screenMode = "gameOver";
    this.music.stop();
    this.run.isGameOver = true;
    this.run.stats.hp = 0;
    this.lastPostRunReward = calculatePostRunReward(this.run);
    if (this.policy.persistPostRunRewards) {
      grantPostRunCredits(this.metaState, this.lastPostRunReward);
    }
    this.stateText.setText("");
    this.player?.setTint(0x64748b).setAlpha(0.8);
    this.playerTrail?.setVisible(false);
    this.showGameOver();
  }

  protected refreshHud() {
    const currentSector = this.getCurrentMapSector();

    updateHud(this.hudText, {
      hp: this.run.stats.hp,
      maxHp: this.run.stats.maxHp,
      xp: this.run.xp,
      xpToNext: this.run.xpToNext,
      level: this.run.level,
      coins: this.run.coins,
      wave: this.run.wave,
      wavePhase: this.run.wavePhase,
      enemyCount: this.run.enemies.length,
      sectorName: currentSector.name,
      sectorSize: currentSector.size,
      discoveredSectors: this.mapState.sectors.length,
      turretCount: this.run.turrets.length,
      maxTurrets: getMaxTurrets(this.run.runUpgrades),
      mineCount: this.run.mines.length,
      maxMines: getMaxMines(this.run.runUpgrades),
      barricadeCount: this.run.barricades.length,
      maxBarricades: this.run.runUpgrades.maxBarricades,
      droneCount: this.run.drones.length,
      chestCount: this.run.chests.length,
      acquiredTomes: Object.entries(this.run.tomes.levels).flatMap(
        ([tomeId, level]) => {
          const tome = getTomeById(tomeId as never);

          if (!tome || !level || level <= 0) {
            return [];
          }

          return [
            {
              id: tome.id,
              title: tome.title,
              level: getTomeLevel(this.run.tomes, tome.id),
              accentColor: tome.accentColor,
            },
          ];
        },
      ),
      acquiredItems: Object.entries(this.run.items.levels).flatMap(
        ([itemId, level]) => {
          const item = getChestItemById(itemId as never);

          if (!item || !level || level <= 0) {
            return [];
          }

          return [
            {
              id: item.id,
              title: item.title,
              category: item.category,
              level: getItemLevel(this.run.items, item.id),
              accentColor: item.accentColor,
            },
          ];
        },
      ),
      activeEffects: [
        this.time.now < this.run.temporaryEffects.magnetOverloadUntil
          ? `Magnete ${Math.ceil((this.run.temporaryEffects.magnetOverloadUntil - this.time.now) / 1000)}s`
          : "",
        this.time.now < this.run.temporaryEffects.venomRoundsUntil
          ? `Venom ${Math.ceil((this.run.temporaryEffects.venomRoundsUntil - this.time.now) / 1000)}s`
          : "",
      ].filter(Boolean),
    });
  }

  protected showTemporaryState(message: string) {
    this.stateText.setText(message);
    this.time.delayedCall(950, () => {
      if (!this.run.isGameOver && this.stateText.text === message) {
        this.stateText.setText("");
      }
    });
  }

  protected showMainMenu(feedback = "") {
    this.clearRunObjects();
    this.clearScreenOverlay();
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setScroll(0, 0);
    this.screenMode = "mainMenu";
    this.music.play("menu");
    this.run.isGameOver = false;
    this.run.isLevelingUp = false;
    this.run.isPaused = false;
    this.shopFeedback = "";
    this.hudText.setText("");
    hideHud();
    this.stateText.setText("");
    this.screenOverlay = showMainMenuOverlay(this, feedback, {
      play: () => this.startRun(),
      tutorial: () => this.scene.start("Tutorial"),
      shop: () => this.showShop(),
      staging: import.meta.env.DEV
        ? () => this.scene.start("Staging")
        : undefined,
      exit: () => this.showMainMenu("Nel browser Exit torna al menu principale."),
    });
  }

  protected showGameOver() {
    this.clearScreenOverlay();
    hideHud();
    this.screenOverlay = showGameOverOverlay(
      this,
      this.run.coins,
      this.lastPostRunReward ?? calculatePostRunReward(this.run),
      this.metaState.postRunCredits,
      {
        restart: () => this.startRun(),
        shop: () => this.showShop(),
        menu: () => this.showMainMenu(),
      },
    );
  }

  protected showShop() {
    this.clearRunObjects();
    this.clearScreenOverlay();
    this.screenMode = "shop";
    this.music.play("menu");
    this.hudText.setText("");
    hideHud();
    this.stateText.setText("");
    this.shopDomOverlay = createShopDomOverlay(
      this.metaState,
      this.selectedShopCategory,
      this.shopFeedback,
      {
        selectCategory: (category) => {
          this.selectedShopCategory = category;
          this.shopFeedback = "";
          this.showShop();
        },
        selectContent: (entry) => this.handleShopContentClick(entry),
        menu: () => this.showMainMenu(),
        play: () => this.startRun(),
      },
    );
  }

  protected handleShopContentClick(entry: ShopContentEntry) {
    if (!isContentUnlocked(this.metaState, entry.kind, entry.id)) {
      if (unlockContent(this.metaState, entry.kind, entry.id)) {
        this.shopFeedback = `${entry.title} sbloccato e aggiunto al pool`;
      } else {
        this.shopFeedback = `Crediti insufficienti: servono ${entry.cost} crediti`;
      }
    } else {
      const result = toggleContentActive(
        this.metaState,
        entry.kind,
        entry.id,
      );
      this.shopFeedback = result.changed
        ? `${entry.title}: ${result.reason.toLowerCase()}`
        : result.reason;
    }
    this.showShop();
  }

  protected clearScreenOverlay() {
    this.screenOverlay?.destroy();
    this.screenOverlay = null;
    this.shopDomOverlay?.();
    this.shopDomOverlay = null;
  }

  protected getCurrentMapSector() {
    if (!this.player) {
      return this.mapState.sectors[0];
    }

    return (
      getSectorAt(this.mapState, this.player.x, this.player.y) ??
      this.mapState.sectors[0]
    );
  }

  protected updateCameraBounds() {
    const bounds = getMapBounds(this.mapState, 220);
    this.cameras.main.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
  }

  protected updateViewportControls() {
    if (Input.Keyboard.JustDown(this.fullscreenKey)) {
      this.toggleFullscreen();
    }

    if (this.screenMode !== "running" || this.run.isPaused) {
      return;
    }

    if (Input.Keyboard.JustDown(this.zoomInKey)) {
      this.setCameraZoom(this.cameraZoom + 0.1);
    } else if (Input.Keyboard.JustDown(this.zoomOutKey)) {
      this.setCameraZoom(this.cameraZoom - 0.1);
    }
  }

  protected updatePauseInput(time: number) {
    if (
      this.screenMode !== "running" ||
      this.run.isLevelingUp ||
      !Input.Keyboard.JustDown(this.pauseKey)
    ) {
      return;
    }

    if (this.run.isPaused) {
      this.resumeRun(time);
    } else {
      this.pauseRun(time);
    }
  }

  protected pauseRun(time: number) {
    this.run.isPaused = true;
    this.run.pausedAt = time;
    this.music.pause();
    this.pauseOverlay?.destroy();
    this.pauseOverlay = showPauseOverlay(this, () =>
      this.resumeRun(this.time.now),
    );
  }

  protected resumeRun(time: number) {
    if (!this.run.isPaused) {
      return;
    }

    const pausedDuration = Math.max(0, time - this.run.pausedAt);
    this.shiftRunTimers(pausedDuration);
    this.run.isPaused = false;
    this.run.pausedAt = 0;
    this.pauseOverlay?.destroy();
    this.pauseOverlay = null;
    this.music.resume();
  }

  protected shiftRunTimers(duration: number) {
    const shift = (value: number) => (value > 0 ? value + duration : value);

    this.run.nextWaveAt = shift(this.run.nextWaveAt);
    this.run.waveEndsAt = shift(this.run.waveEndsAt);
    this.run.nextSpawnPulseAt = shift(this.run.nextSpawnPulseAt);
    this.run.nextShotAt = shift(this.run.nextShotAt);
    this.run.nextBuyableChestAt = shift(this.run.nextBuyableChestAt);
    this.run.invulnerableUntil = shift(this.run.invulnerableUntil);
    this.run.temporaryEffects.magnetOverloadUntil = shift(
      this.run.temporaryEffects.magnetOverloadUntil,
    );
    this.run.temporaryEffects.venomRoundsUntil = shift(
      this.run.temporaryEffects.venomRoundsUntil,
    );
    this.run.enemies.forEach((enemy) => {
      enemy.nextAttackAt = shift(enemy.nextAttackAt);
    });
    this.run.turrets.forEach((turret) => {
      turret.nextShotAt = shift(turret.nextShotAt);
      turret.damageCooldownUntil = shift(turret.damageCooldownUntil);
    });
    this.run.mines.forEach((mine) => {
      mine.damageCooldownUntil = shift(mine.damageCooldownUntil);
    });
    this.run.barricades.forEach((barricade) => {
      barricade.damageCooldownUntil = shift(barricade.damageCooldownUntil);
    });
    this.run.drones.forEach((drone) => {
      drone.nextShotAt = shift(drone.nextShotAt);
    });
  }

  protected setCameraZoom(zoom: number) {
    this.cameraZoom = PhaserMath.Clamp(zoom, 0.75, 1.25);
    this.cameras.main.setZoom(this.cameraZoom);
  }

  protected toggleFullscreen() {
    const target = this.game.canvas.parentElement ?? this.game.canvas;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
      return;
    }

    target.requestFullscreen?.().catch(() => undefined);
  }

  protected renderMap() {
    const currentSector = this.getCurrentMapSector();

    this.currentRenderedSectorId = currentSector.id;
    renderMapArena(this.mapRenderer, this.mapState, currentSector, this.run.chests);
  }

  protected getNextChestKillThreshold() {
    const base = CHEST_KILL_THRESHOLD + PhaserMath.Between(-8, 12);
    const luckMultiplier = 1 + Math.min(0.3, this.run.stats.luck * 0.002);
    return Math.max(
      20,
      Math.round(
        base /
          (this.run.difficulty.chestFrequencyMultiplier * luckMultiplier),
      ),
    );
  }

  protected bootMode(_data: GameplaySceneData) {
    this.showMainMenu();
  }

  protected getTomeChoices() {
    return getLevelUpChoices(this.run, this.metaState);
  }

  protected pickChestReward(): ChestItemReward | undefined {
    return undefined;
  }

  protected onRunStarted() {}

  protected onEnemyKilled(_count: number) {}

  protected onPickupCollected(_pickup: Pickup) {}

  protected onTomeApplied(_offer: TomeOffer) {}

  protected onChestRewardApplied(_reward: ChestItemReward) {}

  protected onPlaceablesChanged() {}

  protected onSectorChanged(_previousSectorId: string, _sectorId: string) {}

  protected onPlayerDamaged(_damage: number) {}

  protected shutdownGameplayScene() {
    this.clearRunObjects();
    this.clearScreenOverlay();
    this.music?.stop();
    this.input?.removeAllListeners("pointerdown");
    this.input?.removeAllListeners("wheel");
    destroyHud();
  }
}
