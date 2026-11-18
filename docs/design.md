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

## Campagna (MVP)

- **Hub**: in alto la mappa del settore con le missioni collegate, in basso
  equipaggiamento, inventario e scheda dell'oggetto selezionato.
- **Missioni**: corridoio orizzontale generato da un seed. La camera scorre da
  sola verso destra e rallenta quando lo schermo è affollato. I nemici
  arrivano da destra, innescati dalla distanza percorsa. Si vince
  raggiungendo il portale d'uscita oppure, nella 1-5, abbattendo il
  Dreadnought.
- **Settore 1, "Fascia dei Rottami"**: 1-1 → 1-2 → (1-3 Nebulosa oppure 1-3
  Asteroidi) → 1-4 → 1-5 boss. La minaccia (tier 1-5) scala nemici e
  bottino.
- **Equipaggiamento**: arma principale (Blaster, Spargitore, Railgun,
  Mitragliera), secondario (Torretta, Posamine, Drone Gregario, Anello di
  Lame), due moduli (Piastre, Propulsore, Mirino, Caricatore, Bobina) e uno
  scafo (Ricognitore, Fregata, Bastione). L'arma principale spara in avanti,
  con un aiuto alla mira entro ~30 gradi.
- **Bottino**: gli elite (35%) e il boss lasciano casse; ogni vittoria dà un
  pezzo garantito, non comune o migliore alla prima vittoria. Rarità:
  potenza ×1 / ×1.15 / ×1.35 / ×1.6.
- **Hangar**: ogni pezzo si potenzia fino al livello 10 (+8% per livello) con
  le monete, oppure si vende. Arma e scafo sono obbligatori e si possono solo
  sostituire.
- **Non è un roguelite**: monete e bottino raccolti si tengono anche quando la
  missione fallisce.
