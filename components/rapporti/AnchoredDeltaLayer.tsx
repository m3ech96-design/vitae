"use client";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

export interface AnchoredPulse {
  id: number;
  value: number;
  x: number;
  y: number;
}

/**
 * Stesso "+N"/"−N" che sale e sfuma di FloatingDelta.tsx (vedi rapporti/[id]), ma pensato per
 * vivere DENTRO un widget della Home invece che in una pagina a sé stante. FloatingDeltaLayer
 * è `absolute` dentro un genitore `relative`: dentro il widget Interazione Rapida, la fascia
 * "con te ora" scrolla con `overflow-y-auto` — un `absolute` lì dentro verrebbe tagliato
 * proprio come i fogli finiti "intrappolati nella card" (vedi PersonalCardSheet.tsx e il
 * Checkpoint 19/58 nel README). Per costruzione, non per toppa: questo layer esce sempre dal
 * DOM con un portal su `document.body` ed è `fixed` a coordinate di SCHERMO (x/y da
 * `getBoundingClientRect()` dell'icona toccata, non della card), quindi nessun antenato può
 * tagliarlo o intrappolarlo, qualunque scroll o overflow abbia nel mezzo.
 */
export function AnchoredDeltaLayer({ pulses }: { pulses: AnchoredPulse[] }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[70]">
      <AnimatePresence>
        {pulses.map((p) => (
          <motion.span
            key={p.id}
            initial={{ opacity: 0, y: 6, scale: 0.75 }}
            animate={{ opacity: [0, 1, 1, 0], y: -34, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut", times: [0, 0.15, 0.7, 1] }}
            className="absolute font-display text-lg"
            style={{
              left: p.x,
              top: p.y,
              transform: "translate(-50%, -50%)",
              color: p.value >= 0 ? "#00E5C7" : "#FF4D6D",
              textShadow: `0 0 12px ${p.value >= 0 ? "#00E5C799" : "#FF4D6D99"}`,
            }}
          >
            {p.value >= 0 ? `+${p.value}` : p.value}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}
