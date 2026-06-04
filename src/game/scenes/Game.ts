import { Input, Math as PhaserMath, Scene, Utils } from "phaser";
import {
  BULLET_RADIUS,
  BUYABLE_CHEST_INTERVAL,
  CHEST_COST,
  CHEST_KILL_THRESHOLD,
  GAME_HEIGHT,
  GAME_WIDTH,
  INITIAL_PLAYER_STATS,
  MAX_BUYABLE_CHESTS,
  MAX_MINES,
  MAX_TURRETS,
  PICKUP_RADIUS,
  PLAYER_HIT_COOLDOWN,
  PLAYER_RADIUS,
  SCREEN_CENTER_X,
  SCREEN_CENTER_Y,
  WAVE_BREAK_DURATION,
  WAVE_DURATION,
  WAVE_FINAL_SPAWN_INTERVAL,
  WAVE_MID_SPAWN_INTERVAL,
  WAVE_START_SPAWN_INTERVAL,
} from "../config/gameplay";
import { pickEnemyTypeForSpawn } from "../data/enemies";
import {
  CHEST_UPGRADES,
  XP_UPGRADES,
  createInitialRunUpgradeState,
  getAvailableUpgrades,
  getUpgradeStacks,
} from "../data/upgrades";
import {
  createMapArenaRenderer,
  renderMapArena,
  type MapArenaRenderer,
} from "../systems/arenaRenderer";
import { createPulse } from "../systems/effects";
import {
  createChest,
  destroyChest,
  getChestSpawnPoint,
  updateChests,
} from "../systems/chests";
import { destroyDrone, syncDroneCount, updateDrones } from "../systems/drones";
import {
  createEnemy,
  destroyEnemy,
  destroyEnemyProjectile,
  updateEnemies as updateEnemySystem,
  updateEnemyProjectiles,
} from "../systems/enemies";
import { createHud, updateHud } from "../systems/hud";
import {
  createInitialMapSectors,
  expandMapForWave,
  getBlockingHazards,
  getMapBounds,
  getPlasmaDamageAt,
  getSectorAt,
  getSectorCenter,
  getSlowMultiplierAt,
  getStartPosition,
} from "../systems/mapSectors";
import {
  SHOP_CATEGORIES,
  SHOP_ITEMS,
  applyLoadoutBonuses,
  equipShopItem,
  getShopItem,
  loadMetaProgression,
} from "../systems/metaProgression";
import {
  createBarricade,
  createMine,
  createTurret,
  destroyBarricade,
  destroyMine,
  destroyTurret,
  getBarricadeCost,
  getMineCost,
  getTurretCost,
  removeNearestPlaceable,
  updatePlaceableEnemyPressure,
  updateMines,
  updateTurrets,
} from "../systems/placeables";
import type {
  Barricade,
  Bullet,
  Chest,
  Drone,
  Enemy,
  EnemyProjectile,
  MapSector,
  MapSectorState,
  MetaProgressionState,
  Mine,
  Pickup,
  PlayerStats,
  RunUpgradeState,
  ShopCategory,
  ShopItem,
  ShopItemId,
  Turret,
  Upgrade,
} from "../types/gameplay";
import {
  circleHitsHazard,
  circlesOverlap,
  clampInsideMap,
  isInsideMap,
  resolveCircleHazardCollisions,
} from "../utils/geometry";

export class Game extends Scene {
  private screenMode: "mainMenu" | "shop" | "running" | "gameOver" = "mainMenu";
  private player: Phaser.GameObjects.Triangle | null = null;
  private playerTrail: Phaser.GameObjects.Arc | null = null;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<"w" | "a" | "s" | "d", Phaser.Input.Keyboard.Key>;
  private restartKey!: Phaser.Input.Keyboard.Key;
  private turretKey!: Phaser.Input.Keyboard.Key;
  private mineKey!: Phaser.Input.Keyboard.Key;
  private barricadeKey!: Phaser.Input.Keyboard.Key;
  private removePlaceableKey!: Phaser.Input.Keyboard.Key;
  private stats!: PlayerStats;
  private runUpgrades!: RunUpgradeState;
  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private enemyProjectiles: EnemyProjectile[] = [];
  private pickups: Pickup[] = [];
  private chests: Chest[] = [];
  private turrets: Turret[] = [];
  private mines: Mine[] = [];
  private barricades: Barricade[] = [];
  private drones: Drone[] = [];
  private xpUpgradePool: Upgrade[] = [];
  private chestUpgradePool: Upgrade[] = [];
  private upgradeOverlay: Phaser.GameObjects.Container | null = null;
  private screenOverlay: Phaser.GameObjects.Container | null = null;
  private mapRenderer!: MapArenaRenderer;
  private mapState!: MapSectorState;
  private currentRenderedSectorId = "";
  private metaState!: MetaProgressionState;
  private selectedShopCategory: ShopCategory = "ships";
  private hudText!: Phaser.GameObjects.Text;
  private stateText!: Phaser.GameObjects.Text;
  private xp = 0;
  private xpToNext = 6;
  private level = 1;
  private coins = 0;
  private wave = 0;
  private nextWaveAt = 0;
  private waveEndsAt = 0;
  private nextSpawnPulseAt = 0;
  private wavePhase = "attesa";
  private nextShotAt = 0;
  private killsSinceLastChest = 0;
  private nextChestKillThreshold = CHEST_KILL_THRESHOLD;
  private nextBuyableChestAt = 0;
  private invulnerableUntil = 0;
  private isLevelingUp = false;
  private isGameOver = false;

  constructor() {
    super("Game");
  }

