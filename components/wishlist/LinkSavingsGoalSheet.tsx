"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Target } from "lucide-react";
import { motion } from "framer-motion";
import { SavingsGoal } from "@/lib/types";

/**
 * Elenco degli obiettivi di risparmio esistenti in Finanze, per scegliere a quale collegare
 * l'articolo — vedi il commento su `linkedSavingsGoalId` in lib/wishlist-types.ts per cosa
 * succede dopo la scelta (chi chiama `onSelect` sposta i fondi, questo foglio si limita a far
 * scegliere QUALE obiettivo).
 *
 * Esce sempre dal DOM con un portal su `document.body`, stesso motivo già noto di
 * ConfirmDialog.tsx: un discendente `position: fixed` dentro un antenato con
 * `overflow-hidden` (qui, WishlistItemSheet è un PersonalCardSheet) smette di essere
 * relativo al viewport su iOS Safari.
 */
export function LinkSavingsGoalSheet({
  goals,
  onSelect,
  onClose,
}: {
  goals: SavingsGoal[];
  onSelect: (goalId: string) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-void-950/90 backdrop-blur-md sm:items-center sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="glass sheen-top w-full max-w-sm rounded-t-xl3 border border-white/10 p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] sm:rounded-xl3"
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-sm text-ink-100">Collega a un obiettivo</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={16} />
          </button>
        </div>

        <p className="mb-4 text-xs text-ink-600">
          La quota di questo articolo diventerà quella dell&apos;obiettivo scelto — sempre aggiornata da sola, senza doverla
          tenere allineata a mano. I fondi già accantonati qui verranno spostati nell&apos;obiettivo.
        </p>

        {goals.length === 0 ? (
          <p className="py-6 text-center text-xs text-ink-800">Non hai ancora nessun obiettivo di risparmio in Finanze.</p>
        ) : (
          <div className="space-y-2">
            {goals.map((g) => (
              <button
                key={g.id}
                onClick={() => onSelect(g.id)}
                className="focus-ring flex w-full items-center gap-2.5 rounded-xl2 border border-white/10 bg-white/[0.03] px-3.5 py-3 text-left transition hover:border-aura-emerald/40"
              >
                <Target size={14} className="shrink-0 text-aura-emerald" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-100">{g.label}</p>
                  <p className="text-[11px] text-ink-800">
                    {g.currentAmount.toLocaleString("it-IT")}€ su {g.targetAmount.toLocaleString("it-IT")}€
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
}
