# Ottimizzazione scroll /pagina-intro (conservativo)

Obiettivo: eliminare lo jank durante lo scroll senza cambiare l'aspetto visivo.

## Modifiche a `src/routes/pagina-intro.tsx`

### 1. Alleggerire i blob fissi di sfondo (righe 535–553)
- Ridurre da **4 blob a 2** (tengo il blob in alto a sinistra e quello in basso a destra, che sono i più visibili — rimuovo quello a metà destra e quello centrale).
- Ridurre dimensioni: 600→480 e 700→520.
- Aggiungere wrapper con `transform: translateZ(0)` e `willChange: "transform"` per promuoverli a layer GPU isolato → non vengono ricomposti durante lo scroll.
- Stessa promozione GPU per il container `circuit-bg`.

Risultato visivo: praticamente identico (i blob rimossi erano i meno visibili e si sovrappongono agli altri).

### 2. Rimuovere `backdrop-blur` dall'header sticky (righe 556–562)
- Rimuovere la classe `backdrop-blur`.
- Aumentare leggermente l'opacità del background da `rgba(7,11,20,0.7)` a `rgba(7,11,20,0.88)` per mantenere la leggibilità senza il blur.

Risultato visivo: l'header sarà leggermente più opaco ma la differenza è minima e il guadagno di performance è netto (il backdrop-filter su un elemento sticky è uno dei costi più alti per frame).

### 3. Rimuovere `drop-shadow` dall'icona falco nel navbar (righe 565–574)
Il filter `drop-shadow` su un elemento dentro un layer sticky viene ricalcolato a ogni frame. Lo sostituisco con un effetto glow più economico tramite `box-shadow` su un wrapper, oppure semplicemente lo rimuovo (l'icona resta visibile e leggibile sul background scuro).

Scelta: rimuovo il `drop-shadow` (l'icona ha già abbastanza presenza visiva grazie al colore cyan).

### 4. Rimuovere `scroll-behavior: smooth` globale (righe 521–527)
Rimuovo del tutto l'`useEffect` che imposta lo scroll smooth sul `documentElement`. Lo scroll nativo del browser (specialmente con trackpad/mouse wheel) è più fluido senza questo override, che introduce un easing artificiale che amplifica la sensazione di scatto quando un frame salta.

## Cosa NON cambio
- Tutte le animazioni `motion` scroll-driven (Reveal, ScrollRevealBlock, ProblemTimeline, ScrollTypewriter)
- Le animazioni `animate-pulse-glow`, `hero-float`, `animate-pulse` sui CTA e hero
- L'animazione `circuit-bg` (resta, ma il container viene promosso a layer GPU separato)
- I servizi, la timeline dei problemi, le sezioni "come funziona" e chiusura
- L'intero file `__root.tsx`, `styles.css`, e qualsiasi altro componente

## Risultato atteso
Riduzione drastica del costo per-frame durante lo scroll grazie a:
- Eliminazione del `backdrop-filter` ricalcolato a ogni frame (singolo guadagno più grande)
- 2 blob invece di 4, su layer GPU isolato → composizione molto più rapida
- Niente `drop-shadow` sull'header sticky
- Scroll nativo senza override CSS
