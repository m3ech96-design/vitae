"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ActionPresentable, pickActionPhrase } from "@/lib/dialogue";

/**
 * Frase Azione (Modalità Vivo) mostrata sotto un profilo Vitaecom — il proprio o quello di
 * un account altrui, simmetricamente (vedi ProfileHeader, che sceglie quale dato passare).
 * Stessa meccanica di ActionLine (components/persone/ActionLine.tsx), che invece resta
 * riservata alle card di Mondo perché lì conta anche "Si Trova A [Luogo]" — un concetto
 * legato agli Impegni di una Persona, che qui non esiste.
 */
export function AccountActionLine({ account }: { account: ActionPresentable }) {
  const [text, setText] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    function cycle() {
      setText(pickActionPhrase(account));
      const t = setTimeout(cycle, 9000 + Math.random() * 7000);
      timers.current.push(t);
    }
    cycle();

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.liveModeEnabled, account.actionPhrase]);

  if (!text) return null;

  return (
    <div className="mt-1.5 h-4 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="truncate text-center font-body text-[11px] italic text-ink-600"
        >
          {text}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
