export interface Point {
  x: number;
  y: number;
}

/**
 * Un punto lungo il perimetro di un rettangolo arrotondato, percorso in senso antiorario a
 * partire da un punto qualunque del lato inferiore — esattamente il percorso richiesto per
 * la sfera di reazione: "deve seguire la linea del contorno in senso antiorario, camminando
 * per tutto il post" fino a fermarsi vicino all'interruzione in alto a sinistra (dove inizia
 * il Lato Stato), non fino a un giro completo.
 *
 * Convenzione degli angoli: 0° punta a destra, 90° in basso, 180° a sinistra, 270° in alto
 * (coordinate schermo, y crescente verso il basso) — con questa convenzione un angolo che
 * DECRESCE corrisponde al movimento antiorario percepito da chi guarda lo schermo (verificato
 * lato per lato: a destra, salire è antiorario; in alto, andare verso sinistra è antiorario;
 * a sinistra, scendere è antiorario — esattamente l'ordine che genera questa funzione).
 *
 * `startX` è la posizione orizzontale di partenza sul lato inferiore (tipicamente dove si
 * trova il pulsante di reazione). `stopY` è dove il percorso si interrompe sul lato sinistro,
 * in prossimità dell'interruzione più vicina del Lato Stato.
 */
export function counterclockwisePerimeterPath(
  width: number,
  height: number,
  radius: number,
  startX: number,
  stopY: number,
  pointsPerCorner = 10
): Point[] {
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

  // 1. Lato inferiore, verso destra, dal punto di partenza fino all'angolo.
  pts.push({ x: clampedStartX, y: height });
  pts.push({ x: width - r, y: height });
  // 2. Angolo in basso a destra: da 90° a 0°.
  arc(width - r, height - r, 90, 0);
  // 3. Lato destro, verso l'alto.
  pts.push({ x: width, y: r });
  // 4. Angolo in alto a destra: da 0° a -90°.
  arc(width - r, r, 0, -90);
  // 5. Lato superiore, verso sinistra.
  pts.push({ x: r, y: 0 });
  // 6. Angolo in alto a sinistra: da -90° a -180°.
  arc(r, r, -90, -180);
  // 7. Lato sinistro, verso il basso, fino al punto di interruzione.
  pts.push({ x: 0, y: Math.max(r, stopY) });

  return pts;
}
