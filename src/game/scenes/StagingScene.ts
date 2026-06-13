import { Input, Math as PhaserMath } from "phaser";
import { ENEMY_DEFINITIONS } from "../data/enemies";
import { getSpecialDropById } from "../data/specialDrops";
import {
  CHEST_ITEMS,
  RARITY_MULTIPLIERS,
  TOMES,
} from "../data/upgrades";
import { spawnChest } from "../systems/chestController";
import { destroyChest } from "../systems/chests";
import { destroyEnemy, destroyEnemyProjectile } from "../systems/enemies";
import {
  expandMapForWave,
  getSectorCenter,
} from "../systems/mapSectors";
import { destroyPlaceableControllerState } from "../systems/placeableController";
import { dropPickup } from "../systems/pickupSystem";
import {
  createInitialRunState,
  destroyRunEntities,
} from "../systems/runState";
import {
  createStagingOverlay,
  type StagingOverlay,
} from "../systems/stagingOverlay";
import { addXpAndCheckLevelUp } from "../systems/upgradeSystem";
import type {
  EnemyTypeId,
  Rarity,
} from "../types/gameplay";
import {
  GameplayScene,
  type GameplaySceneData,
} from "./GameplayScene";

type StagingPreset = "clean" | "early" | "mid" | "boss" | "stress";

