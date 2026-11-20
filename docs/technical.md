# Contesto tecnico

Phaser 4 + Vite + TypeScript strict. Nessuna altra dipendenza runtime.

```
src/
  main.ts                 bootstrap (in dev espone window.game)
  style.css               tutta l'interfaccia DOM
  game/
    main.ts               config Phaser (palco fisso 1280×720, Scale.NONE)
    config.ts             costanti e bilanciamento
    types.ts              tipi condivisi
    utils.ts              RNG con seed, pick pesato, SpatialHash
    meta.ts               salvataggio, sblocchi, crediti
    settings.ts           impostazioni del giocatore (volumi, tremolio, numeri, contrasto, verniciatura)
    archive.ts            archivio comune: nemici visti e abbattuti, pezzi trovati, medaglie, verniciature
    savefile.ts           esporta/importa di tutte le chiavi "space-war-…" in JSON
    audio.ts              musica in streaming + effetti sintetizzati (WebAudio)
    art/svg.ts            icone (24×24, currentColor) e sprite SVG (64×64)
    art/enemySprites.ts   sprite SVG di tutti i nemici e dei boss
    art/textures.ts       caricamento PNG/SVG + texture procedurali (glow, stelle...)
    data/enemies.ts       definizioni nemici, affissi elite, scala per wave
    data/upgrades.ts      tomi, oggetti, rarità, computeStats()
    scenes/GameScene.ts   nucleo di combattimento: nave, nemici, armi, pickup, pausa
    modes/mode.ts         interfaccia GameMode (arena, ritmo, ricompense, fine run, HUD)
    modes/survival.ts     survival roguelite: wave, level-up con tomi, chest, crediti
    modes/campaign/       campagna: equipaggiamento, missioni, livelli a segmenti, formazioni, profilo
    modes/campaign/hub.ts regia dell'hub (stato, eventi delegati, esito missione)
    modes/campaign/sectors.ts  campagna infinita: seed, mappa a nodi, Markov, curve, biomi, mutatori
    modes/campaign/events.ts   cantiere, eventi e tesori (nodi senza combattimento)
    modes/campaign/affixes.ts  affissi del bottino: tiro, etichette, effetti su arma e nave
    modes/campaign/contracts.ts contratti di missione (obiettivo facoltativo per missione)
    ui/extras.ts          finestra Impostazioni e schermata Archivio
    modes/campaign/ui/    viste dell'hub: mappa, hangar (con officina), negozio, elementi comuni
    systems/arena.ts      arena quadrata e corridoio, disegno, collisioni, parallasse
    systems/director.ts   wave del survival, eventi orda/boss, spawn
    systems/enemies.ts    spawn e IA di base dei nemici, boss a fasi
    systems/enemyAI.ts    comportamenti del bestiario v3: laser, supporto, gravità, EMP, teletrasporto, affissi continui
    systems/bestiary2.ts  bestiario 2: picchiatore, flak, radar, sanguisuga, specchio, madre, mina, unità di terra
    systems/bossAI.ts     boss a rotazione (Serpente, Fortezza, Regina), mini-boss, parti e corazze
    systems/patterns.ts   schemi di fuoco (mirato, ventaglio, U, I, S, C, X, muro, spirale)
    systems/weapons.ts    proiettili in pool (anche a ricerca, a gravità, esplosivi), arsenale del survival
    systems/rack.ts       armi a slot della campagna: fuoco tenuto, calore, missili, bombe
    systems/terrain.ts    pavimento e soffitto: campionamento, collisioni, disegno
    systems/deployables.ts torrette e mine
    systems/pickups.ts    gemme, monete, drop speciali, chest
    systems/fx.ts         particelle, numeri di danno, anelli, fulmini, frecce
    ui/                   HUD, schermate, suggerimenti, console dev (DOM puro)
```

## Principi

- **Dimensioni fisse.** Tutto vive in un palco 1280×720 (`#stage`, `stage.ts`)
  scalato in modo uniforme per entrare nello schermo; non ci sono layout che
  dipendono dalla finestra. Phaser usa `Scale.NONE`, il palco è scalato via
  CSS. Sui dispositivi touch l'interfaccia DOM lavora su un palco logico più
  piccolo, ingrandito di un fattore `k` (fino a 1,6), così testi e pulsanti
  restano leggibili. Per provare la modalità touch da desktop si aggiunge
  `?touch=1` all'indirizzo.
- **Comandi touch** (`ui/touch.ts`): joystick analogico sulla metà sinistra e
  pulsanti per modalità. La scena li legge insieme alla tastiera. In verticale
  compare l'invito a ruotare il dispositivo.

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
  survival; `space-war-campaign-v2` contiene monete, inventario,
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

