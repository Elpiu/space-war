import { VIEW_W } from "../config";
import type { CampaignLoadout, Mount } from "../modes/campaign/profile";
import type { GameScene } from "../scenes/GameScene";
import { Arsenal, fireBullet } from "./weapons";

/** Sistema d'arma della campagna: tutto ciò che un modo di gioco monta sulla nave. */
export interface Armament {
  update(dt: number): void;
  destroy(): void;
}

const OVERHEAT_RESUME = 0.35;

/**
 * Armi a slot: frontali e posteriori sparano insieme finché il fuoco è tenuto
 * e generano calore; i missili partono da soli; le bombe usano un indicatore.
 */
export class WeaponRack implements Armament {
  heat = 0;
  overheated = false;
  bombCharge = 1;
  private guns: { mount: Mount; nextShot: number }[];
  private missiles: { mount: Mount; nextShot: number }[];
  private bomb: Mount | undefined;
  private support: Arsenal;

  constructor(
    private readonly g: GameScene,
    readonly loadout: CampaignLoadout,
  ) {
    const mounts = loadout.mounts;
    this.guns = mounts.filter((m) => m.slot === "front" || m.slot === "rear").map((mount) => ({ mount, nextShot: 0 }));
    this.missiles = mounts.filter((m) => m.slot === "missile").map((mount) => ({ mount, nextShot: 600 }));
    this.bomb = mounts.find((m) => m.slot === "bomb");
    this.support = new Arsenal(g, { blaster: false });
  }

  get heatCap() {
    return this.loadout.rack.heatCap;
  }

  get hasBomb() {
    return Boolean(this.bomb);
  }

  get missileReady() {
    const next = Math.min(...this.missiles.map((m) => m.nextShot));
    const interval = this.missiles[0]?.mount.spec.interval ?? 1;
    return Math.max(0, Math.min(1, 1 - (next - this.g.now) / (interval / this.loadout.rack.rateMul)));
  }

  get hasMissiles() {
    return this.missiles.length > 0;
  }

  destroy() {
    this.support.destroy();
  }

  update(dt: number) {
    const { g } = this;
    const rack = this.loadout.rack;
    const firing = g.controls.firing && !this.overheated;

    // Il calore scende sempre, più in fretta quando non si spara.
    this.heat = Math.max(0, this.heat - rack.heatSink * (firing ? 1 : 1.7) * dt);
    if (this.overheated && this.heat <= rack.heatCap * OVERHEAT_RESUME) {
      this.overheated = false;
      g.sfx("shield");
    }

    if (firing) {
      for (const gun of this.guns) {
        if (g.now < gun.nextShot) continue;
        this.fireGun(gun.mount);
        gun.nextShot = g.now + gun.mount.spec.interval / rack.rateMul;
        this.heat += gun.mount.spec.heat;
      }
      if (this.heat >= rack.heatCap) {
        this.heat = rack.heatCap;
        this.overheated = true;
        g.sfx("hurt");
        g.toast("Surriscaldamento!", "heat", "warning");
        g.hints.trigger("overheat");
      }
    }

    // Missili: niente calore, partono quando c'è un bersaglio davanti.
    const targetAhead = g.enemies.some((e) => !e.dead && e.x > g.player.x && e.x < g.cameras.main.scrollX + VIEW_W + 40);
    for (const launcher of this.missiles) {
      if (!targetAhead || g.now < launcher.nextShot) continue;
      this.fireMissiles(launcher.mount);
      launcher.nextShot = g.now + launcher.mount.spec.interval / rack.rateMul;
    }

    if (this.bomb) {
      this.bombCharge = Math.min(1, this.bombCharge + (dt * 1000 * rack.bombRate) / this.bomb.spec.interval);
      if (g.controls.bomb && this.bombCharge >= 1) {
        this.dropBomb(this.bomb);
        this.bombCharge = 0;
      }
    }

    this.support.update(dt);
  }

  private fireGun(mount: Mount) {
    const { g } = this;
    const spec = mount.spec;
    const front = mount.slot === "front";
    const fronts = this.guns.filter((gun) => gun.mount.slot === "front").length;
    // Le armi frontali sono distribuite in verticale sul muso.
    const offsetY = front ? (mount.index - (fronts - 1) / 2) * 12 : 0;
    const x = g.player.x + (front ? 20 : -20);
    const y = g.player.y + offsetY;
    const base = front ? 0 : Math.PI;
    for (let i = 0; i < spec.projectiles; i += 1) {
      const jitter = spec.jitter ? (Math.random() - 0.5) * spec.jitter * 2 : 0;
      fireBullet(g, x, y, base + (i - (spec.projectiles - 1) / 2) * spec.spread + jitter, {
        damage: spec.damage * this.loadout.rack.damageMul,
        speed: spec.speed,
        range: spec.range,
        source: "blaster",
        color: spec.color,
        pierce: spec.pierce,
        scale: spec.scale,
        texture: spec.texture,
      });
    }
    g.sfx("shoot");
  }

  private fireMissiles(mount: Mount) {
    const { g } = this;
    const spec = mount.spec;
    for (let i = 0; i < spec.projectiles; i += 1) {
      const side = (i - (spec.projectiles - 1) / 2) * spec.spread;
      fireBullet(g, g.player.x, g.player.y + (i % 2 ? 10 : -10), side, {
        damage: spec.damage * this.loadout.rack.damageMul,
        speed: spec.speed,
        range: spec.range,
        source: "missile",
        color: spec.color,
        homing: spec.homing,
        blast: spec.blast,
        scale: spec.scale,
        texture: spec.texture,
      });
    }
    g.sfx("dash");
  }

  private dropBomb(mount: Mount) {
    const { g } = this;
    const spec = mount.spec;
    fireBullet(g, g.player.x, g.player.y + 14, 0, {
      damage: spec.damage * this.loadout.rack.damageMul,
      speed: spec.speed,
      range: spec.range,
      source: "bomb",
      color: spec.color,
      gravity: spec.gravity,
      blast: spec.blast,
      scale: spec.scale,
      texture: spec.texture,
    });
    g.sfx("deploy");
    g.hints.trigger("bomb");
  }
}
