import { VIEW_H, VIEW_W } from "./config";

/** Dispositivo con schermo touch come input principale (telefono o tablet). */
export const isTouchDevice = () =>
  new URLSearchParams(window.location.search).has("touch") ||
  window.matchMedia("(pointer: coarse)").matches ||
  ("ontouchstart" in window && navigator.maxTouchPoints > 0);

/**
 * Il gioco ha dimensioni fisse: tutto vive in un palco 1280x720 scalato in
 * modo uniforme per stare nello schermo, senza layout che cambiano con la
 * finestra. Sui dispositivi touch l'interfaccia DOM viene ingrandita di un
 * fattore `k` (lavora su un palco logico più piccolo) per restare leggibile
 * e toccabile su uno schermo da telefono.
 */
export const setupStage = (onResize: () => void) => {
  const stage = document.getElementById("stage") as HTMLElement;
  const touch = isTouchDevice();
  document.body.classList.toggle("is-touch", touch);

  const fit = () => {
    const width = window.visualViewport?.width ?? window.innerWidth;
    const height = window.visualViewport?.height ?? window.innerHeight;
    const s = Math.min(width / VIEW_W, height / VIEW_H);
    // Testi e pulsanti dell'interfaccia non devono scendere sotto ~78% della dimensione nominale.
    const k = touch ? Math.min(1.6, Math.max(1, 0.78 / s)) : 1;
    stage.style.setProperty("--s", `${s}`);
    stage.style.setProperty("--k", `${k}`);
    onResize();
  };

  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", () => window.setTimeout(fit, 250));
  window.visualViewport?.addEventListener("resize", fit);
  fit();
  return { touch };
};

/** Schermo intero e orientamento orizzontale, dove il browser lo consente. */
export const enterFullscreen = async () => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.({ navigationUI: "hide" });
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    await orientation.lock?.("landscape");
  } catch {
    // Non supportato (per esempio iOS Safari): si gioca comunque.
  }
};
