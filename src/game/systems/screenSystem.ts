import {
  GAME_HEIGHT,
  GAME_WIDTH,
  SCREEN_CENTER_X,
  SCREEN_CENTER_Y,
} from "../config/gameplay";
import {
  RARITY_LABELS,
  getItemLevel,
  getTomeLevel,
} from "../data/upgrades";
import { IMAGE_KEYS } from "../data/imageAssets";
import type {
  ChestItemReward,
  PostRunRewardPreview,
  Rarity,
  RunItemState,
  RunTomeState,
  TomeOffer,
} from "../types/gameplay";

export const createUpgradeOverlay = (
  scene: Phaser.Scene,
  choices: TomeOffer[],
  tomes: RunTomeState,
  applyTome: (offer: TomeOffer) => void,
  reroll: () => void,
  rerollLabel: string,
) => {
  const backdrop = scene.add
    .rectangle(
      SCREEN_CENTER_X,
      SCREEN_CENTER_Y,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x020617,
      0.76,
    )
    .setDepth(300);
  const title = scene.add
    .text(SCREEN_CENTER_X, 148, "SCEGLI UN TOMO", {
      fontFamily: "Arial Black",
      fontSize: 40,
      color: "#ffffff",
      stroke: "#0f172a",
      strokeThickness: 8,
    })
    .setOrigin(0.5)
    .setDepth(301);
  const subtitle = scene.add
    .text(SCREEN_CENTER_X, 188, "Massimo 4 discipline per run", {
      fontFamily: "Arial",
      fontSize: 15,
      color: "#94a3b8",
    })
    .setOrigin(0.5)
    .setDepth(301);
  const objects: Phaser.GameObjects.GameObject[] = [backdrop, title, subtitle];
  const interactiveCards: Phaser.GameObjects.Rectangle[] = [];

  choices.forEach((offer, index) => {
    const x = 230 + index * 282;
    const level = getTomeLevel(tomes, offer.tome.id);
    const total = tomes.totalBonuses[offer.tome.id] ?? 0;
    const border = getRarityColor(offer.rarity, offer.tome.accentColor);
    const glow = scene.add
      .rectangle(x, 420, 264, 310, border, 0.1)
      .setDepth(301);
    const card = scene.add
      .rectangle(x, 420, 250, 296, 0x07111f, 0.98)
      .setStrokeStyle(3, border, 0.96)
      .setDepth(302);
    const family = scene.add
      .text(x - 105, 292, "TOMO", {
        fontFamily: "Arial Black",
        fontSize: 10,
        color: toHex(offer.tome.accentColor),
      })
      .setDepth(303);
    const levelText = scene.add
      .text(x + 105, 292, `Lv.${level} > ${level + 1}`, {
        fontFamily: "Arial Black",
        fontSize: 12,
        color: "#f8fafc",
      })
      .setOrigin(1, 0)
      .setDepth(303);
    const icon = scene.add
      .circle(x, 352, 36, offer.tome.accentColor, 0.18)
      .setStrokeStyle(3, offer.tome.accentColor, 0.9)
      .setDepth(303);
    const glyph = scene.add
      .text(x, 352, offer.tome.title.charAt(10) || "T", {
        fontFamily: "Arial Black",
        fontSize: 25,
        color: toHex(offer.tome.accentColor),
      })
      .setOrigin(0.5)
      .setDepth(304);
    const cardTitle = scene.add
      .text(x, 408, offer.tome.title, {
        fontFamily: "Arial Black",
        fontSize: 18,
        color: "#f8fafc",
        align: "center",
        wordWrap: { width: 214 },
      })
      .setOrigin(0.5)
      .setDepth(303);
    const immediate = scene.add
      .text(
        x,
        454,
        `+${formatNumber(offer.scaledIncrement)}% ${offer.tome.shortEffect}`,
        {
          fontFamily: "Arial Black",
          fontSize: 14,
          color: toHex(offer.tome.accentColor),
          align: "center",
          wordWrap: { width: 214 },
        },
      )
      .setOrigin(0.5)
      .setDepth(303);
    const description = scene.add
      .text(x, 496, offer.tome.description, {
        fontFamily: "Arial",
        fontSize: 14,
        color: "#cbd5e1",
        align: "center",
        wordWrap: { width: 210 },
      })
      .setOrigin(0.5)
      .setDepth(303);
    const rarity = scene.add
      .text(
        x,
        548,
        `${RARITY_LABELS[offer.rarity]}  /  Totale +${formatNumber(total)}%`,
        {
          fontFamily: "Arial Black",
          fontSize: 10,
          color: toHex(border),
        },
      )
      .setOrigin(0.5)
      .setDepth(303);

    card.on("pointerdown", () => applyTome(offer));
    interactiveCards.push(card);
    objects.push(
      glow,
      card,
      family,
      levelText,
      icon,
      glyph,
      cardTitle,
      immediate,
      description,
      rarity,
    );
  });

  const rerollButton = scene.add
    .rectangle(SCREEN_CENTER_X, 616, 300, 44, 0x0f172a, 0.98)
    .setStrokeStyle(2, 0xfbbf24, 0.82)
    .setDepth(302);
  const rerollText = scene.add
    .text(SCREEN_CENTER_X, 616, rerollLabel, {
      fontFamily: "Arial Black",
      fontSize: 14,
      color: "#fef3c7",
    })
    .setOrigin(0.5)
    .setDepth(303);
  rerollButton.on("pointerdown", reroll);
  objects.push(rerollButton, rerollText);

  armLevelUpInteractions(scene, [...interactiveCards, rerollButton]);

  pinToScreen(objects);
  return scene.add.container(0, 0, objects).setDepth(300);
};

