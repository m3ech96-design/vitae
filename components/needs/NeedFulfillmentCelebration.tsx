"use client";
import { AnimatePresence, motion } from "framer-motion";

const RING_COLORS = ["#7C5CFF", "#00E5C7", "#FF6B9D", "#FFB454"];

/**
 * Ogni altro bloom dell'app (il Wizard, la conferma di uno stato) usa un solo colore che si
 * espande una volta. Questo ne usa quattro, sfalsati, in tutta la palette Aura — perché
 * "appagamento, felicità estrema" è più pieno di un singolo stato d'animo, ed è l'unico
 * momento dell'app che merita di sentirsi più grande di tutti gli altri.
 */
export function NeedFulfillmentCelebration({ label, onDone }: { label: string | null; onDone: () => void }) {
  return (
    <AnimatePresence onExitComplete={onDone}>
      {label && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center overflow-hidden"
        >
          {RING_COLORS.map((color, i) => (
            <motion.div
              key={color}
              initial={{ opacity: 0.55, scale: 0.15 }}
              animate={{ opacity: 0, scale: 3.4 }}
              transition={{ duration: 2, delay: i * 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="absolute rounded-full"
              style={{
                width: 280,
                height: 280,
                background: `radial-gradient(circle, ${color}66, ${color}22 55%, transparent 72%)`,
              }}
            />
          ))}
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ delay: 0.35, duration: 0.6, type: "spring", stiffness: 190, damping: 18 }}
            className="relative text-center"
          >
            <p className="font-display text-2xl text-ink-100">Bisogno esaudito</p>
            <p className="mt-1.5 text-sm text-ink-400">{label}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
