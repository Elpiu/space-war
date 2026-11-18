# Design

Space War ha due modalità che condividono lo stesso motore di combattimento:
**Survival**, roguelite a wave infinite, e **Campagna**, missioni a
scorrimento con equipaggiamento che si conserva. Le due economie sono
separate: crediti e sblocchi del survival non toccano la campagna, e
viceversa.

## Survival

Il survival è un roguelite arcade di sopravvivenza: una nave, un'arena di
detriti, wave sempre più dense. Il pilota si muove e schiva; il cannone spara da
solo. La run si costruisce scegliendo tomi al level-up e raccogliendo oggetti
dalle chest. Alla morte restano solo i crediti per sbloccare contenuti nuovi.

## Pilastri

1. **Il movimento è il gioco.** Schivare, scattare e scegliere dove combattere
   contano più dei numeri della build.
2. **Ogni nemico si legge al primo sguardo.** Ogni attacco pericoloso viene
   annunciato: linea rossa della carica, laser del cecchino, cerchio del
   kamikaze, barra e fasi del boss.
3. **Build piccole ma con un'identità.** Massimo 4 tomi per run. Ogni tomo al
   livello 5 si evolve e cambia il modo di combattere.
4. **Progressione orizzontale.** I crediti sbloccano contenuti, mai statistiche
   iniziali.

## Controlli

