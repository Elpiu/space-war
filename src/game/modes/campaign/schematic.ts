// Schema della nave per l'hangar: sagoma SVG dello scafo (vista dall'alto,
// muso a destra) e posizione delle prese degli slot, in percentuale.

import type { SlotKey } from "./profile";

const W = 600;
const H = 320;

interface HullShape {
  body: string;
  wings: string;
  details: string;
  color: string;
}

const SHAPES: Record<string, HullShape> = {
  scout: {
    body: "M110 160 L230 122 L470 140 L565 160 L470 180 L230 198 Z",
    wings: "M250 128 L300 66 L360 132 Z M250 192 L300 254 L360 188 Z",
    details: "M300 150 h120 M300 170 h120",
    color: "#34d399",
  },
  frigate: {
    body: "M95 160 L200 104 L450 114 L560 160 L450 206 L200 216 Z",
    wings: "M250 110 L310 32 L390 114 Z M250 210 L310 288 L390 206 Z",
    details: "M230 140 h180 M230 180 h180 M420 150 l40 10 -40 10",
    color: "#38bdf8",
  },
  bastion: {
    body: "M85 160 L165 88 L440 94 L562 160 L440 226 L165 232 Z",
    wings: "M220 96 L290 18 L420 98 Z M220 224 L290 302 L420 222 Z M120 112 h60 v-26 h-60 Z M120 208 h60 v26 h-60 Z",
    details: "M200 128 h220 M200 160 h240 M200 192 h220",
    color: "#f97316",
  },
};

/** Posizione (in %) di ogni presa, a seconda del tipo e dell'indice. */
export const socketPosition = (key: SlotKey, counts: Record<string, number>) => {
  const type = key === "hull" ? "hull" : key.replace(/\d+$/, "");
  const index = Number(key.replace(/\D/g, "")) || 0;
  const n = counts[type] ?? 1;
  const at = (x: number, y: number) => ({ x: (x / W) * 100, y: (y / H) * 100 });
  switch (type) {
    case "front":
      return at(528, 160 + (index - (n - 1) / 2) * 62);
    case "rear":
      return at(58, 160 + (index - (n - 1) / 2) * 70);
    case "missile":
      return at(322, index % 2 === 0 ? 58 : 262);
    case "bomb":
      return at(236, 268);
    case "device":
      return at(300 + index * 64, 160);
    default:
      return at(178, 160);
  }
};

/** Disegno dello scafo; senza scafo montato mostra una sagoma generica. */
export const hullSvg = (hullId: string | undefined) => {
  const shape = SHAPES[hullId ?? ""] ?? SHAPES.frigate;
  const c = shape.color;
  return `<svg class="hq-ship__svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs>
      <radialGradient id="hq-engine" cx="0" cy="0.5" r="1">
        <stop offset="0" stop-color="#fb923c" stop-opacity="0.9"/>
        <stop offset="1" stop-color="#fb923c" stop-opacity="0"/>
      </radialGradient>
      <pattern id="hq-grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M20 0H0V20" fill="none" stroke="${c}" stroke-opacity="0.08"/>
      </pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#hq-grid)"/>
    <ellipse cx="70" cy="160" rx="70" ry="34" fill="url(#hq-engine)" class="hq-ship__flame"/>
    <path d="${shape.wings}" fill="${c}" fill-opacity="0.08" stroke="${c}" stroke-opacity="0.7" stroke-width="2" stroke-linejoin="round"/>
    <path d="${shape.body}" fill="${c}" fill-opacity="0.12" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>
    <path d="${shape.details}" fill="none" stroke="${c}" stroke-opacity="0.45" stroke-width="2" stroke-dasharray="6 6"/>
    <circle cx="470" cy="160" r="16" fill="none" stroke="${c}" stroke-opacity="0.6" stroke-width="2"/>
    <path d="M470 144v32M454 160h32" stroke="${c}" stroke-opacity="0.4"/>
  </svg>`;
};
