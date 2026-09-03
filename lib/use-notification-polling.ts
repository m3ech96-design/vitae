"use client";
import { useEffect, useRef } from "react";

/**
 * Scheletro comune ai quattro *Notifier dell'app (Task, Medication, Engagement, Animal):
 * un controllo ogni minuto mentre l'app è aperta, con la stessa guardia sul permesso di
 * notifica e lo stesso limite onesto mai nascosto — una vera notifica push che arriva anche
 * ad app chiusa richiederebbe un service worker con un abbonamento push e un server dietro a
 * inviarla, che questa app non ha.
 *
 * Non impone la logica di dominio (quali elementi controllare, quando "sono scattati") né la
 * strategia di dedup: i quattro notifier usano due strategie diverse per un motivo reale, non
 * per disattenzione — TaskNotifier ed EngagementNotifier persistono un flag `reminded` sul
 * record stesso, adatto a un evento singolo con un'identità propria; MedicationNotifier e
 * AnimalNotifier usano un `Set` effimero in memoria con chiave sintetica `id-orario-data`,
 * necessario per orari ricorrenti ogni giorno dove non esiste un singolo record a cui
 * attaccare un flag "già notificato oggi" senza doverlo resettare manualmente ogni mezzanotte.
 * Forzare tutti sulla stessa strategia romperebbe la correttezza in almeno uno dei due casi —
 * questo hook lascia entrambe le strade aperte, unifica solo il timer e la guardia.
 *
 * `check` viene tenuto sempre aggiornato tramite ref (chiusura "sempre fresca"): l'effetto
 * che monta l'interval non dipende da `check` stesso, quindi il chiamante non deve passare un
 * array di dipendenze a parte — un dettaglio che, se dimenticato o incompleto, sarebbe un bug
 * silenzioso difficile da notare (il controllo continuerebbe a girare con dati non aggiornati).
 */
export function useNotificationPolling(check: () => void) {
  const checkRef = useRef(check);
  checkRef.current = check;

  useEffect(() => {
    const run = () => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      checkRef.current();
    };
    run();
    const id = setInterval(run, 60000);
    return () => clearInterval(id);
  }, []);
}
