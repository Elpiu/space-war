# Map Graph

La mappa-grafo e' la differenza principale tra Space War e una semplice arena survival. Il giocatore non difende una base: legge la mappa, sceglie terreno favorevole e attraversa collegamenti per sopravvivere.

## Struttura base

Ogni run parte da un nodo iniziale. Un nodo e' una piccola arena giocabile. I nodi sono collegati da passaggi attraversabili dal giocatore anche durante le wave.

Il grafo deve poter generare:

- percorsi lineari;
- diramazioni;
- hub;
- nodi ciechi;
- collegamenti alternativi;
- strozzature;
- zone ricche ma rischiose.

## Espansione progressiva

Durante la partita, la mappa si espande generando nuovi nodi collegati al grafo esistente.

Trigger possibili:

- tempo sopravvissuto;
- numero di wave completate;
- eliminazione di nemici elite;
- soglie di livello;
- eventi speciali.

L'espansione deve dare la sensazione che lo spazio di gioco cresca insieme alla minaccia.

## Collegamenti

I collegamenti sono importanti quanto i nodi. Influenzano fuga, inseguimento, controllo dei nemici e posizionamento delle trappole.

Funzioni dei collegamenti:

- creare percorsi sicuri;
- creare strozzature tattiche;
- offrire scorciatoie;
- esporre a rischi;
- dare punti ideali per trappole;
- permettere fuga durante una wave.

## Tipologie di nodi

I nodi non sono biomi narrativi: sono configurazioni tattiche.

- Nodo ampio: favorisce schivata e movimento libero.
- Nodo stretto: favorisce armi lineari, mine e trappole.
- Nodo a imbuto: concentra nemici in pochi accessi.
- Nodo hub: offre molte uscite ma anche molti ingressi nemici.
- Nodo cieco: protegge un lato ma limita le vie di fuga.
- Nodo ricco: offre piu' drop o opportunita', ma aumenta il rischio.
- Nodo instabile: introduce ostacoli, variazioni o pericoli temporanei.

## Requisiti di gameplay

- Il giocatore deve potersi spostare tra nodi mentre le wave sono attive.
- I nemici devono poter sfruttare la struttura della mappa.
- La scelta del nodo deve influenzare davvero la sopravvivenza.
- Le trappole nei collegamenti devono avere valore tattico chiaro.
- Il grafo deve rimanere leggibile anche quando cresce.

## Primo prototipo

Per il primo prototipo, implementare una versione minima:

- nodo iniziale centrale;
- generazione di nuovi nodi a intervalli o dopo wave;
- collegamenti visibili e attraversabili;
- almeno 3 tipi di nodo con differenze tattiche semplici;
- spawn nemici influenzato dal nodo o dai collegamenti.

