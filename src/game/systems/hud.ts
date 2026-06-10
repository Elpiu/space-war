import type { HudState } from '../types/gameplay';
import {
    GAME_HEIGHT,
    SCREEN_CENTER_X,
    SCREEN_CENTER_Y,
    SECTOR_SIZE_CONFIG
} from '../config/gameplay';

export type HudElements = {
    hudText: Phaser.GameObjects.Text;
    stateText: Phaser.GameObjects.Text;
};

export const createHud = (scene: Phaser.Scene): HudElements => {
    const hudText = scene.add.text(20, 18, '', {
        fontFamily: 'Arial',
        fontSize: 18,
        color: '#e2e8f0',
        lineSpacing: 8
    }).setDepth(200).setScrollFactor(0);

    scene.add.text(20, GAME_HEIGHT - 48, 'WASD/Frecce: movimento  |  T/F/B: preview piazzabile  |  Click: piazza/seleziona  |  E: rimuovi  |  Esc: annulla  |  R: restart', {
        fontFamily: 'Arial',
        fontSize: 16,
        color: '#94a3b8'
    }).setDepth(200).setScrollFactor(0);

    const stateText = scene.add.text(SCREEN_CENTER_X, SCREEN_CENTER_Y - 12, '', {
        fontFamily: 'Arial Black',
        fontSize: 40,
        color: '#ffffff',
        stroke: '#0f172a',
        strokeThickness: 8,
        align: 'center'
    }).setOrigin(0.5).setDepth(250).setScrollFactor(0);

    return {
        hudText,
        stateText
    };
};

export const updateHud = (hudText: Phaser.GameObjects.Text, state: HudState) => {
    const xpClamped = Math.min(state.xp, state.xpToNext);

    hudText.setText([
        `HP ${state.hp}/${state.maxHp}`,
        `XP ${xpClamped}/${state.xpToNext}  Livello ${state.level}`,
        `Risorse run ${state.coins}`,
        `Wave ${state.wave} (${state.wavePhase})`,
        `Nemici ${state.enemyCount}`,
        `Settore ${state.sectorName} (${SECTOR_SIZE_CONFIG[state.sectorSize].label})`,
        `Settori scoperti ${state.discoveredSectors}`,
        `Torrette ${state.turretCount}/${state.maxTurrets}  Mine ${state.mineCount}/${state.maxMines}`,
        `Barricate ${state.barricadeCount}/${state.maxBarricades}  Droni ${state.droneCount}  Chest ${state.chestCount}`
    ]);
};
