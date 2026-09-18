"use client";
import { useEffect } from "react";
import { useTiber } from "@/lib/tiber/context";
import { useTiberSettings } from "@/lib/tiber/settings-context";

const CHECK_INTERVAL_MS = 60 * 1000;

/**
 * Non decide più QUANDO dare a Tiber un momento di riflessione con un orologio scollegato
 * dai fatti (la versione precedente sceglieva a caso un intervallo tra 15 e 30 minuti) —
 * corretto secondo le istruzioni: anche un orologio casuale resta un programma imposto
 * dall'esterno, non un'occasione nata da qualcosa di vero. Qui si controlla spesso (ogni
 * minuto) e a COSTO ZERO se è successo qualcosa di nuovo — il controllo stesso è solo
 * lettura locale dei dati (vedi buildActivitySnapshot), nessuna chiamata a Gemini. Solo
 * quando c'è davvero qualcosa, triggerReflection (in lib/tiber/context.tsx) interpella
 * Gemini — e anche allora resta lui a decidere se dire qualcosa o restare in silenzio.
 * Chiamarlo ogni minuto costa quindi pochissimo: quasi sempre non trova nulla e si ferma
 * subito, prima di spendere nulla.
 */
export function TiberProactiveScheduler() {
  const { hydrated, apiKey, triggerReflection } = useTiber();
  const { hydrated: settingsHydrated, proactiveEnabled } = useTiberSettings();

  useEffect(() => {
    if (!hydrated || !settingsHydrated || !apiKey || !proactiveEnabled) return;
    const check = () => triggerReflection();
    const timeout = setTimeout(check, 5000);
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [hydrated, settingsHydrated, apiKey, proactiveEnabled, triggerReflection]);

  return null;
}
