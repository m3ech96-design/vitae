"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

/**
 * Fa apparire il contenuto con una dissolvenza e un piccolo scivolamento verso l'alto,
 * invece di comparire di colpo — usato per scaglionare l'ingresso delle sezioni di una
 * pagina (`delay` crescente per ciascuna) così la pagina si "accende" pezzo per pezzo
 * invece di apparire tutta insieme e ferma. Nessuna modifica a colori, forme o layout:
 * solo il movimento con cui il contenuto già esistente entra in scena.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
