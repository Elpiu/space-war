import { Game as MainGame } from './scenes/Game';
import { StagingScene } from './scenes/StagingScene';
import { TutorialScene } from './scenes/TutorialScene';
import { AUTO, Game, Scale, Types } from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config/gameplay';

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Types.Core.GameConfig = {
    type: AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    scene: import.meta.env.DEV
        ? [MainGame, TutorialScene, StagingScene]
        : [MainGame, TutorialScene]
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
}

export default StartGame;