| Tasto | Azione |
| --- | --- |
| WASD / frecce | Movimento |
| Spazio (o Shift) | Scatto con breve invulnerabilità |
| Q | Torretta (8 monete, dura 30 s) |
| E | Mina (4 monete, esplode al passaggio) |
| P / Esc | Pausa |
| M | Audio on/off |
| 1-4, R | Scelta tomo e reroll al level-up |
| ` | Console di debug (solo `npm run dev`) |

## Loop

- **Wave da 30 secondi**, poi 3 secondi di pausa (+1 HP).
- **Ogni 5 wave un boss**: la wave finisce solo quando muore.
- **Wave 3, 8, 13...: orda**, un anello di sciami attorno alla nave.
- Gli spawn arrivano da fuori schermo e scelgono il tipo da una tabella pesata
  per wave. Dalla wave 4 compaiono gli **elite** (Rapido, Blindato, Scissile, Rigenerante, Esplosivo, Schermato, Fantasma),
  riconoscibili dall'aura e segnalati da frecce ai bordi dello schermo.
- **Chest** ogni ~55 uccisioni (più rare col tempo) e sempre dal boss: una
  freccia dorata indica dove si trova.

## Arena

Una sola arena di 3200×3200 generata da un seed: asteroidi che bloccano nave,
nemici e proiettili, nebulose che rallentano tutti del 35–40%. Lo sfondo è un
campo stellare in parallasse su quattro livelli.

## Nemici

| Nemico | Dalla wave | Comportamento | Come si affronta |
| --- | --- | --- | --- |
| Inseguitore | 1 | Punta dritto | Kiting |
| Sciame | 2 | Gruppi da 4–6, traiettoria a onda | Ad area, lame |
| Assaltatore | 3 | Si ferma, linea rossa, carica | Spostarsi di lato |
| Tiratore | 4 | Gira attorno e spara | Chiudere la distanza |
| Kamikaze | 5 | Si innesca vicino: cerchio rosso | Uscire dal cerchio, ucciderlo prima |
| Corazzato | 6 | Lento, resiste al contraccolpo, si divide in 2 sciami | Danno sostenuto |
| Scudato | 7 | Scudo frontale che si gira lentamente | Aggirarlo; lame, mine e archi lo ignorano |
| Cecchino | 8 | Laser di mira, poi colpo veloce | Muoversi quando lampeggia |
| Portaerei | 10 | Resta a distanza e lancia sciami | Priorità alta |
| Intercettore | 2 | Velocissimo, vira male | Schivare di lato |
| Zigzag | 3 | Avanza a zigzag e spara | Colpi ad area |
| Scissionista | 4 | Alla morte si divide in 2, poi in 4 più piccoli | Danno ad area, non in mezzo al gruppo |
| Bombardiere | 6 | Lancia bombe a parabola (arancioni) che esplodono | Non stare sotto la traiettoria |
| Batteria a ricerca | 7 | Missili viola che inseguono | Virate strette, abbatterla presto |
| Riparatore | 8 | Resta dietro agli alleati e li cura (anello verde) | Priorità alta |
| Drone laser | 9 | Linea gialla di carica, poi raggio rosso | Uscire dalla linea |
| Scudiero | 9 | Collega gli alleati vicini (linee ciano): danno dimezzato | Abbatterlo per primo |
| Drone EMP | 10 | Vicino disturba la nave: più lenta e calore in salita | Tenerlo a distanza |
| Pozzo gravitazionale | 11 | Attira la nave verso di sé (anelli viola) | Allontanarsi, ucciderlo da lontano |
| Fantasma | 12 | A tratti diventa intangibile e trasparente | Sparare quando è opaco |
| Teletrasporto | 12 | Cerchio magenta dove riappare, poi anello di colpi | Uscire dal cerchio |
| Dreadnought | ogni 5 | 3 fasi: raffiche radiali, spirale con evocazioni, cariche con raffica all'impatto | Leggere le fasi |

Il kamikaze esplode anche quando viene distrutto, e quell'esplosione colpisce
solo gli altri nemici: ucciderlo in mezzo a un gruppo conviene.

**Linguaggio dei segnali.** Ogni colore ha un solo significato: giallo =
carica in corso, rosso = pericolo/colpo, ciano = scudo, viola = controllo
(gravità, EMP, missili), verde = cura, magenta = teletrasporto. Boss, mini-boss
e strutture non ricevono cure né scudi.

**Affissi élite.** Rapido, Blindato, Scissile, più Rigenerante (recupera il 3%
di HP al secondo), Esplosivo (esplode alla morte), Schermato (barriera pari al
60% degli HP da consumare prima) e Fantasma (fasi intangibili).

## Tomi (level-up)

8 tomi, massimo 4 diversi per run, 5 livelli ciascuno. Ogni offerta ha una
rarità che moltiplica l'incremento: Comune ×1, Non comune ×1.5, Raro ×2.25,
Leggendario ×3.5. Ci sono 2 reroll gratis per run, poi si pagano in monete con
costo crescente.

| Tomo | Effetto | Evoluzione al livello 5 |
| --- | --- | --- |
| Potenza | +12% danno | Nucleo Perforante: i colpi trapassano 2 nemici |
| Cadenza | +10% velocità di fuoco | Raffica Stellare: anello di 12 colpi ogni 5 salve |
| Vitalità | +15% HP massimi | Scudo Rigenerante: assorbe un colpo ogni 12 s |
| Mobilità | +8% velocità e scatto | Scia al Plasma: lo scatto brucia i nemici |
| Magnetismo | +20% raggio di raccolta | Campo Repulsore: onda d'urto ogni 6 s |
| Sapienza | +12% esperienza | Illuminazione: 4 scelte e un reroll in più |
| Vampirismo* | +1.5% rubavita | Sete di Sangue: ogni uccisione cura 0.2 HP |
| Ingegneria* | +15% torrette e mine | Fabbrica Orbitale: +1 torretta a colpi doppi |

\* da sbloccare nell'Hangar.

## Oggetti (chest)

| Oggetto | Per livello |
| --- | --- |
| Camera Splitter | +1 proiettile a ventaglio |
| Drone Sentinella | +1 drone che spara |
| Paratia Rinforzata | +3 HP massimi e cura |
| Hangar Torrette | +1 torretta, +20% danno delle torrette |
| Scorta Mine | +1 mina, +15% raggio |
| Proiettili Rimbalzanti* | +1 rimbalzo sul nemico successivo |
| Lame Orbitanti* | +1 lama rotante |
| Arco Elettrico* | fulmine a catena, +1 salto |

\* da sbloccare nell'Hangar.

## Drop

Ogni uccisione lascia gemme di XP (tre tagli: quando a terra sono troppe si
fondono). Monete al 45%, cuori rari. Tre drop speciali molto rari: **Magnet
Overload** (raccoglie tutto per 8 s), **Munizioni Venom** (+25% danno per
20 s) e **Impulso EMP** (danno ai nemici vicini e cancella i proiettili).

## Difficoltà e meta

Prima di ogni run si sceglie Normale, Difficile o Incubo. Le difficoltà più
alte danno più HP e danno ai nemici, più spawn e più crediti. I crediti di fine
run si calcolano come `wave×3 + livello×2 + uccisioni/15`, moltiplicati per la
difficoltà, e si spendono nell'Hangar per aggiungere tomi e oggetti ai pool.
Il salvataggio importa i crediti dalle versioni precedenti del gioco.

## Tutorial

Non esiste una modalità tutorial separata. Alla prima occorrenza di ogni
situazione (movimento, scatto, gemme, monete, chest, evoluzioni, ogni nuovo
tipo di nemico) compare un suggerimento contestuale, una volta sola per
profilo.

## Campagna

Shoot 'em up a scorrimento orizzontale con hangar fra le missioni: il genere
e le meccaniche sono quelli dei classici con negozio (slot d'arma multipli,
calore, bombe), mentre stile e contenuti sono nostri. Il piano completo è in
[campaign-replan.md](campaign-replan.md).

**Fatto (fase A):**
- **Controlli:** WASD per muoversi, Spazio o click sinistro **tenuti** per
  sparare, B o click destro per la bomba. Niente scatto e niente
  torrette/mine in campagna.
- **Slot per scafo:**

  | Scafo | Frontali | Coda | Missili | Bombe | Dispositivi |
  | --- | --- | --- | --- | --- | --- |
  | Ricognitore | 2 | 0 | 1 | 0 | 1 |
  | Fregata | 2 | 1 | 0 | 1 | 1 |
  | Bastione | 3 | 1 | 1 | 1 | 2 |

- **Fuoco e calore:** frontali e coda sparano insieme e scaldano. Al massimo
  la nave si surriscalda e riparte al 35%. Il dissipatore lavora più in fretta
  quando non si spara.
- **Missili e bombe:** i missili partono da soli e non scaldano. Le bombe
  cadono con gravità ed esplodono ad area; l'indicatore si ricarica da solo.
- **Armi e soglie:**
  - frontali: Blaster, Spargitore, Mitragliera, Railgun;
  - coda: Cannone di coda, Flak;
  - missili: Razzi, Sciame a ricerca;
  - bomba: a grappolo.

  Ogni arma cambia comportamento ai livelli 5 e 10.
- **Dispositivi:** Piastre, Radiatore, Serbatoio termico, Mirino, Caricatore,
  Propulsore, Bobina, Vano bombe, più Scanner taglie, Drone gregario e
  Anello di lame che si trovano solo nel bottino.
- **Hangar:** scheda Hangar (inventario: monta, potenzia fino al livello 10,
  vendi) e scheda Negozio. Il catalogo si allarga con il tier delle missioni
  completate; nel negozio tutto è comune, le rarità migliori arrivano solo
  dal bottino.
- **Missioni:** monete e bottino si tengono anche in caso di sconfitta.

**Fatto (fase B):**
- **Livelli a segmenti.** Ogni missione è una sequenza di segmenti
  generata da un seed: si parte sempre con un tratto aperto e si chiude con
  l'uscita, oppure con l'arena del boss nella 1-5.

  | Segmento | Geometria |
  | --- | --- |
  | Spazio aperto | Pochi asteroidi, nebulose |
  | Fascia di rottami | Molti asteroidi |
  | Superficie | Pavimento ondulato |
  | Caverna | Pavimento e soffitto, passaggio stretto |
  | Stazione | Pavimento e soffitto piatti, con pilastri alternati |
  | Arena del boss | Pavimento piatto, niente spawn |

- **Terreno.** Pavimento e soffitto sono profili campionati ogni 40 px, con
  rampe morbide fra un segmento e l'altro e un varco minimo di 290 px.
  - **Nave:** scivola lungo pareti e pendii. Se il bordo dello schermo la
    schiaccia contro una parete, prende danno.
  - **Proiettili:** si fermano sul terreno; bombe e missili ci esplodono.
  - **Nemici e pickup:** restano nello spazio libero.
- **Ritmo.** Ogni segmento favorisce certi nemici: kamikaze e scudati nei
  rottami, tiratori in superficie, sciami in caverna, cecchini in stazione.
  Entrando in un segmento compare il suo nome, e la barra del percorso ha
  una tacca per ogni segmento.
- **Salvataggio:** `space-war-campaign-v2`, migrato in automatico dal v1.
  Torrette e posamine vengono rimborsati in monete.

**Fatto (fase C):**
- **Ondate a formazione.** Ogni ondata è scelta da una tabella per tipo di
  segmento e tier.

  | Ondata | Composizione | Tier |
  | --- | --- | --- |
  | Onda di sciami | Sciami in sinusoide | 1+ |
  | V | Inseguitori in V, capofila a volte elite | 1+ |
  | Picchiata | Assaltatori che piombano verso la tua quota | 2+ |
  | Linea di tiro | Tiratori che si fermano sullo schermo, sparano ed escono di lato | 2+ |
  | Postazione | Cecchino fermo all'ultimo quarto dello schermo | 3+ |
  | Convoglio | Cargo scortato da due inseguitori | 1+ |

  Restano anche ondate con l'IA del survival: kamikaze, scudati, corazzati,
  portaerei e gruppi di inseguitori.
- **Unità di terra** piazzate dal generatore su pavimento e soffitto:
  - **Antiaerea:** la canna segue la nave; anche capovolta sul soffitto.
  - **Carro:** pattuglia il pavimento.
  - **Silo:** colpi lenti e pesanti.
- **Strutture distruttibili:**
  - **Serbatoio:** esplode e danneggia i nemici vicini.
  - **Cartelloni satirici:** "IPO SPAZIALE", "CARBURANTE -90%*",
    "ORBITA PREMIUM", "IL MERCATO NON DORME".
- **Cargo:** attraversa lo schermo lentamente; distrutto, lascia sempre una
  cassa di bottino e monete.
- **Ricompense:** unità di terra, strutture e cargo lasciano sempre monete.
  Il raggio di raccolta di base in campagna è più ampio.

**Fatto (fase D):**
- **Nuove armi:**

  | Arma | Slot | Comportamento | Dal tier |
  | --- | --- | --- | --- |
  | Sfera Rimbalzante | Frontale | Salta da un nemico all'altro | 1 |
  | Laser Continuo | Frontale | Raggio fisso, danno e calore al secondo; al livello 10 attraversa 3 nemici | 3 |
  | Lanciamine di Coda | Coda | Mine lente lasciate indietro | 2 |
  | Perforabunker | Bombe | Danno ×3 su unità di terra e strutture | 2 |

- **Nuovi dispositivi:**

  | Dispositivo | Effetto | Dal tier |
  | --- | --- | --- |
  | Nanobot | Rigenerano HP | 1 |
  | Generatore di Scudo | Assorbe i colpi, si ricarica dopo 2,5 s senza danni, barra azzurra nell'HUD | 2 |
  | Moltiplicatore Combo | Le uccisioni entro 1,8 s rendono via via più monete; "COMBO xN" nell'HUD | 3 |

- **Negozio:** cliccando un pezzo si apre l'anteprima con statistiche,
  soglie e confronto con quello montato (danno e calore al secondo per le
  armi), più i pulsanti "Compra" e "Compra e monta". I pezzi appena
  sbloccati hanno il badge NUOVO.
- **Hangar:** il badge NUOVO compare anche sul bottino non ancora guardato.
  Il dettaglio dell'oggetto mostra cosa cambia al livello successivo e quale
  soglia sblocca. Un pulsante vende tutti i comuni di livello 1 non montati,
  con conferma.

**Fatto (fase E):**
- **Settore 1 a 8 missioni:**

  `1-1 → 1-2 → (1-3 Nebulosa | 1-3 Asteroidi) → 1-4 → (1-5 Cantiere | 1-5 Relitto) → 1-6 Dreadnought`

  I segmenti sono circa il 30% più lunghi: una missione dura 2–3 minuti.
- **Mini-boss Cannoniera** dalla 1-3 in poi, a una distanza fissa del
  percorso:
  - lo scorrimento si ferma finché non viene abbattuta, e ha la sua barra
    nell'HUD;
  - attacca con raffiche mirate, anelli di colpi e sciami;
  - abbattuta, lascia una cassa e monete.
- **Capsula segreta**, una per missione, rasoterra o contro il soffitto
  nei tratti con terreno. Vale 50 × tier monete e un pezzo raro o migliore.
  Una volta trovata non ricompare, e la mappa la segna con un badge viola.
- **Difficoltà per missione.** Si sceglie fra Normale, Difficile e Incubo;
  ogni livello si sblocca vincendo il precedente.
  - Le stelle (fino a 3) compaiono sulla mappa.
  - Le difficoltà più alte rendono i nemici più forti, moltiplicano le
    monete (×1,5 / ×2,2) e pescano il bottino come un tier più alto.
  - La prima vittoria a ogni difficoltà raddoppia il bonus. Il bottino
    garantito è non comune o migliore a Difficile, raro o migliore a Incubo.
- **Salvataggi:** chi aveva già completato missioni riceve una stella per
  ognuna. La boss mission resta giocabile anche con le nuove missioni 1-5
  ancora da fare.

**Fatto (fase F):**
- **Profili di fuoco** con i tasti 1, 2 e 3. Il profilo 1 usa tutte le armi;
  il 2 e il 3 si configurano in hangar, per spegnere le armi più calde.
- **Sfondi per segmento** con dissolvenza:
  - superficie: montagne in parallasse;
  - caverna: vignetta viola;
  - stazione: griglia;
  - rottami: foschia ruggine.
- **Pausa e riepilogo:** in campagna la pausa mostra equipaggiamento e
  comandi; l'esito della missione mostra le stelle ottenute.
- **Boss:** in campagna ha tre volte gli HP e resta sempre nella metà destra
  dello schermo, dove le armi frontali lo raggiungono.
- **Collaudo automatico:** tutte le 8 missioni a Normale, più la 1-4 e il
  boss a Incubo, completate senza errori. Missioni da 1,5 a 3,5 minuti.

## Hub della campagna (v3)

Quattro schermate a tutto spazio, con una barra in alto:

- **Mappa:** il settore occupa la schermata. A lato ci sono la scheda della
  missione (difficoltà, ricompense, capsula) e un riepilogo della nave con il
  pulsante "Modifica nave".
- **Hangar:**
  - **Schema della nave:** in SVG, con una sagoma diversa per ogni scafo e
    le prese degli slot sul disegno.
  - **Presa selezionata:** a destra compaiono il pezzo montato e tutti i
    pezzi compatibili, ognuno con le differenze ("+3,1 danno/s", "+6
    calore/s") e il pulsante Monta.
  - **Anteprima:** passando su un pezzo, la scheda statistiche a sinistra
    mostra le variazioni. La scheda include il **bilancio termico** (calore
    prodotto contro dissipazione) e i secondi di fuoco continuo prima del
    surriscaldamento.
  - **Profili di fuoco:** si attivano direttamente sulle prese delle armi.
  - **Inventario:** filtri per tipo, rarità e novità, ordinamento, selezione
    multipla (vendi o blocca in blocco), pezzi bloccati.
- **Negozio:** catalogo a schede, divise per slot. L'anteprima confronta il
  pezzo con la nave attuale. "Compra e monta" usa uno slot libero, oppure
  sostituisce il pezzo più debole.
- **Officina:** potenziamento con barra dei livelli e anteprima, blocco,
  vendita (con conferma) e vendita rapida dei comuni.
  - **Fusione:** 3 pezzi uguali (stessa definizione e rarità) più monete
    danno un pezzo della rarità superiore. Il pezzo scelto resta montato
    dov'è, prende il livello e l'item level migliori, tiene i suoi affissi e
    ne aggiunge uno. Usa solo doppioni liberi e non bloccati.
  - **Ricalibrazione:** ritira un affisso a scelta (tipo e valore). Ogni
    ricalibrazione dello stesso pezzo costa il 50% in più.
- **Offerte del settore** (in cima al Negozio): 4 pezzi rari o migliori,
  sempre con affissi, all'item level del settore più alto. Cambiano dopo
  ogni missione vinta; "Rinnova" li ripesca, a costo crescente.

## Affissi del bottino

Ogni pezzo trovato ha affissi casuali in base alla rarità: comune 0, non
comune 1, raro 2, leggendario 3 (i leggendari pescano nella metà alta dei
valori). I pezzi del catalogo non ne hanno.

| Affisso | Valori | Dove |
| --- | --- | --- |
| Danno | +6–14% | armi |
| Cadenza | +5–12% | armi |
| Calore | −8–18% per colpo | frontali e coda |
| Colpo critico (danno ×2) | 5–12% | armi |
| Gittata | +10–22% | frontali e coda (non laser) |
| Raffica | +1 proiettile ogni 4 colpi | frontali e coda (non laser) |
| Perforazione | +1 | frontali e coda, solo rari e leggendari |
| Rubavita | 1–3% del danno delle armi di bordo (tetto 8%) | tutti |
| Esplosione all'uccisione | 8–16% (tetto 50%) | tutti |
| Monete | +8–20% | tutti |
| HP | +1–3 | dispositivi e scafi |
| Dissipazione | +6–14% | dispositivi, scafi, frontali e coda |
| Velocità | +4–10% | dispositivi e scafi |

Gli affissi d'arma modificano la scheda dell'arma; gli altri valgono per
tutta la nave finché il pezzo è montato.

## Campagna infinita

Il settore 1 resta fatto a mano. Battere il suo Dreadnought apre il
**settore 2**, e da lì ogni boss apre il settore successivo, senza fine.
Le frecce in cima alla mappa passano da un settore sbloccato all'altro.

- **Seed:** ogni profilo ha un seed; il settore n nasce da `hash(seed, n)`.
  Lo stesso profilo rivede sempre lo stesso settore.
- **Mappa a nodi:** 6 strati, con 2 nodi al primo strato, 2–3 negli strati
  intermedi e il boss all'ultimo. Gli archi collegano solo nodi vicini.
  Completare un nodo apre i successivi collegati e chiude gli altri nodi
  dello stesso strato: la rotta è una scelta.
- **Tipi di nodo:**
  - **Missione:** un percorso a segmenti, come nel settore 1.
  - **Élite:** minaccia +25%, mini-boss garantito, più élite, bottino almeno
    non comune e monete +30%.
  - **Cantiere:** una revisione gratuita (+1 livello al pezzo montato più
    basso) oppure monete.
  - **Evento:** una scelta con rischio (Relitto, Contrabbandiere, Segnale
    di soccorso, Laboratorio pirata).
  - **Tesoro:** un pezzo non comune o migliore e delle monete.
  - **Boss:** il Dreadnought con la minaccia del settore; dà un pezzo in più.
- **Regole della mappa:** al massimo un nodo senza combattimento per strato,
  e due nodi senza combattimento non sono mai collegati: nessuna rotta salta
  tutti gli scontri.
- **Segmenti:** una catena di Markov sceglie la sequenza (per esempio dopo
  una caverna è probabile una stazione); il bioma pesa le transizioni.
- **Terreno:** rumore frattale (fBm, 4 ottave) per pavimento e soffitto,
  anche nel settore 1.
- **Curve**, con `s` = progresso (0 all'inizio del settore 2, +1 per settore):

  | Curva | Formula | Esempi (a inizio settore) |
  | --- | --- | --- |
  | HP nemici | `1 + 0.35·s^1.15` | settore 3: ×1,35 · settore 7: ×3,2 · settore 12: ×5,9 |
  | Danno nemici | `1 + 0.2·s^1.05` | settore 3: ×1,2 · settore 7: ×2,1 |
  | Densità | `1 + 0.6 / (1 + e^(−0.6(s−4)))` | da ×1,05 a ×1,6, poi stabile |
  | Item level | `10·(n−1)` + fino a 10 lungo il settore | settore 2: 10–20 |
  | Potenza item level | `1 + 0.1·√ilvl` | iL 10: ×1,32 · iL 100: ×2 |

  Monete, prezzi di vendita e costi di upgrade crescono con la stessa
  potenza dell'item level, così l'economia resta proporzionata. Il negozio
  vende pezzi con l'item level di un settore indietro.
- **Biomi** a rotazione (`(n−2) mod 5`), ognuno con colori di terreno,
  nebulose e asteroidi, segmenti e formazioni favorite:

  | Bioma | Carattere |
  | --- | --- |
  | Discarica Orbitale | Rottami, sciami e scissionisti |
  | Anelli di Ghiaccio | Molti asteroidi, caverne, cecchini e laser |
  | Nebulosa Tossica | Nebulose ovunque: restarci dentro toglie 1 HP ogni 1,4 s |
  | Cantieri Corporate | Stazioni e superfici, più unità di terra, batterie e scorte |
  | Campo Minato | Kamikaze, pozzi gravitazionali e bombardieri |

- **Mutatori** (dal settore 4: uno per missione, fino a due dal settore 7),
  con più monete come compenso:

  | Mutatore | Effetto | Monete |
  | --- | --- | --- |
  | Corazze pesanti | Nemici +30% HP | +25% |
  | Nebbia densa | I nemici lontani si vedono appena | +20% |
  | Calore +20% | Dissipazione delle armi −17% | +20% |
  | Bottino doppio | Casse doppie e un pezzo in più a fine missione; nemici +15% danno | — |
  | Ondata élite | Élite 2,5 volte più frequenti | +30% |
  | Nemici rapidi | Nemici +20% velocità | +20% |
