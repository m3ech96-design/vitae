"use client";
import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Causa reale trovata dietro "l'icona dell'app è sparita": il service worker aggiorna la
 * sua cache solo quando il browser rileva che sw.js è cambiato byte per byte, e i browser
 * controllano questo raramente da soli (specie le PWA installate su iOS) — un asset rimasto
 * in cache resta lì per mesi senza che nessuno lo richiami mai a rinfrescarsi. Oltre ad aver
 * cambiato il nome della cache in sw.js (vedi lì), qui chiediamo esplicitamente un controllo
 * aggiornamento subito alla registrazione e ogni volta che l'app torna in primo piano — non
 * si aspetta più che il browser se ne accorga per conto suo quando gli va.
 *
 * Corretto secondo le istruzioni: prima l'aggiornamento restava tutto invisibile — il nuovo
 * service worker prendeva il controllo da solo in background (skipWaiting + clients.claim,
 * vedi sw.js), ma senza che l'utente lo sapesse mai: poteva continuare a vedere contenuto
 * vecchio per un giro in più, o non avere alcun segnale che un nuovo checkpoint pubblicato su
 * Vercel fosse già arrivato sul dispositivo. `controllerchange` scatta esattamente nel
 * momento in cui un nuovo service worker prende il posto di quello vecchio — qui si trasforma
 * quel momento in un avviso concreto, con un tocco per ricaricare subito.
 */
export function ServiceWorkerRegister() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;
    // Se la pagina è già controllata da un service worker quando questo effetto parte, un
    // cambio di controller più avanti è un vero aggiornamento da segnalare. Alla primissima
    // registrazione in assoluto (nessun controller ancora) lo stesso evento può scattare per
    // la sola installazione iniziale, che non è un aggiornamento — niente banner in quel caso.
    const hadControllerAlready = Boolean(navigator.serviceWorker.controller);

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        registration = reg;
        reg.update().catch(() => {});
      })
      .catch(() => {});

    const onControllerChange = () => {
      if (hadControllerAlready) setUpdateReady(true);
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const onVisible = () => {
      if (document.visibilityState === "visible") registration?.update().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

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
              onClick={() => window.location.reload()}
              className="focus-ring shrink-0 rounded-full bg-aura-gradient px-3 py-1.5 text-[11px] font-medium text-void-950"
            >
              Aggiorna
            </button>
            <button
              onClick={() => setUpdateReady(false)}
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
