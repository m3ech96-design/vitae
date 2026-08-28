"use client";
import { AnimatePresence, motion } from "framer-motion";

export interface DeltaPulse {
  id: number;
  value: number;
}

/**
 * Il "+N"/"−N" che sale e sfuma quando applichi un'interazione — rende visibile l'effetto
 * del tocco nel momento stesso in cui lo fai, invece di doverlo dedurre da un numero che è
 * cambiato altrove nella pagina un istante dopo.
 */
export function FloatingDeltaLayer({ pulses }: { pulses: DeltaPulse[] }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center overflow-visible">
      <AnimatePresence>
        {pulses.map((p) => (
          <motion.span
            key={p.id}
            initial={{ opacity: 0, y: 6, scale: 0.75 }}
            animate={{ opacity: [0, 1, 1, 0], y: -34, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut", times: [0, 0.15, 0.7, 1] }}
            className="absolute font-display text-lg"
            style={{ color: p.value >= 0 ? "#00E5C7" : "#FF4D6D", textShadow: `0 0 12px ${p.value >= 0 ? "#00E5C799" : "#FF4D6D99"}` }}
          >
            {p.value >= 0 ? `+${p.value}` : p.value}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
