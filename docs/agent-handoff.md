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
- Usare `src/game/data/` per dati di design come upgrade, nemici, nodi e loot table.
- Usare `src/game/systems/` per rendering HUD, effetti, arena, wave, pickup e sistemi riusabili.
- Usare `src/game/utils/` per funzioni pure o quasi pure, per esempio geometria e collisioni semplici.
- Nei moduli ES non assumere l'esistenza globale di `Phaser`: importare esplicitamente i simboli runtime usati, per esempio `Input`, `Math as PhaserMath`, `Utils` o `Scene`.
- Non aggiungere dipendenze senza un motivo forte.
- Non eseguire test manuali, test automatici, test e2e, build, dev server o browser check quando il proprietario del progetto chiede esplicitamente di occuparsene personalmente.
- In quel caso sono consentiti solo controlli statici non esecutivi: lettura file, ricerca, `git diff`, `git diff --check` e ispezione del codice.
- Aggiornare sempre docs operativi quando cambia struttura, milestone o stato reale del backlog.

## Verita' di design da preservare

- Il gioco e' un roguelite spaziale survival.
- La mappa e' un grafo generativo di nodi collegati.
- Il giocatore non difende una base.
- Il valore tattico principale e' scegliere dove combattere.
- Difese e trappole servono a controllare terreno e flussi, non a sostituire il giocatore.
- La progressione deve creare build diverse, non solo aumentare numeri.
- Le monete permanenti devono motivare nuove run.
- Il caos visivo deve rimanere leggibile.

## Primo target tecnico

Costruire un prototipo Phaser giocabile con:

- navicella controllabile;
- shooting;
- nemici a wave;
- XP e level-up;
- monete;
- mappa-grafo minima;
- movimento tra nodi;
- una difesa;
- una trappola;
- morte e restart.

## Attenzione allo stato attuale

Al 2026-06-03 il codice contiene una vertical slice giocabile e una struttura Phaser modulare iniziale. Non assumere pero' che esistano gia' mappa-grafo completa, torrette, trappole, shop, persistenza o sistemi avanzati.

## Quando aggiornare docs

Aggiornare:

- [development-log.md](development-log.md) dopo milestone o feature importanti;
- [technical-context.md](technical-context.md) quando cambia architettura o struttura cartelle;
- [backlog.md](backlog.md) quando feature vengono completate, spostate o scartate;
- i design docs quando cambia una decisione di gioco.
