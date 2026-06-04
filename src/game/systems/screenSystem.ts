import {
  GAME_HEIGHT,
  GAME_WIDTH,
  SCREEN_CENTER_X,
  SCREEN_CENTER_Y,
} from "../config/gameplay";
import {
  getShopItemLevel,
  getShopItemUpgradeCost,
  SHOP_CATEGORIES,
  SHOP_ITEMS,
} from "./metaProgression";
import type {
  MetaProgressionState,
  PostRunRewardPreview,
  ShopCategory,
  ShopItem,
  ShopItemId,
  Upgrade,
} from "../types/gameplay";

export const createUpgradeOverlay = (
  scene: Phaser.Scene,
  choices: Upgrade[],
  applyUpgrade: (upgrade: Upgrade) => void,
) => {
  const backdrop = scene.add
    .rectangle(
      SCREEN_CENTER_X,
      SCREEN_CENTER_Y,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x020617,
      0.72,
    )
    .setDepth(300);
  const title = scene.add
    .text(SCREEN_CENTER_X, 174, "LEVEL UP", {
      fontFamily: "Arial Black",
      fontSize: 44,
      color: "#ffffff",
      stroke: "#0f172a",
      strokeThickness: 8,
    })
    .setOrigin(0.5)
    .setDepth(301);
  const cardObjects: Phaser.GameObjects.GameObject[] = [backdrop, title];

  choices.forEach((upgrade, index) => {
    const x = 246 + index * 266;
    const background = scene.add
      .rectangle(x, 400, 230, 170, 0x172554, 0.94)
      .setStrokeStyle(2, 0x38bdf8, 0.9)
      .setInteractive({ useHandCursor: true })
      .setDepth(301);
    const cardTitle = scene.add
      .text(x, 350, upgrade.title, {
        fontFamily: "Arial Black",
        fontSize: 20,
        color: "#f8fafc",
        align: "center",
        wordWrap: { width: 194 },
      })
      .setOrigin(0.5)
      .setDepth(302);
    const description = scene.add
      .text(x, 420, upgrade.description, {
        fontFamily: "Arial",
        fontSize: 17,
        color: "#bae6fd",
        align: "center",
        wordWrap: { width: 190 },
      })
      .setOrigin(0.5)
      .setDepth(302);

    background.on("pointerdown", () => applyUpgrade(upgrade));
    cardObjects.push(background, cardTitle, description);
  });

  pinToScreen(cardObjects);
  return scene.add.container(0, 0, cardObjects).setDepth(300);
};

export const showMainMenuOverlay = (
  scene: Phaser.Scene,
  feedback: string,
  actions: {
    play: () => void;
    shop: () => void;
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
  const feedbackText = scene.add
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
    ...createMenuButton(scene, 512, 330, "PLAY", actions.play),
    ...createMenuButton(scene, 512, 404, "SHOP", actions.shop),
    ...createMenuButton(scene, 512, 478, "EXIT", actions.exit),
  );

  pinToScreen(objects);
  return scene.add.container(0, 0, objects).setDepth(310);
};

export const showGameOverOverlay = (
  scene: Phaser.Scene,
  coins: number,
  reward: PostRunRewardPreview,
  totalCredits: number,
  actions: {
    restart: () => void;
    shop: () => void;
    menu: () => void;
  },
) => {
  const panel = scene.add
    .rectangle(SCREEN_CENTER_X, 430, 620, 270, 0x020617, 0.9)
    .setStrokeStyle(2, 0x38bdf8, 0.55)
    .setDepth(310);
  const title = scene.add
    .text(SCREEN_CENTER_X, 320, "RUN TERMINATA", {
      fontFamily: "Arial Black",
      fontSize: 34,
      color: "#f8fafc",
      stroke: "#0f172a",
      strokeThickness: 6,
    })
    .setOrigin(0.5)
    .setDepth(311);
  const summary = scene.add
    .text(
      SCREEN_CENTER_X,
      382,
      [
        `Livello ${reward.reachedLevel}  |  Wave ${reward.reachedWave}`,
        `Crediti ottenuti: +${reward.earnedCredits}`,
        `Totale crediti: ${totalCredits}`,
        `Risorse run rimaste: ${coins}`,
      ],
      {
        fontFamily: "Arial",
        fontSize: 18,
        color: "#fde68a",
        align: "center",
        lineSpacing: 7,
      },
    )
    .setOrigin(0.5)
    .setDepth(311);
  const objects: Phaser.GameObjects.GameObject[] = [panel, title, summary];

  objects.push(
    ...createMenuButton(scene, 316, 514, "RESTART", actions.restart, 160),
    ...createMenuButton(scene, 512, 514, "SHOP", actions.shop, 160),
    ...createMenuButton(scene, 708, 514, "MENU", actions.menu, 160),
  );

  pinToScreen(objects);
  return scene.add.container(0, 0, objects).setDepth(310);
};

