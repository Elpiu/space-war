# Replan v3: hangar nuovo, campagna infinita, bestiario

Punto di partenza (commit `1cfcf28`):
- **Campagna:** settore 1 fatto a mano, 8 missioni.
- **Equipaggiamento:** 30 pezzi.
- **Nemici:** 17 tipi in tutto. Nel survival 9 più il boss; in campagna si
  aggiungono 6 unità di terra o strutture, il cargo e la Cannoniera.
- **Ondate:** 11 formazioni.

## 1. Cosa non va oggi

| Area | Problema |
| --- | --- |
| Hangar | Mappa, equipaggiamento, inventario, negozio e dettaglio stanno su un'unica schermata: a 1280×720 serve lo scroll e tutto è piccolo. La nave non si vede mai. Mancano filtri, ordinamento e confronto rapido. |
| Economia | Le monete si accumulano (si arriva a oltre 2000 senza saperle spendere). Mancano scopi per spenderle: fusione, scafi costosi, estetica. |
| Bottino | Ogni pezzo ha statistiche fisse: due Blaster rari sono identici. Il bottino smette presto di sorprendere. |
| Nemici | Diversi tipi condividono la stessa IA (inseguire). Gli sprite PNG hanno stili misti (foto di auto, cartoon, caricature di persone e marchi reali). In campagna le formazioni riusano i volanti del survival. |
| Durata | La campagna finisce dopo un settore: dopo il Dreadnought resta solo il rigioco a difficoltà più alte. |
| Opzioni | Non esiste un menu impostazioni (volumi, tremolio dello schermo, numeri di danno, tasti). |
| Salvataggi | Tutto è nel localStorage: niente esportazione o backup. |

## 2. Hangar ridisegnato da zero

**Schermate separate** con una barra in alto: **Mappa · Hangar · Negozio ·
Officina**. Ognuna usa tutto lo spazio; niente più dashboard compressa.

### Hangar (equipaggiamento)

```
┌──────────────┬───────────────────────────────┬──────────────────────┐
│ STATISTICHE  │        SCHEMA DELLA NAVE      │  PEZZI COMPATIBILI   │
│ HP ███ 16    │   [F1]──┐                     │  (filtrati sullo     │
│ Scudo ██ 4   │   [F2]──┤  ◢███████◣  [CODA]  │   slot selezionato)  │
│ Danno/s 24   │   [F3]──┘  ◥███████◤          │  ▲ +3.1 danno/s      │
│ Calore ▓▓░   │        [MISS] [BOMBA]         │  ▼ +6 calore/s       │
│ bilancio     │   [DISP1] [DISP2]             │  [Monta]             │
│ termico ±    │                               │                      │
├──────────────┴───────────────────────────────┴──────────────────────┤
│ INVENTARIO  filtri: tipo · rarità · nuovi   ordina: potenza · livello│
│ [■][■][■][■][■][■][■] …       selezione multipla → Vendi / Fondi     │
└──────────────────────────────────────────────────────────────────────┘
```

- **Schema della nave in SVG:** cambia con lo scafo, e ogni slot è una presa
  sul disegno (frontali sul muso, coda dietro, missili e bombe sulle ali,
  dispositivi al centro). Si clicca una presa e a destra compaiono solo i pezzi
  compatibili.
- **Anteprima al passaggio del mouse:** passando su un pezzo, le statistiche a
  sinistra mostrano le differenze in verde e rosso, compreso il **bilancio
  termico** (calore prodotto contro dissipazione al secondo).
- **Inventario:** filtri, ordinamento, selezione multipla, pezzi bloccati
  (non vendibili), badge NUOVO.
- **Profili di fuoco:** integrati sullo schema; ogni presa mostra se l'arma è
  attiva nei profili 2 e 3.

### Negozio

- **Catalogo fisso** dei pezzi base, che si allarga con il progresso.
- **Offerte del settore:** 4 pezzi a rotazione, rari o migliori, con
  affissi. Cambiano a ogni missione completata; si possono ripescare a
  pagamento.

### Officina (nuova)

