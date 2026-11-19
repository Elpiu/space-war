/** Impostazioni del giocatore, separate dai salvataggi di gioco. */
export interface Settings {
  /** Volumi da 0 a 1. */
  music: number;
  sfx: number;
  /** Tremolio dello schermo: 0 spento, 0.5 ridotto, 1 pieno. */
  shake: number;
  damageNumbers: boolean;
  /** Avvisi d'attacco più spessi e luminosi. */
  contrast: boolean;
  /** Verniciatura della nave (id da PAINTS). */
  paint: string;
}

const KEY = "space-war-settings-v1";

const defaults = (): Settings => ({ music: 0.8, sfx: 0.8, shake: 1, damageNumbers: true, contrast: false, paint: "standard" });

const clamp01 = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback);

let cached: Settings | null = null;

export const getSettings = (): Settings => {
  if (cached) return cached;
  const base = defaults();
  try {
    const raw = window.localStorage.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as Partial<Settings>) : {};
    cached = {
      music: clamp01(s.music, base.music),
      sfx: clamp01(s.sfx, base.sfx),
      shake: [0, 0.5, 1].includes(s.shake as number) ? (s.shake as number) : base.shake,
      damageNumbers: typeof s.damageNumbers === "boolean" ? s.damageNumbers : base.damageNumbers,
      contrast: typeof s.contrast === "boolean" ? s.contrast : base.contrast,
      paint: typeof s.paint === "string" ? s.paint : base.paint,
    };
  } catch {
    cached = base;
  }
  return cached;
};

export const saveSettings = (patch: Partial<Settings>) => {
  cached = { ...getSettings(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cached));
  } catch {
    // Storage non disponibile: le impostazioni valgono per questa sessione.
  }
  return cached;
};
