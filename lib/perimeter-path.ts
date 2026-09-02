export interface Point {
  x: number;
  y: number;
}

/**
 * Un punto lungo il perimetro di un rettangolo arrotondato, percorso in senso orario a
 * partire da un punto qualunque del lato inferiore, fino al primo angolo incontrato in quella
 * direzione — non più un giro quasi completo del contorno. Corretto secondo le istruzioni:
 * eliminato il concetto di giro antiorario, la sfera ora percorre solo il tratto dal punto di
 * reazione al primo angolo (in basso a sinistra) e lì si dissolve.
 *
 * Convenzione degli angoli: 0° punta a destra, 90° in basso, 180° a sinistra, 270° in alto
 * (coordinate schermo, y crescente verso il basso) — con questa convenzione un angolo che
 * CRESCE corrisponde al movimento orario percepito da chi guarda lo schermo (sul lato
 * inferiore, andare verso sinistra è orario; nell'angolo in basso a sinistra, da 90° a 180° è
 * orario — l'opposto esatto della vecchia funzione antioraria).
 *
 * `startX` è la posizione orizzontale di partenza sul lato inferiore (tipicamente dove si
 * trova il pulsante di reazione).
 */
export function clockwisePerimeterPath(width: number, height: number, radius: number, startX: number, pointsPerCorner = 10): Point[] {
  const r = Math.max(4, Math.min(radius, width / 2 - 1, height / 2 - 1));
  const pts: Point[] = [];

  const arc = (cx: number, cy: number, fromDeg: number, toDeg: number) => {
    for (let i = 1; i <= pointsPerCorner; i++) {
      const t = fromDeg + ((toDeg - fromDeg) * i) / pointsPerCorner;
      const rad = (t * Math.PI) / 180;
      pts.push({ x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) });
    }
  };

  const clampedStartX = Math.min(Math.max(startX, r), width - r);

  // 1. Lato inferiore, verso sinistra, dal punto di partenza fino al primo angolo.
  pts.push({ x: clampedStartX, y: height });
  pts.push({ x: r, y: height });
  // 2. Angolo in basso a sinistra: da 90° a 180° — appena completato, la sfera si dissolve.
  arc(r, height - r, 90, 180);

  return pts;
}

/** Lunghezza cumulativa lungo un percorso a partire dal primo punto, normalizzata da 0 a 1 —
 * un punto ogni 0 (partenza) a 1 (arrivo). Usata per assegnare a ogni punto del percorso una
 * quota di tempo proporzionale alla distanza reale da percorrere, non al suo indice nella
 * lista: i tratti dritti hanno pochi punti molto distanti tra loro, gli angoli molti punti
 * ravvicinati, quindi un tempo assegnato per indice farebbe accelerare e rallentare la sfera
 * in modo innaturale. Con la distanza reale la velocità resta lineare e stabile lungo tutto
 * il tragitto, come richiesto. */
export function cumulativeDistanceFractions(points: Point[]): number[] {
  if (points.length === 0) return [];
  const distances: number[] = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    distances.push(total);
  }
  if (total === 0) return points.map((_, i) => i / Math.max(1, points.length - 1));
  return distances.map((d) => d / total);
}
