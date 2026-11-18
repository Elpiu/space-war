// Set di icone e sprite SVG originali del gioco.
// - Le ICONE (24x24) sono monocromatiche: usano currentColor, così nel DOM
//   prendono il colore dal CSS e in Phaser vengono rasterizzate col colore voluto.
// - Gli SPRITE (64x64) sono a colori pieni e diventano texture Phaser.

const S = (d: string) => `<path d="${d}"/>`;
const F = (d: string) => `<path d="${d}" fill="currentColor" stroke="none"/>`;

export const ICONS = {
  // HUD / interfaccia
  heart: F("M12 20.5s-7.2-4.5-9.2-9C1.4 8.3 3.3 4.8 6.8 4.8c2 0 3.6 1.2 5.2 3.1 1.6-1.9 3.2-3.1 5.2-3.1 3.5 0 5.4 3.5 4 6.7-2 4.5-9.2 9-9.2 9z"),
  xp: F("M12 2.5 19.5 9 12 21.5 4.5 9z") + `<path d="M4.5 9h15M9 9l3 12.5L15 9M9 9l3-6.5L15 9" stroke="#0b1020" stroke-width="1.2" opacity=".45"/>`,
  coin: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.2"/>` + F("M12 8.6l1 2.2 2.4.3-1.8 1.6.5 2.4-2.1-1.2-2.1 1.2.5-2.4-1.8-1.6 2.4-.3z"),
  wave: S("M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0") + S("M3 17c2-4 4-4 6 0s4 4 6 0 4-4 6 0") + S("M3 7c2-4 4-4 6 0s4 4 6 0 4-4 6 0"),
  skull: S("M12 3c-4.6 0-8 3.2-8 7.6 0 2.6 1.2 4.4 3 5.4V19a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3c1.8-1 3-2.8 3-5.4C20 6.2 16.6 3 12 3z") + F("M8.5 9.5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zM15.5 9.5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z") + S("M10 20v-2.5M14 20v-2.5"),
  enemy: S("M12 3 4 8v5c0 4 3.4 7 8 8 4.6-1 8-4 8-8V8z") + F("M8 11.5l3 1.2-.6 1.8-2.6-1zM16 11.5l-3 1.2.6 1.8 2.6-1z"),
  clock: `<circle cx="12" cy="12" r="9"/>` + S("M12 7v5l3.5 2"),
  dash: S("M4 6l6 6-6 6M11 6l6 6-6 6") + S("M19 5v14"),
  turret: S("M5 20h14l-2-6H7z") + `<circle cx="12" cy="11" r="3.5"/>` + S("M14.5 8.5 20 3"),
  mine: `<circle cx="12" cy="12" r="5"/>` + S("M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1") + F("M12 10.4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z"),
  shield: S("M12 2.8 4.5 5.8v5.6c0 4.6 3.1 8.3 7.5 9.8 4.4-1.5 7.5-5.2 7.5-9.8V5.8z"),
  pause: F("M7 4h3.5v16H7zM13.5 4H17v16h-3.5z"),
  play: F("M7 4.5v15l12.5-7.5z"),
  soundOn: F("M4 9.5h3.5L12 5v14l-4.5-4.5H4z") + S("M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"),
  soundOff: F("M4 9.5h3.5L12 5v14l-4.5-4.5H4z") + S("M16 9l5 6M21 9l-5 6"),
  trophy: S("M7 4h10v4a5 5 0 0 1-10 0z") + S("M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M9.5 17h5"),
  credits: S("M12 2.5 20.5 7.3v9.4L12 21.5l-8.5-4.8V7.3z") + F("M12 7.2l1.3 3 3.2.3-2.4 2.1.7 3.2L12 14.1l-2.8 1.7.7-3.2-2.4-2.1 3.2-.3z"),
  lock: `<rect x="5" y="10.5" width="14" height="10" rx="2"/>` + S("M8 10.5V7.5a4 4 0 0 1 8 0v3") + F("M12 14a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"),
  check: S("M5 12.5l4.5 4.5L19 7.5"),
  wrench: S("M14.7 6.3a4.5 4.5 0 0 0-6 5.9L3.5 17.4a2 2 0 0 0 2.8 2.8l5.2-5.2a4.5 4.5 0 0 0 5.9-6l-2.8 2.8-2.4-.4-.4-2.4z"),
  reroll: S("M20 11a8 8 0 0 0-14.3-4.6L4 8") + S("M4 3.5V8h4.5") + S("M4 13a8 8 0 0 0 14.3 4.6L20 16") + S("M20 20.5V16h-4.5"),
  home: S("M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5"),
  star: F("M12 2.8l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.7l-5.6 3.1 1.3-6.2L3 9.3l6.3-.7z"),
  boss: F("M3 8l4.5 3L12 4l4.5 7L21 8l-2 11H5z") + S("M5 19h14"),
  warning: S("M12 3.5 2.5 20h19z") + S("M12 9.5v5") + F("M12 16.3a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z"),

  // Tomi
  "tome-power": F("M12 2l2.2 5.6L20 6l-3.6 4.8L22 12l-5.6 1.2L20 18l-5.8-1.6L12 22l-2.2-5.6L4 18l3.6-4.8L2 12l5.6-1.2L4 6l5.8 1.6z"),
  "tome-cadence": F("M3 9.5h6.5l2.5 2.5-2.5 2.5H3zM12.5 9.5H17l2.5 2.5-2.5 2.5h-4.5z") + S("M3 5.5h8M3 18.5h8M14 5.5h4M14 18.5h4"),
  "tome-vitality": F("M12 20.5s-7.2-4.5-9.2-9C1.4 8.3 3.3 4.8 6.8 4.8c2 0 3.6 1.2 5.2 3.1 1.6-1.9 3.2-3.1 5.2-3.1 3.5 0 5.4 3.5 4 6.7-2 4.5-9.2 9-9.2 9z") + `<path d="M12 9.5v6M9 12.5h6" stroke="#0b1020" stroke-width="2.2"/>`,
  "tome-mobility": S("M2.5 8h7M1.5 12h6M2.5 16h7") + F("M10 5.5c5.5 0 10 2.9 11.5 6.5C20 15.6 15.5 18.5 10 18.5c1.6-2 2.4-4.2 2.4-6.5S11.6 7.5 10 5.5z"),
  "tome-magnetism": S("M6 3.5v8a6 6 0 0 0 12 0v-8") + F("M3.5 3h5v4h-5zM15.5 3h5v4h-5z"),
  "tome-wisdom": S("M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z") + F("M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z"),
  "tome-vampirism": F("M12 2.5S5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 2.5 12 2.5z") + `<path d="M9.5 13.5l1.2 3 1.3-3 1.3 3 1.2-3" stroke="#0b1020" stroke-width="1.5"/>`,
  "tome-engineering": `<circle cx="12" cy="12" r="3.2"/>` + S("M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1") + `<circle cx="12" cy="12" r="6.5"/>`,

  // Oggetti
  "item-splitter": S("M12 21V11M12 11 5 4M12 11l7-7M12 11V3") + F("M3.2 2.2 8 3l-4 4zM20.8 2.2 16 3l4 4zM12 1l2.5 3.5h-5z"),
  "item-bounce": S("M3 18 9 7l5 9 7-11") + F("M21.5 3.5 21 9l-4.5-2.8z"),
  "item-blades": `<circle cx="12" cy="12" r="7.5" stroke-dasharray="3 3"/>` + F("M12 1.5l2 3-2 3-2-3zM12 16.5l2 3-2 3-2-3z") + `<circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>`,
  "item-arc": F("M13.5 1.5 4.5 13.5h6l-1.5 9 9.5-12.5h-6.2z"),
  "item-drone": `<circle cx="12" cy="12" r="3.5"/>` + S("M9.5 9.5 6.5 6.5M14.5 9.5l3-3M9.5 14.5l-3 3M14.5 14.5l3 3") + `<circle cx="5" cy="5" r="2.5"/><circle cx="19" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/>`,
  "item-turret": S("M4 20h12l-2-5H6z") + `<circle cx="10" cy="12.5" r="3"/>` + S("M12 10.5l4.5-4.5M19 2.5v6M16 5.5h6"),
  "item-mine": `<circle cx="10" cy="14" r="4.5"/>` + S("M10 6.5v2M10 19.5v2M2.5 14h2M15.5 14h2M4.7 8.7l1.4 1.4M15.3 19.3l-1.4-1.4M4.7 19.3l1.4-1.4") + S("M19 2.5v6M16 5.5h6"),
  "item-bulkhead": S("M12 2.5 20.5 7.3v9.4L12 21.5l-8.5-4.8V7.3z") + S("M12 8v8M8 12h8"),

  // Campagna: equipaggiamento e mappa
  "gear-blaster": S("M3 10h11l3-2h4v8h-4l-3-2H3z") + S("M7 14v4h3"),
  "gear-spread": S("M3 12h4M7 12l13-7M7 12h14M7 12l13 7") + F("M2 10h4v4H2z"),
  "gear-rail": `<rect x="2" y="10" width="15" height="4" rx="1"/>` + S("M17 12h5M6 7v10M10 7v10M14 7v10"),
  "gear-minigun": S("M3 9h12M3 12h12M3 15h12") + `<rect x="15" y="7" width="4" height="10" rx="1"/>` + S("M19 12h3"),
  "gear-hull": S("M12 2.5l4 8v8l-4 3-4-3v-8z") + S("M8 12l-5 5v2l5-2M16 12l5 5v2l-5-2") + F("M12 8a1.8 1.8 0 1 0 0 3.6A1.8 1.8 0 0 0 12 8z"),
  "arrow-up": S("M12 19V5M6 11l6-6 6 6"),
  map: S("M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z") + S("M9 4v13.5M15 6.5V20"),
  flag: S("M5 21V3.5") + F("M5 4h12l-2.5 4L17 12H5z"),
  crate: S("M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z") + S("M3 7.5 12 12l9-4.5M12 12v9"),
  "gear-missile": S("M3 12h3l2-3h9l4 3-4 3H8l-2-3") + S("M10 9l-2-4M10 15l-2 4"),
  "gear-bomb": `<circle cx="11" cy="14" r="7"/>` + S("M15.5 8.5 18 6") + F("M19 3.5l1 1.6 1.8.4-1.3 1.2.3 1.8-1.8-.9-1.6.9.3-1.8-1.3-1.2 1.8-.4z"),
  "gear-radiator": S("M5 4v16M9.5 4v16M14 4v16M18.5 4v16M3 7h18M3 17h18"),
  heat: F("M12 2.5c1 3.5 5.5 6 5.5 11a5.5 5.5 0 0 1-11 0c0-2.4 1.2-4.1 2.5-5.4.2 1.9 1 3 2.2 3.6C10.6 9 11 5.8 12 2.5z"),

  // Drop speciali
  "special-magnet": S("M6 3.5v8a6 6 0 0 0 12 0v-8") + F("M3.5 3h5v4h-5zM15.5 3h5v4h-5z"),
  "special-venom": S("M9 2.5h6M10 2.5v5.5L4.5 18a2.5 2.5 0 0 0 2.2 3.5h10.6a2.5 2.5 0 0 0 2.2-3.5L14 8V2.5") + F("M7 15h10l2 4.2a1.2 1.2 0 0 1-1.1 1.8H6.1A1.2 1.2 0 0 1 5 19.2z"),
  "special-emp": `<circle cx="12" cy="12" r="9.5" stroke-dasharray="2.5 2.5"/>` + F("M13 4.5 6.5 13H11l-1 6.5 6.5-8.5H12z"),
} as const;

