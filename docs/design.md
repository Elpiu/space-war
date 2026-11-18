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
  per wave. Dalla wave 4 compaiono gli **elite** (Rapido, Blindato, Scissile),
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
| Dreadnought | ogni 5 | 3 fasi: raffiche radiali, spirale con evocazioni, cariche con raffica all'impatto | Leggere le fasi |

Il kamikaze esplode anche quando viene distrutto, e quell'esplosione colpisce
solo gli altri nemici: ucciderlo in mezzo a un gruppo conviene.

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

**Prossime fasi:** contenuti del settore (E: più missioni, mini-boss,
capsule segrete, rigiocabilità a difficoltà più alte), poi rifinitura (F).
