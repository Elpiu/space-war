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

## Prossimi passi

- Bilanciamento con partite vere: curva XP, densità degli spawn dopo la wave
  15, danno del boss nelle tier alte.
- Ricomprimere la musica (circa 17 MB complessivi).
- Supporto touch o gamepad (oggi solo tastiera).
- Seconda arma attiva o "ultimate" a ricarica.
- Altri boss con meccaniche legate all'arena (asteroidi che si muovono,
  nebulose tossiche).
- Sfide giornaliere con seed condiviso (il generatore dell'arena è già
  deterministico).
- Sprite dei nemici PNG in stile più uniforme, o rifatti in SVG come i
  nuovi.
- Pool di sprite anche per i nemici, se servisse più performance dopo la
  wave 20.
