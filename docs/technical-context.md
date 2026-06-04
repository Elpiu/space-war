# Technical Context

Questo documento descrive lo stato tecnico del repository al 2026-06-04. Serve a evitare che nuovi agenti assumano l'esistenza di sistemi non ancora implementati.

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
  - menu principale con `Play`, `Shop` ed `Exit`;
  - shop/hangar esterno con categorie navicelle, cannoni, booster, torrette e mine;
  - shop a schede tutto sbloccato con preview vettoriali Phaser, colori per item, stati selezione/equip e descrizioni leggibili;
  - tre archetipi nave: Standard neutra, Tank resistente/lento e Light Fighter fragile/rapido;
  - loadout persistente che influenza la run successiva;
  - mappa continua prototipo con settori S/M/L, mini-mappa e camera follow;
  - settori generati in world-space senza gate, portali o bridge;
  - ostacoli/pericoli iniziali: asteroidi solidi, nebule rallentanti e plasma dannoso;
  - espansione della mappa dopo wave 2 e poi ogni 2 wave, fino a un limite prototipo;
  - movimento continuo tra settori adiacenti;
  - torrette piazzabili con `T`, costo in monete run, limite massimo e fuoco automatico;
  - mine piazzabili con `F`, costo in monete run, limite massimo ed esplosione ad area;
  - barricate piazzabili con `B` dopo sblocco in-run;
  - rimozione del piazzabile vicino con `E`;
  - piazzabili con HP, distruttibili dai nemici;
  - mini navicelle follower sbloccabili tramite upgrade;
  - chest gratuite dopo circa 80 kill e chest acquistabili con risorsa run;
  - risorsa run non permanente usata per piazzabili e chest;
  - meta-state `localStorage` usato per loadout equipaggiato e compatibilita' con vecchi salvataggi;
  - navicella controllabile con `WASD` o frecce;
  - shooting automatico verso il nemico piu' vicino;
  - nemici data-driven con archetipi inseguitore, sciame, corazzato e tiratore;
  - proiettili nemici separati dai proiettili del giocatore;
  - wave persistenti da circa 30 secondi;
  - fasi wave `inizio`, `medio`, `finale` con ritmo di spawn crescente;
  - settori di spawn scelti tra quelli piu' lontani dal giocatore e marcati nel mondo/mini-mappa;
  - pickup XP e monete;
  - level-up con 3 scelte cliccabili da un pool XP separato dagli upgrade chest;
  - HP, invulnerabilita' breve dopo colpo, morte, pannello game over e restart con `R`;
  - UI base per HP, XP, livello, monete run, wave e numero nemici.

## Struttura Phaser consigliata

- `src/game/scenes/` contiene scene Phaser. Le scene coordinano il ciclo di vita e collegano i sistemi.
- `src/game/config/` contiene costanti condivise, dimensioni canvas e valori iniziali di bilanciamento.
- `src/game/types/` contiene tipi TypeScript condivisi tra scene e sistemi.
- `src/game/data/` contiene dati di design, per esempio pool upgrade separati e definizioni nemici.
- `src/game/systems/` contiene sottosistemi riusabili per settori mappa, rendering arena/mini-mappa, HUD, effetti, chest, droni, piazzabili, meta-progressione, nemici e futuri sistemi di gameplay.
- `src/game/utils/` contiene funzioni pure o leggere, per esempio geometria e collisioni.

La scena `Game` deve restare un orchestratore. Quando una responsabilita' cresce, spostarla in un sistema o in dati dedicati invece di allungare ulteriormente la scena.

## Implicazioni

Il progetto contiene un primo nucleo giocabile, ma non contiene ancora:

- elite, boss, supporti nemici o kamikaze;
- shop/hangar definitivo con economia permanente;
- persistenza avanzata oltre il loadout prototipo in localStorage.

Il prossimo agente di implementazione dovrebbe partire da varieta' nemici, upgrade sinergici o ulteriori contenuti shop, mantenendo giocabile la vertical slice esistente.

## Convenzioni iniziali consigliate

- Tenere Phaser come runtime principale.
- Separare dati di design e logica quando possibile.
- Evitare mega-scene monolitiche appena il prototipo cresce.
- Usare nomi coerenti con i docs: run, wave, sector, hazard, upgrade, coin, turret, trap.
- Costruire prima sistemi semplici e visibili, poi rifinire bilanciamento.
- Se il proprietario del progetto chiede di non eseguire verifiche, non lanciare test, build, dev server, browser check, e2e o controlli statici.
- Aggiornare questi documenti quando una decisione tecnica diventa reale.
