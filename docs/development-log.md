# Development Log

Log cronologico dei progressi del progetto. Ogni voce deve indicare data, tipo di cambiamento e stato del lavoro.

## 2026-06-10 - Generazione mappa non deterministica

Stato:

- sostituita la crescita deterministica dei settori con una blueprint random per run;
- aggiunto seed interno alla run e RNG seedato senza nuove dipendenze;
- aggiunto profilo mappa default con massimo 12 settori totali, profondita' massima 4 e pattern misto controllato;
- la mappa pianifica settori nascosti all'avvio run e li rivela progressivamente dopo wave 2 e poi ogni 2 wave;
- la scelta di anchor, direzione, dimensione, archetipo, aperture e hazard usa valori seedati;
- mantenuti i settori visibili come fonte per camera, mini-mappa, collisioni, spawn, chest e reward.

Verifica:

- non eseguita su richiesta del proprietario del progetto.

## 2026-06-04 - Shop item e piazzabili data-driven

Stato:

- convertiti navicelle, cannoni e booster dello shop da funzioni `apply` imperative a `modifiers` dichiarativi;
- reso il sistema upgrade capace di applicare automaticamente i `modifiers`, lasciando `apply` opzionale per casi dinamici;
- aggiunti clamp opzionali `min`/`max` ai modificatori numerici;
- spostate le definizioni operative di torrette e mine dentro gli item shop (`turret`/`mine`), inclusi costo run, stat, colori e raggi;
- rimosse le config duplicate di torrette/mine da `src/game/config/gameplay.ts`;
- `placeables.ts` crea torrette e mine leggendo il loadout selezionato come dati.

Verifica:

- `npm run build-nolog` e `npx tsc --noEmit` non erano disponibili perche' `npm`/`npx` non sono nel PATH della shell;
- eseguito type-check `tsc --noEmit` con il runtime Node bundled;
- eseguita build produzione Vite con il runtime Node bundled.

## 2026-06-04 - Loot table pesata e sensibile al loadout

Stato:

- aggiunti pesi base agli upgrade XP/chest per rappresentare rarita' e frequenza desiderata;
- sostituita la pesca uniforme con una pesca pesata senza duplicati per le 3 scelte XP;
- sostituita la pesca casuale uniforme delle chest con una pesca pesata singola;
- il loadout equipaggiato influenza le categorie coerenti, per esempio mine, torrette, pickup, nave e armi;
- la direzione gia presa nella run aumenta la probabilita' di categorie come droni, mine, torrette e barricate;
- aggiunti gate morbidi per tenere possibili ma meno frequenti alcune categorie prima che diventino rilevanti.

Verifica:

- non eseguita su richiesta del proprietario del progetto.

## 2026-06-04 - Refactor modulare della scena Game

Stato:

- ridotta `src/game/scenes/Game.ts` da circa 1837 a 579 righe;
- estratti stato run, player, weapon, pickup, wave, chest, reward, upgrade, screen e controller piazzabili in sistemi dedicati;
- aggiunto modello `Modifier` per futuri item/upgrade data-driven;
- aggiunte loot table esplicite per upgrade XP e chest;
- corretto il filtro `maxStacks` degli upgrade;
- aggiunti hook per aperture/generazione settori e per valuta post-run `postRunCredits`;
- preservata la vertical slice e il colore shotgun gia modificato localmente.

Verifica:

- `npm run build-nolog` non era disponibile perche' `npm` non e' nel PATH della shell;
- eseguito type-check `tsc --noEmit` con il runtime Node bundled;
- eseguita build produzione Vite con il runtime Node bundled.

## 2026-06-04 - Economia run, chest e piazzabili evoluti

Stato:

