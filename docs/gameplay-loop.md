# Gameplay Loop

Il loop del gioco deve essere rapido da capire e profondo da padroneggiare. Il giocatore combatte wave in tempo reale, raccoglie risorse, sceglie upgrade e usa la mappa-grafo per trovare il terreno piu' favorevole.

## Loop core della run

1. Il giocatore inizia dal nodo centrale con una navicella base.
2. Le prime wave introducono movimento, shooting, schivata e raccolta.
3. I nemici rilasciano esperienza e monete.
4. L'esperienza permette di salire di livello e scegliere upgrade.
5. La mappa genera nuovi nodi collegati al grafo.
6. Il giocatore decide dove spostarsi per affrontare meglio le wave.
7. Difese e trappole vengono piazzate in nodi o collegamenti.
8. Le wave diventano piu' numerose, aggressive e varie.
9. Elite o boss interrompono il ritmo e costringono a cambiare strategia.
10. Alla morte, la run termina ma le monete permanenti vengono conservate.
11. Il giocatore spende monete nel mercato permanente e riparte.

## Ritmo desiderato

### Inizio run

La partita deve iniziare semplice: pochi nemici, un nodo centrale, una navicella base e una sola arma affidabile. Il giocatore impara movimento, range, raccolta dei pickup e primi pattern nemici.

### Primo sviluppo

Dopo pochi minuti, la mappa inizia ad aprirsi. Il giocatore vede nuovi nodi, sceglie un ramo del grafo, affronta wave piu' dense e comincia a costruire una build tramite upgrade.

### Fase intermedia

La pressione aumenta. I nemici arrivano da piu' collegamenti, gli spazi sicuri si riducono e il giocatore deve decidere se restare in un nodo favorevole o spostarsi verso opportunita' migliori.

### Finale run

Lo schermo deve diventare pieno di effetti, droni, torrette, proiettili e pickup, ma sempre leggibile. Il giocatore e' molto piu' forte dell'inizio, mentre il grafo e le wave sono diventati piu' pericolosi.

## Decisioni ricorrenti

Il gioco deve creare tensione continua tra:

- restare in un nodo favorevole o esplorare nuovi nodi;
- raccogliere drop rischiosi o mantenere posizione sicura;
- investire in potenza personale o difese piazzabili;
- combattere in spazi aperti o sfruttare strozzature;
- spendere una risorsa subito o conservarla;
- inseguire ricompense o sopravvivere piu' a lungo.

## Morte e ripartenza

La morte deve sembrare giusta. Idealmente e' il risultato di una posizione sbagliata, una decisione rischiosa o una wave troppo intensa. Subito dopo, le monete permanenti devono dare un motivo concreto per tornare all'hangar, migliorare qualcosa e ripartire.

## Successo del loop

Il loop funziona se il giocatore, dopo ogni run, puo' raccontare una piccola storia tattica: "Sono sopravvissuto perche' ho trasformato un nodo stretto in una trappola", oppure "Sono morto perche' sono rimasto in un hub troppo aperto mentre arrivavano nemici da tre lati".