export class StagingScene extends GameplayScene {
  private stagingOverlay: StagingOverlay | null = null;
  private panelKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super("Staging");
    this.policy = {
      automaticWaves: false,
      persistPostRunRewards: false,
      invulnerable: true,
    };
  }

  protected override bootMode(data: GameplaySceneData) {
    this.runSeed = data.seed;
    this.startRun();
    this.run.wave = 0;
    this.run.wavePhase = "staging";
    this.run.nextBuyableChestAt = Number.POSITIVE_INFINITY;
    this.panelKey = this.input.keyboard!.addKey(192);
    this.createStagingPanel();
    this.events.once("shutdown", () => this.destroyStagingUi());
    this.refreshStagingPanel();
  }

  override update(time: number, delta: number) {
    super.update(time, delta);

    if (Input.Keyboard.JustDown(this.panelKey)) {
      this.stagingOverlay?.toggle();
    }

    this.refreshStagingPanel();
  }

  private createStagingPanel() {
    const parent = this.game.canvas.parentElement ?? document.body;
    this.stagingOverlay = createStagingOverlay(
      parent,
      TOMES,
      CHEST_ITEMS,
      Object.keys(ENEMY_DEFINITIONS) as EnemyTypeId[],
      {
        reset: () => this.scene.restart({ seed: this.mapState.seed }),
        menu: () => this.scene.start("Game"),
        clearAll: () => this.resetStagingRun(),
        toggleGodMode: () => {
          this.policy.invulnerable = !this.policy.invulnerable;
        },
        heal: () => {
          this.run.stats.hp = this.run.stats.maxHp;
          this.refreshHud();
        },
        damage: () => this.takeDamage(1, this.time.now),
        setMaxHp: (value) => {
          this.run.stats.maxHp = Math.max(1, value);
          this.run.stats.hp = this.run.stats.maxHp;
          this.refreshHud();
        },
        addCoins: (value) => {
          this.run.coins = Math.max(0, this.run.coins + Math.round(value));
          this.refreshHud();
        },
        addXp: (value) => {
          if (addXpAndCheckLevelUp(this.run, Math.max(1, value))) {
            this.showUpgradeChoices();
          }
          this.refreshHud();
        },
        toggleAutomaticWaves: () => {
          this.policy.automaticWaves = !this.policy.automaticWaves;

          if (this.policy.automaticWaves) {
            this.startStagingWave();
          }
        },
        setWave: (value) => {
          this.run.wave = Math.max(0, Math.round(value));
          this.run.waveEndsAt = 0;
          this.run.nextWaveAt = Number.POSITIVE_INFINITY;
          this.run.wavePhase = "staging";
          this.refreshHud();
        },
        startWave: () => this.startStagingWave(),
        spawnEnemy: (type, count) => this.spawnEnemies(type, count),
        clear: (kind) => this.clearEntities(kind),
        applyTome: (id, rarity) => this.applyStagingTome(id, rarity),
        applyItem: (id, rarity) => this.applyStagingItem(id, rarity),
        spawnChest: (kind) => this.spawnStagingChest(kind),
        activateEffect: (id) => this.activateStagingEffect(id),
        regenerateMap: (seed) =>
          this.scene.restart({ seed: Math.max(1, Math.round(seed)) }),
        revealMap: () => this.revealEntireMap(),
        teleport: (sectorId) => this.teleportToSector(sectorId),
        applyPreset: (preset) => this.applyPreset(preset),
      },
    );
  }

  private refreshStagingPanel() {
    this.stagingOverlay?.refresh({
      godMode: this.policy.invulnerable,
      automaticWaves: this.policy.automaticWaves,
      hp: this.run.stats.hp,
      maxHp: this.run.stats.maxHp,
      coins: this.run.coins,
      xp: this.run.xp,
      xpToNext: this.run.xpToNext,
      wave: this.run.wave,
      enemies: this.run.enemies.length,
      sectors: this.mapState.sectors.map((sector) => ({
        id: sector.id,
        name: sector.name,
      })),
      seed: this.mapState.seed,
    });
  }

  private resetStagingRun() {
    destroyRunEntities(this.run);
    destroyPlaceableControllerState(this.placeableState);
    this.run = createInitialRunState();
    this.run.wave = 0;
    this.run.wavePhase = "staging";
    this.run.nextBuyableChestAt = Number.POSITIVE_INFINITY;
    this.refreshHud();
    this.renderMap();
  }

  private startStagingWave() {
    this.run.waveEndsAt = 0;
    this.run.nextWaveAt = 0;
    this.updateWave(this.time.now, true);
    this.refreshHud();
  }

  private spawnEnemies(type: EnemyTypeId, requestedCount: number) {
    if (!this.player || !ENEMY_DEFINITIONS[type]) {
      return;
    }

    const count = PhaserMath.Clamp(Math.round(requestedCount), 1, 200);

    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const ring = 180 + (index % 4) * 42;
      this.spawnEnemyAt(
        this.player.x + Math.cos(angle) * ring,
        this.player.y + Math.sin(angle) * ring,
        type,
      );
    }

    this.refreshHud();
  }

  private clearEntities(
    kind: "enemies" | "projectiles" | "pickups" | "chests",
  ) {
    if (kind === "enemies") {
      this.run.enemies.forEach(destroyEnemy);
      this.run.enemies = [];
    } else if (kind === "projectiles") {
      this.run.enemyProjectiles.forEach(destroyEnemyProjectile);
      this.run.enemyProjectiles = [];
      this.run.bullets.forEach((bullet) => bullet.body.destroy());
      this.run.bullets = [];
    } else if (kind === "pickups") {
      this.run.pickups.forEach((pickup) => pickup.body.destroy());
      this.run.pickups = [];
    } else {
      this.run.chests.forEach(destroyChest);
      this.run.chests = [];
      this.renderMap();
    }

    this.refreshHud();
  }

  private applyStagingTome(id: string, rarity: Rarity) {
    const tome = TOMES.find((entry) => entry.id === id);

    if (!tome) {
      return;
    }

    const multiplier = RARITY_MULTIPLIERS[rarity];
    this.applyTome({
      tome,
      rarity,
      rarityMultiplier: multiplier,
      scaledIncrement: tome.baseIncrement * multiplier,
    });
    this.refreshHud();
  }

  private applyStagingItem(id: string, rarity: Rarity) {
    const item = CHEST_ITEMS.find((entry) => entry.id === id);

    if (!item) {
      return;
    }

    this.applyChestReward({
      item,
      rarity,
      rarityMultiplier: RARITY_MULTIPLIERS[rarity],
    });
    this.refreshHud();
  }

  private spawnStagingChest(kind: "reward" | "shop") {
    if (!this.player) {
      return;
    }

    if (kind === "shop") {
      this.run.coins = Math.max(this.run.coins, 100);
    }

    spawnChest({
      scene: this,
      run: this.run,
      mapState: this.mapState,
      x: this.player.x + 120,
      y: this.player.y,
      kind,
    });
    this.renderMap();
    this.refreshHud();
  }

  private activateStagingEffect(
    id: "magnet-overload" | "venom-rounds",
  ) {
    const effect = getSpecialDropById(id);

    if (!effect) {
      return;
    }

    if (id === "magnet-overload") {
      this.run.temporaryEffects.magnetOverloadUntil =
        this.time.now + effect.durationMs;
    } else {
      this.run.temporaryEffects.venomRoundsUntil =
        this.time.now + effect.durationMs;
    }

    this.refreshHud();
  }

  private revealEntireMap() {
    for (let wave = 2; wave <= 100; wave += 2) {
      expandMapForWave(this.mapState, wave);
    }

    this.updateCameraBounds();
    this.renderMap();
    this.refreshHud();
  }

  private teleportToSector(sectorId: string) {
    if (!this.player) {
      return;
    }

    const sector = this.mapState.sectors.find((entry) => entry.id === sectorId);

    if (!sector) {
      return;
    }

    const center = getSectorCenter(sector);
    this.player.setPosition(center.x, center.y);
    this.playerTrail?.setPosition(center.x, center.y);
    this.renderMap();
  }

  private applyPreset(preset: StagingPreset) {
    this.resetStagingRun();

    if (preset === "clean") {
      return;
    }

    if (preset === "early") {
      this.run.coins = 30;
      this.spawnEnemies("chaser", 5);
      this.spawnEnemies("swarm", 4);
      this.dropStagingResources();
    } else if (preset === "mid") {
      this.run.wave = 5;
      this.run.coins = 120;
      this.applyStagingTome("power", "rare");
      this.applyStagingTome("engineering", "uncommon");
      this.applyStagingItem("sentinel-beacon", "rare");
      this.applyStagingItem("turret-optics", "uncommon");
      this.spawnEnemies("shooter", 6);
      this.spawnEnemies("brute", 4);
      this.revealEntireMap();
    } else if (preset === "boss") {
      this.run.wave = 8;
      this.spawnEnemies("bossDreadnought", 1);
      this.spawnEnemies("chaser", 8);
    } else {
      this.run.wave = 12;
      this.run.coins = 999;
      this.applyStagingTome("power", "legendary");
      this.applyStagingTome("cadence", "legendary");
      this.applyStagingItem("splitter-camera", "legendary");
      this.applyStagingItem("drone-arsenal", "legendary");
      this.spawnEnemies("swarm", 50);
      this.spawnEnemies("shooter", 20);
      this.spawnEnemies("bossDreadnought", 2);
      this.revealEntireMap();
    }

    this.refreshHud();
  }

  private dropStagingResources() {
    if (!this.player) {
      return;
    }

    dropPickup(
      this,
      this.run.pickups,
      this.player.x + 80,
      this.player.y,
      "xp",
      8,
    );
    dropPickup(
      this,
      this.run.pickups,
      this.player.x - 80,
      this.player.y,
      "coin",
      12,
    );
  }

  private destroyStagingUi() {
    this.stagingOverlay?.destroy();
    this.stagingOverlay = null;
  }
}
