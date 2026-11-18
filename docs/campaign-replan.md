# Replan campagna: shoot 'em up a scorrimento con hangar

> **Riferimento di genere.** Jets'n'Guns (Rake in Grass, 2004) è uno shoot 'em
> up orizzontale con negozio fra un livello e l'altro. Ne prendiamo il **genere
> e le meccaniche**: slot d'arma multipli, calore, scenari distruttibili, soldi
> spesi in hangar. Niente nomi, personaggi, livelli, grafica o musica di
> quel gioco. Lo stile resta il nostro: neon sci-fi, rottami orbitali,
> satira corporate ("il mercato non dorme mai"), icone SVG.

## 1. Cosa prendiamo dal genere

| Meccanica del genere | Come la traduciamo in Space War |
| --- | --- |
| Scorrimento orizzontale continuo, livelli da 3–5 min | Missioni a **segmenti** (spazio aperto, superficie, caverna, convoglio, stazione) concatenati da un seed |
| La nave ha **più slot**: frontali, posteriore, missili, bombe; il numero dipende dallo scafo | Ogni scafo ha il suo **layout di slot**: si compra o si trova lo scafo, poi si riempiono gli slot |
| Tutte le armi frontali sparano **insieme** | Il fuoco (tasto tenuto) attiva tutte le armi montate su frontali e posteriore |
| **Calore**: quasi tutte le armi scaldano, e se si surriscalda la nave smette di sparare; missili e bombe non scaldano | Barra del calore nell'HUD. Il surriscaldamento blocca il fuoco finché non scende al 35%. Raffreddamento e dissipatore si potenziano in hangar |
| **Bombe** con indicatore che si ricarica, utili contro i bersagli a terra | Tasto bomba: cade con gravità, ad area, efficace su strutture e unità di terra |
| **Missili** senza calore | Slot missili: lancio automatico a ricarica sul bersaglio più vicino |
| **Scenario distruttibile**: edifici e strutture valgono soldi | Strutture sul terreno (antenne, serbatoi, cartelloni satirici, silos) che esplodono e pagano |
| **Trasporti** che, se distrutti, lasciano casse | Cargo corporate che attraversano lo schermo: abbatterli dà una cassa di bottino |
| **Negozio fra i livelli**: compra/vendi armi e dispositivi, potenzia ogni arma | **Hangar**: catalogo d'acquisto + inventario dei drop + vendita + upgrade per pezzo |
| **Dispositivi**: raffreddamento, corazza, scudi e nanomacchine che rigenerano, bonus taglia, bonus uccisioni multiple | **Dispositivi** in slot dedicati (vedi §5) |
| **Profili d'arma** commutabili | Fase successiva: 2–3 profili salvati (insiemi di armi attive), da cambiare in volo |
| Niente vite: si riprova il livello finché non lo si passa | Già così: fallire tiene monete e bottino |
| Difficoltà che sale col progresso; più livelli di difficoltà | Tier di minaccia per missione + rigiocabilità a "Difficile / Incubo" con bottino migliore |
| Tono comico e scenari pieni di cartelli | Satira dei rottami spaziali: cartelloni pubblicitari, loghi parodia generici, nemici-gadget |
| Segreti e collezionabili | Una "capsula nascosta" per missione (fuori traiettoria, dietro strutture) |

**Cosa NON prendiamo:** l'umorismo specifico, i personaggi, la storia, gli
scenari e i nomi delle armi di quel gioco.

## 2. Cosa cambia rispetto alla campagna di oggi

| Oggi (MVP) | Dopo il replan |
| --- | --- |
| Fuoco automatico in avanti con aiuto alla mira | Fuoco **tenuto** (Spazio o click sinistro) dritto in avanti |
| Un'arma principale + un secondario (torretta/mine/droni/lame) | Slot per scafo: 2–4 frontali, 0–1 posteriore, 0–1 missili, 0–1 bombe, 1–3 dispositivi |
| Torrette e mine anche in campagna | Tolte dalla campagna (restano nel survival). Droni e lame diventano **dispositivi** |
| Corridoio con asteroidi casuali | **Segmenti** tematici con terreno, soffitto, strutture, eventi |
| Nemici con l'IA del survival (inseguono) | **Formazioni con traiettorie** (onda, V, picchiata, attraversamento) + **unità di terra** |
| Bottino solo da drop | **Negozio** (catalogo che si allarga col progresso) + **drop** rari con rarità migliori |
| Upgrade lineare +8% per livello | Upgrade per pezzo fino al livello 10, con **soglie** ai livelli 5 e 10 che cambiano il comportamento |
| Scatto su Spazio | Niente scatto in campagna: Spazio è il fuoco |

Restano: mappa del settore, monete e inventario separati dal survival, rarità,
vendita, esito missione, nessuna perdita alla sconfitta.

## 3. Controlli campagna

