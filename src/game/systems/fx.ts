import { BlendModes, Math as PMath, type GameObjects, type Scene } from "phaser";
import { DEPTH, VIEW_H, VIEW_W } from "../config";
import { fmt, hex } from "../utils";

/** Feedback visivo: particelle, numeri di danno, anelli, fulmini, frecce. */
export class Fx {
  private sparks: GameObjects.Particles.ParticleEmitter;
  private debris: GameObjects.Particles.ParticleEmitter;
  private trail: GameObjects.Particles.ParticleEmitter;
  private numbers: GameObjects.Text[] = [];
  private lines: GameObjects.Graphics;
  private arrows: GameObjects.Graphics;
  private lineUntil = 0;

  constructor(private readonly scene: Scene) {
    this.sparks = scene.add
      .particles(0, 0, "spark", {
        speed: { min: 120, max: 420 },
        lifespan: { min: 200, max: 480 },
        scale: { start: 1.2, end: 0 },
        alpha: { start: 1, end: 0 },
        rotate: { onEmit: (p) => (p ? (Math.atan2(p.velocityY, p.velocityX) * 180) / Math.PI : 0) },
        blendMode: BlendModes.ADD,
        emitting: false,
      })
      .setDepth(DEPTH.fx);
    this.debris = scene.add
      .particles(0, 0, "dot", {
        speed: { min: 30, max: 160 },
        lifespan: { min: 300, max: 700 },
        scale: { start: 1, end: 0.2 },
        alpha: { start: 0.9, end: 0 },
        blendMode: BlendModes.ADD,
        emitting: false,
      })
      .setDepth(DEPTH.fx);
    this.trail = scene.add
      .particles(0, 0, "dot", {
        speed: { min: 5, max: 25 },
        lifespan: 380,
        scale: { start: 0.9, end: 0 },
        alpha: { start: 0.7, end: 0 },
        blendMode: BlendModes.ADD,
        emitting: false,
      })
      .setDepth(DEPTH.player - 1);
    this.lines = scene.add.graphics().setDepth(DEPTH.fx).setBlendMode(BlendModes.ADD);
    this.arrows = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH.overlay);
  }

  burst(x: number, y: number, color: number, count = 10) {
    this.sparks.setParticleTint(color);
    this.sparks.explode(count, x, y);
  }

  explosion(x: number, y: number, color: number, size = 1) {
    this.sparks.setParticleTint(color);
    this.sparks.explode(Math.round(14 * size), x, y);
    this.debris.setParticleTint(0xffffff);
    this.debris.explode(Math.round(8 * size), x, y);
    const flash = this.scene.add
      .image(x, y, "glow")
      .setTint(color)
      .setBlendMode(BlendModes.ADD)
      .setDepth(DEPTH.fx)
      .setDisplaySize(60 * size, 60 * size);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      displayWidth: 150 * size,
      displayHeight: 150 * size,
      duration: 260,
      onComplete: () => flash.destroy(),
    });
  }

  trailDot(x: number, y: number, color: number) {
    this.trail.setParticleTint(color);
    this.trail.emitParticleAt(x, y, 1);
  }

  ring(x: number, y: number, color: number, radius: number, duration = 380) {
    const ring = this.scene.add
      .image(x, y, "ring")
      .setTint(color)
      .setBlendMode(BlendModes.ADD)
      .setDepth(DEPTH.fx)
      .setDisplaySize(radius * 0.3, radius * 0.3);
    this.scene.tweens.add({
      targets: ring,
      displayWidth: radius * 2,
      displayHeight: radius * 2,
      alpha: 0,
      duration,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
  }

  /** Scritta grande che sale e svanisce (annunci delle combo). */
  callout(x: number, y: number, text: string, color: number, big = false) {
    const label = this.scene.add
      .text(x, y, text, { fontFamily: "Orbitron, Arial Black, sans-serif", fontSize: big ? "34px" : "24px", color: hex(color), stroke: "#0b1020", strokeThickness: 6 })
      .setOrigin(0.5)
      .setDepth(DEPTH.text + 1)
      .setScale(0.6);
    this.scene.tweens.add({ targets: label, scale: 1, duration: 140, ease: "Back.easeOut" });
    this.scene.tweens.add({ targets: label, y: y - 60, alpha: 0, delay: 500, duration: 600, onComplete: () => label.destroy() });
  }

  damageNumber(x: number, y: number, value: number, color = 0xffffff, big = false) {
    let text = this.numbers.find((t) => !t.active);
    if (!text) {
      if (this.numbers.length > 48) return;
      text = this.scene.add
        .text(0, 0, "", { fontFamily: "Orbitron, Arial Black, sans-serif", fontSize: "16px", stroke: "#0b1020", strokeThickness: 4 })
        .setOrigin(0.5)
        .setDepth(DEPTH.text);
      this.numbers.push(text);
    }
    text
      .setActive(true)
      .setVisible(true)
      .setText(fmt(Math.round(value * 10) / 10))
      .setColor(hex(color))
      .setFontSize(big ? 24 : 15)
      .setPosition(x + (Math.random() - 0.5) * 16, y - 10)
      .setAlpha(1)
      .setScale(big ? 1.3 : 1);
    this.scene.tweens.add({
      targets: text,
      y: y - 46,
      alpha: 0,
      scale: 1,
      duration: 620,
      ease: "Cubic.easeOut",
      onComplete: () => text!.setActive(false).setVisible(false),
    });
  }

  /** Fulmine a zig-zag fra una sequenza di punti. */
  lightning(points: { x: number; y: number }[], color: number, now: number) {
    if (this.lineUntil < now) this.lines.clear();
    this.lineUntil = now + 110;
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      const segments = 6;
      const path = [new PMath.Vector2(a.x, a.y)];
      for (let s = 1; s < segments; s += 1) {
        const t = s / segments;
        path.push(new PMath.Vector2(a.x + (b.x - a.x) * t + (Math.random() - 0.5) * 22, a.y + (b.y - a.y) * t + (Math.random() - 0.5) * 22));
      }
      path.push(new PMath.Vector2(b.x, b.y));
      this.lines.lineStyle(6, color, 0.35);
      this.lines.strokePoints(path);
      this.lines.lineStyle(2, 0xffffff, 1);
      this.lines.strokePoints(path);
    }
  }

  update(now: number) {
    if (this.lineUntil && now > this.lineUntil) {
      this.lines.clear();
      this.lineUntil = 0;
    }
  }

  /** Frecce ai bordi dello schermo verso bersagli fuori vista. */
  drawArrows(targets: { x: number; y: number; color: number; size?: number }[]) {
    const cam = this.scene.cameras.main;
    const g = this.arrows;
    g.clear();
    const view = cam.worldView;
    const cx = VIEW_W / 2;
    const cy = VIEW_H / 2;
    const margin = 34;

    targets.forEach(({ x, y, color, size = 1 }) => {
      if (x > view.x && x < view.right && y > view.y && y < view.bottom) return;
      const sx = (x - view.x) * cam.zoom;
      const sy = (y - view.y) * cam.zoom;
      const angle = Math.atan2(sy - cy, sx - cx);
      const tx = (cx - margin) / Math.abs(Math.cos(angle) || 0.0001);
      const ty = (cy - margin) / Math.abs(Math.sin(angle) || 0.0001);
      const d = Math.min(tx, ty);
      const ax = cx + Math.cos(angle) * d;
      const ay = cy + Math.sin(angle) * d;
      const s = 13 * size;
      const p = (r: number, a: number) => ({ x: ax + Math.cos(angle + a) * r, y: ay + Math.sin(angle + a) * r });
      g.fillStyle(0x0b1020, 0.8);
      g.fillCircle(ax, ay, s * 1.1);
      g.fillStyle(color, 1);
      g.fillTriangle(p(s, 0).x, p(s, 0).y, p(s * 0.8, 2.4).x, p(s * 0.8, 2.4).y, p(s * 0.8, -2.4).x, p(s * 0.8, -2.4).y);
    });
  }

  clearArrows() {
    this.arrows.clear();
  }

  pause(paused: boolean) {
    [this.sparks, this.debris, this.trail].forEach((emitter) => (paused ? emitter.pause() : emitter.resume()));
  }
}
