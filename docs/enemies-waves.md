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
- pressione tattica: spawn da bordi o settori piu' scomodi.

L'obiettivo non e' solo aumentare numeri. Ogni fase dovrebbe cambiare il tipo di problema che il giocatore deve risolvere.

## Uso della mappa

I nemici devono sfruttare la struttura della mappa continua:

- arrivare da bordi diversi;
- spingere il giocatore fuori da un settore favorevole;
- rendere pericolose zone con ostacoli o plasma;
- premiare trappole ben piazzate nelle strozzature naturali.

## Elite e boss

Elite e boss interrompono il ritmo regolare delle wave. Devono essere riconoscibili prima di diventare letali.

Funzioni:

- testare la build del giocatore;
- forzare movimento attraverso la mappa;
- creare picchi di tensione;
- dare ricompense importanti;
- attivare espansioni della mappa o upgrade speciali.

## Primo prototipo

Per il prototipo bastano:

- un inseguitore base;
- uno sciame fragile;
- un nemico corazzato o elite semplice;
- un tiratore semplice con proiettili leggibili;
- wave a timer o a conteggio;
- aumento progressivo di quantita' e velocita';
- spawn da bordi del settore o della mappa.

## Stato implementato

Al 2026-06-04 i nemici sono definiti in `src/game/data/enemies.ts` e creati/aggiornati tramite `src/game/systems/enemies.ts`.

Archetipi attivi:

- `chaser`: inseguitore base, bilanciato come pressione standard.
- `swarm`: piccolo, fragile e veloce, usato per aumentare densita' e pressione spaziale.
- `brute`: lento, grande e resistente, usato per bloccare percorsi e assorbire danni.
- `shooter`: mantiene distanza e spara proiettili viola verso il giocatore.

Ogni definizione contiene stats, colori, comportamento, ricompense e `iconKey` opzionale. Se in futuro verranno aggiunte icone o sprite, la logica nemici potra' continuare a usare lo stesso id dati con fallback geometrico Phaser.
