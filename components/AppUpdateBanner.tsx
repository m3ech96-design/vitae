"use client";
import { RefreshCw, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppUpdate } from "@/lib/app-update-context";

/**
 * Prima ServiceWorkerRegister.tsx: registrava il service worker E disegnava il banner nello
 * stesso file, con lo stato "updateReady" chiuso lì dentro — nessun altro punto dell'app (es.
 * il pulsante "Cerca aggiornamenti" in Home) poteva raggiungerlo per innescare un controllo o
 * condividerne l'esito. Spostata tutta la logica in lib/app-update-context.tsx (AppUpdateProvider);
 * qui resta solo la parte visibile — lo stesso banner di sempre, aggiornato quando l'uno o
 * l'altro innescano un aggiornamento trovato.
 */
export function AppUpdateBanner() {
  const { updateReady, applyUpdate, dismiss } = useAppUpdate();
  return (
    <AnimatePresence>
      {updateReady && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="fixed inset-x-0 top-[max(env(safe-area-inset-top),1rem)] z-[60] flex justify-center px-4"
        >
          <div className="flex items-center gap-2.5 rounded-full border border-aura-cyan/40 bg-void-950/95 py-2 pl-4 pr-2 shadow-glow-cyan backdrop-blur-xl">
            <RefreshCw size={13} className="shrink-0 text-aura-cyan" />
            <p className="text-xs text-ink-100">Nuova versione pronta</p>
            <button
              onClick={applyUpdate}
              className="focus-ring shrink-0 rounded-full bg-aura-gradient px-3 py-1.5 text-[11px] font-medium text-void-950"
            >
              Aggiorna
            </button>
            <button
              onClick={dismiss}
              className="focus-ring flex h-6 w-6 shrink-0 items-center justify-center text-ink-800 hover:text-ink-200"
              aria-label="Ignora"
            >
              <X size={12} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
