"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { counterclockwisePerimeterPath } from "@/lib/perimeter-path";

/**
 * La sfera di reazione, corretta secondo le istruzioni originali (prima l'animazione era
 * un salto diagonale verso l'angolo, non un percorso lungo il contorno):
 * 1. Appare sovrapposta al contorno del post (la linea del bordo passa sotto di lei, non
 *    sopra — già vero di suo: la sfera è un elemento figlio, dipinto dopo il bordo del
 *    genitore, quindi già "sopra" senza bisogno di z-index).
 * 2. Cammina in senso antiorario lungo tutto il contorno (vedi lib/perimeter-path.ts per
 *    la geometria, verificata con un test dedicato).
 * 3. Vicino all'interruzione in alto a sinistra del Lato Stato, si dissolve mentre la
 *    striscia colorata prende il suo posto (LatoStato gestisce già il proprio impulso
 *    tramite `highlightMoodId`, sincronizzato dallo stesso timeout in PostCard.tsx).
 */
export function ReactionOrbit({
  color,
  width,
  height,
  startX,
  stopY,
  radius = 22,
  durationMs = 1600,
}: {
  color: string;
  width: number;
  height: number;
  startX: number;
  stopY: number;
  radius?: number;
  durationMs?: number;
}) {
  const [visible, setVisible] = useState(true);

  const path = useMemo(
    () => (width > 0 && height > 0 ? counterclockwisePerimeterPath(width, height, radius, startX, stopY) : []),
    [width, height, radius, startX, stopY]
  );

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), durationMs - 150);
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
      transition={{ duration: durationMs / 1000, ease: "linear", times: path.map((_, i) => i / (path.length - 1)) }}
      className="pointer-events-none absolute z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ background: color, boxShadow: `0 0 9px 2px ${color}cc, 0 0 3px ${color}` }}
    />
  );
}
