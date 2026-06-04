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
import { createHud, updateHud } from "../systems/hud";
import { createInitialMapSectors, getMapBounds, getSectorAt, getStartPosition } from "../systems/mapSectors";
import {
  applyLoadoutBonuses,
  buyShopItem,
  calculatePostRunReward,
  equipShopItem,
  getShopItem,
  getShopItemLevel,
  getShopItemUpgradeCost,
  isShopItemUnlocked,
  grantPostRunCredits,
  loadMetaProgression,
  upgradeShopItem,
} from "../systems/metaProgression";
import {
  getMaxMines,
  getMaxTurrets,
  readPlaceableInput,
  type PlaceableActionResult,
} from "../systems/placeableController";
import { updateMines, updatePlaceableEnemyPressure, updateTurrets } from "../systems/placeables";
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
import { createUpgradeOverlay, showGameOverOverlay, showMainMenuOverlay } from "../systems/screenSystem";
import { createShopDomOverlay } from "../systems/shopOverlay";
import { addXpAndCheckLevelUp, applyUpgradeToRun, getLevelUpChoices } from "../systems/upgradeSystem";
import { updatePlayerBullets, updatePlayerShooting } from "../systems/weaponSystem";
import { updateWaveSystem } from "../systems/waveSystem";
import type {
  Enemy,
  MapSectorState,
  MetaProgressionState,
  Pickup,
  PostRunRewardPreview,
  ShopCategory,
  ShopItemId,
  Upgrade,
} from "../types/gameplay";

type ScreenMode = "mainMenu" | "shop" | "running" | "gameOver";

export class Game extends Scene {
  private screenMode: ScreenMode = "mainMenu";
  private player: Phaser.GameObjects.Triangle | null = null;
  private playerTrail: Phaser.GameObjects.Arc | null = null;
  private inputState!: PlayerInput;
  private restartKey!: Phaser.Input.Keyboard.Key;
  private turretKey!: Phaser.Input.Keyboard.Key;
  private mineKey!: Phaser.Input.Keyboard.Key;
  private barricadeKey!: Phaser.Input.Keyboard.Key;
  private removePlaceableKey!: Phaser.Input.Keyboard.Key;
  private run: RunState = createInitialRunState();
  private upgradeOverlay: Phaser.GameObjects.Container | null = null;
  private screenOverlay: Phaser.GameObjects.Container | null = null;
  private shopDomOverlay: (() => void) | null = null;
  private mapRenderer!: MapArenaRenderer;
  private mapState: MapSectorState = createInitialMapSectors();
  private currentRenderedSectorId = "";
  private metaState!: MetaProgressionState;
  private selectedShopCategory: ShopCategory = "ships";
  private lastPostRunReward: PostRunRewardPreview | null = null;
  private shopFeedback = "";
  private hudText!: Phaser.GameObjects.Text;
  private stateText!: Phaser.GameObjects.Text;

  constructor() {
    super("Game");
  }

  create() {
    this.createInput();
    this.mapRenderer = createMapArenaRenderer(this);

    const hud = createHud(this);
    this.hudText = hud.hudText;
    this.stateText = hud.stateText;
    this.metaState = loadMetaProgression();

    this.showMainMenu();
  }

