import { BlendModes, type GameObjects } from "phaser";
import { DEPTH, VIEW_W } from "../config";
import type { CampaignLoadout, Mount } from "../modes/campaign/profile";
import type { GameScene } from "../scenes/GameScene";
import type { Enemy } from "../types";
import { Arsenal, fireBullet } from "./weapons";

/** Sistema d'arma della nave: tutto ciò che una modalità monta sulla nave. */
export interface Armament {
  update(dt: number): void;
  destroy(): void;
}

const OVERHEAT_RESUME = 0.35;

/**
 * Armi a slot della campagna: frontali e posteriori sparano insieme finché il
 * fuoco è tenuto e generano calore; i missili partono da soli; le bombe usano
 * un indicatore che si ricarica.
 */
export class WeaponRack implements Armament {
  heat = 0;
  overheated = false;
  bombCharge = 1;
  /** Profilo di fuoco attivo (1 = tutte le armi). */
  profile: 1 | 2 | 3 = 1;
  private guns: { mount: Mount; nextShot: number }[];
  private beams: { mount: Mount; nextTick: number }[];
  private missiles: { mount: Mount; nextShot: number }[];
  private bomb: Mount | undefined;
  private support: Arsenal;
  private beamGfx: GameObjects.Graphics;

  constructor(
    private readonly g: GameScene,
    readonly loadout: CampaignLoadout,
  ) {
    const mounts = loadout.mounts;
    const guns = mounts.filter((m) => m.slot === "front" || m.slot === "rear");
    this.guns = guns.filter((m) => !m.spec.beam).map((mount) => ({ mount, nextShot: 0 }));
    this.beams = guns.filter((m) => m.spec.beam).map((mount) => ({ mount, nextTick: 0 }));
    this.missiles = mounts.filter((m) => m.slot === "missile").map((mount) => ({ mount, nextShot: 600 }));
    this.bomb = mounts.find((m) => m.slot === "bomb");
    this.support = new Arsenal(g, { blaster: false });
    this.beamGfx = g.add.graphics().setDepth(DEPTH.bullet).setBlendMode(BlendModes.ADD);
  }

  get heatCap() {
    return this.loadout.rack.heatCap;
  }

  get hasBomb() {
    return Boolean(this.bomb);
  }

  get hasMissiles() {
    return this.missiles.length > 0;
  }

  get missileReady() {
    const next = Math.min(...this.missiles.map((m) => m.nextShot));
    const interval = this.missiles[0]?.mount.spec.interval ?? 1;
    return Math.max(0, Math.min(1, 1 - (next - this.g.now) / (interval / this.loadout.rack.rateMul)));
  }

  destroy() {
    this.support.destroy();
    this.beamGfx.destroy();
  }

  update(dt: number) {
    const { g } = this;
    const rack = this.loadout.rack;
    if (g.controls.profile && g.controls.profile !== this.profile) {
      this.profile = g.controls.profile as 1 | 2 | 3;
      g.toast(`Profilo di fuoco ${this.profile}${this.profile === 1 ? ": tutte le armi" : ""}`, "gear-blaster");
    }
    const firing = g.controls.firing && !this.overheated;
    this.beamGfx.clear();

    // Il calore scende sempre, più in fretta quando non si spara.
    this.heat = Math.max(0, this.heat - rack.heatSink * (firing ? 1 : 1.7) * dt);
    if (this.overheated && this.heat <= rack.heatCap * OVERHEAT_RESUME) {
      this.overheated = false;
      g.sfx("shield");
    }

    if (firing) {
      for (const gun of this.guns) {
        if (g.now < gun.nextShot || !this.active(gun.mount)) continue;
        this.fireGun(gun.mount);
        gun.nextShot = g.now + gun.mount.spec.interval / rack.rateMul;
        this.heat += gun.mount.spec.heat;
      }
      for (const beam of this.beams) {
        if (!this.active(beam.mount)) continue;
        this.fireBeam(beam);
        this.heat += beam.mount.spec.heat * dt;
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
      if (!targetAhead || g.now < launcher.nextShot || !this.active(launcher.mount)) continue;
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

  /** L'arma è accesa nel profilo di fuoco corrente? */
  private active(mount: Mount) {
    if (this.profile === 1) return true;
    return this.loadout.fireProfiles[this.profile].includes(`${mount.slot}${mount.index}`);
  }

  /** Le armi frontali sono distribuite in verticale sul muso. */
  private muzzle(mount: Mount) {
    const { g } = this;
    const front = mount.slot === "front";
    const fronts = this.loadout.mounts.filter((m) => m.slot === "front").length;
    const offsetY = front ? (mount.index - (fronts - 1) / 2) * 12 : 0;
    return { x: g.player.x + (front ? 20 : -20), y: g.player.y + offsetY, angle: front ? 0 : Math.PI };
  }

  private fireGun(mount: Mount) {
    const { g } = this;
    const spec = mount.spec;
    const { x, y, angle } = this.muzzle(mount);
    for (let i = 0; i < spec.projectiles; i += 1) {
      const jitter = spec.jitter ? (Math.random() - 0.5) * spec.jitter * 2 : 0;
      fireBullet(g, x, y, angle + (i - (spec.projectiles - 1) / 2) * spec.spread + jitter, {
        damage: spec.damage * this.loadout.rack.damageMul,
        speed: spec.speed,
        range: spec.range,
        source: "blaster",
        color: spec.color,
        pierce: spec.pierce,
        bounce: spec.bounce,
        blast: spec.blast,
        scale: spec.scale,
        texture: spec.texture,
      });
    }
    g.sfx("shoot");
  }

  /** Laser: colpisce i primi nemici sulla linea di tiro, fino al terreno. */
  private fireBeam(beam: { mount: Mount; nextTick: number }) {
    const { g } = this;
    const spec = beam.mount.spec;
    const { x, y } = this.muzzle(beam.mount);
    let endX = x + spec.range;
    for (let px = x; px < endX; px += 20) {
      if (g.solidAt(px, y, 3)) {
        endX = px;
        break;
      }
    }
    const hits = g.enemies
      .filter((e: Enemy) => !e.dead && e.x > x && e.x - e.radius < endX && Math.abs(e.y - y) < e.radius + 6)
      .sort((a, b) => a.x - b.x)
      .slice(0, 1 + (spec.pierce ?? 0));
    if (hits.length > 0 && !spec.pierce) endX = hits[0].x;

    const flicker = 0.75 + Math.random() * 0.25;
    this.beamGfx.lineStyle(14, spec.color, 0.25 * flicker);
    this.beamGfx.lineBetween(x, y, endX, y);
    this.beamGfx.lineStyle(4, 0xffffff, 0.9 * flicker);
    this.beamGfx.lineBetween(x, y, endX, y);
    if (hits.length > 0 && Math.random() < 0.5) g.fx.burst(endX, y, spec.color, 2);

    if (g.now >= beam.nextTick) {
      const damage = spec.damage * this.loadout.rack.damageMul * (spec.interval / 1000) * this.loadout.rack.rateMul;
      hits.forEach((e) => g.damageEnemy(e, damage, "blaster", 0, 20));
      beam.nextTick = g.now + spec.interval;
      g.sfx("zap");
    }
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
      groundMul: spec.groundMul,
      scale: spec.scale,
      texture: spec.texture,
    });
    g.sfx("deploy");
    g.hints.trigger("bomb");
  }
}
