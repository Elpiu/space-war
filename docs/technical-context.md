# Technical Context

Stato tecnico del repository al 2026-06-13.

## Stack e script

- Phaser 4.0.0
- Vite 6.3.1
- TypeScript 5.7.2
- `npm run dev-nolog` per sviluppo locale
- `npm run build-nolog` per build produzione

## Struttura

- `src/game/scenes/GameplayScene.ts` contiene il runtime condiviso di run,
  input, combattimento, HUD, mappa, upgrade, chest e piazzabili.
- `src/game/scenes/Game.ts` gestisce l'ingresso a menu, shop e run normale.
- `src/game/scenes/TutorialScene.ts` orchestra il percorso guidato
  deterministico senza progressione persistente.
- `src/game/scenes/StagingScene.ts` espone la console di test disponibile
  soltanto in sviluppo.
- `src/game/data/upgrades.ts` contiene 12 tomi, 14 oggetti chest, rarita' e
  valori iniziali di bilanciamento.
- `src/game/data/specialDrops.ts` contiene gli effetti temporanei rari.
- `src/game/data/enemyVisuals.ts` associa immagini opzionali ad archetipi,
  boss numerati e proiettili nemici, con fallback alle forme geometriche.
- `src/game/systems/upgradeSystem.ts` genera offerte tomo, tira le rarita',
  applica tomi e oggetti e gestisce il limite di quattro tomi.
- `src/game/systems/metaProgression.ts` gestisce crediti, sblocchi, pool attivi
  e migrazione del salvataggio.
- `src/game/systems/chestController.ts` assegna oggetti automaticamente.
- `src/game/systems/placeables.ts` usa definizioni base autonome per torretta e
  mina; lo shop non fornisce piu' configurazioni operative.
- `src/game/systems/shopOverlay.ts` mostra i cataloghi Tomi e Oggetti.
- `src/game/systems/hud.ts` mostra separatamente tomi e oggetti della run.
- `src/game/systems/musicSystem.ts` gestisce musica, pausa/ripresa e sound
  effect per level-up e chest.
- `src/game/data/imageAssets.ts` centralizza le icone precaricate per chest,
  cure, drop speciali e feedback delle ricompense.

## Stato giocabile

- ogni run parte con nave e arma base, capacita' di 1 torretta, 2 mine e 1
  barricata;
- movimento, shooting automatico, wave e mappa continua generativa;
- settori S/M/L, hazard, mini-mappa ed espansione progressiva;
- level-up con tre tomi differenti e massimo quattro discipline per run;
- due reroll gratuiti per run, poi costi `50, 150, 300, 500, 750...`;
- protezione anti-missclick con ritardo e attesa del rilascio del puntatore;
- rarita' comune, non comune, rara e leggendaria;
- Fortuna applicata a rarita', monete, cure e frequenza chest;
- Difficolta' applicata soltanto ai nuovi spawn e alle relative ricompense;
- chest gratuite e acquistabili con oggetti automatici e duplicati a livelli;
- drop temporanei rari con durata cumulabile: magnete globale e danno nave;
- Vampirismo applicato soltanto ai proiettili della nave;
- oggetti scafo per HP flat e crescita ogni 100 kill;
- torrette, mine e barricate piazzabili, riparabili e migliorabili;
- crediti post-run usati solo per sbloccare nuovi contenuti;
- pool attivi configurabili con minimo otto elementi per categoria;
- salvataggio `space-war-meta-v3`, con migrazione dei crediti dal formato v2.
- pausa con `P`, overlay dedicato e traslazione dei timer alla ripresa;
- effetti audio da `public/sounds/effects/level-up.mp3` e `reward.mp3`.
- icone di gameplay da `public/assets/images`: salute, magnete, veleno, chest,
  navicella giocabile e torretta Doge.
- immagini nemici da `public/assets/images/enemy`, selezionate soltanto quando
  la relativa texture e' stata caricata correttamente.
- dimensioni nemici definite per archetipo e applicate preservando il rapporto
  d'aspetto originale; collisioni e ingombro grafico restano indipendenti.
- tutorial guidato accessibile dal menu, invulnerabile e privo di ricompense
  persistenti;
- staging dev-only con god mode, spawn, wave, upgrade, chest, effetti, seed,
  teletrasporto e preset;
- policy condivise per wave automatiche, persistenza e invulnerabilita';
- cleanup di entita', HUD DOM, pannelli, input e musica al cambio scena.

## Convenzioni

- Le scene specializzate devono estendere `GameplayScene` e restare
  orchestratori.
- Aggiungere nuovi tomi e oggetti come dati, mantenendo distinti
  `TomeDefinition` e `ChestItemDefinition`.
- Non reintrodurre loadout, livelli permanenti o bonus alle statistiche
  iniziali.
- Tenere separate risorsa run e crediti post-run.
- Registrare le nuove immagini tramite `imageAssets.ts`, evitando chiavi e
  percorsi duplicati nei singoli sistemi.
- Per nuovi effetti comportamentali creare sistemi dedicati invece di
  allungare le scene.
- Tutorial e staging devono usare hook e funzioni gameplay reali, senza copie
  parallele delle regole della run.

## Lavoro futuro

- bilanciamento di rarita', Fortuna, Difficolta' e costi;
- nuovi oggetti comportamentali come laser, missili ed elettricita';
- varieta' nemici ed evoluzioni delle build;
- rifinitura visuale e audio dei nuovi tomi/oggetti.