- **Pezzo d'equipaggiamento**: una voce in `GEAR` (`modes/campaign/gear.ts`).
  Le armi hanno una `WeaponSpec` (danno, cadenza, calore, proiettili, ricerca,
  gravità, esplosione) e soglie ai livelli 5 e 10. Gli scafi hanno una
  `HullSpec` con il layout degli slot. I dispositivi hanno effetti
  dichiarativi su nave e rack. Scheda, prezzi e upgrade si derivano da soli.
- **Missione**: una voce in `MISSIONS` (`modes/campaign/missions.ts`), con
  la sequenza dei segmenti, la posizione sulla mappa e le missioni richieste.
  Solo per il settore 1: dal 2 in poi le missioni sono generate da
  `generateSector` (`modes/campaign/sectors.ts`) e si risolvono con
  `resolveMission(seed, id)`. Gli id generati hanno la forma `g{settore}-{strato}-{indice}`.
- **Bioma**: una voce in `BIOMES` (`sectors.ts`) con pesi dei segmenti,
  formazioni favorite e colori. Eventuali pericoli speciali vanno in
  `CampaignMode.update` (vedi la nebulosa tossica).
- **Mutatore**: una voce in `MUTATORS` (`sectors.ts`), più l'effetto in
  `CampaignMode` (`this.has("id")`).
- **Affisso del bottino**: una voce in `GEAR_AFFIXES` (`modes/campaign/affixes.ts`)
  con slot, intervallo e l'effetto `weapon` (sulla WeaponSpec) oppure `ship`
  (su ShipStats o RackStats). Fusione, ricalibrazione e offerte del settore
  sono in `profile.ts`.
- **Medaglia**: una voce in `MEDALS` (`archive.ts`) con progresso e
  verniciatura; la verniciatura va in `PAINTS`. Le statistiche nuove si
  registrano con `recordStat` e si salvano a fine run (`saveArchive`).
- **Contratto**: un id in `ContractId` più etichetta e stato in
  `contracts.ts`, e il contatore in `CampaignMode` (`this.cstats`).
- **Evento**: un `case` in `nodeContent` (`modes/campaign/events.ts`) e l'id
  in `EVENTS` (`sectors.ts`).
- **Minaccia**: `ModeSetup.threat` moltiplica HP, danno e velocità dei nemici
  in `spawnEnemy`, tramite `run.threat`.
- **Schema di fuoco**: un `case` in `firePattern` (`systems/patterns.ts`) e il
  suo costo in `PATTERN_COST`. Un nemico lo usa con `pattern` nella
  definizione o, per il singolo esemplare, con l'opzione `pattern` di `spawnEnemy`.
- **Ondata di campagna**: una voce in `FORMATIONS` (`modes/campaign/formations.ts`)
  con segmenti, tier minimo, peso e ruolo: `role: "travel"` per chi
  attraversa lo schermo, altrimenti ingaggio (le traiettorie `hold` con
  `engage: true` restano a combattere). Le traiettorie disponibili sono
  `straight`, `sine`, `dive`, `wheel` e `hold` (`FlightPath` in `types.ts`).
- **Unità di terra o struttura**: definizione in `data/enemies.ts` con
  `campaignOnly` (e `structure` se non attacca), piazzamento nella tabella
  `GROUND` di `level.ts`.
- **Tipo di segmento**: profilo del terreno in `generateLevel`
  (`modes/campaign/level.ts`), lunghezza in `LENGTHS`, nemici favoriti in
  `SEGMENT_WEIGHTS` (`campaignMode.ts`), stile del bordo in `STYLE`
  (`systems/terrain.ts`).

- **Nemico**: una voce in `data/enemies.ts`. Se ha un comportamento nuovo, un
  `case` in `extraBehavior` (`systems/enemyAI.ts`) o in `bestiary2Behavior`
  (`systems/bestiary2.ts`); le unità di terra in `groundTick`. Boss e
  mini-boss hanno i flag `boss` / `miniBoss` nella definizione (mai
  confrontare l'id con "boss"); le parti (segmenti, punti deboli) hanno
  `part` e `owner`, e muoiono con il proprietario. Le corazze legate alle
  parti stanno in `armorMul` (`systems/bossAI.ts`). Sprite SVG in
  `ENEMY_SPRITES` (`art/enemySprites.ts`). I telegrafi usano i colori di
  `SIGNAL` (`config.ts`): non introdurre colori nuovi per un attacco.
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

- Solo lo sprite PNG della nave resta in `public/assets/images/`.
- Nemici, boss, pickup, difese e icone sono SVG generati da codice: niente file
  da scaricare.
- Musica in `public/sounds/music/` (circa 9 MB per traccia): va in streaming
  con `<audio>` e non blocca il caricamento. Ricomprimerla in OGG o MP3 a
  96 kbps la porterebbe intorno ai 2 MB.
