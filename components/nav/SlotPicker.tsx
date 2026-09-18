"use client";
import { motion } from "framer-motion";
import { X, Check, ArrowLeftRight } from "lucide-react";
import clsx from "clsx";
import { ALL_NAV_ITEMS } from "@/lib/nav-slots";

/** Il foglio che si apre tenendo premuta una delle tre schede personalizzabili in barra (o
 * toccando uno slot dalla scheda Impostazioni, vedi app/impostazioni/page.tsx — stesso
 * componente, due punti d'accesso) — sceglie cosa mettere in quello slot tra TUTTE le altre
 * schede, comprese quelle già in barra negli altri due slot: sceglierne una lì scambia le due
 * posizioni invece di lasciarla semplicemente sparire, così ogni scheda in barra resta sempre
 * raggiungibile da qualche parte. Home e Impostazioni non sono mai tra le opzioni: restano
 * fissi, come richiesto.
 *
 * Estratto da components/BottomNav.tsx (dove viveva come funzione locale, non esportata) per
 * essere richiamabile anche dalla scheda Impostazioni — stesso identico comportamento, un solo
 * file da mantenere invece di due copie che rischierebbero di scollegarsi nel tempo. */
export function SlotPicker({
  current,
  otherSlots,
  onPick,
  onClose,
}: {
  current: string;
  /** Gli href occupati dagli ALTRI due slot in barra (non lo slot che si sta cambiando) —
   * serve solo per segnalare quali opzioni comportano uno scambio, non per escluderle. */
  otherSlots: string[];
  onPick: (href: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-void-950/85 backdrop-blur-md" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong w-full max-w-sm rounded-t-xl3 p-6 pb-[max(env(safe-area-inset-bottom),24px)]"
      >
        <div className="mb-5 flex items-center justify-between">
          <p className="font-display text-lg text-ink-100">Sostituisci scheda</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {ALL_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isCurrent = item.href === current;
            const isOtherSlot = otherSlots.includes(item.href);
            return (
              <button
                key={item.href}
                onClick={() => {
                  onPick(item.href);
                  onClose();
                }}
                className={clsx(
                  "focus-ring relative flex flex-col items-center gap-2 rounded-xl2 border py-5 text-center transition",
                  isCurrent ? "border-aura-violet/60 bg-aura-violet/10" : "border-white/10 bg-white/[0.02] hover:border-aura-violet/50"
                )}
              >
                {isOtherSlot && (
                  <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[9px] text-ink-400">
                    <ArrowLeftRight size={9} /> scambia
                  </span>
                )}
                <Icon size={20} className={isCurrent ? "text-aura-violet" : "text-aura-cyan"} />
                <span className="text-xs text-ink-100">{item.label}</span>
                {isCurrent && <Check size={12} className="text-aura-violet" />}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
