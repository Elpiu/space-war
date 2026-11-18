# Space War: Orbital Survivor · [Gioca](https://elpiu.github.io/space-war/)

La "Corsa allo Spazio" è finita male. L'orbita terrestre è una discarica sovraffollata e letale, piena di rottami di vecchie stazioni spaziali, satelliti spia impazziti e resti di flotte corporative che si sono annientate a vicenda. È il "Far West" del vuoto.

Nessuno sa chi abbia sparato il primo colpo, ma ora è una guerra di tutti contro tutti per le risorse rimaste. I "Raccoglitori" (Scavengers), i "Rimasugli Militari" (Remnants) e le AI di sorveglianza impazzite pattugliano un campo di detriti che cambia a ogni run.

## Missione del pilota

Sei un "Orbital Survivor", su una navicella fatta di pezzi recuperati. Sopravvivi un'altra ondata, raccogli abbastanza risorse per potenziare la nave e, forse, un giorno troverai un passaggio per uscire da questa orbita maledetta.

## Due modalità

- **Survival**: roguelite a wave infinite. Tomi al level-up, oggetti dalle chest, un boss ogni 5 wave; i crediti di fine run sbloccano contenuti nell'Hangar.
- **Campagna**: scegli la missione sulla mappa del settore e attraversa il corridoio fino all'uscita. Raccogli armi, sistemi, moduli e scafi, poi potenziali o vendili per monete.

## Come si gioca

| Tasto | Azione |
| --- | --- |
| WASD / frecce | Muovi la nave: il cannone spara da solo |
| Spazio | Scatto, con un istante di invulnerabilità |
| Q / E | Piazza una torretta o una mina (costano monete) |
| P | Pausa |
| M | Audio on/off |

- Raccogli le gemme, sali di livello e scegli un **tomo**: massimo 4 per run, e ognuno **si evolve** al livello 5.
- Le **chest** contengono oggetti: proiettili extra, rimbalzi, lame orbitanti, droni, fulmini a catena.
- Ogni 5 wave arriva un **boss** a tre fasi. Impara a leggere gli avvisi: linee rosse, laser di mira, cerchi d'innesco.
- I **crediti** di fine run sbloccano nuovi tomi e oggetti nell'Hangar.

Regole, nemici e numeri sono descritti in [docs/design.md](docs/design.md).

### 🎮 Demo (versione 1)

<img width="800" height="450" alt="video_clip" src="https://github.com/user-attachments/assets/7c87b1de-d0c3-44e1-aab7-3b3da01bf3cf" />

🍿 [Se la GIF non si carica, clicca qui!](https://raw.githubusercontent.com/Elpiu/space-war/main/clip_video.mp4)

## Sviluppo

Serve [Node.js](https://nodejs.org).

```bash
npm install
npm run dev      # http://localhost:8080, con console di debug sul tasto `
npm run build    # type-check + build di produzione in dist/
```

Il push su `main` pubblica il gioco su GitHub Pages. L'architettura è descritta in [docs/technical.md](docs/technical.md).

---

### 🛸 Credits & Attributions

**Engine e hosting.** [Phaser 4](https://phaser.io) e GitHub Pages.

**Codice.** Sviluppato in collaborazione con Codex, ChatGPT e Claude.

**Grafica.**
- La nave del pilota viene da Flaticon.
- Icone, pickup, difese e i nemici Kamikaze e Scudato sono SVG originali disegnati nel codice.
- Gli sprite degli altri nemici sono stati generati con Gemini e Qwen Image e scontornati con [remove.bg](https://www.remove.bg/upload).

**Audio.** Colonna sonora composta con Suno AI. Gli effetti sonori sono sintetizzati in tempo reale con WebAudio; i suoni di level-up e ricompensa vengono da Pixabay Sound Effects.

Grazie per aver giocato! Riprova una nuova run: il mercato non dorme mai.
