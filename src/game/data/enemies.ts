import type { EnemyDefinition, EnemyTypeId } from '../types/gameplay';

export const ENEMY_DEFINITIONS: Record<EnemyTypeId, EnemyDefinition> = {
    chaser: {
        id: 'chaser',
        label: 'Inseguitore',
        behavior: 'chaser',
        hp: 3,
        speed: 108,
        damage: 1,
        radius: 16,
        xpValue: 1,
        coinValue: 1,
        color: 0xef4444,
        strokeColor: 0xfecaca,
        iconKey: 'enemy-chaser'
    },
    swarm: {
        id: 'swarm',
        label: 'Sciame',
        behavior: 'swarm',
        hp: 1,
        speed: 146,
        damage: 1,
        radius: 11,
        xpValue: 1,
        coinValue: 1,
        color: 0xf43f5e,
        strokeColor: 0xffc4d6,
        iconKey: 'enemy-swarm'
    },
    brute: {
        id: 'brute',
        label: 'Corazzato',
        behavior: 'brute',
        hp: 8,
        speed: 76,
        damage: 2,
        radius: 23,
        xpValue: 3,
        coinValue: 2,
        color: 0xf97316,
        strokeColor: 0xfed7aa,
        iconKey: 'enemy-brute'
    },
    shooter: {
        id: 'shooter',
        label: 'Tiratore',
        behavior: 'shooter',
        hp: 4,
        speed: 82,
        damage: 1,
        radius: 17,
        xpValue: 2,
        coinValue: 2,
        color: 0x8b5cf6,
        strokeColor: 0xddd6fe,
        iconKey: 'enemy-shooter',
        preferredDistance: 250,
        attackRange: 390,
        attackCooldown: 1850,
        projectile: {
            speed: 255,
            range: 470,
            damage: 1,
            radius: 6,
            color: 0xa78bfa
        }
    }
};

export const getEnemyDefinition = (typeId: EnemyTypeId) => {
    return ENEMY_DEFINITIONS[typeId];
};

export const pickEnemyTypeForSpawn = (
    wave: number,
    spawnIndex: number,
    pulseCount: number
): EnemyTypeId => {
    if (wave >= 4 && (spawnIndex + wave) % 8 === 0) {
        return 'shooter';
    }

    if (wave >= 3 && (spawnIndex + wave) % 6 === 0) {
        return 'brute';
    }

    const swarmCadence = wave >= 3 ? 3 : 4;

    if (pulseCount > 2 && (spawnIndex + wave) % swarmCadence === 1) {
        return 'swarm';
    }

    return 'chaser';
};

export const getEnemyWaveScale = (typeId: EnemyTypeId, wave: number) => {
    const hpBonus = Math.floor(wave / (typeId === 'brute' ? 4 : 3));
    const speedBonus = Math.min(wave * (typeId === 'swarm' ? 5 : 4), typeId === 'brute' ? 34 : 62);
    const cooldownMultiplier = Math.max(0.72, 1 - wave * 0.025);

    return {
        hpBonus,
        speedBonus,
        cooldownMultiplier
    };
};