export const showShopOverlay = (
  scene: Phaser.Scene,
  metaState: MetaProgressionState,
  selectedShopCategory: ShopCategory,
  feedback: string,
  actions: {
    selectCategory: (category: ShopCategory) => void;
    selectItem: (itemId: ShopItemId) => void;
    upgradeItem: (itemId: ShopItemId) => void;
    menu: () => void;
    play: () => void;
  },
) => {
  const backdrop = scene.add
    .rectangle(
      SCREEN_CENTER_X,
      SCREEN_CENTER_Y,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x020617,
      0.94,
    )
    .setDepth(310);
  const title = scene.add
    .text(SCREEN_CENTER_X, 50, "SHOP / HANGAR", {
      fontFamily: "Arial Black",
      fontSize: 32,
      color: "#f8fafc",
      stroke: "#0f172a",
      strokeThickness: 6,
    })
    .setOrigin(0.5)
    .setDepth(311);
  const wallet = scene.add
    .text(
      SCREEN_CENTER_X,
      90,
      `Crediti hangar: ${metaState.postRunCredits}`,
      {
        fontFamily: "Arial",
        fontSize: 18,
        color: "#fde68a",
      },
    )
    .setOrigin(0.5)
    .setDepth(311);
  const feedbackText = scene.add
    .text(SCREEN_CENTER_X, 116, feedback, {
      fontFamily: "Arial",
      fontSize: 14,
      color: feedback.includes("insufficienti") ? "#fecaca" : "#bbf7d0",
    })
    .setOrigin(0.5)
    .setDepth(311);
  const objects: Phaser.GameObjects.GameObject[] = [
    backdrop,
    title,
    wallet,
    feedbackText,
  ];

  SHOP_CATEGORIES.forEach((category, index) => {
    const x = 132 + index * 172;
    const selected = category.id === selectedShopCategory;

    objects.push(
      ...createMenuButton(
        scene,
        x,
        154,
        category.label.toUpperCase(),
        () => actions.selectCategory(category.id),
        150,
        selected ? 0x0f766e : 0x172554,
      ),
      ...createShopCategoryIcon(
        scene,
        category.id,
        x - 56,
        154,
        selected ? 0xccfbf1 : 0x7dd3fc,
      ),
    );
  });

  SHOP_ITEMS.filter((item) => item.category === selectedShopCategory).forEach(
    (item, index) => {
      const col = index % 2;
      const rowIndex = Math.floor(index / 2);
      const x = 330 + col * 368;
      const y = 268 + rowIndex * 172;
      const equipped = metaState.loadout[item.category] === item.id;
      const unlocked =
        item.isDefault || metaState.unlockedItems.includes(item.id);
      const affordable = metaState.postRunCredits >= item.cost;
      const level = getShopItemLevel(metaState, item.id);
      const upgradeCost = getShopItemUpgradeCost(item, level);
      const upgradeAffordable = metaState.postRunCredits >= upgradeCost;
      const status = equipped
        ? "EQUIP"
        : unlocked
          ? "ACQUISTATO"
          : affordable
            ? "COMPRA"
            : "BLOCCATO";
      const statusColor = equipped
        ? item.accentColor
        : unlocked
          ? 0x14532d
          : affordable
            ? 0x1d4ed8
            : 0x7f1d1d;
      const card = scene.add
        .rectangle(
          x,
          y,
          326,
          160,
          0x0f172a,
          unlocked || affordable ? 0.92 : 0.68,
        )
        .setStrokeStyle(
          2,
          equipped ? item.accentColor : unlocked ? 0x475569 : 0x334155,
          unlocked || affordable ? 0.86 : 0.48,
        )
        .setInteractive({ useHandCursor: true })
        .setDepth(311);
      const title = scene.add
        .text(x - 88, y - 52, item.title, {
          fontFamily: "Arial Black",
          fontSize: 16,
          color: unlocked || affordable ? "#f8fafc" : "#94a3b8",
          wordWrap: { width: 190 },
        })
        .setDepth(312);
      const statusBadge = scene.add
        .rectangle(
          x + 96,
          y - 52,
          104,
          28,
          statusColor,
          0.96,
        )
        .setStrokeStyle(1, equipped ? item.accentColor : 0x94a3b8, 0.55)
        .setDepth(312);
      const statusText = scene.add
        .text(x + 96, y - 52, status, {
          fontFamily: "Arial Black",
          fontSize: status.length > 8 ? 10 : 12,
          color: "#f8fafc",
        })
        .setOrigin(0.5)
        .setDepth(313);
      const description = scene.add
        .text(x - 88, y - 22, item.description, {
          fontFamily: "Arial",
          fontSize: 12,
          color: unlocked || affordable ? "#bae6fd" : "#64748b",
          wordWrap: { width: 216 },
        })
        .setDepth(312);
      const statLine = scene.add
        .text(x - 88, y + 26, item.statLine, {
          fontFamily: "Arial Black",
          fontSize: 11,
          color: "#fde68a",
          wordWrap: { width: 216 },
        })
        .setDepth(312);
      const levelText = scene.add
        .text(x - 88, y + 48, `Lv.${level}  ${item.upgrade?.label ?? ""}`, {
          fontFamily: "Arial",
          fontSize: 11,
          color: unlocked ? "#ccfbf1" : "#64748b",
          wordWrap: { width: 174 },
        })
        .setDepth(312);
      const costText = scene.add
        .text(x - 88, y + 66, getShopCostLabel(item, unlocked), {
          fontFamily: "Arial",
          fontSize: 11,
          color: unlocked ? "#bbf7d0" : affordable ? "#ccfbf1" : "#fecaca",
          wordWrap: { width: 164 },
        })
        .setDepth(312);
      const preview = createShopItemPreview(scene, item, x - 126, y + 8);
      const upgradeButton = unlocked
        ? createShopUpgradeButton(
            scene,
            x + 100,
            y + 56,
            upgradeCost,
            upgradeAffordable,
            () => actions.upgradeItem(item.id),
          )
        : [];

      card.on("pointerdown", () => actions.selectItem(item.id));

      objects.push(
        card,
        ...preview,
        title,
        statusBadge,
        statusText,
        description,
        statLine,
        levelText,
        costText,
        ...upgradeButton,
      );
    },
  );

  objects.push(
    ...createMenuButton(scene, 408, 724, "MENU", actions.menu, 180),
    ...createMenuButton(scene, 616, 724, "PLAY", actions.play, 180),
  );

  pinToScreen(objects);
  return scene.add.container(0, 0, objects).setDepth(310);
};

