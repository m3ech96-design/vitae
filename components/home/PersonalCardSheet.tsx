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
 *
 * Secondo bug corretto, stesso principio "una volta sola, per costruzione" — l'altezza
 * massima del foglio (e di ogni altra finestra a foglio/modale dell'app, stesso pattern
 * `max-h-[..vh] flex flex-col overflow-hidden` + un `flex-1 overflow-y-auto` interno) era in
 * `vh`, l'unità calcolata sull'altezza dell'intero viewport "di layout": su telefono, quando
 * si apre la tastiera per scrivere in un campo, il viewport VISIBILE si restringe ma il
 * valore in `vh` resta quello di prima, quindi la finestra restava alta come se la tastiera
 * non ci fosse — la tastiera copriva campi e pulsante di conferma, e scorrere non serviva a
 * niente perché lo spazio scorribile calcolato era comunque quello "senza tastiera". L'unità
 * `dvh` (altezza dinamica del viewport) segue invece lo spazio davvero visibile in ogni
 * momento: stesso valore numerico, unità diversa, applicata in tutte le finestre con questo
 * pattern, non solo in quella segnalata (la Wishlist).
 *
 * Terzo bug corretto: il foglio esce dal DOM con un portal su `document.body`, ma resta
 * figlio, nell'ALBERO REACT, di chiunque lo apra — e React fa risalire gli eventi lungo
 * l'albero React, non lungo il DOM reale. Se chi apre il foglio (es. il pulsante Bisogni/Stati
 * D'Animo nella card personale di Home) è a sua volta dentro un antenato con un proprio
 * `onClick` (la card intera apre il "Resoconto"), qualunque click dentro il foglio — anche solo
 * per chiuderlo — risaliva fino a quell'antenato e apriva anche lui, insieme al foglio giusto.
 * Un `onClick` con `stopPropagation` sullo sfondo dell'intero foglio ferma la risalita qui,
 * una volta per tutti i sei punti che lo usano, non solo dove il doppio-apri è stato notato. */
export function PersonalCardSheet({
  title,
  onClose,
  children,
}: {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center"
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[85dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
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
