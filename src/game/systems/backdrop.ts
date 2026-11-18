import { BlendModes, type GameObjects, type Scene } from "phaser";
import { DEPTH, VIEW_H, VIEW_W } from "../config";

type Kind = "open" | "debris" | "surface" | "cave" | "station" | "boss";

/** Disegna una volta le texture degli sfondi di segmento. */
const ensureTextures = (scene: Scene) => {
  const canvas = (key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
    if (scene.textures.exists(key)) return;
    const t = scene.textures.createCanvas(key, w, h);
    if (!t) return;
    draw(t.getContext());
    t.refresh();
  };

  canvas("bg-surface", VIEW_W, VIEW_H, (ctx) => {
    const g = ctx.createLinearGradient(0, VIEW_H * 0.45, 0, VIEW_H);
    g.addColorStop(0, "rgba(45,212,191,0)");
    g.addColorStop(1, "rgba(45,212,191,0.22)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  });

  // Catena montuosa ripetibile, con il bordo illuminato.
  canvas("bg-mountains", 1024, 240, (ctx) => {
    const peaks = (base: number, amp: number, step: number, color: string, rim: string, seed: number) => {
      ctx.beginPath();
      ctx.moveTo(0, 240);
      for (let x = 0; x <= 1024; x += step) {
        const y = base - Math.abs(Math.sin(x * 0.006 + seed) * amp + Math.sin(x * 0.017 + seed * 2) * amp * 0.4);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(1024, 240);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = rim;
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    peaks(170, 110, 32, "rgba(13,32,44,0.9)", "rgba(45,212,191,0.35)", 1.3);
    peaks(215, 60, 24, "rgba(8,20,30,0.95)", "rgba(45,212,191,0.5)", 4.1);
  });

  canvas("bg-cave", VIEW_W, VIEW_H, (ctx) => {
    const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.25, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.7);
    g.addColorStop(0, "rgba(30,10,60,0)");
    g.addColorStop(1, "rgba(30,10,60,0.85)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  });

  canvas("bg-station", 256, 256, (ctx) => {
    ctx.strokeStyle = "rgba(56,189,248,0.10)";
    ctx.lineWidth = 2;
    for (let i = 0; i <= 256; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(56,189,248,0.25)";
    for (let i = 0; i <= 256; i += 64) for (let j = 0; j <= 256; j += 64) ctx.fillRect(i - 2, j - 2, 4, 4);
  });

  canvas("bg-debris", VIEW_W, VIEW_H, (ctx) => {
    for (let i = 0; i < 5; i += 1) {
      const x = (i / 5) * VIEW_W + 120;
      const y = VIEW_H * (0.25 + (i % 2) * 0.45);
      const g = ctx.createRadialGradient(x, y, 0, x, y, 320);
      g.addColorStop(0, "rgba(234,88,12,0.14)");
      g.addColorStop(1, "rgba(234,88,12,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  });
};

/**
 * Atmosfera per segmento nella campagna: strati fissati alla camera che
 * entrano e escono in dissolvenza quando cambia il tipo di segmento.
 */
export class Backdrop {
  private layers: Partial<Record<Kind, (GameObjects.Image | GameObjects.TileSprite)[]>> = {};
  private mountains: GameObjects.TileSprite;
  private grid: GameObjects.TileSprite;
  readonly objects: GameObjects.GameObject[] = [];

  constructor(scene: Scene) {
    ensureTextures(scene);
    const fixed = <T extends GameObjects.Image | GameObjects.TileSprite>(o: T) => {
      o.setScrollFactor(0).setDepth(DEPTH.background + 1).setAlpha(0);
      this.objects.push(o);
      return o;
    };
    this.mountains = fixed(scene.add.tileSprite(VIEW_W / 2, VIEW_H - 120, VIEW_W, 240, "bg-mountains"));
    this.grid = fixed(scene.add.tileSprite(VIEW_W / 2, VIEW_H / 2, VIEW_W, VIEW_H, "bg-station"));
    this.layers = {
      surface: [fixed(scene.add.image(VIEW_W / 2, VIEW_H / 2, "bg-surface").setBlendMode(BlendModes.ADD)), this.mountains],
      cave: [fixed(scene.add.image(VIEW_W / 2, VIEW_H / 2, "bg-cave"))],
      station: [this.grid],
      debris: [fixed(scene.add.image(VIEW_W / 2, VIEW_H / 2, "bg-debris").setBlendMode(BlendModes.ADD))],
      boss: [fixed(scene.add.image(VIEW_W / 2, VIEW_H / 2, "bg-cave").setTint(0xff6666))],
    };
  }

  update(kind: Kind, scrollX: number, dt: number) {
    const k = Math.min(1, dt * 1.5);
    (Object.keys(this.layers) as Kind[]).forEach((key) => {
      const target = key === kind ? 1 : 0;
      this.layers[key]!.forEach((o) => o.setAlpha(o.alpha + (target - o.alpha) * k));
    });
    this.mountains.tilePositionX = scrollX * 0.25;
    this.grid.tilePositionX = scrollX * 0.5;
  }
}
