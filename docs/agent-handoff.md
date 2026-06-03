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

Al 2026-06-03 il codice e' ancora template Phaser. Non assumere sistemi gia' presenti. La scena `Game` e' placeholder e puo' essere sostituita o rifattorizzata durante il primo prototipo.

## Quando aggiornare docs

Aggiornare:

- [development-log.md](development-log.md) dopo milestone o feature importanti;
- [technical-context.md](technical-context.md) quando cambia architettura o struttura cartelle;
- [backlog.md](backlog.md) quando feature vengono completate, spostate o scartate;
- i design docs quando cambia una decisione di gioco.

