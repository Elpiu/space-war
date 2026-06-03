import { Input, Math as PhaserMath, Scene, Utils } from 'phaser';
import {
    BULLET_RADIUS,
    ENEMY_RADIUS,
    GAME_HEIGHT,
    GAME_WIDTH,
    INITIAL_PLAYER_STATS,
    NODE_CENTER_X,
    NODE_CENTER_Y,
    NODE_RADIUS,
    PICKUP_RADIUS,
    PLAYER_HIT_COOLDOWN,
    PLAYER_RADIUS,
    WAVE_INTERVAL,
} from '../config/gameplay';
import { createUpgradePool } from '../data/upgrades';
import { createCentralNodeArena } from '../systems/arenaRenderer';
import { createPulse } from '../systems/effects';
import { createHud, updateHud } from '../systems/hud';
import type {
    Bullet,
    Enemy,
    Pickup,
    PlayerStats,
    Upgrade,
} from '../types/gameplay';
import {
    circlesOverlap,
    clampInsideNode,
    isInsideNode,
} from '../utils/geometry';

export class Game extends Scene {
    private player!: Phaser.GameObjects.Triangle;
    private playerTrail!: Phaser.GameObjects.Arc;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: Record<'w' | 'a' | 's' | 'd', Phaser.Input.Keyboard.Key>;
    private restartKey!: Phaser.Input.Keyboard.Key;
    private stats!: PlayerStats;
    private enemies: Enemy[] = [];
    private bullets: Bullet[] = [];
    private pickups: Pickup[] = [];
    private upgradePool: Upgrade[] = [];
    private upgradeOverlay: Phaser.GameObjects.Container | null = null;
    private hudText!: Phaser.GameObjects.Text;
    private stateText!: Phaser.GameObjects.Text;
    private xp = 0;
    private xpToNext = 6;
    private level = 1;
    private coins = 0;
    private wave = 0;
    private nextWaveAt = 0;
    private nextShotAt = 0;
    private invulnerableUntil = 0;
    private isLevelingUp = false;
    private isGameOver = false;

    constructor() {
        super('Game');
    }

    create() {
        this.createInput();
        createCentralNodeArena(this);

        const hud = createHud(this);
        this.hudText = hud.hudText;
        this.stateText = hud.stateText;
        this.upgradePool = createUpgradePool();

        this.startRun();
    }

    update(time: number, delta: number) {
        if (this.isGameOver) {
            if (Input.Keyboard.JustDown(this.restartKey)) {
                this.startRun();
            }

            return;
        }

        if (this.isLevelingUp) {
            return;
        }

        const dt = delta / 1000;

        this.updatePlayer(dt);
        this.updateShooting(time);
        this.updateBullets(dt);
        this.updateEnemies(dt, time);
        this.updatePickups(dt);
        this.updateWave(time);
        this.refreshHud();
    }

    private createInput() {
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = this.input.keyboard!.addKeys({
            w: Input.Keyboard.KeyCodes.W,
            a: Input.Keyboard.KeyCodes.A,
            s: Input.Keyboard.KeyCodes.S,
            d: Input.Keyboard.KeyCodes.D,
        }) as Record<'w' | 'a' | 's' | 'd', Phaser.Input.Keyboard.Key>;
        this.restartKey = this.input.keyboard!.addKey(
            Input.Keyboard.KeyCodes.R,
        );
    }

    private startRun() {
        this.clearRunObjects();

        this.stats = { ...INITIAL_PLAYER_STATS };
        this.xp = 0;
        this.xpToNext = 6;
        this.level = 1;
        this.coins = 0;
        this.wave = 0;
        this.nextWaveAt = 0;
        this.nextShotAt = 0;
        this.invulnerableUntil = 0;
        this.isLevelingUp = false;
        this.isGameOver = false;
        this.stateText.setText('');

        this.playerTrail = this.add
            .circle(NODE_CENTER_X, NODE_CENTER_Y, PLAYER_RADIUS + 9, 0x38bdf8, 0.18)
            .setDepth(25);
        this.player = this.add
            .triangle(
                NODE_CENTER_X,
                NODE_CENTER_Y,
                0,
                -24,
                18,
                20,
                -18,
                20,
                0x93c5fd,
                1,
            )
            .setDepth(30);
        this.spawnWave(0);
        this.refreshHud();
    }