| Tasto | Azione |
| --- | --- |
| WASD / frecce | Movimento |
| Spazio / click sinistro (tenuti) | Fuoco: armi frontali e posteriore |
| B / click destro | Bomba |
| 1–3 | Profilo d'arma (fase successiva) |
| P / Esc | Pausa |

I missili partono da soli: non scaldano, hanno solo una ricarica.

## 4. Nave: scafi e slot

| Scafo | Frontali | Post. | Missili | Bombe | Dispositivi | HP | Velocità | Calore (capacità / dissipazione) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ricognitore | 2 | 0 | 1 | 0 | 1 | 8 | 300 | 100 / 32 al secondo |
| Fregata (iniziale) | 2 | 1 | 0 | 1 | 1 | 11 | 255 | 110 / 30 al secondo |
| Bastione | 3 | 1 | 1 | 1 | 2 | 16 | 215 | 130 / 26 al secondo |
| Incrociatore (settore 2) | 4 | 1 | 1 | 1 | 2 | 14 | 240 | 150 / 34 al secondo |
| Ammiraglia (endgame) | 5 | 2 | 2 | 1 | 3 | 18 | 230 | 180 / 38 al secondo |

## 5. Catalogo (prima stesura)

**Armi frontali** (calore per colpo tra parentesi):
- Blaster (3)
- Spargitore a 3 colpi (5)
- Mitragliera (1, cadenza altissima)
- Railgun perforante (14)
- Laser continuo (raggio, calore al secondo)
- Onda (proiettile sinusoidale) (4)
- Sfera elettrica che salta fra i nemici (8)
- Torcia al plasma, corto raggio e danno alto (calore al secondo)

**Armi posteriori:**
- Cannone di coda (3)
- Lanciamine all'indietro (6)
- Flak a ventaglio (5)

**Missili (senza calore):**
- Razzi dritti, a raffica
- Sciame a ricerca
- Siluro pesante perforante

**Bombe (indicatore che si ricarica):**
- Bomba a grappolo
- Napalm, area che brucia
- Perforabunker, danno doppio su strutture

**Dispositivi:**
- Radiatore: più dissipazione
- Serbatoio termico: più capacità di calore
- Piastre: HP
- Generatore di scudo: scudo che si rigenera
- Nanobot: rigenerano HP lentamente
- Bobina magnetica: raccolta
- Scanner taglie: +monete per uccisione
- Moltiplicatore combo: bonus per uccisioni a catena
- Drone gregario
- Anello di lame

**Soglie di upgrade.** Ai livelli 5 e 10 il comportamento cambia, per esempio:
- Spargitore: 5 colpi al livello 5, 7 al livello 10;
- Railgun: al livello 10 rimbalza su un bersaglio in più;
- Sciame: un missile in più a ogni soglia.

Il resto dei livelli aggiunge solo potenza (danno, cadenza, calore).

## 6. Livelli a segmenti

Ogni missione è una sequenza di 5–8 segmenti da circa 1200–2000 px. Ogni
segmento ha un tipo, una densità e un "copione" di ondate.

| Segmento | Geometria | Contenuto tipico |
| --- | --- | --- |
| Spazio aperto | Nessuna | Formazioni volanti, cargo |
| Fascia di rottami | Asteroidi e relitti (gli asteroidi di oggi) | Kamikaze, scudati, rottami distruttibili |
| Superficie | Terreno in basso (profilo procedurale) | Torrette antiaeree, carri, silos, edifici che pagano |
| Caverna | Terreno sotto + soffitto sopra, passaggi stretti | Mine sospese, torrette a soffitto, segreti |
| Convoglio | Spazio aperto | Trasporti scortati da elite: casse garantite |
| Stazione | Pareti a blocchi con varchi | Generatori da distruggere per aprire il passaggio |
| Arena boss | Lo scorrimento si ferma | Boss a fasi (oggi il Dreadnought; poi uno per settore) |

**Ritmo:** lo scorrimento è costante, rallenta solo quando entra un
mini-boss, e si ferma nell'arena del boss. La durata punta a 3–4 minuti per
missione.

**Copione delle ondate:** ogni segmento estrae 3–5 ondate da una tabella per
tipo e tier. Le formazioni sono "cinque in onda dall'alto", "V che
attraversa", "picchiata dal fondo", "torretta più due scorte". Le traiettorie
sono curve con tempi prestabiliti, non inseguimento.

## 7. Nemici

**Volanti, con traiettorie scriptate.** Riusano gli sprite esistenti:
- Inseguitore → "interceptor" in formazione;
- Sciame → stormi sinusoidali;
- Tiratore e Cecchino → si fermano e sparano;
- Kamikaze → picchiata con avviso;
- Scudato → scudo frontale (verso sinistra);
- Portaerei → mini-boss che lancia stormi.

**Di terra (nuovi, SVG):**
- torretta antiaerea (ruota e spara in alto);
- carro (si muove sul terreno);
- silo (lancia un missile lento);
- radar (potenzia la mira delle torrette vicine finché non viene distrutto).