- separata la risorsa run dalla meta-economia: le monete raccolte in partita non vengono piu' bancate fuori run;
- trasformato lo shop/hangar in loadout tutto sbloccato senza acquisti;
- divisi gli upgrade in pool XP selezionabile e pool chest casuale;
- aggiunte chest gratuite circa ogni 80 kill e chest acquistabili in mappa con costo visibile;
- aggiunte barricate sbloccabili, rimozione piazzabile vicino con `E` e HP ai piazzabili;
- aggiunte mini navicelle follower sbloccabili tramite upgrade;
- i nemici possono distruggere torrette, mine e barricate.

Verifica:

- eseguito type-check `tsc --noEmit` con il runtime Node bundled;
- eseguita build produzione Vite con il runtime Node bundled.

## 2026-06-04 - Sistema nemici data-driven

Stato:

- aggiunte definizioni nemici tipizzate in `src/game/data/enemies.ts`;
- aggiunti 4 archetipi giocabili: inseguitore, sciame, corazzato e tiratore;
- aggiunto sistema `src/game/systems/enemies.ts` per creazione, AI, scaling wave, cleanup e proiettili nemici;
- separati i proiettili nemici dai proiettili del giocatore;
- preparato `iconKey` opzionale per future icone nemico con fallback geometrico Phaser;
- aggiornata la composizione wave per introdurre gradualmente sciame, corazzati e tiratori.

Verifica:

- `npm run build-nolog` non era disponibile perche' `npm` non e' nel PATH della shell;
- eseguito type-check `tsc --noEmit` con il runtime Node bundled;
- eseguita build produzione Vite con il runtime Node bundled.

## 2026-06-04 - Rifinitura shop/hangar e archetipi navicella

Stato:

- trasformato lo shop da lista testuale a schede con preview vettoriali Phaser, colori per item e stati `EQUIP`, `ACQUISTATO` e `COMPRA`;
- aggiunti metadati visuali agli item shop: colore, icona/preview e riga statistiche;
- sostituito `Collector` con `Light Fighter`, mantenendo compatibilita' dei vecchi salvataggi `shipCollector`;
- bilanciate le navicelle in tre archetipi: Standard neutra, Tank resistente/lento e Light Fighter fragile/rapido;
- resi i booster moduli con tradeoff invece di bonus puri;
- la navicella in run cambia forma e colore in base al loadout selezionato.

Verifica:

- `npm run build-nolog` non era disponibile perche' `npm` non e' nel PATH della shell;
- eseguita build produzione chiamando Vite con il runtime Node bundled;
- eseguito type-check `tsc --noEmit` con il runtime Node bundled;
- avviato dev server Vite su `http://127.0.0.1:5173` e verificata risposta HTTP 200;
- non e' stato possibile completare il browser check integrato per assenza del relativo tool nella sessione.

## 2026-06-04 - Wave persistenti e settori di spawn

Stato:

- convertite le wave da spawn singolo a finestre persistenti da circa 30 secondi;
- aggiunte fasi wave `inizio`, `medio`, `finale` con intervalli di spawn progressivamente piu' rapidi;
- i nemici spawnano dai settori piu' lontani dal giocatore tra quelli scoperti;
- i settori attivi per lo spawn vengono evidenziati nel mondo e nella mini-mappa;
- l'HUD mostra la fase corrente della wave.

Verifica:

- non sono stati eseguiti test, build, dev server, browser check, e2e, type-check, `git diff`, `git diff --check` o controlli statici, come richiesto dal proprietario.

## 2026-06-04 - Mappa continua a settori

Stato:

- sostituito il modello mappa-grafo con mappa continua composta da settori S/M/L;
- rimosso il gameplay basato su gate, portali, bridge, edge e nodo corrente;
- aggiunto sistema `mapSectors` per creare settori, espandere la mappa, calcolare bounds e hazard;
- aggiornato renderer mappa per disegnare tutti i settori in world-space e mini-mappa fissa a schermo;
- aggiunta camera follow con world bounds aggiornati quando la mappa cresce;
- aggiunti hazard iniziali: asteroidi solidi, nebule rallentanti e plasma dannoso;
- aggiornati movimento, proiettili, nemici, spawn wave e HUD per usare settori continui;
- aggiornati docs di design e contesto tecnico.