    private clearRunObjects() {
        this.enemies.forEach((enemy) => enemy.body.destroy());
        this.bullets.forEach((bullet) => bullet.body.destroy());
        this.pickups.forEach((pickup) => pickup.body.destroy());
        this.enemies = [];
        this.bullets = [];
        this.pickups = [];
        this.upgradeOverlay?.destroy();
        this.upgradeOverlay = null;

        if (this.player) {
            this.player.destroy();
        }

        if (this.playerTrail) {
            this.playerTrail.destroy();
        }
    }

    private updatePlayer(dt: number) {
        const movement = new PhaserMath.Vector2(0, 0);

        if (this.cursors.left?.isDown || this.wasd.a.isDown) {
            movement.x -= 1;
        }

        if (this.cursors.right?.isDown || this.wasd.d.isDown) {
            movement.x += 1;
        }

        if (this.cursors.up?.isDown || this.wasd.w.isDown) {
            movement.y -= 1;
        }

        if (this.cursors.down?.isDown || this.wasd.s.isDown) {
            movement.y += 1;
        }

        if (movement.lengthSq() > 0) {
            movement.normalize().scale(this.stats.speed * dt);
            this.player.x += movement.x;
            this.player.y += movement.y;
            this.player.rotation = movement.angle() + Math.PI / 2;
        }

        clampInsideNode(this.player, PLAYER_RADIUS);
        this.playerTrail.setPosition(this.player.x, this.player.y);
        this.playerTrail.setAlpha(
            this.invulnerableUntil > this.time.now ? 0.34 : 0.18,
        );
        this.player.setAlpha(this.invulnerableUntil > this.time.now ? 0.55 : 1);
    }

    private updateShooting(time: number) {
        if (time < this.nextShotAt || this.enemies.length === 0) {
            return;
        }

        const target = this.findNearestEnemy();

        if (!target) {
            return;
        }

        const direction = new PhaserMath.Vector2(
            target.body.x - this.player.x,
            target.body.y - this.player.y,
        ).normalize();
        const angles = this.getShotAngles(direction.angle());

        angles.forEach((angle) => {
            const velocity = new PhaserMath.Vector2(
                Math.cos(angle),
                Math.sin(angle),
            ).scale(this.stats.bulletSpeed);
            const bullet = this.add
                .circle(this.player.x, this.player.y, BULLET_RADIUS, 0xfef08a, 1)
                .setDepth(20);

            this.bullets.push({
                body: bullet,
                velocity,
                damage: this.stats.damage,
                distanceLeft: this.stats.bulletRange,
                radius: BULLET_RADIUS,
            });
        });

        createPulse(this, this.player.x, this.player.y, 12, 0xfacc15, 0.35);
        this.nextShotAt = time + this.stats.fireRate;
    }

    private getShotAngles(baseAngle: number) {
        if (this.stats.multiShot === 1) {
            return [baseAngle];
        }

        const step = 0.22;
        const offset = ((this.stats.multiShot - 1) * step) / 2;

        return Array.from(
            { length: this.stats.multiShot },
            (_, index) => baseAngle - offset + index * step,
        );
    }

    private updateBullets(dt: number) {
        for (
            let bulletIndex = this.bullets.length - 1;
            bulletIndex >= 0;
            bulletIndex -= 1
        ) {
            const bullet = this.bullets[bulletIndex];
            const movement = bullet.velocity.clone().scale(dt);

            bullet.body.x += movement.x;
            bullet.body.y += movement.y;
            bullet.distanceLeft -= movement.length();

            const enemyIndex = this.enemies.findIndex((enemy) =>
                circlesOverlap(bullet.body, bullet.radius, enemy.body, enemy.radius),
            );

            if (enemyIndex !== -1) {
                this.damageEnemy(enemyIndex, bullet.damage);
                this.removeBullet(bulletIndex);
                continue;
            }

            if (
                bullet.distanceLeft <= 0 ||
                !isInsideNode(bullet.body.x, bullet.body.y, 24)
            ) {
                this.removeBullet(bulletIndex);
            }
        }
    }

