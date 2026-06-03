# Development Log

Log cronologico dei progressi del progetto. Ogni voce deve indicare data, tipo di cambiamento e stato del lavoro.

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
