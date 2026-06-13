import { Math as PhaserMath } from "phaser";
import { CHEST_ITEMS, RARITY_MULTIPLIERS, TOMES } from "../data/upgrades";
import { spawnChest } from "../systems/chestController";
import { destroyEnemy } from "../systems/enemies";
import { expandMapForWave, getSectorCenter } from "../systems/mapSectors";
import { dropPickup } from "../systems/pickupSystem";
import {
  createTutorialOverlay,
  type TutorialOverlay,
} from "../systems/tutorialOverlay";
import { addXpAndCheckLevelUp } from "../systems/upgradeSystem";
import type {
  ChestItemReward,
  Pickup,
  TomeOffer,
} from "../types/gameplay";
import {
  GameplayScene,
  type GameplaySceneData,
} from "./GameplayScene";

type TutorialStepDefinition = {
  title: string;
  description: string;
};

const TUTORIAL_STEPS: TutorialStepDefinition[] = [
  {
    title: "Pilota la nave",
    description: "Muoviti con WASD o con le frecce direzionali.",
  },
  {
    title: "Combattimento automatico",
    description: "Mantieni la distanza: la nave spara da sola al bersaglio vicino.",
  },
  {
    title: "Raccogli le ricompense",
    description: "Avvicinati ai pickup di esperienza e risorse run.",
  },
  {
    title: "Scegli un tomo",
    description: "Seleziona uno dei tre tomi per orientare la build.",
  },
  {
    title: "Controlla il terreno",
    description: "Piazza una torretta con T, una mina con F e una barricata con B, confermando con click.",
  },
  {
    title: "Cambia settore",
    description: "Raggiungi il settore evidenziato attraversando l'apertura della mappa.",
  },
  {
    title: "Apri una chest",
    description: "Raggiungi la chest gratuita per ottenere un oggetto passivo.",
  },
  {
    title: "Controlli avanzati",
    description: "E rimuove un piazzabile vicino, Esc annulla, P mette in pausa, Z/X o rotella cambiano zoom e F11 gestisce il fullscreen.",
  },
];

export class TutorialScene extends GameplayScene {
  private tutorialOverlay: TutorialOverlay | null = null;
  private tutorialStep = 0;
  private movedDistance = 0;
  private lastPlayerPosition: Phaser.Math.Vector2 | null = null;
  private tutorialKills = 0;
  private collectedKinds = new Set<Pickup["kind"]>();
  private targetSectorId = "";
  private targetMarker: Phaser.GameObjects.Arc | null = null;
  private finalTransitionAt = 0;

  constructor() {
    super("Tutorial");
    this.policy = {
      automaticWaves: false,
      persistPostRunRewards: false,
      invulnerable: true,
    };
  }

  protected override bootMode(_data: GameplaySceneData) {
    this.startRun();
    const parent = this.game.canvas.parentElement ?? document.body;
    this.tutorialOverlay = createTutorialOverlay(parent, () =>
      this.scene.start("Game"),
    );
    this.events.once("shutdown", () => this.destroyTutorialUi());
    this.enterTutorialStep(0);
  }

  protected override onRunStarted() {
    this.run.wave = 1;
    this.run.wavePhase = "tutorial";
    this.run.xpToNext = 999;
    this.run.nextBuyableChestAt = Number.POSITIVE_INFINITY;
    this.run.coins = 0;

    if (expandMapForWave(this.mapState, 2)) {
      this.updateCameraBounds();
      this.renderMap();
    }

    this.targetSectorId = this.mapState.sectors[1]?.id ?? "";
  }

  override update(time: number, delta: number) {
    super.update(time, delta);

    if (
      this.screenMode !== "running" ||
      this.run.isPaused ||
      this.run.isLevelingUp ||
      !this.player
    ) {
      return;
    }

    if (this.tutorialStep === 0) {
      const current = new PhaserMath.Vector2(this.player.x, this.player.y);

      if (this.lastPlayerPosition) {
        this.movedDistance += PhaserMath.Distance.BetweenPoints(
          this.lastPlayerPosition,
          current,
        );
      }

      this.lastPlayerPosition = current;
      this.refreshTutorialOverlay();

      if (this.movedDistance >= 280) {
        this.advanceTutorial();
      }
    } else if (this.tutorialStep === 4) {
      this.refreshTutorialOverlay();

      if (
        this.run.turrets.length > 0 &&
        this.run.mines.length > 0 &&
        this.run.barricades.length > 0
      ) {
        this.advanceTutorial();
      }
    } else if (
      this.tutorialStep === 7 &&
      this.finalTransitionAt > 0 &&
      time >= this.finalTransitionAt
    ) {
      this.scene.start("Game", { startRun: true });
    } else if (this.tutorialStep === 7) {
      this.refreshTutorialOverlay();
    }
  }

  protected override getTomeChoices(): TomeOffer[] {
    return ["power", "mobility", "engineering"].flatMap((id) => {
      const tome = TOMES.find((entry) => entry.id === id);

      if (!tome) {
        return [];
      }

      return [{
        tome,
        rarity: "common" as const,
        rarityMultiplier: RARITY_MULTIPLIERS.common,
        scaledIncrement: tome.baseIncrement,
      }];
    });
  }

  protected override pickChestReward(): ChestItemReward | undefined {
    const item = CHEST_ITEMS.find((entry) => entry.id === "reinforced-bulkhead");

    return item
      ? {
          item,
          rarity: "common",
          rarityMultiplier: RARITY_MULTIPLIERS.common,
        }
      : undefined;
  }

  protected override onEnemyKilled(count: number) {
    if (this.tutorialStep !== 1) {
      return;
    }

    this.tutorialKills += count;
    this.refreshTutorialOverlay();

    if (this.tutorialKills >= 3) {
      this.advanceTutorial();
    }
  }