    private updateEnemies(dt: number, time: number) {
        for (const enemy of this.enemies) {
            const direction = new PhaserMath.Vector2(
                this.player.x - enemy.body.x,
                this.player.y - enemy.body.y,
            );

            if (direction.lengthSq() > 0) {
                direction.normalize();
                enemy.body.x += direction.x * enemy.speed * dt;
                enemy.body.y += direction.y * enemy.speed * dt;
            }

            if (
                circlesOverlap(this.player, PLAYER_RADIUS, enemy.body, enemy.radius) &&
                time > this.invulnerableUntil
            ) {
                this.takeDamage(enemy.damage, time);
            }
        }
    }

    private updatePickups(dt: number) {
        for (let index = this.pickups.length - 1; index >= 0; index -= 1) {
            const pickup = this.pickups[index];
            const distance = PhaserMath.Distance.Between(
                this.player.x,
                this.player.y,
                pickup.body.x,
                pickup.body.y,
            );

            if (distance < this.stats.pickupRadius) {
                const pull = new PhaserMath.Vector2(
                    this.player.x - pickup.body.x,
                    this.player.y - pickup.body.y,
                );

                if (pull.lengthSq() > 0) {
                    pull.normalize().scale(360 * dt);
                    pickup.body.x += pull.x;
                    pickup.body.y += pull.y;
                }
            }

            if (distance < PLAYER_RADIUS + pickup.radius) {
                this.collectPickup(index);
            }
        }
    }

    private updateWave(time: number) {
        if (time >= this.nextWaveAt) {
            this.spawnWave(time);
        }
    }

    private spawnWave(time: number) {
        this.wave += 1;
        this.nextWaveAt = time + WAVE_INTERVAL;

        const enemyCount = 3 + this.wave * 2;
        const speedBonus = Math.min(this.wave * 6, 80);
        const hpBonus = Math.floor(this.wave / 3);

        for (let i = 0; i < enemyCount; i += 1) {
            const angle = PhaserMath.FloatBetween(0, Math.PI * 2);
            const radius = NODE_RADIUS - 24;
            const x = NODE_CENTER_X + Math.cos(angle) * radius;
            const y = NODE_CENTER_Y + Math.sin(angle) * radius;
            const isHeavy = this.wave >= 4 && i % 6 === 0;
            const body = this.add
                .circle(
                    x,
                    y,
                    isHeavy ? ENEMY_RADIUS + 6 : ENEMY_RADIUS,
                    isHeavy ? 0xf97316 : 0xef4444,
                    1,
                )
                .setDepth(15);

            this.enemies.push({
                body,
                hp: isHeavy ? 7 + hpBonus : 3 + hpBonus,
                speed: isHeavy ? 78 + speedBonus * 0.5 : 104 + speedBonus,
                damage: isHeavy ? 2 : 1,
                xpValue: isHeavy ? 3 : 1,
                coinValue: isHeavy ? 2 : 1,
                radius: isHeavy ? ENEMY_RADIUS + 6 : ENEMY_RADIUS,
            });
        }
    }

    private damageEnemy(enemyIndex: number, damage: number) {
        const enemy = this.enemies[enemyIndex];

        enemy.hp -= damage;
        enemy.body.setScale(1.18);
        this.tweens.add({
            targets: enemy.body,
            scale: 1,
            duration: 90,
        });

        if (enemy.hp <= 0) {
            this.dropPickup(enemy.body.x, enemy.body.y, 'xp', enemy.xpValue);

            if (PhaserMath.Between(0, 100) < 48) {
                this.dropPickup(
                    enemy.body.x + PhaserMath.Between(-8, 8),
                    enemy.body.y + PhaserMath.Between(-8, 8),
                    'coin',
                    enemy.coinValue,
                );
            }

            createPulse(this, enemy.body.x, enemy.body.y, 28, 0xfb7185, 0.32);
            enemy.body.destroy();
            this.enemies.splice(enemyIndex, 1);
        }
    }

    private dropPickup(
        x: number,
        y: number,
        kind: Pickup['kind'],
        value: number,
    ) {
        const color = kind === 'xp' ? 0x22d3ee : 0xfacc15;
        const pickup = this.add.circle(x, y, PICKUP_RADIUS, color, 1).setDepth(10);

        this.pickups.push({
            body: pickup,
            kind,
            value,
            radius: PICKUP_RADIUS,
        });
    }

