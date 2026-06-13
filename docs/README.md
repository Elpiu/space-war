# Space War Docs

Questa cartella contiene il contesto condiviso di Space War: un roguelite
spaziale d'azione con combattimento in tempo reale, tomi, oggetti passivi e una
mappa continua generativa.

## Ordine di lettura

1. [concept.md](concept.md) - Visione e pilastri.
2. [gameplay-loop.md](gameplay-loop.md) - Loop della run.
3. [progression.md](progression.md) - Tomi, rarita', oggetti e pool.
4. [prototype-scope.md](prototype-scope.md) - Scope della vertical slice.
5. [technical-context.md](technical-context.md) - Stato tecnico reale.
6. [agent-handoff.md](agent-handoff.md) - Regole operative.

## Documenti di design

- [concept.md](concept.md) - Identita' del gioco.
- [gameplay-loop.md](gameplay-loop.md) - Ritmo, decisioni e ripartenza.
- [progression.md](progression.md) - Progressione dentro e fuori dalla run.
- [map-graph.md](map-graph.md) - Settori, hazard ed espansione della mappa.
- [combat.md](combat.md) - Movimento, shooting e leggibilita'.
- [enemies-waves.md](enemies-waves.md) - Nemici, wave e scaling.
- [defenses-traps.md](defenses-traps.md) - Controllo tattico del terreno.
- [economy.md](economy.md) - Risorsa run e crediti post-run.
- [visual-feedback.md](visual-feedback.md) - Linguaggio visivo e feedback.

## Documenti operativi

- [prototype-scope.md](prototype-scope.md)
- [technical-context.md](technical-context.md)
- [development-log.md](development-log.md)
- [backlog.md](backlog.md)
- [agent-handoff.md](agent-handoff.md)

## Stato attuale

Al 2026-06-13 il repository contiene una vertical slice Phaser giocabile con:

- mappa continua generativa a settori S/M/L;
- movimento, shooting automatico, wave, hazard e pickup;
- level-up con tre tomi e limite di quattro discipline per run;
- quattro rarita' influenzate dalla Fortuna;
- chest con 14 oggetti passivi automatici e duplicati a livelli;
- capacita' base di 1 torretta, 2 mine e 1 barricata;
- drop temporanei rari Magnet Overload e Munizioni Venom;
- crediti post-run, sblocchi e gestione dei pool attivi;
- menu, shop, HUD, game over, musica e persistenza locale.
- pausa con `P`, sound effect per level-up/chest e reroll delle offerte tomo.
- tutorial guidato interattivo accessibile dal menu;
- staging dev-only con console e preset per test rapidi.

Il prossimo lavoro deve concentrarsi su bilanciamento, varieta' dei contenuti e
sinergie, senza reintrodurre loadout o bonus permanenti iniziali.

## Regole docs

- Aggiornare design, stato tecnico e backlog quando cambia una decisione.
- Usare termini stabili: run, wave, tomo, oggetto, rarita', Fortuna, settore,
  hazard, risorsa run e crediti post-run.
- Conservare nel development log anche le feature successivamente rimosse.
- Se il proprietario chiede di non eseguire verifiche, non lanciare test,
  build, dev server, browser check o controlli statici.
