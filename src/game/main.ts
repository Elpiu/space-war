import { AUTO, Game, Scale, type Types } from "phaser";
import { VIEW_H, VIEW_W } from "./config";
import { GameScene } from "./scenes/GameScene";
import { setupStage } from "./stage";

const config: Types.Core.GameConfig = {
  type: AUTO,
  width: VIEW_W,
  height: VIEW_H,
  parent: "game-container",
  backgroundColor: "#050816",
  // Il canvas resta 1280x720: lo scala il palco (vedi stage.ts) insieme all'interfaccia.
  scale: { mode: Scale.NONE },
  input: { activePointers: 4 },
  scene: [GameScene],
};

export const startGame = (parent: string) => {
  const game = new Game({ ...config, parent });
  // Dopo ogni ridimensionamento Phaser ricalcola i limiti del canvas per l'input.
  setupStage(() => game.scale?.refresh());
  return game;
};