  protected override onPickupCollected(pickup: Pickup) {
    if (this.tutorialStep !== 2) {
      return;
    }

    this.collectedKinds.add(pickup.kind);
    this.refreshTutorialOverlay();

    if (
      this.collectedKinds.has("xp") &&
      this.collectedKinds.has("coin")
    ) {
      this.advanceTutorial();
    }
  }

  protected override onTomeApplied(_offer: TomeOffer) {
    if (this.tutorialStep === 3) {
      this.advanceTutorial();
    }
  }

  protected override onSectorChanged(
    _previousSectorId: string,
    sectorId: string,
  ) {
    if (this.tutorialStep === 5 && sectorId === this.targetSectorId) {
      this.advanceTutorial();
    }
  }

  protected override onChestRewardApplied(_reward: ChestItemReward) {
    if (this.tutorialStep === 6) {
      this.advanceTutorial();
    }
  }

  private advanceTutorial() {
    if (this.tutorialStep >= TUTORIAL_STEPS.length - 1) {
      return;
    }

    this.enterTutorialStep(this.tutorialStep + 1);
  }

  private enterTutorialStep(step: number) {
    this.tutorialStep = step;

    if (step === 1) {
      this.spawnTutorialEnemies();
    } else if (step === 2) {
      this.clearTutorialEnemies();
      this.spawnTutorialPickups();
    } else if (step === 3) {
      this.run.xpToNext = 6;
      this.run.xp = 5;

      if (addXpAndCheckLevelUp(this.run, 1)) {
        this.showUpgradeChoices();
      }
    } else if (step === 4) {
      this.run.coins = Math.max(this.run.coins, 100);
      this.refreshHud();
    } else if (step === 5) {
      this.createTargetMarker();
    } else if (step === 6) {
      this.destroyTargetMarker();
      this.spawnTutorialChest();
    } else if (step === 7) {
      this.finalTransitionAt = this.time.now + 6500;
    }

    this.refreshTutorialOverlay();
  }

  private spawnTutorialEnemies() {
    if (!this.player) {
      return;
    }

    const offsets = [
      { x: 220, y: 0 },
      { x: -190, y: 90 },
      { x: 70, y: -210 },
    ];

    offsets.forEach((offset) =>
      this.spawnEnemyAt(
        this.player!.x + offset.x,
        this.player!.y + offset.y,
        "chaser",
      ),
    );
  }

  private clearTutorialEnemies() {
    this.run.enemies.forEach(destroyEnemy);
    this.run.enemies = [];
  }

  private spawnTutorialPickups() {
    if (!this.player) {
      return;
    }

    dropPickup(
      this,
      this.run.pickups,
      this.player.x + 120,
      this.player.y,
      "xp",
      1,
    );
    dropPickup(
      this,
      this.run.pickups,
      this.player.x - 120,
      this.player.y,
      "coin",
      4,
    );
  }

  private createTargetMarker() {
    const sector = this.mapState.sectors.find(
      (entry) => entry.id === this.targetSectorId,
    );

    if (!sector) {
      this.advanceTutorial();
      return;
    }

    const center = getSectorCenter(sector);
    this.targetMarker = this.add
      .circle(center.x, center.y, 54, 0x22d3ee, 0.12)
      .setStrokeStyle(4, 0x67e8f9, 0.95)
      .setDepth(75);
    this.tweens.add({
      targets: this.targetMarker,
      scale: 1.35,
      alpha: 0.35,
      yoyo: true,
      repeat: -1,
      duration: 720,
    });
  }

  private spawnTutorialChest() {
    if (!this.player) {
      return;
    }

    spawnChest({
      scene: this,
      run: this.run,
      mapState: this.mapState,
      x: this.player.x + 126,
      y: this.player.y,
      kind: "reward",
    });
    this.renderMap();
  }

  private refreshTutorialOverlay() {
    const definition = TUTORIAL_STEPS[this.tutorialStep];

    if (!definition) {
      return;
    }

    this.tutorialOverlay?.update({
      step: this.tutorialStep + 1,
      totalSteps: TUTORIAL_STEPS.length,
      title: definition.title,
      description: definition.description,
      progress: this.getTutorialProgress(),
    });
  }

  private getTutorialProgress() {
    if (this.tutorialStep === 0) {
      return `${Math.min(280, Math.round(this.movedDistance))} / 280 distanza`;
    }

    if (this.tutorialStep === 1) {
      return `${Math.min(3, this.tutorialKills)} / 3 nemici eliminati`;
    }

    if (this.tutorialStep === 2) {
      return `${this.collectedKinds.has("xp") ? "XP OK" : "XP"}  /  ${this.collectedKinds.has("coin") ? "RISORSE OK" : "RISORSE"}`;
    }

    if (this.tutorialStep === 4) {
      return `T ${this.run.turrets.length}/1  F ${this.run.mines.length}/1  B ${this.run.barricades.length}/1`;
    }

    if (this.tutorialStep === 7) {
      const seconds = Math.max(
        0,
        Math.ceil((this.finalTransitionAt - this.time.now) / 1000),
      );
      return `Run normale tra ${seconds}s`;
    }

    return "Completa l'obiettivo";
  }

  private destroyTargetMarker() {
    if (this.targetMarker) {
      this.tweens.killTweensOf(this.targetMarker);
      this.targetMarker.destroy();
    }

    this.targetMarker = null;
  }

  private destroyTutorialUi() {
    this.destroyTargetMarker();
    this.tutorialOverlay?.destroy();
    this.tutorialOverlay = null;
  }
}
