# Gameplay Loop

Il loop del gioco deve essere rapido da capire e profondo da padroneggiare. Il giocatore combatte wave in tempo reale, raccoglie risorse, sceglie tomi e usa la mappa continua a settori per trovare il terreno piu' favorevole.

## Loop core della run

1. Il giocatore inizia dal settore centrale con una navicella base.
2. Le prime wave introducono movimento, shooting, schivata e raccolta.
3. I nemici rilasciano esperienza e monete.
4. L'esperienza permette di salire di livello e scegliere uno tra tre tomi.
5. La mappa genera nuovi settori agganciati a quelli esistenti.
6. Il giocatore decide dove spostarsi per affrontare meglio le wave.
7. Difese e trappole vengono piazzate nei settori.
8. Le wave diventano piu' numerose, aggressive e varie.
9. Elite o boss interrompono il ritmo e costringono a cambiare strategia.
10. Le chest assegnano oggetti passivi con rarita' senza interrompere la run.
11. Alla morte, la run termina e vengono assegnati crediti post-run.
12. Il giocatore sblocca o filtra tomi e oggetti nello shop, poi riparte.

La run puo' essere messa in pausa e ripresa con `P`. Pausa, level-up e altre
modali devono fermare il gameplay senza consumare timer di wave, attacchi o
buff temporanei.

## Tutorial

Il tutorial e' una scena separata accessibile dal menu. Introduce in ordine
movimento, shooting automatico, pickup, tomi, torretta, mina, barricata,
attraversamento dei settori e chest. Usa i sistemi reali della run, mantiene
gli HP almeno a 1 e non assegna crediti o sblocchi persistenti. Al termine
avvia automaticamente una run normale.

## Ritmo desiderato

### Inizio run

La partita deve iniziare semplice: pochi nemici, un settore centrale, una navicella base, una sola arma affidabile, una torretta base e una mina base. Nessun loadout altera le statistiche iniziali.

### Primo sviluppo

Dopo pochi minuti, la mappa inizia ad aprirsi. Il giocatore costruisce una build scegliendo fino a quattro tomi e raccogliendo oggetti dalle chest.

### Fase intermedia

La pressione aumenta. I nemici arrivano dai bordi dei settori, gli spazi sicuri si riducono e il giocatore deve decidere se restare in un settore favorevole o spostarsi verso opportunita' migliori.

### Finale run

Lo schermo deve diventare pieno di effetti, droni, torrette, proiettili e pickup, ma sempre leggibile. Il giocatore e' molto piu' forte dell'inizio, mentre la mappa e le wave sono diventate piu' pericolose.

## Decisioni ricorrenti

Il gioco deve creare tensione continua tra:

- restare in un settore favorevole o esplorare nuovi settori;
- raccogliere drop rischiosi o mantenere posizione sicura;
- investire in potenza personale o difese piazzabili;
- combattere in spazi aperti o sfruttare strozzature;
- spendere una risorsa subito o conservarla;
- inseguire ricompense o sopravvivere piu' a lungo.

## Morte e ripartenza

La morte deve sembrare giusta. Idealmente e' il risultato di una posizione sbagliata, una decisione rischiosa o una wave troppo intensa. Subito dopo, i crediti post-run devono dare un motivo concreto per sbloccare nuove possibilita' e ripartire.

## Successo del loop

Il loop funziona se il giocatore, dopo ogni run, puo' raccontare una piccola storia tattica: "Sono sopravvissuto perche' ho trasformato un settore piccolo in una trappola", oppure "Sono morto perche' sono rimasto in una zona plasma mentre arrivavano nemici da tre lati".