export const showPauseOverlay = (
  scene: Phaser.Scene,
  resume: () => void,
) => {
  const backdrop = scene.add
    .rectangle(
      SCREEN_CENTER_X,
      SCREEN_CENTER_Y,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x020617,
      0.78,
    )
    .setInteractive()
    .setDepth(320);
  const panel = scene.add
    .rectangle(SCREEN_CENTER_X, SCREEN_CENTER_Y, 460, 220, 0x07111f, 0.98)
    .setStrokeStyle(2, 0x38bdf8, 0.78)
    .setDepth(321);
  const title = scene.add
    .text(SCREEN_CENTER_X, SCREEN_CENTER_Y - 52, "PAUSA", {
      fontFamily: "Arial Black",
      fontSize: 42,
      color: "#f8fafc",
    })
    .setOrigin(0.5)
    .setDepth(322);
  const hint = scene.add
    .text(SCREEN_CENTER_X, SCREEN_CENTER_Y - 6, "Premi P per riprendere", {
      fontFamily: "Arial",
      fontSize: 16,
      color: "#94a3b8",
    })
    .setOrigin(0.5)
    .setDepth(322);
  const [button, text] = createMenuButton(
    scene,
    SCREEN_CENTER_X,
    SCREEN_CENTER_Y + 58,
    "RIPRENDI",
    resume,
    210,
  );
  const objects = [backdrop, panel, title, hint, button, text];
  pinToScreen(objects);
  return scene.add.container(0, 0, objects).setDepth(320);
};

export const createChestRewardToast = (
  scene: Phaser.Scene,
  reward: ChestItemReward,
  items: RunItemState,
  detail: string,
) => {
  const x = GAME_WIDTH - 194;
  const y = GAME_HEIGHT - 148;
  const border = getRarityColor(reward.rarity, reward.item.accentColor);
  const panel = scene.add
    .rectangle(x, y, 332, 108, 0x07111f, 0.96)
    .setStrokeStyle(2, border, 0.92)
    .setDepth(282)
    .setScrollFactor(0);
  const icon = scene.add
    .image(x - 132, y, IMAGE_KEYS.chest)
    .setDisplaySize(62, 62)
    .setDepth(284)
    .setScrollFactor(0);
  const title = scene.add
    .text(x - 90, y - 38, reward.item.title, {
      fontFamily: "Arial Black",
      fontSize: 16,
      color: "#f8fafc",
    })
    .setDepth(284)
    .setScrollFactor(0);
  const meta = scene.add
    .text(
      x - 90,
      y - 12,
      `${RARITY_LABELS[reward.rarity]}  Lv.${getItemLevel(items, reward.item.id)}`,
      {
        fontFamily: "Arial Black",
        fontSize: 11,
        color: toHex(border),
      },
    )
    .setDepth(284)
    .setScrollFactor(0);
  const effect = scene.add
    .text(x - 90, y + 12, reward.item.shortEffect, {
      fontFamily: "Arial",
      fontSize: 13,
      color: toHex(reward.item.accentColor),
    })
    .setDepth(284)
    .setScrollFactor(0);
  const detailText = scene.add
    .text(x - 90, y + 34, detail, {
      fontFamily: "Arial",
      fontSize: 11,
      color: "#94a3b8",
    })
    .setDepth(284)
    .setScrollFactor(0);
  const container = scene.add
    .container(0, 0, [panel, icon, title, meta, effect, detailText])
    .setDepth(282);

  scene.tweens.add({
    targets: container,
    alpha: { from: 0, to: 1 },
    y: { from: 18, to: 0 },
    duration: 130,
  });
  scene.tweens.add({
    targets: container,
    alpha: 0,
    delay: 2200,
    duration: 260,
    onComplete: () => container.destroy(),
  });
};