    private collectPickup(index: number) {
        const pickup = this.pickups[index];

        if (pickup.kind === 'xp') {
            this.xp += pickup.value;
            this.checkLevelUp();
        } else {
            this.coins += pickup.value;
        }

        pickup.body.destroy();
        this.pickups.splice(index, 1);
        this.refreshHud();
    }

    private checkLevelUp() {
        if (this.xp < this.xpToNext) {
            return;
        }

        this.xp -= this.xpToNext;
        this.level += 1;
        this.xpToNext = Math.floor(this.xpToNext * 1.45 + 3);
        this.showUpgradeChoices();
    }

    private showUpgradeChoices() {
        this.isLevelingUp = true;

        const backdrop = this.add
            .rectangle(
                NODE_CENTER_X,
                NODE_CENTER_Y,
                GAME_WIDTH,
                GAME_HEIGHT,
                0x020617,
                0.72,
            )
            .setDepth(300);
        const title = this.add
            .text(512, 174, 'LEVEL UP', {
                fontFamily: 'Arial Black',
                fontSize: 44,
                color: '#ffffff',
                stroke: '#0f172a',
                strokeThickness: 8,
            })
            .setOrigin(0.5)
            .setDepth(301);
        const choices = Utils.Array.Shuffle([...this.upgradePool]).slice(
            0,
            3,
        );
        const cardObjects: Phaser.GameObjects.GameObject[] = [backdrop, title];

        choices.forEach((upgrade, index) => {
            const x = 246 + index * 266;
            const background = this.add
                .rectangle(x, 400, 230, 170, 0x172554, 0.94)
                .setStrokeStyle(2, 0x38bdf8, 0.9)
                .setInteractive({ useHandCursor: true })
                .setDepth(301);
            const cardTitle = this.add
                .text(x, 350, upgrade.title, {
                    fontFamily: 'Arial Black',
                    fontSize: 20,
                    color: '#f8fafc',
                    align: 'center',
                    wordWrap: { width: 194 },
                })
                .setOrigin(0.5)
                .setDepth(302);
            const description = this.add
                .text(x, 420, upgrade.description, {
                    fontFamily: 'Arial',
                    fontSize: 17,
                    color: '#bae6fd',
                    align: 'center',
                    wordWrap: { width: 190 },
                })
                .setOrigin(0.5)
                .setDepth(302);

            background.on('pointerdown', () => {
                upgrade.apply(this.stats);
                this.closeUpgradeOverlay();
            });

            cardObjects.push(background, cardTitle, description);
        });

        this.upgradeOverlay = this.add.container(0, 0, cardObjects).setDepth(300);
        this.refreshHud();
    }

    private closeUpgradeOverlay() {
        this.upgradeOverlay?.destroy();
        this.upgradeOverlay = null;
        this.isLevelingUp = false;
        this.refreshHud();
    }

    private takeDamage(damage: number, time: number) {
        this.stats.hp -= damage;
        this.invulnerableUntil = time + PLAYER_HIT_COOLDOWN;
        this.cameras.main.shake(90, 0.006);

        if (this.stats.hp <= 0) {
            this.endRun();
        }

        this.refreshHud();
    }

    private endRun() {
        this.isGameOver = true;
        this.stats.hp = 0;
        this.stateText.setText(
            `RUN TERMINATA\nMonete raccolte: ${this.coins}\nPremi R per ripartire`,
        );
        this.player.setFillStyle(0x64748b, 0.8);
        this.playerTrail.setVisible(false);
    }

    private refreshHud() {
        updateHud(this.hudText, {
            hp: this.stats.hp,
            maxHp: this.stats.maxHp,
            xp: this.xp,
            xpToNext: this.xpToNext,
            level: this.level,
            coins: this.coins,
            wave: this.wave,
            enemyCount: this.enemies.length,
        });
    }

    private findNearestEnemy() {
        let nearest: Enemy | null = null;
        let nearestDistance = Number.MAX_VALUE;

        for (const enemy of this.enemies) {
            const distance = PhaserMath.Distance.Squared(
                this.player.x,
                this.player.y,
                enemy.body.x,
                enemy.body.y,
            );

            if (distance < nearestDistance) {
                nearest = enemy;
                nearestDistance = distance;
            }
        }

        return nearest;
    }

    private removeBullet(index: number) {
        this.bullets[index].body.destroy();
        this.bullets.splice(index, 1);
    }
}