**Strutture distruttibili (nuove, SVG):** serbatoio (esplode ad area),
cartellone satirico, antenna, container con monete, capsula segreta.

**Trasporti:** cargo lenti che attraversano lo schermo. Si possono lasciare
andare, ma distrutti danno una cassa di bottino.

## 8. Economia

| Fonte | Monete |
| --- | --- |
| Nemico volante | 1–4 × tier |
| Struttura | 3–15 × tier |
| Trasporto | cassa di bottino + 10 × tier |
| Combo (5+ uccisioni in 2 s) | +10% per ogni passo, con il dispositivo |
| Capsula segreta | 50 × tier + un pezzo raro |
| Fine missione | 40 × tier (doppio alla prima vittoria) |

**Hangar:**
- il catalogo d'acquisto si allarga completando le missioni;
- i drop sono varianti con rarità migliori, che non si trovano in negozio;
- vendita al 50% del valore;
- upgrade con costo crescente.

**Obiettivo di bilanciamento:** a ogni missione completata si può comprare o
potenziare un pezzo importante.

## 9. HUD campagna

- **Barra del calore** sotto la nave (o in basso a sinistra), che lampeggia
  quando ci si avvicina al surriscaldamento.
- **Indicatore delle bombe** e **ricarica dei missili** al posto di torretta e
  mina.
- **Monete della missione** con un contatore combo.
- **Barra del percorso** in alto (c'è già), con le tacche dei segmenti.

## 10. Architettura

- **`WeaponRack`** (nuovo, `systems/rack.ts`): gestisce le armi montate negli
  slot, ognuna con cadenza, calore e comportamento propri:
  - colpo singolo, ventaglio, raggio, onda, sfera, perforante;
  - missile a ricerca, bomba a gravità.

  In campagna sostituisce `Arsenal`; il survival continua a usare `Arsenal`.
- **`Terrain`** (nuovo, `systems/terrain.ts`): profili di pavimento e soffitto
  campionati per x. Fornisce collisione per nave, proiettili e bombe, il
  disegno, e i punti d'ancoraggio per unità di terra e strutture.
- **`LevelScript`** (nuovo, `modes/campaign/level.ts`): genera i segmenti dal
  seed e la scaletta delle ondate per distanza.
- **Volanti a traiettoria**: un nuovo `behavior: "path"` in
  `systems/enemies.ts`, con una funzione posizione-nel-tempo per formazione.
  Gli altri comportamenti restano per il survival.
- **Strutture**: entità statiche con HP, ricompensa ed esplosione (riusano
  `damageEnemy` attraverso un tipo "struttura").
- **Dati**: `gear.ts` passa a slot tipizzati (`front`, `rear`, `missile`,
  `bomb`, `device`, `hull`), più `heat`, soglie di upgrade e flag "in
  negozio".
- **Salvataggio**: la migrazione a `space-war-campaign-v2` converte
  l'inventario attuale. Arma principale → frontale; secondari → dispositivi o
  vendita automatica con rimborso.
- **Survival**: invariato.

## 11. Fasi

| Fase | Contenuto | Fatto quando |
| --- | --- | --- |
| **A. Nave a slot e calore** ✅ | `WeaponRack`, fuoco tenuto, calore, missili, bombe, layout di slot degli scafi, HUD di calore e bombe, migrazione del salvataggio | La 1-1 si gioca con 2 frontali + bomba e il calore conta |
| **B. Terreno e segmenti** ✅ | `Terrain`, `LevelScript`, segmenti spazio/rottami/superficie/caverna, collisioni | Una missione attraversa almeno 3 tipi di segmento |
| **C. Nemici da shmup** ✅ | Formazioni a traiettoria, unità di terra, strutture distruttibili, trasporti | Ogni segmento ha ondate riconoscibili e bersagli a terra |
| **D. Hangar negozio** ✅ | Catalogo d'acquisto, sblocco progressivo, soglie di upgrade, dispositivi | Comprare e potenziare cambia davvero come si gioca la missione successiva |
| **E. Contenuti settore 1** ✅ | 8 missioni, mini-boss, boss finale, capsule segrete, rigiocabilità a difficoltà più alte | Il settore si finisce in 30–40 minuti con una curva sensata |
| **F. Rifinitura** ✅ | Profili d'arma, cartelloni satirici, musica e sfondi per segmento, bilanciamento | Sessione di test completa senza blocchi |

Ogni fase si chiude con un gioco funzionante, un commit e un giro di prova.

## 12. Decisioni prese

1. **Fuoco tenuto**, senza opzione automatica.
2. **Terreno**: pavimento e soffitto, entrambi.
3. **Mix negozio + drop**: confermato.
4. **Torrette e mine**: tolte dalla campagna (restano nel survival).
5. **Scatto**: tolto dalla campagna (resta nel survival). Shift resta libero.
