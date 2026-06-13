# Defenses And Traps

Difese e trappole servono a trasformare la mappa in un vantaggio tattico. Non proteggono una base e non devono sostituire abilita', movimento e decisioni del giocatore.

## Ruolo nel gioco

Il giocatore usa strumenti piazzabili per:

- preparare un settore prima o durante una wave;
- controllare flussi di nemici;
- rendere utili strozzature naturali, ostacoli e hazard;
- guadagnare tempo per raccogliere pickup;
- sostenere una build specifica;
- creare una zona temporaneamente favorevole.

## Tipi possibili

- Torretta automatica: spara ai nemici vicini.
- Mina spaziale: esplode al contatto o in prossimita'.
- Campo rallentante: riduce velocita' nemica in un'area.
- Barriera temporanea: blocca o devia nemici per pochi secondi.
- Impulso ad area: respinge o danneggia gruppi.
- Drone sentinella: pattuglia un settore o segue il giocatore.
- Trappola ambientale: si piazza vicino a ostacoli, nebule o zone plasma.

## Regole di design

- Devono aiutare, non giocare al posto del giocatore.
- Devono avere costo, cooldown o limite di piazzamento.
- Devono essere leggibili a colpo d'occhio.
- Devono interagire con forma dei settori, ostacoli e pericoli.
- Devono poter essere migliorate tramite Tomo dell'Ingegneria e oggetti chest.
- La capacita' minima di ogni run e' 1 torretta, 2 mine e 1 barricata.
- Nel prototipo attuale possono essere distrutte dai nemici e rimosse dal giocatore vicino con `E`, senza rimborso.

## Decisioni interessanti

Le difese funzionano se creano domande:

- piazzo una torretta nel settore dove sono ora o in quello dove voglio fuggire?
- spendo risorse per una mina o conservo per riparare?
- fortifico un settore piccolo o uso trappole vicino agli hazard?
- potenzio la navicella o investo nel controllo della mappa?

## Primo prototipo

Implementare una difesa e una trappola:

- torretta automatica piazzabile nel settore corrente;
- mina o campo rallentante piazzabile in un punto della mappa;
- una barricata disponibile da subito, espandibile con Kit Barricata;
- mini navicelle follower come supporto mobile;
- costo semplice in risorsa in-run;
- limite massimo per evitare spam;
- feedback chiaro di piazzamento, attivazione e danno.
