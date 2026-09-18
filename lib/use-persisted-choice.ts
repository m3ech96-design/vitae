"use client";
import { useCallback, useEffect, useState } from "react";

/**
 * Ricorda una scelta testuale (vista, ordinamento...) tra un elenco chiuso di opzioni valide,
 * da una sessione all'altra — introdotta perché più schede (Task, Wishlist, Liste e note,
 * Mappa) avevano un selettore di vista o ordinamento perfettamente funzionante ma MAI
 * persistito: si ripartiva sempre dal default a ogni apertura della scheda, costringendo a
 * rifare la stessa scelta ogni volta. Non tutto merita un intero *-context.tsx con la sua
 * storia di funzioni dedicate quando è un solo valore isolato — questo hook generico copre
 * esattamente quel caso, con la stessa forma (stato + idratazione + scrittura localStorage)
 * degli altri context dell'app, solo senza il giro di createContext/Provider per un singolo
 * valore per pagina.
 *
 * Un valore salvato che non è più tra le opzioni valide passate (es. una vista rimossa in un
 * aggiornamento futuro) ripiega sul default invece di rompere la pagina — stessa cautela già
 * applicata a `useNavSlots` per gli href non più validi.
 *
 * Elencate in Impostazioni → "Viste predefinite" (vedi app/impostazioni/page.tsx) insieme a
 * un pulsante "Reimposta" per scheda — la scelta resta comunque modificabile, più comodamente,
 * direttamente dai controlli già presenti in ciascuna pagina.
 */
export function usePersistedChoice<T extends string>(key: string, defaultValue: T, validValues: readonly T[]) {
  const [value, setValueState] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw && (validValues as readonly string[]).includes(raw)) setValueState(raw as T);
    } catch {
      // dati locali non leggibili: resta il default
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback(
    (v: T) => {
      setValueState(v);
      try {
        window.localStorage.setItem(key, v);
      } catch {
        // ignorato
      }
    },
    [key]
  );

  return [value, setValue, hydrated] as const;
}