const getShopCostLabel = (item: ShopItem, unlocked: boolean) => {
  if (item.isDefault) {
    return "Gratis (default) · click equip";
  }

  if (unlocked) {
    return `Acquistato · click equip`;
  }

  return `Costo: ${item.cost} crediti`;
};

const createShopUpgradeButton = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  cost: number,
  affordable: boolean,
  onClick: () => void,
) => {
  const color = affordable ? 0x164e63 : 0x431407;
  const borderColor = affordable ? 0x67e8f9 : 0xf97316;
  const textColor = affordable ? "#ecfeff" : "#fed7aa";
  const button = scene.add
    .rectangle(x, y, 106, 30, color, 0.96)
    .setStrokeStyle(1, borderColor, 0.78)
    .setInteractive({ useHandCursor: true })
    .setDepth(314);
  const label = scene.add
    .text(x, y - 4, "UPGRADE", {
      fontFamily: "Arial Black",
      fontSize: 10,
      color: textColor,
    })
    .setOrigin(0.5)
    .setDepth(315);
  const costText = scene.add
    .text(x, y + 8, `${cost} crediti`, {
      fontFamily: "Arial",
      fontSize: 9,
      color: textColor,
    })
    .setOrigin(0.5)
    .setDepth(315);

  button.on(
    "pointerdown",
    (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
      onClick();
    },
  );

  return [button, label, costText];
};

const createShopCategoryIcon = (
  scene: Phaser.Scene,
  category: ShopCategory,
  x: number,
  y: number,
  color: number,
) => {
  const graphics = scene.add.graphics().setDepth(313);

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
};

const createShopItemPreview = (
  scene: Phaser.Scene,
  item: ShopItem,
  x: number,
  y: number,
) => {
  const graphics = scene.add.graphics().setDepth(312);
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
};

const createMenuButton = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  width = 240,
  color = 0x172554,
) => {
  const button = scene.add
    .rectangle(x, y, width, 48, color, 0.94)
    .setStrokeStyle(2, 0x38bdf8, 0.72)
    .setInteractive({ useHandCursor: true })
    .setDepth(311);
  const text = scene.add
    .text(x, y, label, {
      fontFamily: "Arial Black",
      fontSize: 18,
      color: "#f8fafc",
    })
    .setOrigin(0.5)
    .setDepth(312);

  button.on("pointerdown", onClick);

  return [button, text];
};

export const pinToScreen = (objects: Phaser.GameObjects.GameObject[]) => {
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
};
