"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Person } from "@/lib/types";
import { pickDialoguePhrase } from "@/lib/dialogue";

/**
 * Nuvoletta ancorata all'avatar, riservata alle Frasi Ricorrenti (Modalità Dialogo).
 * Le Azioni non passano più da qui: vivono come riga di testo nella card (vedi ActionLine).
 * Va usata solo dentro un contenitore che NON ha overflow-hidden, altrimenti viene tagliata.
 */
export function DialogueBubble({ person }: { person: Person }) {
  const [text, setText] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [typed, setTyped] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    function scheduleNext(delay: number) {
      const t = setTimeout(cycle, delay);
      timers.current.push(t);
    }

    function cycle() {
      const phrase = pickDialoguePhrase(person);
      if (phrase) {
        setText(phrase);
        setVisible(true);
        const hideT = setTimeout(() => setVisible(false), 4600);
        timers.current.push(hideT);
        scheduleNext(4600 + 6000 + Math.random() * 6000);
      } else {
        scheduleNext(7000);
      }
    }

    scheduleNext(1500 + Math.random() * 3500);
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person.dialogModeEnabled, person.recurringPhrases]);

  useEffect(() => {
    if (!visible || !text) {
      setTyped("");
      return;
    }
    let i = 0;
    setTyped("");
    const id = setInterval(() => {
      i++;
      setTyped(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 26);
    return () => clearInterval(id);
  }, [visible, text]);

  return (
    <AnimatePresence>
      {visible && text && (
        <motion.div
          initial={{ opacity: 0, scale: 0.4, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.4, y: 6 }}
          transition={{ type: "spring", stiffness: 340, damping: 20 }}
          className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[150px] -translate-x-1/2"
        >
          <div className="rounded-2xl border border-aura-violet/30 bg-void-800/95 px-3 py-1.5 text-[11px] leading-snug text-ink-100 shadow-glow-sm">
            {typed}
          </div>
          <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-aura-violet/30 bg-void-800/95" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
