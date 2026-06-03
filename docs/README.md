# Space War Docs

Questa cartella contiene il contesto condiviso del progetto Space War: un roguelite spaziale d'azione con combattimento in tempo reale, progressione RPG e mappa-grafo generativa.

Lo scopo principale e' aiutare nuovi agenti di coding a capire rapidamente cosa costruire, cosa esiste gia' e quali decisioni di design sono considerate fondamentali.

## Ordine di lettura consigliato

1. [concept.md](concept.md) - Visione, fantasia del giocatore e pilastri.
2. [gameplay-loop.md](gameplay-loop.md) - Loop della run e ritmo desiderato.
3. [prototype-scope.md](prototype-scope.md) - Primo prototipo giocabile e priorita'.
4. [technical-context.md](technical-context.md) - Stato attuale del repo Phaser.
5. [agent-handoff.md](agent-handoff.md) - Regole pratiche prima di modificare codice.

## Documenti di design

- [concept.md](concept.md) - Identita' del gioco e principi guida.
- [gameplay-loop.md](gameplay-loop.md) - Struttura della partita, tensioni e run ideale.
- [progression.md](progression.md) - XP, level-up, upgrade e meta-progressione.
- [map-graph.md](map-graph.md) - Mappa-grafo, nodi, collegamenti ed espansione.
- [combat.md](combat.md) - Movimento, shooting, armi e leggibilita'.
- [enemies-waves.md](enemies-waves.md) - Nemici, wave, elite, boss e scaling.
- [defenses-traps.md](defenses-traps.md) - Difese, trappole e controllo del terreno.
- [economy.md](economy.md) - Monete, risorse in-run e mercato permanente.
- [visual-feedback.md](visual-feedback.md) - Direzione visiva e feedback moment-to-moment.

## Documenti operativi

- [prototype-scope.md](prototype-scope.md) - Cosa deve dimostrare il primo prototipo.
- [technical-context.md](technical-context.md) - Struttura tecnica attuale e convenzioni iniziali.
- [development-log.md](development-log.md) - Log cronologico dei progressi.
- [backlog.md](backlog.md) - Feature ordinate per fase.
- [agent-handoff.md](agent-handoff.md) - Sintesi operativa per nuovi agenti.

## Stato attuale del progetto

Al 2026-06-03 il repository contiene una prima vertical slice Phaser giocabile:

- `src/main.ts` avvia il gioco dentro `game-container`.
- `src/game/main.ts` configura Phaser usando dimensioni condivise da `src/game/config/gameplay.ts`, scaling `FIT` e scena `Game`.
- `src/game/scenes/Game.ts` orchestra una run arcade minima con movimento, shooting automatico, nemici, wave, pickup, level-up, HP, morte, restart e UI.
- `src/game/config/`, `src/game/types/`, `src/game/data/`, `src/game/systems/` e `src/game/utils/` separano costanti, contratti, dati di design, sottosistemi e funzioni di supporto.
- `public/assets` contiene ancora asset demo (`bg.png`, `logo.png`), non usati dalla vertical slice attuale.

Il prossimo lavoro di implementazione dovrebbe proseguire dal nucleo giocabile verso mappa-grafo, movimento tra nodi, torrette e trappole descritti in [prototype-scope.md](prototype-scope.md).

## Regole di aggiornamento docs

- Aggiornare i documenti quando cambia una decisione di design o una feature viene implementata.
- Aggiornare [development-log.md](development-log.md) a ogni passaggio importante.
- Non usare i documenti come lista infinita di idee: spostare le idee non prioritarie in [backlog.md](backlog.md).
- Quando una feature viene costruita, mantenere allineati design, stato tecnico e backlog.
- Scrivere in italiano semplice, con termini stabili: run, wave, upgrade, mappa-grafo, nodo, collegamento, meta-progressione.
- Se il proprietario del progetto chiede di gestire personalmente la verifica, non eseguire test manuali, automatici, e2e, build, dev server o browser check.
