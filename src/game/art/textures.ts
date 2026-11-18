import type { Scene } from "phaser";
import { SPRITES, badgeDocument, type IconId } from "./svg";

// Il loader di Phaser decodifica i data URI con atob: servono in base64.
const svgUrl = (svg: string) => {
  const bytes = new TextEncoder().encode(svg);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return `data:image/svg+xml;base64,${btoa(binary)}`;
};

/** Icone su badge rasterizzate come texture (chiave = "ico-<id>"). */
const ICON_TEXTURES: { id: IconId; color: string }[] = [
  { id: "special-magnet", color: "#22d3ee" },
  { id: "special-venom", color: "#a3e635" },
  { id: "special-emp", color: "#c4b5fd" },
  { id: "boss", color: "#f87171" },
];

const PNG_IMAGES: Record<string, string> = {
  player: "assets/images/starship.png",
  "enemy-chaser": "assets/images/enemy/chaser.png",
  "enemy-swarm": "assets/images/enemy/swarm.png",
  "enemy-brute": "assets/images/enemy/brute.png",
  "enemy-charger": "assets/images/enemy/charger.png",
  "enemy-shooter": "assets/images/enemy/shooter.png",
  "enemy-sniper": "assets/images/enemy/sniper.png",
  "enemy-carrier": "assets/images/enemy/carrier.png",
  "enemy-boss1": "assets/images/enemy/boss1.png",
  "enemy-boss2": "assets/images/enemy/boss2.png",
};

export const preloadArt = (scene: Scene) => {
  Object.entries(PNG_IMAGES).forEach(([key, path]) => scene.load.image(key, path));
  Object.entries(SPRITES).forEach(([key, svg]) => scene.load.svg(key, svgUrl(svg)));
  ICON_TEXTURES.forEach(({ id, color }) =>
    scene.load.svg(`ico-${id}`, svgUrl(badgeDocument(id, color, 64))),
  );
};

/** Texture procedurali: bagliori, scintille, proiettili e campi stellari. */
export const createProceduralTextures = (scene: Scene) => {
  const canvas = (key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
    if (scene.textures.exists(key)) return;
    const texture = scene.textures.createCanvas(key, w, h);
    if (!texture) return;
    draw(texture.getContext());
    texture.refresh();
  };

  canvas("glow", 64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });

  canvas("dot", 16, 16, (ctx) => {
    const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.6, "rgba(255,255,255,0.8)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
  });

  canvas("spark", 24, 6, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 24, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.7, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0.6)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(12, 3, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Proiettile: capsula luminosa orientata lungo l'asse X.
  canvas("bullet", 32, 14, (ctx) => {
    const g = ctx.createRadialGradient(20, 7, 0, 20, 7, 14);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.4, "rgba(255,255,255,0.85)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(16, 7, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(20, 7, 7, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  canvas("orb", 24, 24, (ctx) => {
    const g = ctx.createRadialGradient(12, 12, 0, 12, 12, 12);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.45, "rgba(255,255,255,0.95)");
    g.addColorStop(0.7, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 24, 24);
  });

  canvas("ring", 128, 128, (ctx) => {
    ctx.strokeStyle = "rgba(255,255,255,1)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.stroke();
  });

  const starLayer = (key: string, count: number, maxSize: number, alpha: number) =>
    canvas(key, 512, 512, (ctx) => {
      for (let i = 0; i < count; i += 1) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * maxSize + 0.3;
        const tint = ["#ffffff", "#bae6fd", "#fde68a", "#e9d5ff"][i % 4];
        ctx.globalAlpha = alpha * (0.4 + Math.random() * 0.6);
        ctx.fillStyle = tint;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    });

  starLayer("stars-far", 220, 0.9, 0.7);
  starLayer("stars-mid", 90, 1.4, 0.85);
  starLayer("stars-near", 28, 2.2, 1);

  canvas("nebula", 512, 512, (ctx) => {
    const blobs = [
      { x: 140, y: 160, r: 220, c: "56,189,248" },
      { x: 380, y: 330, r: 240, c: "168,85,247" },
      { x: 300, y: 90, r: 160, c: "236,72,153" },
    ];
    // Ogni blob viene ripetuto sui bordi per rendere la texture ripetibile.
    blobs.forEach(({ x, y, r, c }) => {
      for (const dx of [-512, 0, 512]) {
        for (const dy of [-512, 0, 512]) {
          const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
          g.addColorStop(0, `rgba(${c},0.16)`);
          g.addColorStop(1, `rgba(${c},0)`);
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, 512, 512);
        }
      }
    });
  });
};
