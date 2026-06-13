import { GameplayScene, type GameplaySceneData } from "./GameplayScene";

export class Game extends GameplayScene {
  constructor() {
    super("Game");
  }

  protected override bootMode(data: GameplaySceneData) {
    if (data.startRun) {
      this.startRun();
      return;
    }

    this.showMainMenu();
  }
}
