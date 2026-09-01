/**
 * Un fronte d'onda per la superficie del liquido — un percorso SVG chiuso che riempie
 * tutto sotto la linea ondulata, campionata a più punti per restare morbida. `phase` è un
 * valore continuo (non solo 0/1): tenendolo crescere all'infinito nell'animazione, l'onda
 * scorre sempre nella stessa direzione invece di limitarsi ad oscillare avanti e indietro —
 * molto più vicino a un liquido vero che si muove.
 */
export function wavePath(phase: number, amplitude: number, viewWidth = 100, viewHeight = 10, baseline = 5, steps = 24): string {
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = t * viewWidth;
    // Due frequenze sovrapposte, non una sola: un'onda pura sarebbe troppo regolare per
    // sembrare acqua vera.
    const y =
      baseline +
      Math.sin(t * Math.PI * 2 * 2 + phase * Math.PI * 2) * amplitude +
      Math.sin(t * Math.PI * 2 * 3.3 + phase * Math.PI * 2 * 1.6) * amplitude * 0.35;
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M0,${viewHeight} L${points.join(" L")} L${viewWidth},${viewHeight} Z`;
}
