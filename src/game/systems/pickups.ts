import { BlendModes } from "phaser";
import { COLORS, DEPTH, LIMITS, PLAYER_RADIUS } from "../config";
import type { GameScene } from "../scenes/GameScene";
import type { Pickup, PickupKind } from "../types";
import { dist2, rand } from "../utils";
import { hitsAsteroid } from "./arena";
import { clampToGap } from "./terrain";

const LOOK: Record<PickupKind, { texture: string; size: number; glow?: number }> = {
  xp: { texture: "gem-s", size: 16 },
  coin: { texture: "coin", size: 18 },
  heart: { texture: "heart", size: 26, glow: COLORS.heal },
  magnet: { texture: "ico-special-magnet", size: 30, glow: 0x22d3ee },
  venom: { texture: "ico-special-venom", size: 30, glow: 0xa3e635 },
  emp: { texture: "ico-special-emp", size: 30, glow: 0xa78bfa },
  chest: { texture: "chest", size: 46, glow: 0xfbbf24 },
  capsule: { texture: "capsule", size: 40, glow: 0xa855f7 },
};

const gemLook = (value: number) =>
  value >= 20 ? { texture: "gem-l", size: 26 } : value >= 5 ? { texture: "gem-m", size: 21 } : { texture: "gem-s", size: 16 };

export const dropPickup = (g: GameScene, kind: PickupKind, x: number, y: number, value = 1): Pickup => {
  // Troppe gemme a terra: la nuova si fonde con la più vicina.
  if (kind === "xp") {
    const gems = g.pickups.filter((p) => p.active && p.kind === "xp");
    if (gems.length >= LIMITS.maxGems) {
      let best = gems[0];
      let bestD = Infinity;
      for (const gem of gems) {
        const d = dist2(gem.x, gem.y, x, y);
        if (d < bestD) {
          bestD = d;
          best = gem;
        }
      }
      best.value += value;
      const look = gemLook(best.value);
      best.sprite.setTexture(look.texture).setDisplaySize(look.size, look.size);
      return best;
    }
  }

  const look = kind === "xp" ? gemLook(value) : LOOK[kind];
  let p = g.pickups.find((entry) => !entry.active && entry.kind === kind);
  if (!p) {
    const sprite = g.add.image(x, y, look.texture).setDepth(DEPTH.pickup);
    const glowColor = LOOK[kind].glow;
    const glow = glowColor
      ? g.add.image(x, y, "glow").setTint(glowColor).setBlendMode(BlendModes.ADD).setDepth(DEPTH.pickup - 1).setDisplaySize(look.size * 2.6, look.size * 2.6)
      : undefined;
    p = { kind, sprite, glow, x, y, value, pulled: false, active: true };
    g.pickups.push(p);
  }
  p.x = x;
  p.y = y;
  p.value = value;
  p.pulled = false;
  p.active = true;
  p.sprite.setTexture(look.texture).setDisplaySize(look.size, look.size).setActive(true).setVisible(true).setPosition(x, y);
  p.glow?.setActive(true).setVisible(true).setPosition(x, y);
  return p;
};

/** Posiziona una chest lontana dalla nave ma raggiungibile. */
export const dropChestNearby = (g: GameScene) => {
  for (let tries = 0; tries < 30; tries += 1) {
    const a = rand(0, Math.PI * 2);
    const d = rand(450, 800);
    const x = g.player.x + Math.cos(a) * d;
    const y = g.player.y + Math.sin(a) * d;
    if (x < 80 || y < 80 || x > g.arena.width - 80 || y > g.arena.height - 80) continue;
    if (hitsAsteroid(g.arena, x, y, 40)) continue;
    dropPickup(g, "chest", x, y);
    return;
  }
  dropPickup(g, "chest", g.player.x + 120, g.player.y);
};

export const updatePickups = (g: GameScene, dt: number) => {
  const px = g.player.x;
  const py = g.player.y;
  const radius = g.run.stats.pickupRadius;
  const vacuum = g.now < g.run.magnetUntil;
  const bob = Math.sin(g.now * 0.005);

  for (const p of g.pickups) {
    if (!p.active) continue;
    const d2 = dist2(p.x, p.y, px, py);

    if (p.kind !== "chest" && p.kind !== "capsule") {
      if (!p.pulled && (d2 < radius * radius || (vacuum && (p.kind === "xp" || p.kind === "coin")))) p.pulled = true;
    } else if (p.kind === "chest" && !p.pulled && g.mode.id === "campaign" && p.x < g.cameras.main.scrollX + 30) {
      // Cassa rimasta indietro con lo scorrimento: vola da sola verso la nave (niente bottino perso).
      p.pulled = true;
    }
    {
      if (p.pulled) {
        const d = Math.sqrt(d2) || 1;
        const speed = Math.max(420, 1400 - d);
        p.x += ((px - p.x) / d) * speed * dt;
        p.y += ((py - p.y) / d) * speed * dt;
      }
    }

    if (g.arena.terrain && !p.pulled) p.y = clampToGap(g.arena.terrain, p.x, p.y, 14);
    const floatY = p.glow ? bob * 3 : 0;
    p.sprite.setPosition(p.x, p.y + floatY);
    p.glow?.setPosition(p.x, p.y + floatY).setAlpha(0.45 + bob * 0.15);

    if (d2 < (PLAYER_RADIUS + (p.kind === "chest" || p.kind === "capsule" ? 26 : 12)) ** 2) {
      p.active = false;
      p.sprite.setActive(false).setVisible(false);
      p.glow?.setActive(false).setVisible(false);
      g.collect(p);
    }
  }
};

export const activeChests = (g: GameScene) => g.pickups.filter((p) => p.active && p.kind === "chest");