export type IconId = keyof typeof ICONS;

/** Markup SVG inline per il DOM (colore preso da CSS `color`). */
export const icon = (id: IconId, className = "ico") =>
  `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[id]}</svg>`;

/** Icona su un badge circolare scuro: per i drop speciali a terra. */
export const badgeDocument = (id: IconId, color: string, size = 64) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">` +
  `<circle cx="16" cy="16" r="14.5" fill="#0b1020" stroke="${color}" stroke-width="2"/>` +
  `<g transform="translate(5 5) scale(0.9167)" color="${color}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[id].replace(/currentColor/g, color)}</g></svg>`;

const doc = (body: string, size = 64, viewBox = "0 0 64 64") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}">${body}</svg>`;

const gem = (light: string, mid: string, dark: string) =>
  doc(`
    <path d="M32 4 56 24 32 60 8 24z" fill="${mid}" stroke="#0b1020" stroke-width="3" stroke-linejoin="round"/>
    <path d="M8 24h48L32 60z" fill="${dark}"/>
    <path d="M20 24 32 4l12 20z" fill="${light}"/>
    <path d="M8 24h48M20 24l12 36 12-36M20 24 32 4l12 20" fill="none" stroke="#0b1020" stroke-width="2" stroke-linejoin="round" opacity=".5"/>
    <path d="M24 14l5-6" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>
  `);

