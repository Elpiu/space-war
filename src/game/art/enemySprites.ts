// Sprite SVG originali di tutti i nemici, in uno stile unico:
// scafo scuro con contorno, pannelli, un colore di ruolo e un nucleo luminoso.
// Muso verso l'alto (la rotazione la gestisce il gioco).
//
// Colori di ruolo: rosso assalto, blu sciame, viola tiratori, arancio pesanti,
// verde supporto, ciano scudi, porpora controllo, lime/magenta/bianco speciali.

const OUT = `stroke="#0b1020" stroke-width="3" stroke-linejoin="round"`;
const HULL = "#1e293b";
const PANEL = "#334155";

const svg = (body: string, size = 128, view = 64) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${view} ${view}">${body}</svg>`;

/** Nucleo luminoso con alone (gradiente radiale). */
const core = (cx: number, cy: number, r: number, color: string, id = "c") =>
  `<defs><radialGradient id="${id}"><stop offset="0" stop-color="#fff"/><stop offset="0.45" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>
   <circle cx="${cx}" cy="${cy}" r="${r * 1.9}" fill="url(#${id})" opacity=".55"/>
   <circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="#0b1020" stroke-width="2"/>
   <circle cx="${cx - r * 0.3}" cy="${cy - r * 0.3}" r="${r * 0.35}" fill="#fff" opacity=".8"/>`;

const flame = (x: number, y: number, w = 6) =>
  `<path d="M${x - w / 2} ${y} Q${x} ${y + w * 2.2} ${x + w / 2} ${y} Z" fill="#fb923c"/><path d="M${x - w / 4} ${y} Q${x} ${y + w * 1.3} ${x + w / 4} ${y} Z" fill="#fde68a"/>`;