- **Potenzia:** l'upgrade di oggi, con anteprima.
- **Fondi:** 3 pezzi uguali della stessa rarità più monete danno 1 pezzo
  della rarità superiore. È uno scopo per le monete e per i doppioni.
- **Ricalibra:** ripesca un affisso del pezzo, pagando monete.
- **Verniciatura:** colori della nave, solo estetici, sbloccati con le
  medaglie.

## 3. Bottino con affissi

Ogni pezzo trovato ha **0–3 affissi casuali** in base alla rarità, per
esempio:
- +8% danno;
- −10% calore per colpo;
- +1 proiettile ogni 4 colpi;
- colpo critico 10%;
- +15% gittata;
- rubavita 2%;
- esplosione alla morte del nemico;
- +20% monete.

Così due Blaster rari diventano diversi, e il bottino resta interessante
anche dopo molte ore. I pezzi del catalogo base non hanno affissi.

## 4. Campagna infinita

Il settore 1 resta fatto a mano e fa da tutorial. Dal settore 2 i settori si
**generano all'infinito**.

| Tecnica | Uso |
| --- | --- |
| **Seed deterministico** `seed(n) = hash(seedProfilo, n)` | Ogni settore è riproducibile; si può condividere un seed o fare una sfida giornaliera. |
| **Grafo a strati (DAG)** | 6–7 strati, 2–3 nodi per strato, archi solo verso nodi vicini. I tipi di nodo sono Missione, Élite, Cantiere (negozio e riparazione), Evento (una scelta con rischio), Tesoro e Boss. |
| **Catena di Markov sui segmenti** | Una matrice di transizione (ad es. dopo una caverna è più probabile una stazione che un'altra caverna) produce percorsi vari ma coerenti, invece di sequenze casuali. |
| **Rumore frattale (fBm)** | Il profilo del terreno è una somma di ottave (ampiezza ×0.5, frequenza ×2): rilievi naturali a ogni scala. |
| **Curva di minaccia** `m(n) = 1 + 0.25·n^1.1` (rivista dopo il collaudo; era `0.35·n^1.15`) | Crescita leggermente più che lineare: HP e danni dei nemici salgono senza esplodere. |
| **Densità logistica** `d(n) = dMax / (1 + e^(−0.6(n−4)))` | Il numero di nemici a schermo cresce e poi si stabilizza, così lo schermo resta leggibile. |
| **Item level** `potenza = rarità × livello × (1 + 0.1·√ilvl)` | Il bottino dei settori alti è più forte, ma con rendimenti decrescenti (radice quadrata): l'equipaggiamento vecchio non diventa subito spazzatura. |
| **Biomi a rotazione e mutatori** | `bioma = biomi[n mod 5]` (Rottami, Anelli di ghiaccio, Nebulosa tossica, Cantieri corporate, Campo minato), ognuno con palette, pericoli e nemici favoriti. Dal settore 4 si aggiungono 1–2 **mutatori** casuali (nemici corazzati, nebbia, calore +20%, bottino doppio) che alzano rischio e ricompensa. |
| **Boss a rotazione** | Quattro archetipi che si alternano; ogni 3 settori il boss guadagna una fase in più. |

La progressione resta sensata anche all'infinito: la potenza del giocatore
cresce con √ilvl e l'upgrade, quella dei nemici con n^1.15. La differenza
la colmano abilità, fusione e affissi.

## 5. Bestiario: nemici distinti e molti di più

**Principio:** ogni nemico ha **un ruolo e un segnale** leggibili, con un
codice colore unico (rosso = danno in arrivo, giallo = carica, azzurro =
scudo, viola = controllo). Tutti gli sprite diventano **SVG originali in
uno stile unico**; i PNG attuali (caricature e marchi reali) escono dal gioco.

| Ruolo | Nemici nuovi (prima stesura) |
| --- | --- |
| **Volanti d'assalto** | Intercettore (veloce, in linea retta), Zigzag, Picchiatore, Bombardiere (sgancia bombe dall'alto), Kamikaze a sciame |
| **Tiratori** | Drone laser (raggio con avviso giallo), Batteria a ricerca, Cecchino, Flak volante |
| **Supporto** *(bersagli prioritari)* | Riparatore (cura gli alleati), Scudiero (bolla che protegge i vicini), Radar volante (rende più precisi gli altri) |
| **Controllo** | Pozzo gravitazionale (attira la nave), Drone EMP (fa salire il calore), Sanguisuga (si attacca e rallenta), Specchio (rimanda i colpi frontali) |
| **Speciali** | Fantasma (diventa intangibile a intervalli), Teletrasporto, Madre dello sciame, Scissionista a cascata |
| **Di terra** | Torre flak, Recinto laser (due piloni con raggio a tempo), Batteria missilistica, Ragno (cammina su pavimento e soffitto), Generatore di scudo (protegge le strutture vicine), Hangar (lancia droni), Pistoni (pericolo ambientale in stazione) |
| **Mini-boss** | Cannoniera, Incrociatore posamine, Corazzata con punti deboli |
| **Boss** | Dreadnought, Serpente segmentato (ogni segmento si distrugge), Fortezza orbitale (immobile, punti deboli da aprire), Regina dello sciame |
| **Affissi élite** | Rapido, Blindato, Scissile, più Rigenerante, Esplosivo, Schermato, Vampirico, Fantasma |

