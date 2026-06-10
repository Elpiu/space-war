# Mappa Continua A Settori

La mappa e' la differenza principale tra Space War e una semplice arena survival. Il giocatore non difende una base: legge lo spazio, sceglie terreno favorevole e si muove dentro un'area che cresce durante la run.

## Struttura base

Ogni run parte da un settore iniziale. Un settore e' un pezzo fisico della mappa in world-space. I settori si agganciano su una griglia e condividono bordi attraversabili: non esistono portali, bridge o gate necessari per cambiare area.

Il modello deve poter generare:

- settori piccoli, medi e grandi;
- ramificazioni leggibili;
- spazi larghi per schivare;
- strozzature create dalla composizione dei settori;
- zone con ostacoli o pericoli;
- aree rischiose ma utili per controllare i nemici.

## Espansione progressiva

Durante la partita, la mappa si espande generando nuovi settori adiacenti a quelli esistenti.

Trigger possibili:

- tempo sopravvissuto;
- numero di wave completate;
- eliminazione di nemici elite;
- soglie di livello;
- eventi speciali.

L'espansione deve dare la sensazione che lo spazio di gioco cresca insieme alla minaccia. La camera segue il player e i bounds del mondo si aggiornano quando compaiono nuovi settori.

## Generazione per run

La mappa non deve comporsi sempre nello stesso modo. Ogni run crea un seed interno random e genera una blueprint nascosta della mappa, poi rivela i settori progressivamente durante le wave.

Nel prototipo aggiornato il profilo default e':

- massimo 12 settori totali, incluso il nucleo;
- profondita' massima 4 dal settore centrale;
- pattern misto controllato, con run piu' compatte, ramificate o con una spina principale e rami laterali;
- reveal di 1 settore ogni 2 wave, a partire dalla wave 2.

Il seed non e' ancora esposto in UI. Serve solo a rendere coerente la run dopo la creazione della blueprint e a preparare debug o seed condivisi futuri.

## Settori S/M/L

I settori non sono biomi narrativi e non hanno tipologie tattiche rigide. La loro identita' nasce da dimensione, composizione e contenuto.

- Settore S: compatto, rapido da attraversare, piu' teso quando arrivano molti nemici.
- Settore M: spazio intermedio, utile per combattere e riposizionarsi.
- Settore L: ampio, piu' adatto a kite, torrette e movimento largo.

Ogni settore puo' contenere 1-3 elementi spicy ma leggibili:

- asteroidi solidi che bloccano movimento e proiettili;
- campi nebula che rallentano;
- zone plasma pulsanti che infliggono danno leggero.

## Requisiti di gameplay

- Il giocatore deve muoversi tra settori senza interazioni speciali.
- I nemici devono usare lo spazio continuo e spawnare dai bordi della mappa o del settore vicino al player.
- La scelta del settore deve influenzare davvero la sopravvivenza.
- Ostacoli e pericoli devono creare tattica senza rendere la mappa illeggibile.
- La mini-mappa deve rimanere chiara anche quando la mappa cresce.

## Primo prototipo

Per il primo prototipo, implementare una versione minima:

- settore iniziale centrale;
- generazione di nuovi settori a intervalli o dopo wave;
- movimento continuo in world-space;
- settori S/M/L con differenze di dimensione;
- ostacoli/pericoli semplici;
- spawn nemici influenzato dal settore corrente e dai bordi dell'area.
