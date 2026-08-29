"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";

/**
 * Guscio comune per le finestre a foglio di tutta l'app (Stati D'Animo, Bisogni, Imprimi
 * Momento, commenti, la Vetrina...) — riusato invece di inventarne uno nuovo ogni volta.
 *
 * Bug corretto — dentro la card personale di Home il foglio restava schiacciato dentro la
 * card invece di coprire lo schermo, rendendo lo scroll del suo contenuto quasi impossibile
 * (pochi pixel di altezza reale a disposizione): la card è dentro un `<Reveal>`
 * (framer-motion, `animate={{ y: 0 }}`), e un'animazione che tocca `transform` lascia quella
 * proprietà impostata anche a riposo — anche `translateY(0px)` conta come "non none".
 * Qualunque discendente con `position: fixed` smette allora di essere relativo al viewport
 * ed è invece relativo a QUELL'antenato: `inset: 0` copriva la card, non lo schermo. Il
 * componente è condiviso da sei punti diversi dell'app, non tutti dentro un antenato con
 * transform — piuttosto che verificare ogni punto uno per uno (fragile: basta che una
 * futura sessione avvolga un'altra chiamata in un `Reveal` per far ripresentare lo stesso
 * bug altrove), il foglio esce sempre dal DOM con un portal su `document.body`: corretto
 * ovunque, per costruzione, non solo dove è stato segnalato.
 */
export function PersonalCardSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">{title}</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </motion.div>
    </div>,
    document.body
  );
}
