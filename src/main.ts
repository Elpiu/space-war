import { startGame } from "./game/main";
import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
  const game = startGame("game-container");
  // In sviluppo l'istanza resta raggiungibile dalla console per il debug.
  if (import.meta.env.DEV) (window as unknown as { game: typeof game }).game = game;
});
