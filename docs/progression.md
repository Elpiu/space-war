# Progression

La progressione e' divisa in due livelli: crescita dentro la run e crescita permanente tra una run e l'altra. Entrambe devono dare nuove possibilita' senza eliminare la pressione delle wave.

## Esperienza e level-up

I nemici eliminati rilasciano esperienza. Il giocatore raccoglie XP durante la run e, al raggiungimento di una soglia, sale di livello.

Ogni level-up deve proporre una scelta chiara tra upgrade. La scelta deve essere immediata da capire e visivamente percepibile dopo l'applicazione.

## Upgrade in-run

Le scelte migliori non aumentano solo numeri: cambiano il comportamento del gioco.

Nel prototipo attuale gli upgrade in-run sono divisi per fonte:

- upgrade da XP: il giocatore sceglie una carta tra 3 opzioni al level-up;
- upgrade da chest: il giocatore apre una chest e riceve subito un upgrade casuale non scelto.

Le chest servono a spingere build emergenti su piazzabili, droni e controllo mappa, mentre il level-up mantiene piu' controllo sulla direzione principale della run.

Dal 2026-06-04 XP e chest usano una loot table pesata invece di una scelta uniforme. Ogni upgrade puo' avere un peso base che rappresenta rarita' o frequenza desiderata. La pesca viene poi corretta da tre segnali:

- loadout equipaggiato: mine, torrette speciali, booster magnete e armi non base aumentano le categorie coerenti;
- build gia avviata nella run: se il giocatore ha gia preso droni, mine, torrette o barricate, la categoria collegata diventa piu' probabile;
- gate morbidi: alcune categorie restano possibili ma meno frequenti finche' non sono state sbloccate o rese rilevanti.

Il level-up pesca le 3 carte senza duplicati, ma ogni carta segue i pesi aggiornati. Le chest pescano un singolo upgrade dallo stesso sistema di bias, con un pool separato.

Categorie possibili:

- danno;
- cadenza di fuoco;
- numero di proiettili;
- proiettili rimbalzanti;
- laser;
- missili;
- droni;
- magnete per pickup;
- scudi;
- velocita';
- rigenerazione;
- esplosioni ad area;
- effetti elettrici o catene di danno;
- miglioramenti alle torrette;
- miglioramenti alle trappole.

## Build desiderate

Ogni run dovrebbe poter prendere una direzione leggibile:

- build proiettili rapidi: molti colpi, alta pressione costante;
- build laser: danno lineare, controllo di corridoi e nodi stretti;
- build droni: supporto mobile, copertura extra e autonomia;
- build mine/trappole: controllo del territorio e preparazione;
- build area: esplosioni, impulsi e pulizia degli sciami;
- build elettrica: catene di danno e controllo di gruppi;
- build sopravvivenza: scudi, rigenerazione e mobilita'.

## Meta-progressione

La meta-progressione economica e' sospesa nel prototipo attuale: lo shop/hangar e' tutto sbloccato e serve a scegliere loadout. Quando tornera', dovra' usare una valuta separata dalla risorsa run.

Possibili sblocchi:

- nuove navicelle;
- statistiche iniziali migliori;
- nuovi tipi di armi;
- nuove difese;
- nuove trappole;
- set di upgrade piu' ampio;
- equipaggiamenti permanenti;
- personalizzazione visiva della navicella.

## Regola di bilanciamento

La meta-progressione deve dare senso di avanzamento, ma non deve rendere banali le prime fasi. Preferire sblocchi che aprono stili di gioco rispetto a bonus puramente numerici.

## Primo prototipo

Per il primo prototipo bastano:

- barra XP;
- level-up con 3 scelte;
- 6-10 upgrade semplici ma percepibili;
- monete raccolte durante la run;
- totale monete conservato dopo morte o restart;
- una schermata o stato minimo di spesa permanente, anche provvisorio.
