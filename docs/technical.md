# Contesto tecnico

Phaser 4 + Vite + TypeScript strict. Nessuna altra dipendenza runtime.

```
src/
  main.ts                 bootstrap (in dev espone window.game)
  style.css               tutta l'interfaccia DOM
  game/
    main.ts               config Phaser (1280×720, Scale.FIT)
    config.ts             costanti e bilanciamento
    types.ts              tipi condivisi
    utils.ts              RNG con seed, pick pesato, SpatialHash
    meta.ts               salvataggio, sblocchi, crediti
    audio.ts              musica in streaming + effetti sintetizzati (WebAudio)
    art/svg.ts            icone (24×24, currentColor) e sprite SVG (64×64)
    art/textures.ts       caricamento PNG/SVG + texture procedurali (glow, stelle...)
    data/enemies.ts       definizioni nemici, affissi elite, scala per wave
    data/upgrades.ts      tomi, oggetti, rarità, computeStats()
    scenes/GameScene.ts   nucleo di combattimento: nave, nemici, armi, pickup, pausa
    modes/mode.ts         interfaccia GameMode (arena, ritmo, ricompense, fine run, HUD)
    modes/survival.ts     survival roguelite: wave, level-up con tomi, chest, crediti
    modes/campaign/       campagna: equipaggiamento, missioni, profilo, hub, corridoio
    systems/arena.ts      arena quadrata e corridoio, disegno, collisioni, parallasse
    systems/director.ts   wave del survival, eventi orda/boss, spawn
    systems/enemies.ts    spawn e IA di tutti i nemici, boss a fasi
    systems/weapons.ts    proiettili in pool, cannone, droni, lame, arco, evoluzioni
    systems/deployables.ts torrette e mine
    systems/pickups.ts    gemme, monete, drop speciali, chest
    systems/fx.ts         particelle, numeri di danno, anelli, fulmini, frecce
    ui/                   HUD, schermate, suggerimenti, console dev (DOM puro)
```

## Principi

- **Nucleo + modalità.** `GameScene` è il nucleo comune: nave, nemici, armi,
  pickup, effetti, pausa e stati (`menu`, `playing`, `levelup`, `paused`,
  `over`). Tutto ciò che distingue le modalità passa da `GameMode`
  (`modes/mode.ts`):
  - `setup`: arena, punto di partenza, loadout base, livello di minaccia;
  - `update`: ritmo e regia (wave nel survival, scorrimento nella campagna);
  - `onKill` e `onChest`: ricompense;
  - `end`: assegna le ricompense e mostra il riepilogo;
  - `hud` e `build`: cosa mostra l'HUD.

  I sistemi ricevono la scena e leggono `g.run`, `g.enemies`, `g.player`, `g.arena`.
- **Statistiche derivate.** `run.base` è il loadout di partenza: fisso nel
  survival, calcolato dall'equipaggiamento in campagna (`loadoutStats`).
  `computeStats(run)` ci applica sopra tomi e oggetti. Nessun valore viene
  "cotto" dentro le entità, quindi un upgrade non deve aggiornare a mano
  torrette o droni già esistenti.
- **Salvataggi separati.** `space-war-meta-v4` contiene crediti e sblocchi del
  survival; `space-war-campaign-v1` contiene monete, inventario,
  equipaggiamento e missioni completate.
- **Tempo di gioco proprio.** `g.now` avanza solo in modalità `playing`:
  pausa e level-up congelano automaticamente timer, cooldown e buff. Al
  congelamento vengono messi in pausa anche tween e particelle.
- **Pool.** Proiettili, proiettili nemici, pickup e numeri di danno vengono
  riciclati. Le gemme oltre il limite si fondono.
- **SpatialHash.** Separazione fra nemici e collisioni dei proiettili usano una
  griglia ricostruita a ogni frame.
- **UI in DOM.** Phaser disegna solo il mondo. Menu, HUD, carte e toast sono
  HTML/CSS con icone SVG inline. L'HUD scrive nel DOM solo quando un valore
  cambia.

## Aggiungere contenuti

- **Pezzo d'equipaggiamento**: una voce in `GEAR` (`modes/campaign/gear.ts`),
  con effetti dichiarativi `set`/`add`/`mul` sulle statistiche. Scheda,
  prezzi e upgrade si derivano da soli.
- **Missione**: una voce in `MISSIONS` (`modes/campaign/missions.ts`), con
  posizione sulla mappa e missioni richieste.

- **Nemico**: una voce in `data/enemies.ts`. Se ha un comportamento nuovo, un
  `case` in `updateEnemies` (`systems/enemies.ts`). Sprite in
  `art/textures.ts` (PNG) oppure in `art/svg.ts` (`SPRITES`).
- **Tomo**: una voce in `TOMES` più l'effetto in `computeStats`; l'eventuale
  evoluzione si controlla con `isEvolved(run, id)` dove serve.
- **Oggetto**: una voce in `ITEMS`, l'effetto in `computeStats` o nel sistema
  che lo usa (`itemLevel(run, id)`).
- **Icona**: path SVG in `ICONS` (24×24, `currentColor`), poi `icon("id")` nel DOM.

## Comandi

```bash
npm run dev        # http://localhost:8080 con console di debug (tasto `)
npm run build      # type-check + build in dist/
npm run typecheck
npm run deploy     # pubblica dist/ su GitHub Pages
```

Il deploy avviene anche in automatico a ogni push su `main`
(`.github/workflows/deploy.yml`).

## Asset

- Sprite PNG dei nemici e della nave in `public/assets/images/`.
- Nuovi nemici, pickup, difese e icone sono SVG generati da codice: niente file
  da scaricare.
- Musica in `public/sounds/music/` (circa 9 MB per traccia): va in streaming
  con `<audio>` e non blocca il caricamento. Ricomprimerla in OGG o MP3 a
  96 kbps la porterebbe intorno ai 2 MB.
