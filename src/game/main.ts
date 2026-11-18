import { AUTO, Game, Scale, type Types } from "phaser";
import { VIEW_H, VIEW_W } from "./config";
import { GameScene } from "./scenes/GameScene";

const config: Types.Core.GameConfig = {
  type: AUTO,
  width: VIEW_W,
  height: VIEW_H,
  parent: "game-container",
  backgroundColor: "#050816",
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH,
  },
  scene: [GameScene],
};

export const startGame = (parent: string) => new Game({ ...config, parent });
