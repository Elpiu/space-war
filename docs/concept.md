# Concept

Space War e' un gioco d'azione spaziale incentrato sulla sopravvivenza. Il giocatore controlla una navicella, combatte wave di nemici in tempo reale, raccoglie esperienza, sceglie upgrade, accumula monete e si muove dentro una mappa-grafo generativa composta da nodi collegati.

Il punto distintivo non e' difendere una base o conquistare territori. La mappa e' un sistema tattico da leggere e attraversare: ogni nodo e ogni collegamento cambia il modo in cui conviene combattere.

## Visione

L'esperienza deve essere immediata, leggibile e progressivamente caotica. Ogni run deve produrre una situazione diversa e spingere il giocatore a decidere rapidamente:

- dove combattere;
- quando muoversi verso un altro nodo;
- quali upgrade scegliere;
- dove piazzare difese o trappole;
- quando rischiare per raccogliere pickup;
- quando sopravvivere invece di cercare valore.

Il gioco deve avere il ritmo di un arcade survival, la crescita di un roguelite/RPG e la profondita' tattica di una mappa che cambia durante la partita.

## Fantasia del giocatore

Il giocatore deve sentirsi come il pilota di una navicella sempre piu' potente, intrappolato in una costellazione ostile che si espande insieme alla minaccia.

La sensazione desiderata:

- partire vulnerabile ma agile;
- sopravvivere alle prime ondate;
- raccogliere esperienza e diventare piu' distruttivo;
- scegliere in quale nodo combattere in base alla forma della mappa;
- usare difese e trappole per preparare il terreno;
- vedere lo schermo riempirsi di proiettili, esplosioni, pickup e nemici;
- morire con la voglia di iniziare subito una nuova run.

## Pilastri di design

### Movimento e combattimento

Il cuore del gioco e' controllare la navicella. Muoversi, schivare, sparare e attraversare collegamenti deve essere fluido e appagante. Anche quando l'azione diventa intensa, il giocatore deve capire da dove arrivano i pericoli, quali nemici sono prioritari e quali spazi sono sicuri.

### Mappa-grafo generativa

La run non si svolge in una singola arena statica. Parte da un nodo iniziale e, con il tempo o al raggiungimento di obiettivi, genera nuovi nodi collegati al grafo esistente. Ogni run deve creare percorsi, diramazioni, hub, nodi ciechi e collegamenti diversi.

### Scelta tattica del terreno

Ogni nodo e' una piccola arena con una forma e un valore tattico. Un nodo ampio favorisce schivata e movimento libero. Un nodo stretto favorisce armi lineari, mine e trappole. Un hub offre vie di fuga ma espone ad attacchi da piu' direzioni. La domanda centrale durante una wave e':

> "Dove mi conviene combattere adesso?"

### Progressione roguelite/RPG

Durante la run il giocatore raccoglie esperienza e sale di livello. Ogni level-up deve offrire upgrade capaci di cambiare armi, statistiche, effetti speciali, difese o stile di gioco. Le build devono divergere: proiettili rapidi, laser, droni, mine, danni ad area, effetti elettrici, controllo o sopravvivenza.

### Meta-progressione

I nemici rilasciano monete permanenti mantenute dopo la morte. Fuori dalla run, queste monete permettono di sbloccare miglioramenti, navicelle, armi, difese, trappole o nuove opzioni. La meta-progressione deve aprire modi di giocare, non solo aumentare numeri.

### Difese e trappole

Il giocatore puo' installare strumenti nella mappa durante la run. Non servono a proteggere una base: servono a controllare flussi, preparare nodi favorevoli e rendere certi collegamenti o arene piu' interessanti.

## Identita' sintetica

Space War e' un roguelite arcade spaziale dove sopravvivere significa combattere bene, scegliere upgrade coerenti e usare una mappa-grafo generativa come parte della propria build.

