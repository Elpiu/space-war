# Backlog

## v2.0: rifondazione (fatto)

- [x] Codice riscritto da circa 10.700 a circa 4.400 righe TypeScript, con una
      scena sola.
- [x] Arena unica con asteroidi e nebulose al posto della mappa a settori.
- [x] Torrette e mine piazzate con un tasto sulla posizione della nave (niente
      griglia, spostamento, riparazione). Barricate rimosse.
- [x] Pausa e level-up congelano il tempo di gioco senza spostare i timer a mano.
- [x] Statistiche derivate da tomi e oggetti (`computeStats`).
- [x] Interfaccia interamente in DOM con un set di icone SVG originali.
- [x] Scatto con invulnerabilità.
- [x] Nove nemici con comportamenti distinti e attacchi annunciati, elite con
      affissi, boss a tre fasi.
- [x] Spawn da tabella pesata, eventi orda e boss.
- [x] 8 tomi con evoluzione al livello 5, 8 oggetti con effetti visibili.
- [x] Arma: perforazione, rimbalzi, lame orbitanti, arco elettrico, droni.
- [x] Gemme a tre tagli che si fondono oltre il limite; pool di proiettili.
- [x] Feedback: lampo bianco al colpo, numeri di danno, particelle, scia,
      vignetta rossa quando si viene colpiti, frecce fuori schermo.
- [x] Sfondo stellare in parallasse, menu animato.
- [x] Effetti sonori sintetizzati, musica in streaming, tasto per l'audio.
- [x] Riepilogo di fine run con danni per fonte e build.
- [x] Tutorial sostituito da suggerimenti contestuali.
- [x] Difficoltà scelta a inizio run.
- [x] Pulizia: telemetria del template, Tailwind e file inutilizzati rimossi;
      nessuna richiesta a file inesistenti.

## v2.1: due modalità (fatto)

- [x] Nucleo di combattimento separato dalle modalità (`GameMode`).
- [x] Survival estratto senza cambiare il gameplay.
- [x] Campagna MVP: hub con mappa, equipaggiamento e inventario; vendita e
      upgrade; corridoio a scorrimento; portale d'uscita; boss nella 1-5;
      bottino e riepilogo della missione.

## v3: hangar, campagna infinita, bestiario, contorno (fatto)

- [x] G1 Hangar a schermate (Mappa, Hangar, Negozio, Officina) con schema della nave.
- [x] G2 Bestiario 1: sprite SVG, 12 nemici nuovi, affissi élite, linguaggio dei segnali.
- [x] G3 Campagna infinita: settori generati (DAG, Markov, fBm), biomi, mutatori, item level.
- [x] G4 Affissi del bottino, fusione, ricalibrazione, offerte del settore.
- [x] G5 Bestiario 2: 12 nemici, 2 mini-boss, 3 boss a rotazione.
- [x] G6 Impostazioni, esporta/importa, archivio, medaglie, verniciature,
      contratti, sfida del giorno, combo, impatto, rallentatore, radio.
- [x] Giro di collaudo: mira automatica che punta il boss a colpi alterni,
      Fortezza ritarata, curva di minaccia ammorbidita (era un muro dal
      settore 7-8), hub compatto su telefono, tasti ignorati con le
      impostazioni aperte, archivio salvato anche alla chiusura della pagina.

## Prossimi passi

- **Bilanciamento con partite vere:** prezzi di fusione, ricalibrazione e
  offerte; curva di minaccia dei settori alti; durata dei boss del survival
  dopo la wave 20; ricompense dei contratti.
- **Ricomprimere la musica:** due MP3 da circa 9 MB l'uno; in OGG o MP3 a
  96 kbps scenderebbero intorno ai 2 MB (serve un encoder, per esempio ffmpeg).
- **Gamepad** (oggi tastiera e touch).
- **Rimappatura dei tasti** nelle impostazioni.
- **Sfida del giorno anche nel survival** (il generatore dell'arena è già
  deterministico).
- Seconda arma attiva o "ultimate" a ricarica nel survival.
- Pool di sprite per i nemici, se servisse più velocità oltre i 200 nemici
  (oggi circa 4-5 ms per frame con 220 nemici).
- Su telefono le impostazioni e l'hangar scorrono in verticale: valutare un
  layout ancora più compatto per schermi molto bassi.
