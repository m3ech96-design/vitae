"use client";
import { useEffect } from "react";

/**
 * Causa reale trovata dietro "l'icona dell'app è sparita": il service worker aggiorna la
 * sua cache solo quando il browser rileva che sw.js è cambiato byte per byte, e i browser
 * controllano questo raramente da soli (specie le PWA installate su iOS) — un asset rimasto
 * in cache resta lì per mesi senza che nessuno lo richiami mai a rinfrescarsi. Oltre ad aver
 * cambiato il nome della cache in sw.js (vedi lì), qui chiediamo esplicitamente un controllo
 * aggiornamento subito alla registrazione e ogni volta che l'app torna in primo piano — non
 * si aspetta più che il browser se ne accorga per conto suo quando gli va.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        registration = reg;
        reg.update().catch(() => {});
      })
      .catch(() => {});

    const onVisible = () => {
      if (document.visibilityState === "visible") registration?.update().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  return null;
}
