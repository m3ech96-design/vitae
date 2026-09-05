"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Target, PiggyBank } from "lucide-react";
import { motion } from "framer-motion";
import { SavingsGoal } from "@/lib/types";
import { WishlistItem } from "@/lib/wishlist-types";

/**
 * Scelta della destinazione a cui collegare l'articolo — sullo stesso piano, mai un default
 * dell'una sull'altra (vedi il commento su `linkedTo` in lib/wishlist-types.ts):
 * il salvadanaio generale delle Finanze, oppure uno dei suoi obiettivi di risparmio. Questo
 * foglio si limita a far scegliere QUALE; chi chiama `onSelect` sposta i fondi già
 * accantonati sull'articolo verso la destinazione scelta.
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
  onSelect: (linkedTo: NonNullable<WishlistItem["linkedTo"]>) => void;
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
          <p className="font-display text-sm text-ink-100">Collega a</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={16} />
          </button>
        </div>

        <p className="mb-4 text-xs text-ink-600">
          La quota di questo articolo diventerà quella della destinazione scelta — sempre aggiornata da sola, senza doverla
          tenere allineata a mano. I fondi già accantonati qui verranno spostati lì.
        </p>

        <div className="space-y-2">
          <button
            onClick={() => onSelect({ kind: "general" })}
            className="focus-ring flex w-full items-center gap-2.5 rounded-xl2 border border-white/10 bg-white/[0.03] px-3.5 py-3 text-left transition hover:border-aura-cyan/40"
          >
            <PiggyBank size={14} className="shrink-0 text-aura-cyan" />
            <p className="text-sm text-ink-100">Salvadanaio generale</p>
          </button>

          {goals.map((g) => (
            <button
              key={g.id}
              onClick={() => onSelect({ kind: "goal", goalId: g.id })}
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
      </motion.div>
    </div>,
    document.body
  );
}