export const ENEMY_SPRITES: Record<string, string> = {
  // ---------- Assalto (rosso) ----------
  "enemy-chaser": svg(`
    ${flame(26, 54)}${flame(38, 54)}
    <path d="M32 4 L44 24 L44 46 L54 58 L40 54 L24 54 L10 58 L20 46 L20 24 Z" fill="${HULL}" ${OUT}/>
    <path d="M32 8 L40 24 H24 Z" fill="#ef4444"/>
    <path d="M20 40 h24" stroke="#ef4444" stroke-width="3"/>
    ${core(32, 32, 5, "#fca5a5")}`),
  "enemy-interceptor": svg(`
    ${flame(32, 56, 7)}
    <path d="M32 2 L40 34 L60 50 L40 48 L36 56 H28 L24 48 L4 50 L24 34 Z" fill="${HULL}" ${OUT}/>
    <path d="M32 6 L36 30 H28 Z" fill="#f87171"/>
    <path d="M40 40 L54 48 M24 40 L10 48" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
    ${core(32, 38, 4, "#fecaca")}`),
  "enemy-charger": svg(`
    ${flame(32, 58, 8)}
    <path d="M32 2 L50 28 L46 56 H18 L14 28 Z" fill="${HULL}" ${OUT}/>
    <path d="M14 28 L4 22 L16 34 M50 28 L60 22 L48 34" fill="none" ${OUT}/>
    <path d="M24 20 L32 12 L40 20 M24 30 L32 22 L40 30" fill="none" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    ${core(32, 42, 6, "#fde68a")}`),

  // ---------- Sciame (blu) ----------
  "enemy-swarm": svg(`
    <rect x="2" y="24" width="18" height="16" rx="2" fill="#1d4ed8" ${OUT}/>
    <rect x="44" y="24" width="18" height="16" rx="2" fill="#1d4ed8" ${OUT}/>
    <path d="M6 28v8M11 28v8M16 28v8M48 28v8M53 28v8M58 28v8" stroke="#93c5fd" stroke-width="1.5"/>
    <path d="M20 32h4M40 32h4" ${OUT}/>
    <rect x="22" y="20" width="20" height="24" rx="5" fill="${HULL}" ${OUT}/>
    ${core(32, 32, 5, "#60a5fa")}`),
  "enemy-splitter": svg(`
    <path d="M32 6c14 0 24 9 24 24s-10 28-24 28S8 45 8 30 18 6 32 6z" fill="#365314" ${OUT}/>
    <path d="M32 6v52M12 22l40 20M12 42l40-20" stroke="#a3e635" stroke-width="2" stroke-dasharray="4 4" opacity=".8"/>
    <circle cx="20" cy="26" r="5" fill="#a3e635" stroke="#0b1020" stroke-width="2"/>
    <circle cx="44" cy="38" r="5" fill="#a3e635" stroke="#0b1020" stroke-width="2"/>
    ${core(32, 32, 6, "#d9f99d")}`),

  // ---------- Tiratori (viola / rosa / giallo) ----------
  "enemy-shooter": svg(`
    <rect x="6" y="18" width="10" height="30" rx="3" fill="${PANEL}" ${OUT}/>
    <rect x="48" y="18" width="10" height="30" rx="3" fill="${PANEL}" ${OUT}/>
    <path d="M11 18V6M53 18V6" stroke="#c084fc" stroke-width="5" stroke-linecap="round"/>
    <circle cx="32" cy="34" r="18" fill="${HULL}" ${OUT}/>
    <circle cx="32" cy="34" r="12" fill="none" stroke="#c084fc" stroke-width="2.5"/>
    ${core(32, 34, 6, "#e9d5ff")}`),
  "enemy-sniper": svg(`
    <path d="M32 0v22" stroke="#f472b6" stroke-width="5" stroke-linecap="round"/>
    <path d="M32 0v22" stroke="#0b1020" stroke-width="1"/>
    <path d="M24 22 H40 L46 54 L32 62 L18 54 Z" fill="${HULL}" ${OUT}/>
    <path d="M18 40 L4 52 L18 50 M46 40 L60 52 L46 50" fill="${PANEL}" ${OUT}/>
    ${core(32, 36, 6, "#f9a8d4")}
    <circle cx="32" cy="22" r="3" fill="#f472b6"/>`),
  "enemy-zigzag": svg(`
    <path d="M36 2 L18 30 H30 L24 62 L48 26 H34 L42 2 Z" fill="${HULL}" ${OUT}/>
    <path d="M36 8 L26 26 H34 L30 44" fill="none" stroke="#facc15" stroke-width="3" stroke-linejoin="round"/>
    ${core(34, 28, 4, "#fef08a")}`),
  "enemy-bomber": svg(`
    ${flame(22, 50)}${flame(42, 50)}
    <path d="M32 8 L40 18 L62 30 L58 40 L40 38 L38 50 H26 L24 38 L6 40 L2 30 L24 18 Z" fill="${HULL}" ${OUT}/>
    <rect x="24" y="26" width="16" height="14" rx="3" fill="#7c2d12" ${OUT}/>
    <circle cx="28" cy="33" r="3" fill="#fb923c"/><circle cx="36" cy="33" r="3" fill="#fb923c"/>
    <path d="M8 32 L22 28 M56 32 L42 28" stroke="#f97316" stroke-width="3" stroke-linecap="round"/>
    ${core(32, 16, 4, "#fed7aa")}`),
  "enemy-laser": svg(`
    <path d="M16 56 L24 38 M48 56 L40 38 M32 60 V40" stroke="${PANEL}" stroke-width="5" stroke-linecap="round"/>
    <path d="M16 56 L24 38 M48 56 L40 38 M32 60 V40" stroke="#0b1020" stroke-width="1.5"/>
    <path d="M14 30 a18 18 0 0 1 36 0 v6 H14 Z" fill="${HULL}" ${OUT}/>
    <rect x="26" y="4" width="12" height="16" rx="3" fill="${PANEL}" ${OUT}/>
    ${core(32, 12, 4, "#fde047", "l")}
    <path d="M18 30 h28" stroke="#facc15" stroke-width="2.5"/>`),
  "enemy-missile": svg(`
    <rect x="8" y="14" width="48" height="40" rx="6" fill="${HULL}" ${OUT}/>
    <g fill="#0f172a" ${OUT}><rect x="13" y="19" width="10" height="12" rx="2"/><rect x="27" y="19" width="10" height="12" rx="2"/><rect x="41" y="19" width="10" height="12" rx="2"/></g>
    <path d="M18 19v-6M32 19v-6M46 19v-6" stroke="#e9d5ff" stroke-width="4" stroke-linecap="round"/>
    <path d="M14 42 h36" stroke="#a855f7" stroke-width="3"/>
    ${core(32, 46, 4, "#d8b4fe")}`),

  // ---------- Pesanti (arancio) ----------
  "enemy-brute": svg(`
    ${flame(22, 58)}${flame(42, 58)}
    <path d="M32 2 L56 14 L60 44 L46 58 H18 L4 44 L8 14 Z" fill="#431407" ${OUT}/>
    <path d="M32 10 L48 18 L50 40 L40 50 H24 L14 40 L16 18 Z" fill="${PANEL}" ${OUT}/>
    <path d="M18 24 h28 M16 34 h32" stroke="#f97316" stroke-width="3"/>
    ${core(32, 42, 5, "#fdba74")}`),
  "enemy-carrier": svg(`
    ${flame(16, 58)}${flame(32, 60, 8)}${flame(48, 58)}
    <path d="M32 2 L50 12 L60 40 L52 58 H12 L4 40 L14 12 Z" fill="${HULL}" ${OUT}/>
    <rect x="20" y="22" width="24" height="24" rx="4" fill="#0f172a" ${OUT}/>
    <path d="M24 28 h16 M24 34 h16 M24 40 h16" stroke="#94a3b8" stroke-width="2"/>
    <path d="M14 18 L22 10 M50 18 L42 10" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
    ${core(32, 12, 4, "#e2e8f0")}`),

  // ---------- Supporto e scudi (verde / ciano) ----------
  "enemy-repairer": svg(`
    <path d="M32 4 L32 60 M4 32 L60 32" stroke="${PANEL}" stroke-width="7" stroke-linecap="round"/>
    <path d="M32 4 L32 60 M4 32 L60 32" stroke="#0b1020" stroke-width="1.5"/>
    <circle cx="32" cy="32" r="18" fill="${HULL}" ${OUT}/>
    <path d="M32 22 v20 M22 32 h20" stroke="#4ade80" stroke-width="6" stroke-linecap="round"/>
    <circle cx="32" cy="4" r="4" fill="#4ade80"/><circle cx="32" cy="60" r="4" fill="#4ade80"/><circle cx="4" cy="32" r="4" fill="#4ade80"/><circle cx="60" cy="32" r="4" fill="#4ade80"/>`),
  "enemy-bearer": svg(`
    <circle cx="32" cy="32" r="28" fill="none" stroke="#22d3ee" stroke-width="2" stroke-dasharray="6 5" opacity=".9"/>
    <path d="M32 8 L52 20 V44 L32 56 L12 44 V20 Z" fill="${HULL}" ${OUT}/>
    <path d="M32 16 L44 24 V40 L32 48 L20 40 V24 Z" fill="none" stroke="#22d3ee" stroke-width="2.5"/>
    ${core(32, 32, 6, "#a5f3fc")}`),

  // ---------- Controllo (porpora) ----------
  "enemy-gravity": svg(`
    <circle cx="32" cy="32" r="27" fill="#2e1065" ${OUT}/>
    <path d="M32 8 a24 24 0 0 1 24 24 M56 32 a24 24 0 0 1 -24 24 M32 56 a24 24 0 0 1 -24 -24 M8 32 a24 24 0 0 1 24 -24" fill="none" stroke="#a855f7" stroke-width="2.5"/>
    <path d="M32 14 a18 18 0 1 1 -12.7 5.3" fill="none" stroke="#c4b5fd" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M32 22 a10 10 0 1 1 -7 3" fill="none" stroke="#e9d5ff" stroke-width="2" stroke-linecap="round"/>
    <circle cx="32" cy="32" r="5" fill="#0b1020" stroke="#e9d5ff" stroke-width="2"/>`),
  "enemy-emp": svg(`
    <path d="M32 2 L28 14 H35 L30 24" fill="none" stroke="#818cf8" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="32" cy="38" rx="26" ry="14" fill="${HULL}" ${OUT}/>
    <ellipse cx="32" cy="34" rx="14" ry="10" fill="${PANEL}" ${OUT}/>
    <path d="M10 40 h44" stroke="#6366f1" stroke-width="2.5" stroke-dasharray="3 3"/>
    ${core(32, 33, 5, "#c7d2fe")}`),

  // ---------- Speciali ----------
  "enemy-phantom": svg(`
    <path d="M32 4 C48 4 54 18 54 32 V56 L46 50 L39 58 L32 50 L25 58 L18 50 L10 56 V32 C10 18 16 4 32 4 Z" fill="#cbd5e1" fill-opacity=".85" ${OUT}/>
    <ellipse cx="24" cy="28" rx="5" ry="7" fill="#0b1020"/><ellipse cx="40" cy="28" rx="5" ry="7" fill="#0b1020"/>
    <circle cx="25" cy="26" r="2" fill="#e0f2fe"/><circle cx="41" cy="26" r="2" fill="#e0f2fe"/>
    <path d="M24 42 q8 6 16 0" fill="none" stroke="#0b1020" stroke-width="3" stroke-linecap="round"/>`),
  "enemy-teleporter": svg(`
    <circle cx="32" cy="32" r="28" fill="none" stroke="#e879f9" stroke-width="2" opacity=".7"/>
    <circle cx="32" cy="32" r="22" fill="none" stroke="#f0abfc" stroke-width="1.5" stroke-dasharray="4 4"/>
    <path d="M32 6 L50 32 L32 58 L14 32 Z" fill="${HULL}" ${OUT}/>
    <path d="M32 14 L44 32 L32 50 L20 32 Z" fill="#701a75" stroke="#e879f9" stroke-width="2"/>
    ${core(32, 32, 5, "#f5d0fe")}`),

  // ---------- Boss ----------
  "enemy-boss1": svg(`
    <g>${flame(40, 118, 10)}${flame(64, 122, 14)}${flame(88, 118, 10)}</g>
    <path d="M64 4 L86 22 L118 40 L112 86 L92 112 H36 L16 86 L10 40 L42 22 Z" fill="#450a0a" ${OUT}/>
    <path d="M64 16 L80 30 L100 44 L96 80 L82 100 H46 L32 80 L28 44 L48 30 Z" fill="${HULL}" ${OUT}/>
    <g fill="${PANEL}" ${OUT}><circle cx="34" cy="56" r="9"/><circle cx="94" cy="56" r="9"/><circle cx="46" cy="86" r="8"/><circle cx="82" cy="86" r="8"/></g>
    <path d="M34 56 L22 40 M94 56 L106 40 M46 86 L38 74 M82 86 L90 74" stroke="#f87171" stroke-width="4" stroke-linecap="round"/>
    <path d="M44 40 H84 M40 66 H88" stroke="#ef4444" stroke-width="3"/>
    ${core(64, 62, 11, "#fca5a5", "b")}`, 256, 128),
  "enemy-boss2": svg(`
    <g>${flame(50, 112, 12)}${flame(78, 112, 12)}</g>
    <path d="M64 6 C78 20 84 30 88 44 L124 70 L116 84 L86 80 L80 110 H48 L42 80 L12 84 L4 70 L40 44 C44 30 50 20 64 6 Z" fill="#3b0764" ${OUT}/>
    <path d="M64 22 C72 32 76 42 76 54 L74 96 H54 L52 54 C52 42 56 32 64 22 Z" fill="${HULL}" ${OUT}/>
    <path d="M14 74 L44 62 M114 74 L84 62" stroke="#c084fc" stroke-width="4" stroke-linecap="round"/>
    <g fill="#f87171" stroke="#0b1020" stroke-width="2"><circle cx="30" cy="70" r="5"/><circle cx="98" cy="70" r="5"/></g>
    <path d="M56 70 H72 M56 82 H72" stroke="#ef4444" stroke-width="3"/>
    ${core(64, 48, 10, "#f0abfc", "b")}`, 256, 128),
};
