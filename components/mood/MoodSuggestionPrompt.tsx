"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMood } from "@/lib/mood-context";

/**
 * Compare solo quando un innesco configurato dall'utente scatta davvero (vedi
 * lib/mood-context.tsx, fireTrigger) — mai un elenco a caso: solo gli stati che TU hai
 * scelto per QUESTA interazione specifica, dalla scheda di gestione.
 */
export function MoodSuggestionPrompt() {
  const { pendingSuggestion, allMoods, confirmMood, dismissSuggestion } = useMood();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (!pendingSuggestion) return null;
  const candidates = pendingSuggestion.candidateMoodIds
    .map((id) => allMoods.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  if (candidates.length === 0) return null;

  const handlePick = (id: string) => {
    setConfirmingId(id);
    setTimeout(() => {
      confirmMood(id);
      setConfirmingId(null);
    }, 550);
  };

  const confirmingMood = candidates.find((m) => m.id === confirmingId);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-end justify-center bg-void-950/70 backdrop-blur-sm sm:items-center"
        onClick={() => !confirmingId && dismissSuggestion()}
      >
        {/* Lo stesso respiro di luce del passo finale del Wizard — non un effetto nuovo, la
           stessa grammatica visiva riusata per lo stesso tipo di momento: qualcosa che si
           conferma e si accende. */}
        <AnimatePresence>
          {confirmingMood && (
            <motion.div
              initial={{ opacity: 0, scale: 0.25 }}
              animate={{ opacity: 1, scale: 2.6 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none fixed inset-0 z-10"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${confirmingMood.color}88, ${confirmingMood.color}22 45%, transparent 70%)`,
              }}
            />
          )}
        </AnimatePresence>

        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: confirmingId ? 0 : 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong w-full max-w-sm rounded-t-xl3 p-6 sm:rounded-xl3"
        >
          <p className="text-center font-display text-lg text-ink-100">Ti Senti Così?</p>
          <div className="mt-6 flex flex-wrap justify-center gap-5">
            {candidates.map((m) => (
              <button
                key={m.id}
                onClick={() => handlePick(m.id)}
                disabled={Boolean(confirmingId)}
                className="flex flex-col items-center gap-2"
              >
                <span className="relative flex h-16 w-16 items-center justify-center">
                  <span
                    className="absolute inset-0 rounded-full blur-md animate-pulseSoft"
                    style={{ background: m.color, opacity: 0.6 }}
                    aria-hidden
                  />
                  <span
                    className="relative h-12 w-12 rounded-full border border-white/30"
                    style={{
                      background: `radial-gradient(circle at 35% 30%, ${m.color}, ${m.color}cc)`,
                      boxShadow: `0 0 20px ${m.color}aa`,
                    }}
                  />
                </span>
                <span className="text-xs text-ink-200">{m.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={dismissSuggestion}
            disabled={Boolean(confirmingId)}
            className="focus-ring mt-7 w-full text-center text-xs text-ink-800 hover:text-ink-400"
          >
            Non Ora
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