const wide = (body: string, w: number, h: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 2}" height="${h * 2}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

/** Cartellone satirico su due gambe. */
const billboard = (line1: string, line2: string, accent: string) =>
  wide(
    `<path d="M30 70v24M98 70v24" stroke="#334155" stroke-width="6"/>
     <path d="M22 94h20M90 94h20" stroke="#1e293b" stroke-width="5"/>
     <rect x="6" y="6" width="116" height="64" rx="6" fill="#0b1020" stroke="${accent}" stroke-width="4"/>
     <rect x="12" y="12" width="104" height="52" rx="3" fill="#111a33"/>
     <text x="64" y="34" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="14" fill="#f8fafc">${line1}</text>
     <text x="64" y="54" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="15" fill="${accent}">${line2}</text>
     <circle cx="16" cy="10" r="2.5" fill="${accent}"/><circle cx="112" cy="10" r="2.5" fill="${accent}"/>`,
    128,
    96,
  );

/** Sprite a colori: ognuno diventa una texture con la stessa chiave. */
export const SPRITES: Record<string, string> = {
  "gem-s": gem("#a5f3fc", "#22d3ee", "#0e7490"),
  "gem-m": gem("#bbf7d0", "#4ade80", "#15803d"),
  "gem-l": gem("#f5d0fe", "#d946ef", "#86198f"),
  coin: doc(`
    <circle cx="32" cy="32" r="26" fill="#f59e0b" stroke="#0b1020" stroke-width="3"/>
    <circle cx="32" cy="32" r="19" fill="#fbbf24" stroke="#b45309" stroke-width="2.5"/>
    <path d="M32 19l3.6 7.6 8.2.9-6.1 5.6 1.7 8.1L32 37.1l-7.4 4.1 1.7-8.1-6.1-5.6 8.2-.9z" fill="#fef3c7"/>
    <path d="M17 22a17 17 0 0 1 10-8" stroke="#fff" stroke-width="3.5" stroke-linecap="round" fill="none" opacity=".75"/>
  `),
  heart: doc(`
    <path d="M32 56S10 42 6 29C3 19 9 9 19 9c6 0 10 3.5 13 8 3-4.5 7-8 13-8 10 0 16 10 13 20-4 13-26 27-26 27z" fill="#f43f5e" stroke="#0b1020" stroke-width="3" stroke-linejoin="round"/>
    <path d="M16 20c1-3 3-5 6-5.5" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".8"/>
    <path d="M32 26v16M24 34h16" stroke="#fff1f2" stroke-width="5" stroke-linecap="round"/>
  `),
  chest: doc(`
    <rect x="7" y="20" width="50" height="34" rx="6" fill="#1e293b" stroke="#0b1020" stroke-width="3"/>
    <path d="M7 30h50" stroke="#0b1020" stroke-width="3"/>
    <rect x="7" y="14" width="50" height="16" rx="6" fill="#334155" stroke="#0b1020" stroke-width="3"/>
    <path d="M14 22h36" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
    <path d="M14 42h10M40 42h10" stroke="#22d3ee" stroke-width="3" stroke-linecap="round"/>
    <rect x="26" y="25" width="12" height="14" rx="3" fill="#fbbf24" stroke="#0b1020" stroke-width="2.5"/>
    <circle cx="32" cy="32" r="2.4" fill="#0b1020"/>
  `),
  "turret-base": doc(`
    <path d="M32 4 56 18v28L32 60 8 46V18z" fill="#1e293b" stroke="#0b1020" stroke-width="3" stroke-linejoin="round"/>
    <path d="M32 12 49 22v20L32 52 15 42V22z" fill="#334155"/>
    <circle cx="32" cy="32" r="12" fill="#0f172a" stroke="#22d3ee" stroke-width="3"/>
    <circle cx="16" cy="22" r="2" fill="#22d3ee"/><circle cx="48" cy="22" r="2" fill="#22d3ee"/>
    <circle cx="16" cy="42" r="2" fill="#22d3ee"/><circle cx="48" cy="42" r="2" fill="#22d3ee"/>
  `),
  "turret-gun": doc(`
    <rect x="26" y="4" width="12" height="30" rx="3" fill="#94a3b8" stroke="#0b1020" stroke-width="3"/>
    <rect x="28.5" y="2" width="7" height="8" rx="2" fill="#22d3ee" stroke="#0b1020" stroke-width="2"/>
    <circle cx="32" cy="34" r="11" fill="#e2e8f0" stroke="#0b1020" stroke-width="3"/>
    <circle cx="32" cy="34" r="4.5" fill="#22d3ee"/>
  `),
  mine: doc(`
    <g stroke="#0b1020" stroke-width="3" stroke-linejoin="round">
      <path d="M32 3l4 10h-8zM32 61l-4-10h8zM3 32l10-4v8zM61 32l-10 4v-8zM11.5 11.5l9.5 4.5-5 5zM52.5 52.5 43 48l5-5zM11.5 52.5l4.5-9.5 5 5zM52.5 11.5 48 21l-5-5z" fill="#475569"/>
      <circle cx="32" cy="32" r="18" fill="#1e293b"/>
    </g>
    <circle cx="32" cy="32" r="11" fill="#0f172a" stroke="#f97316" stroke-width="2.5"/>
    <circle cx="32" cy="32" r="5" fill="#ef4444"/>
    <path d="M24 25a10 10 0 0 1 6-4" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".6"/>
  `),
  blade: doc(`
    <path d="M32 2 42 32 32 62 22 32z" fill="#e0f2fe" stroke="#0b1020" stroke-width="3" stroke-linejoin="round"/>
    <path d="M32 8v48" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
    <circle cx="32" cy="32" r="5" fill="#38bdf8" stroke="#0b1020" stroke-width="2"/>
  `),
  drone: doc(`
    <g stroke="#0b1020" stroke-width="3">
      <path d="M20 20 44 44M44 20 20 44" stroke-linecap="round"/>
      <circle cx="14" cy="14" r="9" fill="#334155"/><circle cx="50" cy="14" r="9" fill="#334155"/>
      <circle cx="14" cy="50" r="9" fill="#334155"/><circle cx="50" cy="50" r="9" fill="#334155"/>
      <circle cx="32" cy="32" r="12" fill="#a78bfa"/>
    </g>
    <path d="M8 14h12M44 14h12M8 50h12M44 50h12" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>
    <circle cx="32" cy="32" r="5" fill="#f5f3ff"/>
  `),
  // Nemico nuovo: kamikaze. Una bomba-drone con alette e spia di innesco.
  "enemy-kamikaze": doc(`
    <g stroke="#0b1020" stroke-width="3" stroke-linejoin="round">
      <path d="M10 38 2 50l14-4zM54 38l8 12-14-4z" fill="#7f1d1d"/>
      <circle cx="32" cy="36" r="22" fill="#dc2626"/>
      <path d="M14 30a22 22 0 0 1 36 0z" fill="#ef4444"/>
      <rect x="26" y="8" width="12" height="8" rx="2" fill="#475569"/>
    </g>
    <path d="M32 8c0-4 3-6 6-5" stroke="#0b1020" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="40" cy="3.5" r="3.5" fill="#fde047"/>
    <path d="M20 38l8 3M44 38l-8 3" stroke="#0b1020" stroke-width="4" stroke-linecap="round"/>
    <circle cx="25" cy="44" r="3" fill="#fef08a"/><circle cx="39" cy="44" r="3" fill="#fef08a"/>
    <path d="M27 51h10" stroke="#0b1020" stroke-width="3" stroke-linecap="round"/>
    <path d="M18 26a16 16 0 0 1 8-6" stroke="#fff" stroke-width="3.5" stroke-linecap="round" fill="none" opacity=".6"/>
  `),
  // Nemico nuovo: scudato. Un guscio corazzato con visore, lo scudo è a parte.
  "enemy-shielded": doc(`
    <g stroke="#0b1020" stroke-width="3" stroke-linejoin="round">
      <path d="M32 4 54 16v24L32 60 10 40V16z" fill="#475569"/>
      <path d="M32 12 46 20v16L32 50 18 36V20z" fill="#64748b"/>
      <rect x="20" y="22" width="24" height="10" rx="5" fill="#0f172a"/>
    </g>
    <rect x="23" y="25" width="18" height="4" rx="2" fill="#38bdf8"/>
    <path d="M24 42h16M27 46h10" stroke="#0b1020" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="14" cy="24" r="2.5" fill="#38bdf8"/><circle cx="50" cy="24" r="2.5" fill="#38bdf8"/>
  `),
  // Missile orientato lungo l'asse X (muso a destra).
  missile: doc(`
    <path d="M6 26h8l-6-12h6l10 12h22l12 6-12 6H24L14 50H8l6-12H6z" fill="#e2e8f0" stroke="#0b1020" stroke-width="3" stroke-linejoin="round"/>
    <path d="M46 26l12 6-12 6z" fill="#ef4444"/>
    <path d="M26 30h16" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
  `),
  // ---------- Campagna: unità di terra, strutture, trasporti ----------
  "ground-turret": doc(`
    <g stroke="#0b1020" stroke-width="3" stroke-linejoin="round">
      <rect x="27" y="4" width="10" height="30" rx="2" fill="#94a3b8"/>
      <rect x="25" y="2" width="14" height="7" rx="2" fill="#f87171"/>
      <path d="M12 46a20 20 0 0 1 40 0z" fill="#475569"/>
      <path d="M4 62l6-16h44l6 16z" fill="#1e293b"/>
    </g>
    <circle cx="32" cy="40" r="5" fill="#f87171"/>
    <path d="M14 56h36" stroke="#f59e0b" stroke-width="3" stroke-dasharray="5 4"/>
  `),
  "ground-tank": wide(`
    <g stroke="#0b1020" stroke-width="3" stroke-linejoin="round">
      <path d="M20 22 4 10" stroke="#94a3b8" stroke-width="6" stroke-linecap="round"/>
      <rect x="6" y="40" width="84" height="18" rx="9" fill="#1e293b"/>
      <path d="M12 40l8-14h52l10 14z" fill="#64748b"/>
      <path d="M30 26a16 12 0 0 1 32 0z" fill="#475569"/>
    </g>
    <g fill="#0b1020"><circle cx="18" cy="49" r="4"/><circle cx="34" cy="49" r="4"/><circle cx="50" cy="49" r="4"/><circle cx="66" cy="49" r="4"/><circle cx="80" cy="49" r="4"/></g>
    <rect x="40" y="30" width="16" height="5" rx="2" fill="#f87171"/>
  `, 96, 64),
  "ground-silo": doc(`
    <g stroke="#0b1020" stroke-width="3" stroke-linejoin="round">
      <path d="M8 62V34a24 18 0 0 1 48 0v28z" fill="#334155"/>
      <path d="M22 26l10-20 10 20z" fill="#e2e8f0"/>
      <path d="M20 28h24v8H20z" fill="#0f172a"/>
    </g>
    <path d="M10 48h44" stroke="#facc15" stroke-width="6" stroke-dasharray="6 6"/>
    <circle cx="32" cy="18" r="3" fill="#ef4444"/>
  `),
  "prop-fuel": doc(`
    <g stroke="#0b1020" stroke-width="3" stroke-linejoin="round">
      <path d="M14 62l4-10M50 62l-4-10" stroke="#334155" stroke-width="5"/>
      <rect x="8" y="10" width="48" height="44" rx="12" fill="#b91c1c"/>
      <rect x="8" y="24" width="48" height="10" fill="#fbbf24"/>
      <rect x="26" y="4" width="12" height="8" rx="2" fill="#64748b"/>
    </g>
    <path d="M32 38c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9z" fill="#fde68a"/>
    <path d="M16 16a10 10 0 0 1 8-4" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".5"/>
  `),
  "prop-board-1": billboard("IPO SPAZIALE", "COMPRA ORA!", "#38bdf8"),
  "prop-board-2": billboard("CARBURANTE", "-90%*", "#facc15"),
  "prop-board-3": billboard("ORBITA", "PREMIUM", "#c084fc"),
  "prop-board-4": billboard("IL MERCATO", "NON DORME", "#4ade80"),
  // Trasporto corporate: muso a sinistra, container a destra.
  cargo: wide(`
    <g stroke="#0b1020" stroke-width="3" stroke-linejoin="round">
      <path d="M150 30h8v20h-8z" fill="#f97316"/>
      <rect x="40" y="16" width="112" height="48" rx="6" fill="#334155"/>
      <rect x="50" y="22" width="30" height="36" rx="3" fill="#0ea5e9"/>
      <rect x="84" y="22" width="30" height="36" rx="3" fill="#f59e0b"/>
      <rect x="118" y="22" width="28" height="36" rx="3" fill="#10b981"/>
      <path d="M40 22 6 34v12l34 12z" fill="#64748b"/>
    </g>
    <path d="M14 38h16" stroke="#7dd3fc" stroke-width="5" stroke-linecap="round"/>
    <path d="M58 30v20M92 30v20M126 30v20" stroke="#0b1020" stroke-width="2" opacity=".4"/>
    <circle cx="160" cy="40" r="5" fill="#fde68a"/>
  `, 166, 80),
  "shield-arc": doc(
    `<path d="M10 52A34 34 0 0 1 54 52" fill="none" stroke="#7dd3fc" stroke-width="7" stroke-linecap="round"/>
     <path d="M14 50A30 30 0 0 1 50 50" fill="none" stroke="#e0f2fe" stroke-width="2.5" stroke-linecap="round"/>`,
    96,
  ),
};