export const showMainMenuOverlay = (
  scene: Phaser.Scene,
  feedback: string,
  actions: {
    play: () => void;
    tutorial: () => void;
    shop: () => void;
    staging?: () => void;
    exit: () => void;
  },
) => {
  const backdrop = scene.add
    .rectangle(
      SCREEN_CENTER_X,
      SCREEN_CENTER_Y,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x020617,
      0.92,
    )
    .setDepth(310);
  const title = scene.add
    .text(SCREEN_CENTER_X, 190, "SPACE WAR", {
      fontFamily: "Arial Black",
      fontSize: 54,
      color: "#f8fafc",
      stroke: "#0f172a",
      strokeThickness: 8,
    })
    .setOrigin(0.5)
    .setDepth(311);
  const info = scene.add
    .text(SCREEN_CENTER_X, actions.staging ? 630 : 590, feedback, {
      fontFamily: "Arial",
      fontSize: 15,
      color: "#94a3b8",
    })
    .setOrigin(0.5)
    .setDepth(311);
  const objects: Phaser.GameObjects.GameObject[] = [backdrop, title, info];
  const entries = [
    { label: "PLAY", action: actions.play },
    { label: "TUTORIAL", action: actions.tutorial },
    { label: "SHOP", action: actions.shop },
    ...(actions.staging
      ? [{ label: "STAGING", action: actions.staging }]
      : []),
    { label: "EXIT", action: actions.exit },
  ];
  const startY = actions.staging ? 300 : 320;
  const gap = actions.staging ? 62 : 68;

  entries.forEach((entry, index) => {
    objects.push(
      ...createMenuButton(
        scene,
        SCREEN_CENTER_X,
        startY + index * gap,
        entry.label,
        entry.action,
      ),
    );
  });
  pinToScreen(objects);
  return scene.add.container(0, 0, objects).setDepth(310);
};

export const showGameOverOverlay = (
  scene: Phaser.Scene,
  coins: number,
  reward: PostRunRewardPreview,
  totalCredits: number,
  actions: { restart: () => void; shop: () => void; menu: () => void },
) => {
  const panel = scene.add
    .rectangle(SCREEN_CENTER_X, 420, 620, 300, 0x020617, 0.94)
    .setStrokeStyle(2, 0x38bdf8, 0.55)
    .setDepth(310);
  const title = scene.add
    .text(SCREEN_CENTER_X, 306, "RUN TERMINATA", {
      fontFamily: "Arial Black",
      fontSize: 34,
      color: "#f8fafc",
    })
    .setOrigin(0.5)
    .setDepth(311);
  const summary = scene.add
    .text(
      SCREEN_CENTER_X,
      360,
      `Livello ${reward.reachedLevel}  /  Wave ${reward.reachedWave}  /  Risorse run ${coins}`,
      {
        fontFamily: "Arial",
        fontSize: 16,
        color: "#cbd5e1",
      },
    )
    .setOrigin(0.5)
    .setDepth(311);
  const credits = scene.add
    .text(
      SCREEN_CENTER_X,
      398,
      `+${reward.earnedCredits} crediti  /  Totale ${totalCredits}`,
      {
        fontFamily: "Arial Black",
        fontSize: 18,
        color: "#fde68a",
      },
    )
    .setOrigin(0.5)
    .setDepth(311);
  const objects: Phaser.GameObjects.GameObject[] = [
    panel,
    title,
    summary,
    credits,
  ];
  objects.push(
    ...createMenuButton(scene, 512, 466, "RESTART", actions.restart, 190),
    ...createMenuButton(scene, 402, 532, "SHOP", actions.shop, 190),
    ...createMenuButton(scene, 622, 532, "MENU", actions.menu, 190),
  );
  pinToScreen(objects);
  return scene.add.container(0, 0, objects).setDepth(310);
};

const createMenuButton = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  action: () => void,
  width = 280,
) => {
  const background = scene.add
    .rectangle(x, y, width, 52, 0x0f172a, 0.96)
    .setStrokeStyle(2, 0x38bdf8, 0.72)
    .setInteractive({ useHandCursor: true })
    .setDepth(312);
  const text = scene.add
    .text(x, y, label, {
      fontFamily: "Arial Black",
      fontSize: 18,
      color: "#e0f2fe",
    })
    .setOrigin(0.5)
    .setDepth(313);
  background.on("pointerdown", action);
  return [background, text];
};

const getRarityColor = (rarity: Rarity, accent: number) => {
  if (rarity === "legendary") return 0xf59e0b;
  if (rarity === "rare") return 0xc084fc;
  if (rarity === "uncommon") return accent;
  return 0x64748b;
};

const pinToScreen = (objects: Phaser.GameObjects.GameObject[]) => {
  objects.forEach((object) => {
    if ("setScrollFactor" in object) {
      (
        object as Phaser.GameObjects.GameObject & {
          setScrollFactor: (value: number) => unknown;
        }
      ).setScrollFactor(0);
    }
  });
};

const armLevelUpInteractions = (
  scene: Phaser.Scene,
  targets: Phaser.GameObjects.Rectangle[],
) => {
  const enable = () => {
    targets.forEach((target) => {
      if (target.active) {
        target.setInteractive({ useHandCursor: true });
      }
    });
  };
  const waitForRelease = () => {
    if (scene.input.activePointer.isDown) {
      scene.input.once("pointerup", enable);
      return;
    }

    enable();
  };

  scene.time.delayedCall(320, waitForRelease);
};

const formatNumber = (value: number) =>
  Number.isInteger(value) ? `${value}` : value.toFixed(1);

const toHex = (color: number) => `#${color.toString(16).padStart(6, "0")}`;
