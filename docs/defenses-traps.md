# Defenses And Traps

Difese e trappole servono a trasformare la mappa in un vantaggio tattico. Non proteggono una base e non devono sostituire abilita', movimento e decisioni del giocatore.

## Ruolo nel gioco

Il giocatore usa strumenti piazzabili per:

- preparare un nodo prima o durante una wave;
- controllare flussi di nemici;
- rendere utili strozzature e collegamenti;
- guadagnare tempo per raccogliere pickup;
- sostenere una build specifica;
- creare una zona temporaneamente favorevole.

## Tipi possibili

- Torretta automatica: spara ai nemici vicini.
- Mina spaziale: esplode al contatto o in prossimita'.
- Campo rallentante: riduce velocita' nemica in un'area.
- Barriera temporanea: blocca o devia nemici per pochi secondi.
- Impulso ad area: respinge o danneggia gruppi.
- Drone sentinella: pattuglia un nodo o segue il giocatore.
- Trappola di collegamento: si piazza tra due nodi e colpisce chi attraversa.

## Regole di design

- Devono aiutare, non giocare al posto del giocatore.
- Devono avere costo, cooldown o limite di piazzamento.
- Devono essere leggibili a colpo d'occhio.
- Devono interagire con la forma dei nodi e dei collegamenti.
- Devono poter essere migliorate tramite upgrade in-run o meta-progressione.

## Decisioni interessanti

Le difese funzionano se creano domande:

- piazzo una torretta nel nodo dove sono ora o in quello dove voglio fuggire?
- spendo risorse per una mina o conservo per riparare?
- fortifico un nodo stretto o uso trappole nei collegamenti?
- potenzio la navicella o investo nel controllo della mappa?

## Primo prototipo

Implementare una difesa e una trappola:

- torretta automatica piazzabile nel nodo corrente;
- mina o campo rallentante piazzabile in un punto del nodo o in un collegamento;
- costo semplice in risorsa in-run;
- limite massimo per evitare spam;
- feedback chiaro di piazzamento, attivazione e danno.

