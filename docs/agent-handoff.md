# Agent Handoff

Questo documento e' la sintesi operativa per nuovi agenti di coding.

## Prima di modificare codice

Leggere in ordine:

1. [README.md](README.md)
2. [concept.md](concept.md)
3. [gameplay-loop.md](gameplay-loop.md)
4. [prototype-scope.md](prototype-scope.md)
5. [technical-context.md](technical-context.md)

Poi controllare lo stato reale del repo, perche' i documenti potrebbero essere stati superati da implementazioni successive.

## Regole operative apprese

- Rispettare la struttura Phaser del progetto: le scene devono orchestrare, mentre dati, tipi, costanti, utility e sottosistemi vanno separati in cartelle dedicate sotto `src/game/`.
- Evitare scene monolitiche quando una feature cresce oltre il prototipo immediato.
- Usare `src/game/config/` per numeri condivisi e bilanciamento iniziale.
- Usare `src/game/types/` per contratti TypeScript condivisi.
- Usare `src/game/data/` per dati di design come upgrade, nemici, settori, hazard e loot table.
- Usare `src/game/systems/` per rendering HUD, effetti, arena, wave, pickup e sistemi riusabili.
- Usare `src/game/utils/` per funzioni pure o quasi pure, per esempio geometria e collisioni semplici.
- Dopo il refactor del 2026-06-04, non aggiungere nuove feature direttamente in `Game.ts` se esiste un confine di sistema adatto: usare `runState`, `playerSystem`, `weaponSystem`, `pickupSystem`, `waveSystem`, `chestController`, `combatRewards`, `upgradeSystem`, `placeableController` o `screenSystem`.
- Il runtime condiviso vive in `GameplayScene`; `Game`, `TutorialScene` e
  `StagingScene` devono differenziare il comportamento tramite policy, hook e
  orchestrazione, non duplicando il loop.
- La staging deve restare registrata e visibile soltanto con
  `import.meta.env.DEV`.
- Per nuovi tomi o oggetti chest, aggiungere definizioni data-driven in `src/game/data/upgrades.ts`.
- Per nuovi drop temporanei, estendere `src/game/data/specialDrops.ts` e il relativo stato run.
- Non reintrodurre loadout o bonus iniziali nello shop: la meta-progressione sblocca soltanto contenuti e gestisce i pool attivi.
- Nei moduli ES non assumere l'esistenza globale di `Phaser`: importare esplicitamente i simboli runtime usati, per esempio `Input`, `Math as PhaserMath`, `Utils` o `Scene`.
- Non aggiungere dipendenze senza un motivo forte.
- Non eseguire test manuali, test automatici, test e2e, build, dev server, browser check o controlli statici quando il proprietario del progetto chiede esplicitamente di non fare verifiche.
- In quel caso non lanciare nemmeno `git diff`, `git diff --check`, type-check, lint, build o ispezioni finali: completare le modifiche richieste e riportare solo cosa e' stato cambiato.
- Se il proprietario chiede di non fare test/verifiche, considerare il vincolo valido per ogni forma di controllo: niente test, niente e2e, niente verifica manuale, niente browser, niente build, niente lint/type-check e niente controlli statici, anche se sarebbero normalmente parte del flusso finale.
- Aggiornare sempre docs operativi quando cambia struttura, milestone o stato reale del backlog.

## Verita' di design da preservare

- Il gioco e' un roguelite spaziale survival.
- La mappa e' continua e generativa, composta da settori S/M/L agganciati su griglia.
- Il giocatore non difende una base.
- Il valore tattico principale e' scegliere dove combattere.
- Difese e trappole servono a controllare terreno e flussi, non a sostituire il giocatore.
- Ogni run garantisce capacita' per 1 torretta, 2 mine e 1 barricata.
- Il Vampirismo si applica soltanto ai proiettili della nave.
- La pausa con `P` deve congelare logicamente timer, cooldown e buff.
- La modale level-up deve restare protetta dai click ereditati dal gameplay.
- La progressione deve creare build diverse, non solo aumentare numeri.
- I crediti post-run devono motivare nuove run senza aumentare la potenza iniziale.
- Il caos visivo deve rimanere leggibile.

## Primo target tecnico

Costruire un prototipo Phaser giocabile con:

- navicella controllabile;
- shooting;
- nemici a wave;
- XP e level-up;
- monete;
- mappa continua minima;
- movimento tra settori;
- una difesa;
- una trappola;
- morte e restart.

## Attenzione allo stato attuale

Al 2026-06-13 il codice contiene una vertical slice giocabile con tomi al level-up, 14 oggetti chest, effetti temporanei rari, rarita', Fortuna, Difficolta' e shop di sblocchi/pool. Il bilanciamento numerico resta iniziale.

## Quando aggiornare docs

Aggiornare:

- [development-log.md](development-log.md) dopo milestone o feature importanti;
- [technical-context.md](technical-context.md) quando cambia architettura o struttura cartelle;
- [backlog.md](backlog.md) quando feature vengono completate, spostate o scartate;
- i design docs quando cambia una decisione di gioco.