  update(time: number, delta: number) {
    if (this.screenMode === "gameOver") {
      if (Input.Keyboard.JustDown(this.restartKey)) {
        this.startRun();
      }

      return;
    }

    if (this.screenMode !== "running" || this.run.isLevelingUp) {
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

  private createInput() {
    this.inputState = createMovementInput(this);
    this.restartKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.R);
    this.turretKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.T);
    this.mineKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.F);
    this.barricadeKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.B);
    this.removePlaceableKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.E);
  }

  private startRun() {
    this.clearRunObjects();
    this.clearScreenOverlay();
    this.screenMode = "running";
    this.mapState = createInitialMapSectors();
    this.currentRenderedSectorId = "";
    this.updateCameraBounds();
    this.run = createInitialRunState();
    this.lastPostRunReward = null;
    this.shopFeedback = "";
    this.run.nextChestKillThreshold = this.getNextChestKillThreshold();
    applyLoadoutBonuses(this.run.stats, this.run.runUpgrades, this.metaState);
    this.stateText.setText("");

    const startPosition = getStartPosition(this.mapState);
    const shipVisual = getShipVisual(getShopItem(this.metaState.loadout.ships));
    const ship = createPlayerShip(
      this,
      startPosition.x,
      startPosition.y,
      shipVisual,
    );

    this.player = ship.player;
    this.playerTrail = ship.trail;
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.renderMap();
    this.updateWave(0);
    this.refreshHud();
  }

  private clearRunObjects() {
    destroyRunEntities(this.run);
    this.upgradeOverlay?.destroy();
    this.upgradeOverlay = null;
    this.player?.destroy();
    this.playerTrail?.destroy();
    this.player = null;
    this.playerTrail = null;
    this.cameras.main.stopFollow();
  }

  private updatePlayer(dt: number) {
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

    if (this.getCurrentMapSector().id !== this.currentRenderedSectorId) {
      this.renderMap();
    }
  }

  private updateShooting(time: number) {
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
    });
  }

  private updatePlaceableInput() {
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
      },
      player: this.player,
      metaState: this.metaState,
      runUpgrades: this.run.runUpgrades,
      turrets: this.run.turrets,
      mines: this.run.mines,
      barricades: this.run.barricades,
      coins: this.run.coins,
    }).forEach(({ result, pulseColor, pulseRadius }) => {
      this.handlePlaceableResult(result, pulseColor, pulseRadius);
    });
  }

  private handlePlaceableResult(
    result: PlaceableActionResult,
    pulseColor?: number,
    pulseRadius?: number,
  ) {
    this.run.coins = result.coins;

    if (result.message) {
      this.showTemporaryState(result.message);
    }

    if (result.changed && pulseColor && pulseRadius && this.player) {
      createPulse(this, this.player.x, this.player.y, pulseRadius, pulseColor, 0.22);
    }

    if (result.changed) {
      this.refreshHud();
    }
  }

  private updatePlaceables(time: number) {
    updateTurrets(this, this.run.turrets, this.run.enemies, time, (enemyIndex, damage) =>
      this.damageEnemy(enemyIndex, damage),
    );
    updateMines(this, this.run.mines, this.run.enemies, (enemyIndex, damage) =>
      this.damageEnemy(enemyIndex, damage),
    );
    updatePlaceableEnemyPressure(
      this,
      this.run.enemies,
      this.run.turrets,
      this.run.mines,
      this.run.barricades,
      time,
    );
  }

  private updateDrones(time: number, dt: number) {
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
      (enemyIndex, damage) => this.damageEnemy(enemyIndex, damage),
    );
  }

  private updateBullets(dt: number) {
    updatePlayerBullets({
      bullets: this.run.bullets,
      enemies: this.run.enemies,
      mapState: this.mapState,
      dt,
      damageEnemy: (enemyIndex, damage) => this.damageEnemy(enemyIndex, damage),
    });
  }

  private updateEnemies(dt: number, time: number) {
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

  private updateEnemyProjectiles(dt: number, time: number) {
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

  private updatePickups(dt: number) {
    if (!this.player) {
      return;
    }

    updatePickups({
      player: this.player,
      pickups: this.run.pickups,
      stats: this.run.stats,
      dt,
      collect: (pickup) => this.collectPickup(pickup),
    });
  }

  private updateWave(time: number) {
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

  private spawnEnemyAt(x: number, y: number, enemyType: Enemy["typeId"]) {
    this.run.enemies.push(createEnemy(this, x, y, enemyType, this.run.wave, this.mapState));
  }

  private damageEnemy(enemyIndex: number, damage: number) {
    damageEnemyAndApplyRewards({
      scene: this,
      run: this.run,
      mapState: this.mapState,
      enemyIndex,
      damage,
      getNextChestKillThreshold: () => this.getNextChestKillThreshold(),
    });
  }

  private collectPickup(pickup: Pickup) {
    if (pickup.kind === "xp") {
      if (addXpAndCheckLevelUp(this.run, pickup.value)) {
        this.showUpgradeChoices();
      }
    } else if (pickup.kind === "hp") {
      this.run.stats.hp = Math.min(
        this.run.stats.hp + pickup.value,
        this.run.stats.maxHp,
      );
    } else {
      this.run.coins += pickup.value;
    }

    this.refreshHud();
  }

  private showUpgradeChoices() {
    this.run.isLevelingUp = true;
    this.upgradeOverlay = createUpgradeOverlay(
      this,
      getLevelUpChoices({
        runUpgrades: this.run.runUpgrades,
        loadout: this.metaState.loadout,
      }),
      (upgrade) => {
        this.applyUpgrade(upgrade);
        this.closeUpgradeOverlay();
      },
    );
    this.refreshHud();
  }

  private applyUpgrade(upgrade: Upgrade) {
    applyUpgradeToRun({
      scene: this,
      run: this.run,
      upgrade,
      player: this.player,
      drones: this.run.drones,
    });
  }

  private closeUpgradeOverlay() {
    this.upgradeOverlay?.destroy();
    this.upgradeOverlay = null;
    this.run.isLevelingUp = false;
    this.refreshHud();
  }

  private updateChests(time: number) {
    if (!this.player) {
      return;
    }

    updateChestController({
      scene: this,
      run: this.run,
      mapState: this.mapState,
      player: this.player,
      time,
      showMessage: (message) => this.showTemporaryState(message),
      renderMap: () => this.renderMap(),
      applyUpgrade: (upgrade) => this.applyUpgrade(upgrade),
      loadout: this.metaState.loadout,
    });
    this.refreshHud();
  }

  private takeDamage(damage: number, time: number) {
    this.run.invulnerableUntil = applyPlayerDamage({
      scene: this,
      stats: this.run.stats,
      damage,
      time,
      onDeath: () => this.endRun(),
    });
    this.refreshHud();
  }

  private endRun() {
    if (this.run.isGameOver) {
      return;
    }

    this.screenMode = "gameOver";
    this.run.isGameOver = true;
    this.run.stats.hp = 0;
    this.lastPostRunReward = calculatePostRunReward(this.run);
    grantPostRunCredits(this.metaState, this.lastPostRunReward);
    this.stateText.setText("");
    this.player?.setFillStyle(0x64748b, 0.8);
    this.playerTrail?.setVisible(false);
    this.showGameOver();
  }

  private refreshHud() {
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
    });
  }

  private showTemporaryState(message: string) {
    this.stateText.setText(message);
    this.time.delayedCall(950, () => {
      if (!this.run.isGameOver && this.stateText.text === message) {
        this.stateText.setText("");
      }
    });
  }

  private showMainMenu(feedback = "") {
    this.clearRunObjects();
    this.clearScreenOverlay();
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setScroll(0, 0);
    this.screenMode = "mainMenu";
    this.run.isGameOver = false;
    this.run.isLevelingUp = false;
    this.shopFeedback = "";
    this.hudText.setText("");
    this.stateText.setText("");
    this.screenOverlay = showMainMenuOverlay(this, feedback, {
      play: () => this.startRun(),
      shop: () => this.showShop(),
      exit: () => this.showMainMenu("Nel browser Exit torna al menu principale."),
    });
  }

  private showGameOver() {
    this.clearScreenOverlay();
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

  private showShop() {
    this.clearRunObjects();
    this.clearScreenOverlay();
    this.screenMode = "shop";
    this.hudText.setText("");
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
        selectItem: (itemId) => this.handleShopItemClick(itemId),
        upgradeItem: (itemId) => this.handleShopItemUpgradeClick(itemId),
        menu: () => this.showMainMenu(),
        play: () => this.startRun(),
      },
    );
  }

  private handleShopItemClick(itemId: ShopItemId) {
    const item = getShopItem(itemId);

    if (!item) {
      return;
    }

    if (isShopItemUnlocked(this.metaState, item.id)) {
      equipShopItem(this.metaState, item.id);
      this.shopFeedback = `${item.title} equipaggiato`;
    } else if (!buyShopItem(this.metaState, item.id)) {
      this.shopFeedback = `Crediti insufficienti: servono ${item.cost} crediti`;
    } else {
      this.shopFeedback = `${item.title} sbloccato`;
    }

    this.showShop();
  }

  private handleShopItemUpgradeClick(itemId: ShopItemId) {
    const item = getShopItem(itemId);

    if (!item) {
      return;
    }

    if (!isShopItemUnlocked(this.metaState, item.id)) {
      this.shopFeedback = "Sblocca l'item prima di potenziarlo";
    } else if (!upgradeShopItem(this.metaState, item.id)) {
      const level = getShopItemLevel(this.metaState, item.id);
      const cost = getShopItemUpgradeCost(item, level);

      this.shopFeedback = `Crediti insufficienti: servono ${cost} crediti`;
    } else {
      const level = getShopItemLevel(this.metaState, item.id);

      this.shopFeedback = `${item.title} potenziato a Lv.${level}`;
    }

    this.showShop();
  }

  private clearScreenOverlay() {
    this.screenOverlay?.destroy();
    this.screenOverlay = null;
    this.shopDomOverlay?.();
    this.shopDomOverlay = null;
  }

  private getCurrentMapSector() {
    if (!this.player) {
      return this.mapState.sectors[0];
    }

    return (
      getSectorAt(this.mapState, this.player.x, this.player.y) ??
      this.mapState.sectors[0]
    );
  }

  private updateCameraBounds() {
    const bounds = getMapBounds(this.mapState, 220);
    this.cameras.main.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
  }

  private renderMap() {
    const currentSector = this.getCurrentMapSector();

    this.currentRenderedSectorId = currentSector.id;
    renderMapArena(this.mapRenderer, this.mapState, currentSector, this.run.chests);
  }

  private getNextChestKillThreshold() {
    return CHEST_KILL_THRESHOLD + PhaserMath.Between(-8, 12);
  }
}
