import { DEPLOY, DEPTH } from "../config";
import { isEvolved, tomeBonus } from "../data/upgrades";
import type { GameScene } from "../scenes/GameScene";
import type { Enemy, Mine, Turret } from "../types";
import { dist2 } from "../utils";
import { hitsAsteroid } from "./arena";
import { fireBullet, nearestEnemy } from "./weapons";

const near: Enemy[] = [];

/** Torrette (Q) e mine (E): si piazzano dove si trova la nave. */
export class Deployables {
  turrets: Turret[] = [];
  mines: Mine[] = [];

  constructor(private readonly g: GameScene) {}

  destroy() {
    this.turrets.forEach((t) => this.removeTurret(t));
    this.mines.forEach((m) => m.sprite.destroy());
    this.turrets = [];
    this.mines = [];
  }

  placeTurret() {
    const { g } = this;
    const { run } = g;
    if (this.turrets.length >= run.stats.maxTurrets) return g.toast("Torrette al massimo", "warning");
    if (run.coins < DEPLOY.turretCost) return g.toast(`Servono ${DEPLOY.turretCost} monete`, "coin");
    if (hitsAsteroid(g.arena, g.player.x, g.player.y, 24)) return;
    run.coins -= DEPLOY.turretCost;

    const { x, y } = g.player;
    const range = g.add
      .image(x, y, "ring")
      .setTint(0x22d3ee)
      .setAlpha(0.18)
      .setDepth(DEPTH.deployable - 1)
      .setDisplaySize(DEPLOY.turretRange * 2, DEPLOY.turretRange * 2);
    const base = g.add.image(x, y, "turret-base").setDisplaySize(52, 52).setDepth(DEPTH.deployable);
    const gun = g.add.image(x, y, "turret-gun").setDisplaySize(44, 44).setDepth(DEPTH.deployable + 1);
    const lifetime = DEPLOY.turretLifetime * (1 + tomeBonus(run, "engineering"));
    this.turrets.push({ base, gun, range, x, y, expiresAt: g.now + lifetime, nextShot: g.now + 300 });
    g.fx.ring(x, y, 0x22d3ee, 80);
    g.sfx("deploy");
    g.hints.trigger("turret-placed");
  }

  placeMine() {
    const { g } = this;
    const { run } = g;
    if (this.mines.length >= run.stats.maxMines) return g.toast("Mine al massimo", "warning");
    if (run.coins < DEPLOY.mineCost) return g.toast(`Servono ${DEPLOY.mineCost} monete`, "coin");
    run.coins -= DEPLOY.mineCost;
    const sprite = g.add.image(g.player.x, g.player.y, "mine").setDisplaySize(34, 34).setDepth(DEPTH.deployable).setAlpha(0.5);
    this.mines.push({ sprite, x: g.player.x, y: g.player.y, armedAt: g.now + DEPLOY.mineArmDelay });
    g.sfx("deploy");
  }

  update() {
    const { g } = this;
    const now = g.now;
    const power = g.run.stats.deployPower;

    this.turrets = this.turrets.filter((t) => {
      const left = t.expiresAt - now;
      if (left <= 0) {
        g.fx.burst(t.x, t.y, 0x22d3ee, 12);
        this.removeTurret(t);
        return false;
      }
      const blink = left < 3000 && Math.floor(now / 150) % 2 === 0;
      t.base.setAlpha(blink ? 0.4 : 1);
      t.gun.setAlpha(blink ? 0.4 : 1);

      const target = nearestEnemy(g, t.x, t.y, DEPLOY.turretRange);
      if (target) {
        const a = Math.atan2(target.y - t.y, target.x - t.x);
        t.gun.setRotation(a + Math.PI / 2);
        if (now >= t.nextShot) {
          const shots = isEvolved(g.run, "engineering") ? 2 : 1;
          for (let i = 0; i < shots; i += 1) {
            fireBullet(g, t.x, t.y, a + (i - (shots - 1) / 2) * 0.12, {
              damage: DEPLOY.turretDamage * power,
              speed: 720,
              range: DEPLOY.turretRange + 40,
              source: "turret",
              color: 0x67e8f9,
              scale: 0.9,
            });
          }
          t.nextShot = now + DEPLOY.turretInterval;
        }
      }
      return true;
    });

    const blastRadius = DEPLOY.mineBlastRadius * g.run.stats.mineRadius;
    this.mines = this.mines.filter((m) => {
      if (now < m.armedAt) return true;
      m.sprite.setAlpha(1);
      m.sprite.setTint(Math.floor(now / 300) % 2 === 0 ? 0xffffff : 0xfca5a5);
      g.enemyHash.query(m.x, m.y, DEPLOY.mineTriggerRadius + 40, near);
      const triggered = near.some((e) => !e.dead && dist2(m.x, m.y, e.x, e.y) < (DEPLOY.mineTriggerRadius + e.radius) ** 2);
      if (!triggered) return true;

      g.fx.explosion(m.x, m.y, 0xfb923c, 1.8);
      g.fx.ring(m.x, m.y, 0xfb923c, blastRadius);
      g.sfx("boom");
      g.shake(120, 0.006);
      g.enemyHash.query(m.x, m.y, blastRadius + 40, near);
      for (const e of near) {
        if (e.dead || dist2(m.x, m.y, e.x, e.y) > (blastRadius + e.radius) ** 2) continue;
        g.damageEnemy(e, DEPLOY.mineDamage * power, "mine", Math.atan2(e.y - m.y, e.x - m.x), 500);
      }
      m.sprite.destroy();
      return false;
    });
  }

  private removeTurret(t: Turret) {
    t.base.destroy();
    t.gun.destroy();
    t.range.destroy();
  }
}
