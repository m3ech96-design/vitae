"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { clockwisePerimeterPath, cumulativeDistanceFractions } from "@/lib/perimeter-path";

/**
 * La sfera di reazione:
 * 1. Appare sovrapposta al contorno del post (la linea del bordo passa sotto di lei, non
 *    sopra — già vero di suo: la sfera è un elemento figlio, dipinto dopo il bordo del
 *    genitore, quindi già "sopra" senza bisogno di z-index).
 * 2. Cammina in senso ORARIO (corretto secondo le istruzioni: eliminato il giro antiorario di
 *    quasi tutto il contorno) dal punto di reazione fino al primo angolo incontrato, quello in
 *    basso a sinistra — vedi lib/perimeter-path.ts per la geometria.
 * 3. Appena completato quell'angolo si dissolve — non prosegue più fino all'interruzione del
 *    Lato Stato in alto: il resto degli effetti (il Lato Stato che si accende nello stesso
 *    istante, gestito da PostCard.tsx) resta invariato.
 *
 * Velocità più lineare e stabile: i tempi di ogni punto sono ora proporzionali alla distanza
 * reale percorsa (vedi cumulativeDistanceFractions), non al suo indice nella lista — prima un
 * tratto dritto con pochi punti molto distanti e un angolo con molti punti ravvicinati
 * ricevevano la stessa quota di tempo per punto, facendo percepire la sfera più lenta sui
 * tratti dritti e più veloce negli angoli.
 */
export function ReactionOrbit({
  color,
  width,
  height,
  startX,
  radius = 22,
  durationMs = 700,
}: {
  color: string;
  width: number;
  height: number;
  startX: number;
  radius?: number;
  durationMs?: number;
}) {
  const [visible, setVisible] = useState(true);

  const path = useMemo(
    () => (width > 0 && height > 0 ? clockwisePerimeterPath(width, height, radius, startX) : []),
    [width, height, radius, startX]
  );
  const times = useMemo(() => cumulativeDistanceFractions(path), [path]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), durationMs - 100);
    return () => clearTimeout(t);
  }, [durationMs]);

  if (path.length === 0 || !visible) return null;

  return (
    <motion.span
      initial={{ left: path[0].x, top: path[0].y, opacity: 0, scale: 0.5 }}
      animate={{
        left: path.map((p) => p.x),
        top: path.map((p) => p.y),
        opacity: [0, ...Array(Math.max(0, path.length - 2)).fill(1), 0.4],
        scale: [0.5, ...Array(Math.max(0, path.length - 2)).fill(1), 0.85],
      }}
      transition={{ duration: durationMs / 1000, ease: "linear", times }}
      className="pointer-events-none absolute z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ background: color, boxShadow: `0 0 9px 2px ${color}cc, 0 0 3px ${color}` }}
    />
  );
}