Obiettivo: **circa 40 tipi di nemici**, distribuiti per bioma e tier, ognuno
con un'icona nel bestiario.

## 6. Chicche

- **Bestiario e catalogo:** nemici incontrati, con suggerimento e numero di
  uccisioni; pezzi trovati, con percentuale di collezione.
- **Contratti di missione:** obiettivi facoltativi ("abbatti 3 cargo",
  "nessun surriscaldamento", "distruggi tutti i cartelloni") che danno un
  bonus.
- **Medaglie:** obiettivi a lungo termine che sbloccano verniciature.
- **Annunci delle combo** ("DOPPIA!", "STRAGE!"), una breve pausa d'impatto
  sulle uccisioni grosse, rallentatore alla morte del boss.
- **Radio corporate:** messaggi satirici di "Controllo Missione" fra un
  segmento e l'altro.
- **Menu impostazioni:** volumi separati, tremolio dello schermo, numeri di
  danno, avvisi ad alto contrasto, rimappatura dei tasti.
- **Gamepad.**
- **Esporta e importa il salvataggio** (file JSON).
- **Sfida giornaliera:** un settore con il seed del giorno.

## 7. Fasi proposte

| Fase | Contenuto | Fatto quando |
| --- | --- | --- |
| **G1. Hangar nuovo** ✅ | Schermate separate, schema della nave, anteprima delle differenze, filtri, selezione multipla, blocco | Equipaggiare è veloce e si vede la nave |
| **G2. Bestiario 1** ✅ | Linguaggio dei segnali, 12 nemici nuovi, affissi élite nuovi, sprite SVG al posto dei PNG | Ogni segmento ha nemici con ruoli distinti |
| **G3. Campagna infinita** ✅ | Generatore di settori (DAG, Markov, fBm), curve di minaccia, biomi, mutatori, item level | Dopo il settore 1 si gioca senza fine, con difficoltà sensata |
| **G4. Bottino e Officina** ✅ | Affissi, fusione, ricalibrazione, offerte del settore | Le monete hanno sempre un uso, il bottino sorprende |
| **G5. Bestiario 2 e boss** ✅ | Altri 12 nemici, 3 boss e 2 mini-boss nuovi | Circa 40 nemici, boss a rotazione |
| **G6. Chicche** ✅ | Impostazioni, bestiario/catalogo, contratti, medaglie, verniciature, esporta/importa, sfida giornaliera | Il gioco ha un "contorno" completo |

Ogni fase si chiude con build, collaudo automatico (l'autopilota della
fase F) e commit.

## 8. Decisioni prese

1. **Sprite:** tutti i nemici diventano SVG originali in stile unico; i PNG
   escono dal gioco.
2. **Hangar:** schermate separate, Mappa · Hangar · Negozio · Officina.
3. **Campagna infinita:** mappa a nodi generata (DAG) dal settore 2.
4. **Ordine:** G1 → G2 → G3 → G4 → G5 → G6.