Fuori dal batch:

- bilanciamento finale degli hazard, asset definitivi, pathfinding nemico avanzato e varietà completa dei settori.

Verifica:

- non sono stati eseguiti test, build, dev server, browser check, e2e, type-check, `git diff`, `git diff --check` o controlli statici, come richiesto dal proprietario.

## 2026-06-04 - Menu principale e shop/loadout esterno

Stato:

- aggiunto menu principale con `Play`, `Shop` ed `Exit`;
- trasformato l'hangar in shop esterno con categorie navicelle, cannoni, booster, torrette e mine;
- aggiunti item acquistabili e selezionabili per loadout persistente;
- esteso il meta-state localStorage con item sbloccati e loadout equipaggiato;
- mantenuta compatibilita' con i vecchi livelli hangar gia salvati;
- `Play` avvia la run applicando navicella, cannone, booster, torretta e mina selezionati;
- dopo morte sono disponibili `Restart`, `Shop` e `Menu`;
- aggiornato backlog e contesto tecnico.

Fuori dal batch:

- UI finale dello shop, reset progressione, descrizioni avanzate, preview visuali e bilanciamento definitivo degli item.

Verifica:

- non sono stati eseguiti test, build, dev server, browser check, e2e, type-check, `git diff`, `git diff --check` o controlli statici, come richiesto dal proprietario.

## 2026-06-03 - Monete permanenti e hangar provvisorio

Stato:

- aggiunto meta-state persistente in `localStorage` con chiave `space-war-meta-v1`;
- aggiunti tipi condivisi per upgrade hangar e stato meta-progressione;
- aggiunto sistema `metaProgression` per load/save, costi, acquisti e bonus permanenti;
- alla morte le monete run vengono sommate una sola volta al totale permanente;
- aggiunto hangar post-morte con 3 acquisti: scafo iniziale, propulsori iniziali e magnete iniziale;
- gli acquisti permanenti vengono applicati all'inizio della run successiva;
- aggiornato backlog e contesto tecnico.

Fuori dal batch:

- hangar definitivo, reset manuale progressione, nuove navicelle, shop completo e sblocchi avanzati.

Verifica:

- non sono stati eseguiti test, build, dev server, browser check, e2e, type-check, `git diff`, `git diff --check` o controlli statici, come richiesto dal proprietario.

## 2026-06-03 - Torrette e mine piazzabili

Stato:

- aggiunti tipi condivisi per torrette e mine;
- aggiunte costanti di costo, limite, range, danno e cooldown dei piazzabili;
- aggiunto sistema `placeables` per creazione, update, danno e cleanup;
- aggiunto input `T` per piazzare torrette sulla posizione della navicella;
- aggiunto input `F` per piazzare mine sulla posizione della navicella;
- torrette e mine consumano monete run e rispettano limiti massimi;
- aggiornato HUD con contatori torrette/mine e comandi;
- aggiornato backlog e contesto tecnico.

Fuori dal batch:

- risorsa in-run separata, upgrade specifici per piazzabili, shop/hangar e persistenza.

Verifica:

- non sono stati eseguiti test, build, dev server, browser check, e2e, type-check, `git diff`, `git diff --check` o controlli statici, come richiesto dal proprietario.

## 2026-06-03 - Mappa-grafo prototipo e movimento tra nodi

Stato:

- aggiunti tipi condivisi per nodi, collegamenti, direzioni e stato del grafo;
- aggiunta configurazione per 3 tipi di nodo tattico: ampio, stretto e hub;
- aggiunto sistema `mapGraph` per creare la mappa iniziale, espanderla e risolvere collegamenti/direzioni;
- sostituito il renderer del nodo centrale con rendering dinamico di arena corrente, gate e mini-mappa;
- aggiunto movimento tra nodi attraversando i gate sul bordo;
- aggiornato lo spawn wave per usare il nodo corrente, il rischio del nodo e i gate collegati;
- aggiornato HUD con nodo corrente, tipo nodo e nodi scoperti;
- aggiornato backlog e contesto tecnico.

Fuori dal batch:

- torrette, trappole, risorsa in-run, shop/hangar e persistenza.

Verifica:

- eseguita build produzione con Vite usando il runtime Node bundled;
- eseguito type-check `tsc --noEmit`;
- `npm` non era disponibile nel PATH della shell, quindi la verifica e' stata eseguita chiamando direttamente Node/Vite/TypeScript locali.

## 2026-06-03 - Fix import runtime Phaser

Stato:

- corretto `Game.ts` per non usare `Phaser.*` come globale runtime;
- importati esplicitamente `Input`, `Math as PhaserMath` e `Utils` da `phaser`;
- lasciati i riferimenti `Phaser.*` solo nelle annotazioni di tipo.

Verifica:

- non sono stati eseguiti test automatici, build, dev server, browser check, e2e o test manuali, come richiesto.

## 2026-06-03 - Refactor struttura Phaser

Stato:

- riorganizzata la vertical slice in una struttura Phaser modulare sotto `src/game/`;
- spostati tipi condivisi in `src/game/types/`;
- spostate costanti e valori iniziali in `src/game/config/`;
- spostato il pool upgrade in `src/game/data/`;
- aggiunti sistemi per arena, HUD ed effetti in `src/game/systems/`;
- spostate utility geometriche in `src/game/utils/`;
- aggiornata la config Phaser per usare le dimensioni condivise;
- mantenuta `Game` come scena orchestratrice della run.

Regole apprese:

- seguire la struttura Phaser modulare prima che la scena diventi monolitica;
- non eseguire test automatici, manuali, e2e, build, dev server o browser check quando il proprietario del progetto li riserva a se';
- aggiornare sempre docs operativi dopo refactor strutturali.

Verifica:

- non sono stati eseguiti test automatici, build, dev server, browser check, e2e o test manuali, come richiesto.

## 2026-06-03 - Vertical slice prototipo core

Stato:

- sostituita la scena placeholder con una prima run giocabile;
- aggiunta navicella controllabile con `WASD` e frecce;
- aggiunto shooting automatico verso il nemico piu' vicino;
- aggiunti nemici inseguitori, wave a timer e scaling semplice;
- aggiunti pickup XP e monete;
- aggiunto level-up con 3 scelte da 6 upgrade base;
- aggiunti HP, breve invulnerabilita' dopo danno, morte e restart con `R`;
- aggiunta UI base per HP, XP, livello, monete run, wave e nemici;
- aggiunto un nodo centrale visibile come arena provvisoria.

Fuori dal batch:

- mappa-grafo completa, collegamenti e movimento tra nodi;
- torrette, trappole e risorsa in-run;
- persistenza monete, shop/hangar, audio e asset finali.

Verifica:

- non sono stati eseguiti test automatici, build, dev server o test manuali, come richiesto.

## 2026-06-03 - Documentazione iniziale

Stato:

- creata base documentale in `docs/`;
- raccolto e diviso il concept originale del gioco;
- documentati loop, progressione, mappa-grafo, combattimento, nemici, economia, difese, visual feedback e scope del prototipo;
- documentato lo stato tecnico attuale del repository.

Contesto tecnico:

- il repo e' ancora il template Phaser 4 + Vite + TypeScript;
- la scena `Game` contiene ancora contenuto placeholder;
- non esiste ancora gameplay implementato.

Prossimo passo consigliato:

- sostituire il placeholder Phaser con un primo prototipo di navicella controllabile, shooting base, nemici inseguitori e raccolta XP/monete.
