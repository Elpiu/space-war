# Technical Context

Questo documento descrive lo stato tecnico del repository al 2026-06-03. Serve a evitare che nuovi agenti assumano l'esistenza di sistemi non ancora implementati.

## Stack

- Phaser 4.0.0
- Vite 6.3.1
- TypeScript 5.7.2
- Template di partenza: Phaser Vite TypeScript Template

## Script disponibili

Da `package.json`:

- `npm run dev` - avvia Vite con logging template.
- `npm run build` - build produzione con logging template.
- `npm run dev-nolog` - avvia Vite senza chiamata `log.js`.
- `npm run build-nolog` - build produzione senza chiamata `log.js`.

Per sviluppo locale del gioco, preferire `npm run dev-nolog`.

## Struttura attuale

- `index.html` contiene il container dell'app.
- `public/style.css` centra il canvas e imposta lo sfondo pagina.
- `public/assets/bg.png` e `public/assets/logo.png` sono asset demo del template.
- `src/main.ts` aspetta `DOMContentLoaded` e chiama `StartGame('game-container')`.
- `src/game/main.ts` crea la config Phaser:
  - canvas 1024x768;
  - `Scale.FIT`;
  - `Scale.CENTER_BOTH`;
  - background `#028af8`;
  - scena `Game`.
- `src/game/scenes/Game.ts` e' ancora una scena placeholder:
  - carica `background` e `logo`;
  - mostra immagini e testo template.

## Implicazioni

Il progetto non contiene ancora:

- player;
- nemici;
- sistemi di wave;
- mappa-grafo;
- XP o upgrade;
- monete;
- difese o trappole;
- UI di gioco;
- persistenza.

Il primo agente di implementazione dovra' creare questi sistemi partendo dal template.

## Convenzioni iniziali consigliate

- Tenere Phaser come runtime principale.
- Separare dati di design e logica quando possibile.
- Evitare mega-scene monolitiche appena il prototipo cresce.
- Usare nomi coerenti con i docs: run, wave, node, edge, upgrade, coin, turret, trap.
- Costruire prima sistemi semplici e visibili, poi rifinire bilanciamento.
- Aggiornare questi documenti quando una decisione tecnica diventa reale.

