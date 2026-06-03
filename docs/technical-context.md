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
  - canvas configurato da `src/game/config/gameplay.ts`;
  - `Scale.FIT`;
  - `Scale.CENTER_BOTH`;
  - background `#028af8`;
  - scena `Game`.
- `src/game/scenes/Game.ts` contiene una vertical slice giocabile:
  - nodo centrale visibile come arena provvisoria;
  - navicella controllabile con `WASD` o frecce;
  - shooting automatico verso il nemico piu' vicino;
  - nemici inseguitori con wave a timer e scaling semplice;
  - pickup XP e monete;
  - level-up con 3 scelte cliccabili da 6 upgrade base;
  - HP, invulnerabilita' breve dopo colpo, morte e restart con `R`;
  - UI base per HP, XP, livello, monete run, wave e numero nemici.

## Struttura Phaser consigliata

- `src/game/scenes/` contiene scene Phaser. Le scene coordinano il ciclo di vita e collegano i sistemi.
- `src/game/config/` contiene costanti condivise, dimensioni canvas e valori iniziali di bilanciamento.
- `src/game/types/` contiene tipi TypeScript condivisi tra scene e sistemi.
- `src/game/data/` contiene dati di design, per esempio il pool degli upgrade.
- `src/game/systems/` contiene sottosistemi riusabili per rendering arena, HUD, effetti e futuri sistemi di gameplay.
- `src/game/utils/` contiene funzioni pure o leggere, per esempio geometria e collisioni.

La scena `Game` deve restare un orchestratore. Quando una responsabilita' cresce, spostarla in un sistema o in dati dedicati invece di allungare ulteriormente la scena.

## Implicazioni

Il progetto contiene un primo nucleo giocabile, ma non contiene ancora:

- mappa-grafo completa con piu' nodi e collegamenti attraversabili;
- espansione della mappa durante la run;
- difese o trappole;
- archetipi nemici avanzati, elite o boss;
- shop/hangar;
- persistenza.

Il prossimo agente di implementazione dovrebbe partire dal grafo minimo o dai piazzabili, mantenendo giocabile la vertical slice esistente.

## Convenzioni iniziali consigliate

- Tenere Phaser come runtime principale.
- Separare dati di design e logica quando possibile.
- Evitare mega-scene monolitiche appena il prototipo cresce.
- Usare nomi coerenti con i docs: run, wave, node, edge, upgrade, coin, turret, trap.
- Costruire prima sistemi semplici e visibili, poi rifinire bilanciamento.
- Se il proprietario del progetto chiede di non eseguire verifiche, non lanciare test, build, dev server, browser check o e2e. Limitarsi a controlli statici.
- Aggiornare questi documenti quando una decisione tecnica diventa reale.
