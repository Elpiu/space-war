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
  // ---------- Bestiario 2 ----------
  "enemy-diver": svg(`
    <path d="M28 9 Q32 -6 36 9 Z" fill="#fb923c"/><path d="M30 9 Q32 0 34 9 Z" fill="#fde68a"/>
    <path d="M32 60 L42 40 L58 30 L44 26 L40 8 H24 L20 26 L6 30 L22 40 Z" fill="${HULL}" ${OUT}/>
    <path d="M32 54 L38 40 H26 Z" fill="#f43f5e"/>
    <path d="M10 30 L22 34 M54 30 L42 34" stroke="#fb7185" stroke-width="3" stroke-linecap="round"/>
    ${core(32, 22, 5, "#fecdd3")}`),
  "enemy-flak": svg(`
    ${flame(24, 56)}${flame(40, 56)}
    <rect x="12" y="20" width="40" height="34" rx="8" fill="${HULL}" ${OUT}/>
    <rect x="26" y="2" width="12" height="22" rx="3" fill="${PANEL}" ${OUT}/>
    <path d="M20 4 L26 12 M44 4 L38 12" stroke="#fb923c" stroke-width="3" stroke-linecap="round"/>
    <path d="M18 44 H46" stroke="#fb923c" stroke-width="3"/>
    ${core(32, 34, 6, "#fed7aa")}`),
  "enemy-radar": svg(`
    ${flame(32, 56)}
    <path d="M22 28 L42 28 L46 52 H18 Z" fill="${HULL}" ${OUT}/>
    <path d="M8 18 Q32 -2 56 18 Q32 10 8 18 Z" fill="#065f46" ${OUT}/>
    <path d="M32 12 V28" ${OUT}/>
    <path d="M14 16 Q32 4 50 16" fill="none" stroke="#34d399" stroke-width="2"/>
    ${core(32, 40, 6, "#a7f3d0")}`),
  "enemy-leech": svg(`
    <path d="M32 4 C48 8 54 24 50 40 C46 54 38 60 32 60 C26 60 18 54 14 40 C10 24 16 8 32 4 Z" fill="#3b0764" ${OUT}/>
    <path d="M20 22 Q32 28 44 22 M18 34 Q32 40 46 34 M20 46 Q32 52 44 46" fill="none" stroke="#a855f7" stroke-width="2.5"/>
    <circle cx="32" cy="12" r="6" fill="#0b1020"/>
    <path d="M27 9 L29 14 M32 7 V13 M37 9 L35 14" stroke="#e9d5ff" stroke-width="1.5"/>
    ${core(32, 32, 4, "#e9d5ff")}`),
  "enemy-mirror": svg(`
    ${flame(32, 58)}
    <path d="M32 6 L52 18 V44 L32 58 L12 44 V18 Z" fill="${HULL}" ${OUT}/>
    <path d="M32 10 L48 20 V30 H16 V20 Z" fill="#e2e8f0" stroke="#0b1020" stroke-width="2"/>
    <path d="M20 16 L28 26 M30 12 L38 24" stroke="#fff" stroke-width="2" opacity=".9"/>
    ${core(32, 42, 5, "#f8fafc")}`),
  "enemy-brood": svg(`
    <ellipse cx="32" cy="34" rx="26" ry="24" fill="#365314" ${OUT}/>
    <g fill="#a3e635" stroke="#0b1020" stroke-width="2"><circle cx="18" cy="26" r="6"/><circle cx="46" cy="26" r="6"/><circle cx="22" cy="44" r="5"/><circle cx="42" cy="44" r="5"/><circle cx="32" cy="52" r="4"/></g>
    <path d="M8 22 L2 14 M56 22 L62 14 M10 40 L2 44 M54 40 L62 44" ${OUT}/>
    ${core(32, 30, 7, "#ecfccb")}`),
  "enemy-mine": svg(`
    <g stroke="#0b1020" stroke-width="3" stroke-linecap="round"><path d="M32 2 V14 M32 50 V62 M2 32 H14 M50 32 H62 M10 10 L18 18 M54 54 L46 46 M54 10 L46 18 M10 54 L18 46"/></g>
    <g stroke="#ef4444" stroke-width="2" stroke-linecap="round"><path d="M32 4 V13 M32 51 V60 M4 32 H13 M51 32 H60"/></g>
    <circle cx="32" cy="32" r="18" fill="${HULL}" ${OUT}/>
    ${core(32, 32, 7, "#fca5a5")}`),

  // ---------- Terra (Bestiario 2): base in basso ----------
  "ground-flak": svg(`
    <path d="M6 62 L12 44 H52 L58 62 Z" fill="${HULL}" ${OUT}/>
    <rect x="16" y="28" width="32" height="18" rx="4" fill="${PANEL}" ${OUT}/>
    <rect x="20" y="4" width="8" height="28" rx="2" fill="${HULL}" ${OUT}/>
    <rect x="36" y="4" width="8" height="28" rx="2" fill="${HULL}" ${OUT}/>
    <path d="M24 6 V12 M40 6 V12" stroke="#fb923c" stroke-width="3"/>
    ${core(32, 37, 5, "#fed7aa")}`),
  "ground-pylon": svg(`
    <path d="M14 62 L22 40 H42 L50 62 Z" fill="${HULL}" ${OUT}/>
    <rect x="26" y="8" width="12" height="36" rx="3" fill="${PANEL}" ${OUT}/>
    <path d="M26 20 H38 M26 30 H38" stroke="#facc15" stroke-width="2.5"/>
    ${core(32, 8, 6, "#fef08a")}`),
  "ground-spider": svg(`
    <g fill="none" stroke="#0b1020" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 34 L8 26 L2 50 M20 40 L10 44 L8 62 M42 34 L56 26 L62 50 M44 40 L54 44 L56 62"/></g>
    <g fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round"><path d="M22 34 L8 26 L2 50 M42 34 L56 26 L62 50"/></g>
    <ellipse cx="32" cy="36" rx="16" ry="12" fill="${HULL}" ${OUT}/>
    <rect x="28" y="14" width="8" height="14" rx="2" fill="${PANEL}" ${OUT}/>
    ${core(32, 37, 5, "#e9d5ff")}`),
  "ground-shieldgen": svg(`
    <path d="M8 62 L14 46 H50 L56 62 Z" fill="${HULL}" ${OUT}/>
    <path d="M10 46 A22 22 0 0 1 54 46" fill="rgba(34,211,238,.18)" stroke="#22d3ee" stroke-width="2.5"/>
    <rect x="26" y="26" width="12" height="22" rx="3" fill="${PANEL}" ${OUT}/>
    ${core(32, 24, 6, "#a5f3fc")}`),
  "ground-hangar": svg(`
    <path d="M2 62 V34 Q32 6 62 34 V62 Z" fill="${HULL}" ${OUT}/>
    <path d="M16 62 V42 Q32 30 48 42 V62 Z" fill="#0b1020" stroke="#94a3b8" stroke-width="2"/>
    <path d="M22 50 H42 M22 56 H42" stroke="#38bdf8" stroke-width="2" opacity=".8"/>
    <path d="M8 34 Q32 12 56 34" fill="none" stroke="#94a3b8" stroke-width="2.5"/>
    ${core(32, 20, 4, "#e2e8f0")}`),

  // ---------- Mini-boss ----------
  "enemy-minelayer": svg(`
    <g>${flame(44, 118, 10)}${flame(84, 118, 10)}</g>
    <path d="M64 6 L96 26 L112 70 L100 110 H28 L16 70 L32 26 Z" fill="#450a0a" ${OUT}/>
    <path d="M64 20 L86 34 L96 70 L88 98 H40 L32 70 L42 34 Z" fill="${HULL}" ${OUT}/>
    <g fill="${PANEL}" ${OUT}><circle cx="40" cy="104" r="9"/><circle cx="64" cy="108" r="9"/><circle cx="88" cy="104" r="9"/></g>
    <g fill="#ef4444"><circle cx="40" cy="104" r="3"/><circle cx="64" cy="108" r="3"/><circle cx="88" cy="104" r="3"/></g>
    <path d="M44 50 H84 M40 76 H88" stroke="#ef4444" stroke-width="3"/>
    ${core(64, 62, 10, "#fca5a5", "m")}`, 256, 128),
  "enemy-battleship": svg(`
    <g>${flame(40, 120, 10)}${flame(64, 124, 13)}${flame(88, 120, 10)}</g>
    <path d="M64 2 L90 20 L104 56 L120 64 L104 72 L96 112 H32 L24 72 L8 64 L24 56 L38 20 Z" fill="#0c4a6e" ${OUT}/>
    <path d="M64 16 L82 30 L90 60 L84 100 H44 L38 60 L46 30 Z" fill="${HULL}" ${OUT}/>
    <path d="M46 44 H82 M44 70 H84 M46 90 H82" stroke="#38bdf8" stroke-width="3"/>
    <g fill="${PANEL}" ${OUT}><rect x="54" y="22" width="20" height="14" rx="3"/></g>
    ${core(64, 58, 11, "#bae6fd", "s")}`, 256, 128),
  "enemy-weakpoint": svg(`
    <path d="M32 4 L56 18 V46 L32 60 L8 46 V18 Z" fill="${HULL}" ${OUT}/>
    <path d="M32 12 L48 22 V42 L32 52 L16 42 V22 Z" fill="none" stroke="#22d3ee" stroke-width="2.5"/>
    ${core(32, 32, 9, "#67e8f9", "w")}`),

  // ---------- Boss (Bestiario 2) ----------
  "enemy-serpent": svg(`
    <path d="M32 2 C48 6 58 20 56 36 C54 50 44 60 32 62 C20 60 10 50 8 36 C6 20 16 6 32 2 Z" fill="#14532d" ${OUT}/>
    <path d="M14 14 L4 4 M50 14 L60 4" ${OUT}/>
    <path d="M14 14 L4 4 M50 14 L60 4" stroke="#4ade80" stroke-width="2"/>
    <g fill="#facc15" stroke="#0b1020" stroke-width="2"><path d="M18 26 L28 30 L20 34 Z"/><path d="M46 26 L36 30 L44 34 Z"/></g>
    <path d="M22 46 Q32 54 42 46" fill="none" stroke="#4ade80" stroke-width="3"/>
    <path d="M26 50 L28 56 M38 50 L36 56" stroke="#f8fafc" stroke-width="2"/>
    ${core(32, 38, 5, "#bbf7d0", "h")}`),
  "enemy-segment": svg(`
    <circle cx="32" cy="32" r="26" fill="#166534" ${OUT}/>
    <circle cx="32" cy="32" r="17" fill="${HULL}" ${OUT}/>
    <g stroke="#4ade80" stroke-width="3" stroke-linecap="round"><path d="M32 6 V14 M32 50 V58 M6 32 H14 M50 32 H58"/></g>
    ${core(32, 32, 6, "#86efac", "g")}`),
  "enemy-fortress": svg(`
    <circle cx="64" cy="64" r="58" fill="#0c4a6e" ${OUT}/>
    <circle cx="64" cy="64" r="44" fill="${HULL}" ${OUT}/>
    <g fill="${PANEL}" ${OUT}><rect x="56" y="2" width="16" height="22" rx="3"/><rect x="56" y="104" width="16" height="22" rx="3"/><rect x="2" y="56" width="22" height="16" rx="3"/><rect x="104" y="56" width="22" height="16" rx="3"/></g>
    <g stroke="#38bdf8" stroke-width="3"><path d="M64 4 V14 M64 114 V124 M4 64 H14 M114 64 H124"/></g>
    <circle cx="64" cy="64" r="26" fill="#0b1020" stroke="#facc15" stroke-width="3" stroke-dasharray="10 6"/>
    ${core(64, 64, 14, "#fde68a", "f")}`, 256, 128),
  "enemy-queen": svg(`
    <g>${flame(50, 116, 12)}${flame(78, 116, 12)}</g>
    <path d="M64 4 L80 20 L120 30 L100 58 L116 92 L82 86 L72 114 H56 L46 86 L12 92 L28 58 L8 30 L48 20 Z" fill="#365314" ${OUT}/>
    <path d="M64 18 L76 30 L84 60 L74 100 H54 L44 60 L52 30 Z" fill="${HULL}" ${OUT}/>
    <path d="M48 8 L56 20 M80 8 L72 20 M64 2 V16" stroke="#facc15" stroke-width="4" stroke-linecap="round"/>
    <g fill="#a3e635" stroke="#0b1020" stroke-width="2"><circle cx="30" cy="40" r="6"/><circle cx="98" cy="40" r="6"/><circle cx="34" cy="80" r="5"/><circle cx="94" cy="80" r="5"/></g>
    ${core(64, 56, 11, "#ecfccb", "q")}`, 256, 128),

};
