import type { EnemyDefinition, EnemyTypeId } from '../types/gameplay';

const ARMED_ENEMY_COLOR = 0xc084fc;
const ARMED_ENEMY_STROKE_COLOR = 0xf3e8ff;

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
        color: ARMED_ENEMY_COLOR,
        strokeColor: ARMED_ENEMY_STROKE_COLOR,
        iconKey: 'enemy-shooter',
        preferredDistance: 250,
        attackRange: 390,
        attackCooldown: 1850,
        projectile: {
            speed: 255,
            range: 470,
            damage: 1,
            radius: 6,
            color: ARMED_ENEMY_COLOR
        }
    },
    charger: {
        id: 'charger',
        label: 'Assaltatore',
        behavior: 'chaser',
        hp: 5,
        speed: 178,
        damage: 2,
        radius: 15,
        xpValue: 3,
        coinValue: 2,
        color: 0xf59e0b,
        strokeColor: 0xfef3c7,
        iconKey: 'enemy-charger'
    },
    sniper: {
        id: 'sniper',
        label: 'Cecchino',
        behavior: 'shooter',
        hp: 5,
        speed: 68,
        damage: 1,
        radius: 18,
        xpValue: 4,
        coinValue: 3,
        color: ARMED_ENEMY_COLOR,
        strokeColor: ARMED_ENEMY_STROKE_COLOR,
        iconKey: 'enemy-sniper',
        preferredDistance: 330,
        attackRange: 520,
        attackCooldown: 2450,
        projectile: {
            speed: 370,
            range: 640,
            damage: 2,
            radius: 5,
            color: ARMED_ENEMY_COLOR
        }
    },
    eliteBrute: {
        id: 'eliteBrute',
        label: 'Elite corazzato',
        behavior: 'brute',
        hp: 18,
        speed: 88,
        damage: 3,
        radius: 28,
        xpValue: 8,
        coinValue: 6,
        color: 0xdc2626,
        strokeColor: 0xfef2f2,
        iconKey: 'enemy-elite-brute'
    },
    bossDreadnought: {
        id: 'bossDreadnought',
        label: 'Dreadnought',
        behavior: 'shooter',
        hp: 54,
        speed: 58,
        damage: 4,
        radius: 38,
        xpValue: 22,
        coinValue: 16,
        color: ARMED_ENEMY_COLOR,
        strokeColor: ARMED_ENEMY_STROKE_COLOR,
        iconKey: 'enemy-boss-dreadnought',
        preferredDistance: 280,
        attackRange: 460,
        attackCooldown: 1650,
        projectile: {
            speed: 230,
            range: 520,
            damage: 2,
            radius: 9,
            color: ARMED_ENEMY_COLOR
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
    if (wave >= 8 && wave % 4 === 0 && spawnIndex === 0) {
        return 'bossDreadnought';
    }

    if (wave >= 6 && (spawnIndex + pulseCount + wave) % 13 === 0) {
        return 'eliteBrute';
    }

    if (wave >= 5 && (spawnIndex * 2 + wave) % 9 === 0) {
        return 'sniper';
    }

    if (wave >= 4 && (spawnIndex + wave) % 7 === 2) {
        return 'charger';
    }

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
    const heavyEnemy = typeId === 'brute' || typeId === 'eliteBrute' || typeId === 'bossDreadnought';
    const hpBonus = Math.floor(wave / (heavyEnemy ? 4 : 3));
    const speedBonus = Math.min(wave * (typeId === 'swarm' ? 5 : 4), heavyEnemy ? 34 : 62);
    const cooldownMultiplier = Math.max(0.72, 1 - wave * 0.025);

    return {
        hpBonus: typeId === 'bossDreadnought' ? hpBonus * 3 : hpBonus,
        speedBonus,
        cooldownMultiplier
    };
};
