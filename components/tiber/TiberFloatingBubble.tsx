"use client";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useTiber } from "@/lib/tiber/context";

/**
 * Rende visibile ovunque nell'app l'ultimo commento spontaneo di Tiber non ancora letto —
 * "presente in modo globale, non solo nella Home" come richiesto esplicitamente. Il testo
 * vero vive nel context (TiberProvider, montato una volta nel layout radice, vedi
 * lib/tiber/context.tsx e triggerReflection lì dentro): questa bolla ne è solo una vetrina,
 * sparisce da sola non appena l'utente apre la pagina di Tiber (che segna tutto come "visto"
 * al montaggio) o quando la si tocca per aprirla direttamente da qui.
 *
 * Sul lato sinistro apposta, non destro: la pillola del cronometro Hobby (vedi
 * FloatingHobbyTimerPill.tsx) occupa già quel lato quando un cronometro è attivo — le due
 * non devono mai sovrapporsi, e possono benissimo essere visibili entrambe insieme.
 */
export function TiberFloatingBubble() {
  const router = useRouter();
  const pathname = usePathname();
  const { hydrated, apiKey, latestUnseenProactive, markProactiveSeen } = useTiber();

  if (!hydrated || !apiKey || !latestUnseenProactive || pathname === "/tiber") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 8 }}
        className="fixed left-4 z-[45] bottom-[calc(env(safe-area-inset-bottom)+84px)]"
      >
        <button
          onClick={() => router.push("/tiber")}
          className="focus-ring glass-nav flex max-w-[75vw] items-start gap-2 rounded-2xl py-2.5 pl-3 pr-2 text-left shadow-glass sm:max-w-sm"
        >
          <Sparkles size={14} className="mt-0.5 shrink-0 text-aura-violet" />
          <p className="line-clamp-2 min-w-0 text-xs text-ink-100">{latestUnseenProactive.text}</p>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              markProactiveSeen();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                markProactiveSeen();
              }
            }}
            className="focus-ring flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink-700 hover:text-ink-200"
            aria-label="Ignora"
          >
            <X size={12} />
          </span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
