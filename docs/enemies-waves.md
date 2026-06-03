# Enemies And Waves

Le wave devono aumentare progressivamente in difficolta', densita' e varieta'. I nemici non sono solo bersagli: devono spingere il giocatore a muoversi, scegliere il terreno e cambiare strategia.

## Ruoli nemici

Archetipi possibili:

- Inseguitore rapido: fragile, veloce, costringe a muoversi.
- Sciame fragile: tanti bersagli deboli, crea pressione visiva e spaziale.
- Corazzato: lento, alta vita, blocca percorsi.
- Tiratore a distanza: obbliga a schivare e cambiare priorita'.
- Kamikaze: accelera verso il giocatore ed esplode o infligge alto danno.
- Supporto: potenzia altri nemici o cura gruppi.
- Elite: nemico raro con pattern riconoscibile e ricompensa alta.
- Boss: evento periodico che cambia ritmo e richiede strategia.

## Wave

Le wave devono crescere lungo tre assi:

- quantita': piu' nemici sullo schermo;
- varieta': piu' archetipi combinati;
- pressione tattica: spawn da direzioni o collegamenti piu' scomodi.

L'obiettivo non e' solo aumentare numeri. Ogni fase dovrebbe cambiare il tipo di problema che il giocatore deve risolvere.

## Uso della mappa

I nemici devono sfruttare la struttura del grafo:

- arrivare da collegamenti diversi;
- spingere il giocatore fuori da un nodo favorevole;
- chiudere un nodo cieco;
- rendere pericoloso un hub;
- premiare trappole ben piazzate nei passaggi.

## Elite e boss

Elite e boss interrompono il ritmo regolare delle wave. Devono essere riconoscibili prima di diventare letali.

Funzioni:

- testare la build del giocatore;
- forzare movimento attraverso il grafo;
- creare picchi di tensione;
- dare ricompense importanti;
- attivare espansioni della mappa o upgrade speciali.

## Primo prototipo

Per il prototipo bastano:

- un inseguitore base;
- uno sciame fragile;
- un nemico corazzato o elite semplice;
- wave a timer o a conteggio;
- aumento progressivo di quantita' e velocita';
- spawn da bordi del nodo o collegamenti.

