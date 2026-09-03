"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Flag, Check } from "lucide-react";
import { REPORT_REASONS, ReportReason } from "@/lib/vitaecom-social-types";

/**
 * "Segnala questo post" — un motivo tra quelli previsti (con un campo libero solo per
 * "Altro"), poi conferma: qui non esiste ancora un vero moderatore dall'altra parte, quindi
 * non promettiamo un "esito" della segnalazione — solo che è stata registrata, e che il post
 * intanto sparisce dal tuo Vitaeworld, come una cosa ragionevole da fare comunque.
 */
export function ReportPostSheet({ onSubmit, onClose }: { onSubmit: (reason: ReportReason, note?: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (!reason) return;
    onSubmit(reason, reason === "Altro" ? note : undefined);
    setSent(true);
    setTimeout(onClose, 1100);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong w-full max-w-sm overflow-hidden rounded-t-xl3 p-6 pb-[max(env(safe-area-inset-bottom),24px)] sm:rounded-xl3"
      >
        {sent ? (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-aura-emerald/15 text-aura-emerald">
              <Check size={20} />
            </span>
            <p className="mt-3 text-sm text-ink-200">Segnalazione registrata.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="flex items-center gap-2 font-display text-lg text-ink-100">
                <Flag size={16} className="text-aura-pink" /> Segnala post
              </p>
              <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-1.5">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`focus-ring flex w-full items-center justify-between rounded-xl2 border px-4 py-3 text-left text-sm transition ${
                    reason === r ? "border-aura-pink/50 bg-aura-pink/[0.08] text-ink-100" : "border-white/10 text-ink-300 hover:border-white/20"
                  }`}
                >
                  {r}
                  {reason === r && <Check size={14} className="text-aura-pink" />}
                </button>
              ))}
            </div>
            {reason === "Altro" && (
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Descrivi in breve…"
                rows={2}
                className="focus-ring mt-3 w-full resize-none rounded-xl2 border border-white/10 bg-white/[0.03] p-3 text-sm text-ink-100 placeholder:text-ink-800"
              />
            )}
            <button
              onClick={submit}
              disabled={!reason}
              className="focus-ring mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-aura-pink/50 bg-aura-pink/15 py-3 text-sm text-ink-100 transition disabled:opacity-40"
            >
              Invia segnalazione
            </button>
          </>
        )}
      </motion.div>
    </div>,
    document.body
  );
}
