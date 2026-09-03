"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Person } from "@/lib/types";
import { pickActionPhrase } from "@/lib/dialogue";
import { currentEngagement } from "@/lib/presence";
import { usePlaces } from "@/lib/places-context";

/**
 * Riga di testo nella card, sotto le informazioni della persona — MAI nella nuvoletta.
 * "Si Trova A [Luogo]" (dagli Impegni) ha sempre precedenza sulle Azioni, come richiesto.
 * Font e transizione diversi apposta dalla Bolla di Dialogo: qui è una dissolvenza
 * incrociata in corsivo. È in flusso normale nel layout, quindi non copre mai nulla.
 */
export function ActionLine({ person }: { person: Person }) {
  const { places } = usePlaces();
  const [text, setText] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const engagement = currentEngagement(person);
    if (engagement?.linkedPlaceId) {
      const place = places.find((p) => p.id === engagement.linkedPlaceId);
      if (place) {
        setText(`Si trova a ${place.name}`);
        return;
      }
    }

    timers.current.forEach(clearTimeout);
    timers.current = [];

    function cycle() {
      if (currentEngagement(person)) return; // un impegno è scattato nel frattempo
      setText(pickActionPhrase(person));
      const t = setTimeout(cycle, 9000 + Math.random() * 7000);
      timers.current.push(t);
    }
    cycle();

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person.liveModeEnabled, person.actionPhrase, person.engagements, places]);

  if (!text) return null;

  return (
    <div className="h-4 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="truncate font-body text-[11px] italic text-ink-600"
        >
          {text}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
