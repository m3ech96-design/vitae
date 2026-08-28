"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useIllness } from "@/lib/illness-context";
import { Button } from "../ui/Button";

/**
 * Minimo apposta: un campo libero, non un elenco di sintomi da spuntare — sarebbe già
 * troppo clinico per quello che vuole essere questa app. La stima dei giorni è facoltativa
 * e serve solo a decidere quando proporre l'unico promemoria gentile, mai un timer.
 */
export function IllnessSheet({ onClose }: { onClose: () => void }) {
  const { illness, setIllness, clearIllness } = useIllness();
  const [label, setLabel] = useState(illness?.label ?? "");
  const [days, setDays] = useState<string>(illness?.estimatedDays ? String(illness.estimatedDays) : "");

  const submit = () => {
    if (!label.trim()) return;
    const n = parseInt(days, 10);
    setIllness(label, Number.isFinite(n) && n > 0 ? n : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong w-full max-w-sm rounded-t-xl3 p-6 sm:rounded-xl3"
      >
        <div className="mb-5 flex items-center justify-between">
          <p className="font-display text-lg text-ink-100">{illness ? "Come Stai?" : "Non Ti Senti Bene?"}</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <label className="block">
          <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">Cosa C&apos;È</span>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Es. Raffreddore, Mal Di Testa…"
            className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100 placeholder:text-ink-800"
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">
            Quanto Pensi Ti Servirà (Facoltativo)
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="3"
              className="focus-ring w-24 rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100 placeholder:text-ink-800"
            />
            <span className="text-sm text-ink-600">Giorni — Solo Un Promemoria Per Te, Non Un Timer</span>
          </div>
        </label>

        <Button className="mt-6 w-full justify-center" onClick={submit} disabled={!label.trim()}>
          {illness ? "Aggiorna" : "Segna Come Non In Forma"}
        </Button>

        {illness && (
          <button
            onClick={() => {
              clearIllness();
              onClose();
            }}
            className="focus-ring mt-3 w-full text-center text-xs text-ink-800 hover:text-ink-400"
          >
            Sto Meglio, Rimuovi
          </button>
        )}
      </motion.div>
    </div>
  );
}
