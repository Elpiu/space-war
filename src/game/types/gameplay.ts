export type PlayerStats = {
    maxHp: number;
    hp: number;
    speed: number;
    damage: number;
    fireRate: number;
    bulletSpeed: number;
    bulletRange: number;
    pickupRadius: number;
    multiShot: number;
};

export type Enemy = {
    body: Phaser.GameObjects.Arc;
    hp: number;
    speed: number;
    damage: number;
    xpValue: number;
    coinValue: number;
    radius: number;
};

export type Bullet = {
    body: Phaser.GameObjects.Arc;
    velocity: Phaser.Math.Vector2;
    damage: number;
    distanceLeft: number;
    radius: number;
};

export type Pickup = {
    body: Phaser.GameObjects.Arc;
    kind: 'xp' | 'coin';
    value: number;
    radius: number;
};

export type Upgrade = {
    title: string;
    description: string;
    apply: (stats: PlayerStats) => void;
};

export type HudState = {
    hp: number;
    maxHp: number;
    xp: number;
    xpToNext: number;
    level: number;
    coins: number;
    wave: number;
    enemyCount: number;
};