  create() {
    this.createInput();
    this.mapRenderer = createMapArenaRenderer(this);

    const hud = createHud(this);
    this.hudText = hud.hudText;
    this.stateText = hud.stateText;
    this.xpUpgradePool = XP_UPGRADES;
    this.chestUpgradePool = CHEST_UPGRADES;
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

    if (this.screenMode !== "running") {
      return;
    }

    if (this.isLevelingUp) {
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
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys({
      w: Input.Keyboard.KeyCodes.W,
      a: Input.Keyboard.KeyCodes.A,
      s: Input.Keyboard.KeyCodes.S,
      d: Input.Keyboard.KeyCodes.D,
    }) as Record<"w" | "a" | "s" | "d", Phaser.Input.Keyboard.Key>;
    this.restartKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.R);
    this.turretKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.T);
    this.mineKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.F);
    this.barricadeKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.B);
    this.removePlaceableKey = this.input.keyboard!.addKey(
      Input.Keyboard.KeyCodes.E,
    );
  }

  private startRun() {
    this.clearRunObjects();
    this.clearScreenOverlay();
    this.screenMode = "running";

    this.mapState = createInitialMapSectors();
    this.currentRenderedSectorId = "";
    this.updateCameraBounds();
    this.stats = { ...INITIAL_PLAYER_STATS };
    this.runUpgrades = createInitialRunUpgradeState();
    applyLoadoutBonuses(this.stats, this.metaState);
    this.xp = 0;
    this.xpToNext = 6;
    this.level = 1;
    this.coins = 0;
    this.wave = 0;
    this.nextWaveAt = 0;
    this.waveEndsAt = 0;
    this.nextSpawnPulseAt = 0;
    this.wavePhase = "attesa";
    this.nextShotAt = 0;
    this.killsSinceLastChest = 0;
    this.nextChestKillThreshold = this.getNextChestKillThreshold();
    this.nextBuyableChestAt = 12000;
    this.invulnerableUntil = 0;
    this.isLevelingUp = false;
    this.isGameOver = false;
    this.stateText.setText("");

    const startPosition = getStartPosition(this.mapState);
    const shipItem = getShopItem(this.metaState.loadout.ships);
    const shipVisual = this.getShipVisual(shipItem);

    this.playerTrail = this.add
      .circle(
        startPosition.x,
        startPosition.y,
        shipVisual.trailRadius,
        shipVisual.trailColor,
        0.18,
      )
      .setDepth(25);
    this.player = this.add
      .triangle(
        startPosition.x,
        startPosition.y,
        shipVisual.points[0],
        shipVisual.points[1],
        shipVisual.points[2],
        shipVisual.points[3],
        shipVisual.points[4],
        shipVisual.points[5],
        shipVisual.color,
        1,
      )
      .setStrokeStyle(2, shipVisual.strokeColor, 0.92)
      .setDepth(30);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.renderMap();
    this.startWave(0);
    this.refreshHud();
  }

  private clearRunObjects() {
    this.enemies.forEach(destroyEnemy);
    this.bullets.forEach((bullet) => bullet.body.destroy());
    this.enemyProjectiles.forEach(destroyEnemyProjectile);
    this.pickups.forEach((pickup) => pickup.body.destroy());
    this.chests.forEach(destroyChest);
    this.turrets.forEach(destroyTurret);
    this.mines.forEach(destroyMine);
    this.barricades.forEach(destroyBarricade);
    this.drones.forEach(destroyDrone);
    this.enemies = [];
    this.bullets = [];
    this.enemyProjectiles = [];
    this.pickups = [];
    this.chests = [];
    this.turrets = [];
    this.mines = [];
    this.barricades = [];
    this.drones = [];
    this.upgradeOverlay?.destroy();
    this.upgradeOverlay = null;

    if (this.player) {
      this.player.destroy();
      this.player = null;
    }

    if (this.playerTrail) {
      this.playerTrail.destroy();
      this.playerTrail = null;
    }

    this.cameras.main.stopFollow();
  }

  private updatePlayer(dt: number) {
    if (!this.player || !this.playerTrail) {
      return;
    }

    const movement = new PhaserMath.Vector2(0, 0);

    if (this.cursors.left?.isDown || this.wasd.a.isDown) {
      movement.x -= 1;
    }

    if (this.cursors.right?.isDown || this.wasd.d.isDown) {
      movement.x += 1;
    }

    if (this.cursors.up?.isDown || this.wasd.w.isDown) {
      movement.y -= 1;
    }

    if (this.cursors.down?.isDown || this.wasd.s.isDown) {
      movement.y += 1;
    }

    if (movement.lengthSq() > 0) {
      const speedMultiplier = getSlowMultiplierAt(
        this.mapState,
        this.player.x,
        this.player.y,
      );

      movement.normalize().scale(this.stats.speed * speedMultiplier * dt);
      this.player.x += movement.x;
      this.player.y += movement.y;
      this.player.rotation = movement.angle() + Math.PI / 2;
    }

    resolveCircleHazardCollisions(
      this.player,
      PLAYER_RADIUS,
      getBlockingHazards(this.mapState),
    );
    clampInsideMap(this.player, PLAYER_RADIUS, this.mapState.sectors);

    const plasmaDamage = getPlasmaDamageAt(
      this.mapState,
      this.player.x,
      this.player.y,
    );

    if (plasmaDamage > 0 && this.time.now > this.invulnerableUntil) {
      this.takeDamage(plasmaDamage, this.time.now);
    }

    const currentSector = this.getCurrentMapSector();

    if (currentSector.id !== this.currentRenderedSectorId) {
      this.renderMap();
    }

    this.playerTrail.setPosition(this.player.x, this.player.y);
    this.playerTrail.setAlpha(
      this.invulnerableUntil > this.time.now ? 0.34 : 0.18,
    );
    this.player.setAlpha(this.invulnerableUntil > this.time.now ? 0.55 : 1);
  }

  private updateShooting(time: number) {
    if (!this.player || time < this.nextShotAt || this.enemies.length === 0) {
      return;
    }

    const player = this.player;
    const target = this.findNearestEnemy();

    if (!target) {
      return;
    }

    const direction = new PhaserMath.Vector2(
      target.body.x - player.x,
      target.body.y - player.y,
    ).normalize();
    const angles = this.getShotAngles(direction.angle());

    angles.forEach((angle) => {
      const velocity = new PhaserMath.Vector2(
        Math.cos(angle),
        Math.sin(angle),
      ).scale(this.stats.bulletSpeed);
      const bullet = this.add
        .circle(player.x, player.y, BULLET_RADIUS, 0xfef08a, 1)
        .setDepth(20);

      this.bullets.push({
        body: bullet,
        velocity,
        damage: this.stats.damage,
        distanceLeft: this.stats.bulletRange,
        radius: BULLET_RADIUS,
      });
    });

    createPulse(this, this.player.x, this.player.y, 12, 0xfacc15, 0.35);
    this.nextShotAt = time + this.stats.fireRate;
  }

  private updatePlaceableInput() {
    if (Input.Keyboard.JustDown(this.turretKey)) {
      this.tryPlaceTurret();
    }

    if (Input.Keyboard.JustDown(this.mineKey)) {
      this.tryPlaceMine();
    }

    if (Input.Keyboard.JustDown(this.barricadeKey)) {
      this.tryPlaceBarricade();
    }

    if (Input.Keyboard.JustDown(this.removePlaceableKey)) {
      this.tryRemoveNearestPlaceable();
    }
  }

  private updatePlaceables(time: number) {
    updateTurrets(
      this,
      this.turrets,
      this.enemies,
      time,
      (enemyIndex, damage) => this.damageEnemy(enemyIndex, damage),
    );
    updateMines(this, this.mines, this.enemies, (enemyIndex, damage) =>
      this.damageEnemy(enemyIndex, damage),
    );
    updatePlaceableEnemyPressure(
      this,
      this.enemies,
      this.turrets,
      this.mines,
      this.barricades,
      time,
    );
  }

  private updateDrones(time: number, dt: number) {
    if (!this.player) {
      return;
    }

    syncDroneCount(this, this.drones, this.player, this.runUpgrades);
    updateDrones(
      this,
      this.drones,
      this.player,
      this.enemies,
      time,
      dt,
      (enemyIndex, damage) => this.damageEnemy(enemyIndex, damage),
    );
  }

  private tryPlaceTurret() {
    if (!this.player) {
      return;
    }

    const maxTurrets = this.getMaxTurrets();
    const turretCost = getTurretCost();

    if (this.turrets.length >= maxTurrets) {
      this.showTemporaryState(`Limite torrette ${maxTurrets}/${maxTurrets}`);
      return;
    }

    if (this.coins < turretCost) {
      this.showTemporaryState(`Servono ${turretCost} risorse per una torretta`);
      return;
    }

    this.coins -= turretCost;
    this.turrets.push(
      createTurret(
        this,
        this.player.x,
        this.player.y,
        this.metaState.loadout.turrets,
        this.runUpgrades,
      ),
    );
    createPulse(this, this.player.x, this.player.y, 28, 0x38bdf8, 0.24);
    this.refreshHud();
  }

  private tryPlaceMine() {
    if (!this.player) {
      return;
    }

    const maxMines = this.getMaxMines();
    const mineCost = getMineCost(this.runUpgrades);

    if (this.mines.length >= maxMines) {
      this.showTemporaryState(`Limite mine ${maxMines}/${maxMines}`);
      return;
    }

    if (this.coins < mineCost) {
      this.showTemporaryState(`Servono ${mineCost} risorse per una mina`);
      return;
    }

    this.coins -= mineCost;
    this.mines.push(
      createMine(
        this,
        this.player!.x,
        this.player!.y,
        this.metaState.loadout.mines,
        this.runUpgrades,
      ),
    );
    createPulse(this, this.player.x, this.player.y, 22, 0xfacc15, 0.22);
    this.refreshHud();
  }

  private tryPlaceBarricade() {
    if (!this.player) {
      return;
    }

    if (!this.runUpgrades.barricadeUnlocked) {
      this.showTemporaryState("Serve un upgrade barricata");
      return;
    }

    if (this.barricades.length >= this.runUpgrades.maxBarricades) {
      this.showTemporaryState(
        `Limite barricate ${this.runUpgrades.maxBarricades}/${this.runUpgrades.maxBarricades}`,
      );
      return;
    }

    const cost = getBarricadeCost(this.runUpgrades);

    if (this.coins < cost) {
      this.showTemporaryState(`Servono ${cost} risorse per una barricata`);
      return;
    }

    this.coins -= cost;
    this.barricades.push(
      createBarricade(this, this.player.x, this.player.y, this.runUpgrades),
    );
    createPulse(this, this.player.x, this.player.y, 24, 0xcbd5e1, 0.22);
    this.refreshHud();
  }

  private tryRemoveNearestPlaceable() {
    if (!this.player) {
      return;
    }

    const removed = removeNearestPlaceable(
      this.player.x,
      this.player.y,
      this.turrets,
      this.mines,
      this.barricades,
    );

    this.showTemporaryState(
      removed ? "Piazzabile rimosso" : "Nessun piazzabile vicino",
    );
    this.refreshHud();
  }

  private getShotAngles(baseAngle: number) {
    if (this.stats.multiShot === 1) {
      return [baseAngle];
    }

    const step = 0.22;
    const offset = ((this.stats.multiShot - 1) * step) / 2;

    return Array.from(
      { length: this.stats.multiShot },
      (_, index) => baseAngle - offset + index * step,
    );
  }

  private updateBullets(dt: number) {
    for (
      let bulletIndex = this.bullets.length - 1;
      bulletIndex >= 0;
      bulletIndex -= 1
    ) {
      const bullet = this.bullets[bulletIndex];
      const movement = bullet.velocity.clone().scale(dt);

      bullet.body.x += movement.x;
      bullet.body.y += movement.y;
      bullet.distanceLeft -= movement.length();

      const enemyIndex = this.enemies.findIndex((enemy) =>
        circlesOverlap(bullet.body, bullet.radius, enemy.body, enemy.radius),
      );

      if (enemyIndex !== -1) {
        this.damageEnemy(enemyIndex, bullet.damage);
        this.removeBullet(bulletIndex);
        continue;
      }

      if (
        circleHitsHazard(
          bullet.body,
          bullet.radius,
          getBlockingHazards(this.mapState),
        )
      ) {
        this.removeBullet(bulletIndex);
        continue;
      }

      if (
        bullet.distanceLeft <= 0 ||
        !isInsideMap(bullet.body.x, bullet.body.y, 24, this.mapState.sectors)
      ) {
        this.removeBullet(bulletIndex);
      }
    }
  }

  private updateEnemies(dt: number, time: number) {
    if (!this.player) {
      return;
    }

    updateEnemySystem(
      this,
      this.enemies,
      this.enemyProjectiles,
      this.player,
      this.mapState,
      this.barricades,
      dt,
      time,
      this.invulnerableUntil,
      (damage, hitTime) => this.takeDamage(damage, hitTime),
    );
  }

  private updateEnemyProjectiles(dt: number, time: number) {
    if (!this.player) {
      return;
    }

    updateEnemyProjectiles(
      this,
      this.enemyProjectiles,
      this.player,
      this.mapState,
      this.barricades,
      dt,
      time,
      this.invulnerableUntil,
      (damage, hitTime) => this.takeDamage(damage, hitTime),
    );
  }

  private updatePickups(dt: number) {
    if (!this.player) {
      return;
    }

    for (let index = this.pickups.length - 1; index >= 0; index -= 1) {
      const pickup = this.pickups[index];
      const distance = PhaserMath.Distance.Between(
        this.player.x,
        this.player.y,
        pickup.body.x,
        pickup.body.y,
      );

      if (distance < this.stats.pickupRadius) {
        const pull = new PhaserMath.Vector2(
          this.player.x - pickup.body.x,
          this.player.y - pickup.body.y,
        );

        if (pull.lengthSq() > 0) {
          pull.normalize().scale(360 * dt);
          pickup.body.x += pull.x;
          pickup.body.y += pull.y;
        }
      }

      if (distance < PLAYER_RADIUS + pickup.radius) {
        this.collectPickup(index);
      }
    }
  }

  private updateWave(time: number) {
    if (this.waveEndsAt > 0 && time >= this.waveEndsAt) {
      this.finishWave(time);
      return;
    }

    if (this.waveEndsAt === 0 && time >= this.nextWaveAt) {
      this.startWave(time);
      return;
    }

    if (this.waveEndsAt > 0 && time >= this.nextSpawnPulseAt) {
      this.spawnWavePulse(time);
    }
  }

  private startWave(time: number) {
    this.wave += 1;
    this.waveEndsAt = time + WAVE_DURATION;

    const expanded = expandMapForWave(this.mapState, this.wave);

    if (expanded) {
      this.updateCameraBounds();
    }

    this.mapState.activeSpawnSectorIds = this.pickFarSpawnSectors().map(
      (sector) => sector.id,
    );
    this.nextSpawnPulseAt = time;
    this.wavePhase = "inizio";
    this.renderMap();
    this.spawnWavePulse(time);
  }

  private finishWave(time: number) {
    this.waveEndsAt = 0;
    this.nextWaveAt = time + WAVE_BREAK_DURATION;
    this.nextSpawnPulseAt = 0;
    this.wavePhase = "pausa";
    this.mapState.activeSpawnSectorIds = [];
    this.renderMap();
  }

  private spawnWavePulse(time: number) {
    const phase = this.getWavePhase(time);
    const spawnSectors = this.getActiveSpawnSectors();
    const pulseCount = Math.round(
      (phase.count + this.wave) *
        (spawnSectors.reduce((total, sector) => total + sector.risk, 0) /
          Math.max(1, spawnSectors.length)),
    );

    this.wavePhase = phase.label;

    for (let i = 0; i < pulseCount; i += 1) {
      const sector = spawnSectors[i % spawnSectors.length];
      const spawnPoint = this.getEnemySpawnPoint(sector, i);
      const enemyType = pickEnemyTypeForSpawn(this.wave, i, pulseCount);

      this.spawnEnemyAt(spawnPoint.x, spawnPoint.y, enemyType);
    }

    this.nextSpawnPulseAt = time + phase.interval;
  }

  private spawnEnemyAt(x: number, y: number, enemyType: Enemy["typeId"]) {
    this.enemies.push(
      createEnemy(this, x, y, enemyType, this.wave, this.mapState),
    );
  }

  private damageEnemy(enemyIndex: number, damage: number) {
    const enemy = this.enemies[enemyIndex];

    enemy.hp -= damage;
    enemy.body.setScale(1.18);
    this.tweens.add({
      targets: enemy.body,
      scale: 1,
      duration: 90,
    });

    if (enemy.hp <= 0) {
      const deathX = enemy.body.x;
      const deathY = enemy.body.y;

      this.dropPickup(enemy.body.x, enemy.body.y, "xp", enemy.xpValue);

      if (PhaserMath.Between(0, 100) < 48) {
        this.dropPickup(
          enemy.body.x + PhaserMath.Between(-8, 8),
          enemy.body.y + PhaserMath.Between(-8, 8),
          "coin",
          enemy.coinValue,
        );
      }

      if (PhaserMath.Between(0, 79) === 0) {
        this.dropPickup(
          enemy.body.x + PhaserMath.Between(-6, 6),
          enemy.body.y + PhaserMath.Between(-6, 6),
          "hp",
          1,
        );
      }

      createPulse(
        this,
        enemy.body.x,
        enemy.body.y,
        28,
        enemy.definition.color,
        0.32,
      );
      destroyEnemy(enemy);
      this.enemies.splice(enemyIndex, 1);
      this.registerEnemyKill(deathX, deathY);
    }
  }

  private registerEnemyKill(x: number, y: number) {
    this.killsSinceLastChest += 1;

    if (this.killsSinceLastChest < this.nextChestKillThreshold) {
      return;
    }

    this.killsSinceLastChest = 0;
    this.nextChestKillThreshold = this.getNextChestKillThreshold();
    this.spawnChest(x, y, "reward");
  }

  private dropPickup(
    x: number,
    y: number,
    kind: Pickup["kind"],
    value: number,
  ) {
    const color =
      kind === "xp" ? 0x22d3ee : kind === "hp" ? 0xf87171 : 0xfacc15;

    const pickup = this.add.circle(x, y, PICKUP_RADIUS, color, 1).setDepth(10);

    this.pickups.push({
      body: pickup,
      kind,
      value,
      radius: PICKUP_RADIUS,
    });
  }

  private collectPickup(index: number) {
    const pickup = this.pickups[index];

    if (pickup.kind === "xp") {
      this.xp += pickup.value;
      this.checkLevelUp();
    } else if (pickup.kind === "hp") {
      this.stats.hp = Math.min(this.stats.hp + pickup.value, this.stats.maxHp);
    } else {
      this.coins += pickup.value;
    }

    pickup.body.destroy();
    this.pickups.splice(index, 1);
    this.refreshHud();
  }

  private checkLevelUp() {
    if (this.xp < this.xpToNext) {
      return;
    }

    this.xp -= this.xpToNext;
    this.level += 1;
    this.xpToNext = Math.floor(this.xpToNext * 1.45 + 3);
    this.showUpgradeChoices();
  }

  private showUpgradeChoices() {
    this.isLevelingUp = true;

    const backdrop = this.add
      .rectangle(
        SCREEN_CENTER_X,
        SCREEN_CENTER_Y,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x020617,
        0.72,
      )
      .setDepth(300);
    const title = this.add
      .text(SCREEN_CENTER_X, 174, "LEVEL UP", {
        fontFamily: "Arial Black",
        fontSize: 44,
        color: "#ffffff",
        stroke: "#0f172a",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(301);
    const choices = Utils.Array.Shuffle(
      getAvailableUpgrades(this.xpUpgradePool, this.runUpgrades),
    ).slice(0, 3);
    const cardObjects: Phaser.GameObjects.GameObject[] = [backdrop, title];

    choices.forEach((upgrade, index) => {
      const x = 246 + index * 266;
      const background = this.add
        .rectangle(x, 400, 230, 170, 0x172554, 0.94)
        .setStrokeStyle(2, 0x38bdf8, 0.9)
        .setInteractive({ useHandCursor: true })
        .setDepth(301);
      const cardTitle = this.add
        .text(x, 350, upgrade.title, {
          fontFamily: "Arial Black",
          fontSize: 20,
          color: "#f8fafc",
          align: "center",
          wordWrap: { width: 194 },
        })
        .setOrigin(0.5)
        .setDepth(302);
      const description = this.add
        .text(x, 420, upgrade.description, {
          fontFamily: "Arial",
          fontSize: 17,
          color: "#bae6fd",
          align: "center",
          wordWrap: { width: 190 },
        })
        .setOrigin(0.5)
        .setDepth(302);

      background.on("pointerdown", () => {
        this.applyUpgrade(upgrade);
        this.closeUpgradeOverlay();
      });

      cardObjects.push(background, cardTitle, description);
    });

    this.pinToScreen(cardObjects);
    this.upgradeOverlay = this.add.container(0, 0, cardObjects).setDepth(300);
    this.refreshHud();
  }

  private updateChests(time: number) {
    if (!this.player) {
      return;
    }

    this.spawnBuyableChestIfNeeded(time);
    updateChests(
      this,
      this.chests,
      this.player,
      this.coins,
      (chest, index) => this.openChest(chest, index),
      (cost) => this.showTemporaryState(`Chest: servono ${cost} risorse`),
    );
    this.renderMap();
  }

  private spawnBuyableChestIfNeeded(time: number) {
    if (
      time < this.nextBuyableChestAt ||
      this.chests.filter((chest) => chest.kind === "shop").length >=
        MAX_BUYABLE_CHESTS
    ) {
      return;
    }

    const sector = this.pickChestSector();
    const spawnPoint = getChestSpawnPoint(
      sector,
      this.chests.length + this.wave,
    );

    this.spawnChest(spawnPoint.x, spawnPoint.y, "shop");
    this.renderMap();
    this.nextBuyableChestAt = time + BUYABLE_CHEST_INTERVAL;
  }

  private spawnChest(x: number, y: number, kind: Chest["kind"]) {
    const cost =
      kind === "shop" ? CHEST_COST + Math.max(0, this.wave - 1) * 2 : 0;
    const chest = createChest(this, x, y, kind, cost);

    clampInsideMap(chest.body, chest.radius, this.mapState.sectors);
    chest.label.setPosition(chest.body.x, chest.body.y - 28);
    this.chests.push(chest);
    createPulse(
      this,
      chest.body.x,
      chest.body.y,
      30,
      kind === "shop" ? 0xfacc15 : 0x22c55e,
      0.2,
    );
  }

  private openChest(chest: Chest, index: number) {
    if (chest.opened) {
      return;
    }

    chest.opened = true;
    this.coins -= chest.cost;
    const upgrade = this.pickChestUpgrade();

    if (upgrade) {
      this.applyUpgrade(upgrade);
      this.showTemporaryState(`Chest: ${upgrade.title}`);
    } else {
      this.coins += 8;
      this.showTemporaryState("Chest: +8 risorse");
    }

    destroyChest(chest);
    this.chests.splice(index, 1);
    this.refreshHud();
  }

  private pickChestUpgrade() {
    const available = getAvailableUpgrades(
      this.chestUpgradePool,
      this.runUpgrades,
    );

    return Utils.Array.GetRandom(available);
  }

  private applyUpgrade(upgrade: Upgrade) {
    upgrade.apply({
      stats: this.stats,
      runUpgrades: this.runUpgrades,
    });
    this.runUpgrades.stacks[upgrade.id] =
      getUpgradeStacks(this.runUpgrades, upgrade) + 1;

    if (this.player) {
      syncDroneCount(this, this.drones, this.player, this.runUpgrades);
    }
  }

  private closeUpgradeOverlay() {
    this.upgradeOverlay?.destroy();
    this.upgradeOverlay = null;
    this.isLevelingUp = false;
    this.refreshHud();
  }

  private takeDamage(damage: number, time: number) {
    this.stats.hp -= damage;
    this.invulnerableUntil = time + PLAYER_HIT_COOLDOWN;
    this.cameras.main.shake(90, 0.006);

    if (this.stats.hp <= 0) {
      this.endRun();
    }

    this.refreshHud();
  }

  private endRun() {
    this.screenMode = "gameOver";
    this.isGameOver = true;
    this.stats.hp = 0;
    this.stateText.setText("");
    this.player?.setFillStyle(0x64748b, 0.8);
    this.playerTrail?.setVisible(false);
    this.showGameOverOverlay();
  }

  private refreshHud() {
    const currentSector = this.getCurrentMapSector();

    updateHud(this.hudText, {
      hp: this.stats.hp,
      maxHp: this.stats.maxHp,
      xp: this.xp,
      xpToNext: this.xpToNext,
      level: this.level,
      coins: this.coins,
      wave: this.wave,
      wavePhase: this.wavePhase,
      enemyCount: this.enemies.length,
      sectorName: currentSector.name,
      sectorSize: currentSector.size,
      discoveredSectors: this.mapState.sectors.length,
      turretCount: this.turrets.length,
      maxTurrets: this.getMaxTurrets(),
      mineCount: this.mines.length,
      maxMines: this.getMaxMines(),
      barricadeCount: this.barricades.length,
      maxBarricades: this.runUpgrades.maxBarricades,
      droneCount: this.drones.length,
      chestCount: this.chests.length,
    });
  }

  private showTemporaryState(message: string) {
    this.stateText.setText(message);
    this.time.delayedCall(950, () => {
      if (!this.isGameOver && this.stateText.text === message) {
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
    this.isGameOver = false;
    this.isLevelingUp = false;
    this.hudText.setText("");
    this.stateText.setText("");

    const backdrop = this.add
      .rectangle(
        SCREEN_CENTER_X,
        SCREEN_CENTER_Y,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x020617,
        0.92,
      )
      .setDepth(310);
    const title = this.add
      .text(SCREEN_CENTER_X, 190, "SPACE WAR", {
        fontFamily: "Arial Black",
        fontSize: 54,
        color: "#f8fafc",
        stroke: "#0f172a",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(311);
    const feedbackText = this.add
      .text(SCREEN_CENTER_X, 588, feedback, {
        fontFamily: "Arial",
        fontSize: 16,
        color: "#94a3b8",
      })
      .setOrigin(0.5)
      .setDepth(311);
    const objects: Phaser.GameObjects.GameObject[] = [
      backdrop,
      title,
      feedbackText,
    ];

    objects.push(
      ...this.createMenuButton(512, 330, "PLAY", () => this.startRun()),
      ...this.createMenuButton(512, 404, "SHOP", () => this.showShopOverlay()),
      ...this.createMenuButton(512, 478, "EXIT", () =>
        this.showMainMenu("Nel browser Exit torna al menu principale."),
      ),
    );

    this.pinToScreen(objects);
    this.screenOverlay = this.add.container(0, 0, objects).setDepth(310);
  }

  private showGameOverOverlay() {
    this.clearScreenOverlay();

    const panel = this.add
      .rectangle(SCREEN_CENTER_X, 430, 620, 270, 0x020617, 0.9)
      .setStrokeStyle(2, 0x38bdf8, 0.55)
      .setDepth(310);
    const title = this.add
      .text(SCREEN_CENTER_X, 320, "RUN TERMINATA", {
        fontFamily: "Arial Black",
        fontSize: 34,
        color: "#f8fafc",
        stroke: "#0f172a",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(311);
    const summary = this.add
      .text(SCREEN_CENTER_X, 368, `Risorse run rimaste: ${this.coins}`, {
        fontFamily: "Arial",
        fontSize: 18,
        color: "#fde68a",
      })
      .setOrigin(0.5)
      .setDepth(311);
    const objects: Phaser.GameObjects.GameObject[] = [panel, title, summary];

    objects.push(
      ...this.createMenuButton(316, 470, "RESTART", () => this.startRun(), 160),
      ...this.createMenuButton(
        512,
        470,
        "SHOP",
        () => this.showShopOverlay(),
        160,
      ),
      ...this.createMenuButton(
        708,
        470,
        "MENU",
        () => this.showMainMenu(),
        160,
      ),
    );

    this.pinToScreen(objects);
    this.screenOverlay = this.add.container(0, 0, objects).setDepth(310);
  }

  private showShopOverlay() {
    this.clearRunObjects();
    this.clearScreenOverlay();
    this.screenMode = "shop";
    this.hudText.setText("");
    this.stateText.setText("");

    const backdrop = this.add
      .rectangle(
        SCREEN_CENTER_X,
        SCREEN_CENTER_Y,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x020617,
        0.94,
      )
      .setDepth(310);
    const title = this.add
      .text(SCREEN_CENTER_X, 58, "SHOP / HANGAR", {
        fontFamily: "Arial Black",
        fontSize: 34,
        color: "#f8fafc",
        stroke: "#0f172a",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(311);
    const wallet = this.add
      .text(
        SCREEN_CENTER_X,
        102,
        "Hangar libero: scegli il loadout, nessun acquisto richiesto",
        {
          fontFamily: "Arial",
          fontSize: 18,
          color: "#bae6fd",
        },
      )
      .setOrigin(0.5)
      .setDepth(311);
    const objects: Phaser.GameObjects.GameObject[] = [backdrop, title, wallet];

    SHOP_CATEGORIES.forEach((category, index) => {
      const x = 132 + index * 172;
      const selected = category.id === this.selectedShopCategory;

      objects.push(
        ...this.createMenuButton(
          x,
          150,
          category.label.toUpperCase(),
          () => {
            this.selectedShopCategory = category.id;
            this.showShopOverlay();
          },
          150,
          selected ? 0x0f766e : 0x172554,
        ),
        ...this.createShopCategoryIcon(
          category.id,
          x - 56,
          150,
          selected ? 0xccfbf1 : 0x7dd3fc,
        ),
      );
    });

    SHOP_ITEMS.filter(
      (item) => item.category === this.selectedShopCategory,
    ).forEach((item, index) => {
      const col = index % 2;
      const rowIndex = Math.floor(index / 2);
      const x = 330 + col * 368;
      const y = 264 + rowIndex * 184;
      const equipped = this.metaState.loadout[item.category] === item.id;
      const status = equipped ? "EQUIP" : "SELEZIONA";
      const card = this.add
        .rectangle(x, y, 326, 156, 0x0f172a, 0.9)
        .setStrokeStyle(
          2,
          equipped ? item.accentColor : 0x334155,
          equipped ? 0.95 : 0.86,
        )
        .setInteractive({ useHandCursor: true })
        .setDepth(311);
      const title = this.add
        .text(x - 88, y - 54, item.title, {
          fontFamily: "Arial Black",
          fontSize: 17,
          color: "#f8fafc",
          wordWrap: { width: 190 },
        })
        .setDepth(312);
      const statusBadge = this.add
        .rectangle(
          x + 96,
          y - 52,
          104,
          28,
          equipped ? item.accentColor : 0x1e293b,
          0.96,
        )
        .setStrokeStyle(1, item.accentColor, 0.75)
        .setDepth(312);
      const statusText = this.add
        .text(x + 96, y - 52, status, {
          fontFamily: "Arial Black",
          fontSize: status.length > 8 ? 10 : 12,
          color: "#f8fafc",
        })
        .setOrigin(0.5)
        .setDepth(313);
      const description = this.add
        .text(x - 88, y - 20, item.description, {
          fontFamily: "Arial",
          fontSize: 13,
          color: "#bae6fd",
          wordWrap: { width: 216 },
        })
        .setDepth(312);
      const statLine = this.add
        .text(x - 88, y + 42, item.statLine, {
          fontFamily: "Arial Black",
          fontSize: 12,
          color: "#fde68a",
          wordWrap: { width: 216 },
        })
        .setDepth(312);
      const costText = this.add
        .text(x + 78, y + 46, "clicca per equip", {
          fontFamily: "Arial",
          fontSize: 12,
          color: "#ccfbf1",
        })
        .setDepth(312);
      const preview = this.createShopItemPreview(item, x - 126, y + 8);

      card.on("pointerdown", () => {
        this.handleShopItemClick(item.id);
      });

      objects.push(
        card,
        ...preview,
        title,
        statusBadge,
        statusText,
        description,
        statLine,
        costText,
      );
    });

    objects.push(
      ...this.createMenuButton(
        408,
        704,
        "MENU",
        () => this.showMainMenu(),
        180,
      ),
      ...this.createMenuButton(616, 704, "PLAY", () => this.startRun(), 180),
    );

    this.pinToScreen(objects);
    this.screenOverlay = this.add.container(0, 0, objects).setDepth(310);
  }

  private createShopCategoryIcon(
    category: ShopCategory,
    x: number,
    y: number,
    color: number,
  ) {
    const graphics = this.add.graphics().setDepth(313);

    graphics.lineStyle(2, color, 0.95);
    graphics.fillStyle(color, 0.9);

    if (category === "ships") {
      graphics.fillTriangle(x, y - 10, x + 8, y + 9, x - 8, y + 9);
      graphics.strokeTriangle(x, y - 10, x + 8, y + 9, x - 8, y + 9);
    } else if (category === "weapons") {
      graphics.beginPath();
      graphics.moveTo(x - 9, y + 7);
      graphics.lineTo(x + 10, y - 6);
      graphics.strokePath();
      graphics.fillCircle(x + 11, y - 7, 3);
    } else if (category === "boosters") {
      graphics.fillRect(x - 7, y - 8, 14, 13);
      graphics.fillTriangle(x - 6, y + 5, x, y + 14, x + 6, y + 5);
    } else if (category === "turrets") {
      graphics.strokeCircle(x, y, 11);
      graphics.fillRect(x - 7, y - 7, 14, 14);
      graphics.fillRect(x - 3, y - 16, 6, 10);
    } else {
      graphics.fillCircle(x, y, 8);
      graphics.strokeCircle(x, y, 14);
    }

    return [graphics];
  }

  private createShopItemPreview(item: ShopItem, x: number, y: number) {
    const graphics = this.add.graphics().setDepth(312);
    const accent = item.accentColor;

    graphics.fillStyle(0x020617, 0.64);
    graphics.fillCircle(x, y, 42);
    graphics.lineStyle(2, accent, 0.78);
    graphics.strokeCircle(x, y, 42);
    graphics.lineStyle(2, 0xe0f2fe, 0.88);
    graphics.fillStyle(accent, 0.96);

    if (item.iconKind === "shipStandard") {
      graphics.fillTriangle(x, y - 28, x + 19, y + 22, x - 19, y + 22);
      graphics.strokeTriangle(x, y - 28, x + 19, y + 22, x - 19, y + 22);
    } else if (item.iconKind === "shipTank") {
      graphics.fillTriangle(x, y - 24, x + 28, y + 20, x - 28, y + 20);
      graphics.fillStyle(0x0f766e, 0.95);
      graphics.fillRect(x - 18, y + 2, 36, 20);
      graphics.strokeTriangle(x, y - 24, x + 28, y + 20, x - 28, y + 20);
    } else if (item.iconKind === "shipLight") {
      graphics.fillTriangle(x, y - 31, x + 13, y + 24, x - 13, y + 24);
      graphics.strokeTriangle(x, y - 31, x + 13, y + 24, x - 13, y + 24);
    } else if (item.iconKind.startsWith("weapon")) {
      const isRapid = item.iconKind === "weaponRapid";
      const isHeavy = item.iconKind === "weaponHeavy";
      graphics.lineStyle(isHeavy ? 8 : 5, accent, 0.95);
      graphics.beginPath();
      graphics.moveTo(x - 26, y + 16);
      graphics.lineTo(x + 24, y - 12);
      graphics.strokePath();
      graphics.fillStyle(accent, 0.98);
      graphics.fillCircle(x + 27, y - 14, isHeavy ? 8 : 5);

      if (isRapid) {
        graphics.fillCircle(x + 12, y - 6, 4);
        graphics.fillCircle(x + 39, y - 21, 4);
      }
    } else if (item.iconKind.startsWith("booster")) {
      graphics.fillStyle(accent, 0.95);

      if (item.iconKind === "boosterNone") {
        graphics.lineStyle(3, 0x94a3b8, 0.95);
        graphics.strokeCircle(x, y, 18);
        graphics.beginPath();
        graphics.moveTo(x - 14, y + 14);
        graphics.lineTo(x + 14, y - 14);
        graphics.strokePath();
      } else {
        graphics.fillRoundedRect(x - 22, y - 18, 44, 36, 6);
        graphics.fillStyle(
          0xfef08a,
          item.iconKind === "boosterSpeed" ? 0.95 : 0.55,
        );
        graphics.fillTriangle(x - 12, y + 18, x, y + 36, x + 12, y + 18);

        if (item.iconKind === "boosterMagnet") {
          graphics.lineStyle(3, accent, 0.92);
          graphics.strokeCircle(x, y, 28);
        }
      }
    } else if (item.iconKind.startsWith("turret")) {
      const isLongRange = item.iconKind === "turretLongRange";
      graphics.lineStyle(2, accent, isLongRange ? 0.48 : 0.26);
      graphics.strokeCircle(x, y, isLongRange ? 34 : 25);
      graphics.fillStyle(accent, 0.95);
      graphics.fillRect(x - 13, y - 13, 26, 26);
      graphics.fillStyle(0xe0f2fe, 0.95);
      graphics.fillRect(x - 4, y - 29, 8, 22);
    } else {
      const isBlast = item.iconKind === "mineBlast";
      graphics.fillStyle(accent, 0.96);
      graphics.fillCircle(x, y, isBlast ? 17 : 14);
      graphics.lineStyle(2, 0xfef3c7, 0.92);
      graphics.strokeCircle(x, y, isBlast ? 29 : 22);
      graphics.beginPath();
      graphics.moveTo(x, y - 32);
      graphics.lineTo(x, y - 22);
      graphics.moveTo(x + 28, y);
      graphics.lineTo(x + 18, y);
      graphics.moveTo(x, y + 32);
      graphics.lineTo(x, y + 22);
      graphics.moveTo(x - 28, y);
      graphics.lineTo(x - 18, y);
      graphics.strokePath();
    }

    return [graphics];
  }

  private getShipVisual(item: ShopItem | undefined) {
    const iconKind = item?.iconKind ?? "shipStandard";

    if (iconKind === "shipTank") {
      return {
        points: [0, -22, 24, 21, -24, 21] as const,
        color: item?.accentColor ?? 0x2dd4bf,
        strokeColor: 0xccfbf1,
        trailColor: 0x2dd4bf,
        trailRadius: PLAYER_RADIUS + 12,
      };
    }

    if (iconKind === "shipLight") {
      return {
        points: [0, -27, 14, 22, -14, 22] as const,
        color: item?.accentColor ?? 0xfacc15,
        strokeColor: 0xfef9c3,
        trailColor: 0xfacc15,
        trailRadius: PLAYER_RADIUS + 7,
      };
    }

    return {
      points: [0, -24, 18, 20, -18, 20] as const,
      color: item?.accentColor ?? 0x93c5fd,
      strokeColor: 0xe0f2fe,
      trailColor: 0x38bdf8,
      trailRadius: PLAYER_RADIUS + 9,
    };
  }

  private handleShopItemClick(itemId: ShopItemId) {
    equipShopItem(this.metaState, itemId);
    this.showShopOverlay();
  }

  private createMenuButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    width = 240,
    color = 0x172554,
  ) {
    const button = this.add
      .rectangle(x, y, width, 48, color, 0.94)
      .setStrokeStyle(2, 0x38bdf8, 0.72)
      .setInteractive({ useHandCursor: true })
      .setDepth(311);
    const text = this.add
      .text(x, y, label, {
        fontFamily: "Arial Black",
        fontSize: 18,
        color: "#f8fafc",
      })
      .setOrigin(0.5)
      .setDepth(312);

    button.on("pointerdown", onClick);

    return [button, text];
  }

  private clearScreenOverlay() {
    this.screenOverlay?.destroy();
    this.screenOverlay = null;
  }

  private pinToScreen(objects: Phaser.GameObjects.GameObject[]) {
    objects.forEach((object) => {
      if ("setScrollFactor" in object) {
        (
          object as Phaser.GameObjects.GameObject & {
            setScrollFactor: (
              x: number,
              y?: number,
            ) => Phaser.GameObjects.GameObject;
          }
        ).setScrollFactor(0);
      }
    });
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

    this.cameras.main.setBounds(
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
    );
  }

  private renderMap() {
    const currentSector = this.getCurrentMapSector();

    this.currentRenderedSectorId = currentSector.id;
    renderMapArena(this.mapRenderer, this.mapState, currentSector, this.chests);
  }

  private pickFarSpawnSectors() {
    if (!this.player) {
      return [this.mapState.sectors[0]];
    }

    const desiredCount = this.wave >= 6 ? 3 : this.wave >= 3 ? 2 : 1;

    return [...this.mapState.sectors]
      .sort((a, b) => {
        const aCenter = getSectorCenter(a);
        const bCenter = getSectorCenter(b);
        const aDistance = PhaserMath.Distance.Squared(
          this.player!.x,
          this.player!.y,
          aCenter.x,
          aCenter.y,
        );
        const bDistance = PhaserMath.Distance.Squared(
          this.player!.x,
          this.player!.y,
          bCenter.x,
          bCenter.y,
        );

        return bDistance - aDistance;
      })
      .slice(0, Math.min(desiredCount, this.mapState.sectors.length));
  }

  private pickChestSector() {
    if (!this.player) {
      return this.mapState.sectors[0];
    }

    return (
      [...this.mapState.sectors].sort((a, b) => {
        const aCenter = getSectorCenter(a);
        const bCenter = getSectorCenter(b);

        return (
          PhaserMath.Distance.Squared(
            this.player!.x,
            this.player!.y,
            bCenter.x,
            bCenter.y,
          ) -
          PhaserMath.Distance.Squared(
            this.player!.x,
            this.player!.y,
            aCenter.x,
            aCenter.y,
          )
        );
      })[0] ?? this.mapState.sectors[0]
    );
  }

  private getMaxTurrets() {
    return MAX_TURRETS + this.runUpgrades.maxTurretBonus;
  }

  private getMaxMines() {
    return MAX_MINES + this.runUpgrades.maxMineBonus;
  }

  private getNextChestKillThreshold() {
    return CHEST_KILL_THRESHOLD + PhaserMath.Between(-8, 12);
  }

  private getActiveSpawnSectors() {
    const sectors = this.mapState.activeSpawnSectorIds
      .map((sectorId) =>
        this.mapState.sectors.find((sector) => sector.id === sectorId),
      )
      .filter((sector): sector is MapSector => Boolean(sector));

    return sectors.length > 0 ? sectors : [this.getCurrentMapSector()];
  }

  private getWavePhase(time: number) {
    const elapsed = Math.max(0, time - (this.waveEndsAt - WAVE_DURATION));
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
  }

  private getEnemySpawnPoint(currentSector: MapSector, index: number) {
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
  }

  private findNearestEnemy() {
    if (!this.player) {
      return null;
    }

    let nearest: Enemy | null = null;
    let nearestDistance = Number.MAX_VALUE;

    for (const enemy of this.enemies) {
      const distance = PhaserMath.Distance.Squared(
        this.player.x,
        this.player.y,
        enemy.body.x,
        enemy.body.y,
      );

      if (distance < nearestDistance) {
        nearest = enemy;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  private removeBullet(index: number) {
    this.bullets[index].body.destroy();
    this.bullets.splice(index, 1);
  }
}
