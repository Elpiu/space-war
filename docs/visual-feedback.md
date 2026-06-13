# Visual Feedback

La direzione visiva deve puntare su energia, chiarezza e impatto. Space War deve diventare spettacolare, ma mai illeggibile.

## Obiettivi

- Far sentire ogni colpo e ogni esplosione.
- Rendere visibili pickup e ricompense.
- Comunicare chiaramente level-up, tomi, oggetti e rarita'.
- Distinguere nemici, proiettili, trappole e difese.
- Far percepire l'espansione della mappa.
- Mantenere leggibile la posizione della navicella.

## Elementi importanti

- proiettili luminosi;
- scie visibili;
- esplosioni rapide e leggibili;
- nemici che si frammentano o si dissolvono;
- pickup attratti verso la navicella;
- feedback chiaro quando si sale di livello;
- oggetti che cambiano aspetto o volume delle armi;
- settori che si accendono quando vengono scoperti;
- effetti distinti per torrette, mine, droni e trappole;
- boss grandi e riconoscibili.

## Leggibilita' durante il caos

Il giocatore deve sempre distinguere:

- la propria navicella;
- nemici pericolosi;
- proiettili nemici;
- pickup importanti;
- confini o forma del settore;
- ostacoli e hazard disponibili;
- difese piazzate.

Effetti troppo grandi, permanenti o saturi rischiano di coprire informazioni critiche. Preferire impatti brevi, scie pulite e colori differenziati.

## Feedback minimi per prototipo

- scia o effetto movimento navicella;
- flash o particella su sparo;
- effetto di hit sui nemici;
- esplosione o dissolvenza alla morte;
- pickup XP e monete distinguibili;
- attrazione pickup con scia;
- pausa breve con tre card tomo al level-up;
- toast non bloccante per oggetti ottenuti dalle chest;
- colori distinti per rarita' comune, non comune, rara e leggendaria;
- pickup speciali piu' grandi, bordati e colorati in base all'effetto;
- icona `health.png` per le cure;
- icona `magnet.png` per Magnet Overload;
- icona `venom.png` per Munizioni Venom;
- icona `treasure-chest.png` per le chest presenti nell'arena;
- `starship.png` come immagine della navicella giocabile;
- `doge-turret.png` come immagine della torretta piazzabile;
- icona della chest nel toast delle ricompense;
- immagini dedicate per inseguitore, sciame, corazzato e tiratore;
- ingombro massimo standard per archetipo senza deformare le proporzioni PNG;
- feedback al colpo relativo alla scala base, con espansione breve del `12%`;
- fallback ai pallini e marker colorati per i nemici senza immagine;
- variante boss casuale tra i file disponibili `boss1.png` ... `boss12.png`;
- immagini proiettile opzionali con schema `projectile-<tipo>.png` e
  `projectile-bossN.png`, con fallback ai proiettili colorati;
- alone colorato e pulsazione leggera per i pickup dotati di icona;
- timer HUD per Magnet Overload e Munizioni Venom;
- suono dedicato all'apertura della scelta level-up;
- suono dedicato alla ricompensa chest;
- pulsante reroll con gratuiti residui o costo corrente;
- overlay pausa con comando `P` chiaramente visibile;
- segnale visivo quando un nuovo settore appare;
- effetto diverso per torretta e trappola.
