"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Compass } from "lucide-react";

/**
 * "Esplora Altro" su un account Vitaecom che non è il tuo. Scoperte/Rapporto
 * mostravano dati veri solo collegando l'account a una Persona di Mondo — un ponte
 * eliminato apposta: tenerlo vivo avrebbe tolto senso a scoprire man mano una persona che
 * oggi è ancora sconosciuta, e comunque avrebbe finto una seconda identità per la stessa
 * persona (una in Mondo, una in Persone). La direzione dichiarata è opposta — arrivare a
 * un'unica scheda "Persone" con la scoperta progressiva costruita sopra l'account stesso,
 * senza più "Mondo" a fianco — un lavoro suo, non qualcosa da improvvisare qui con un
 * ripiego che si sarebbe dovuto disfare subito dopo.
 *
 * Finché quell'unione non esiste, questo pannello resta onesto: dice cosa manca e perché,
 * invece di mostrare due schede vuote o dati presi in prestito da un'altra persona.
 */
export function ExploreProfileSheet({ nickname, onClose }: { accountId?: string; nickname: string; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="flex items-center justify-between px-6 pt-6">
          <span className="w-[18px]" />
          <p className="font-display text-sm text-ink-100">Esplora @{nickname}</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-7 text-center">
          <Compass size={22} className="mx-auto text-ink-800" />
          <p className="mt-3.5 text-sm text-ink-200">
            Scoperte e rapporto per @{nickname} arriveranno quando Mondo e persone diventeranno un&apos;unica
            scheda.
          </p>
          <p className="mt-2.5 text-xs text-ink-800">
            Fino ad allora restano dati tuoi solo per le persone che conosci offline, in Mondo — non un ponte verso
            questo account.
          </p>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
