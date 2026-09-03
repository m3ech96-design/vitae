import { useState, useEffect, useCallback } from "react";
import { newId } from "./id";

/**
 * Hook di persistenza generico condiviso da ogni context che gestisce una lista di elementi
 * con id in localStorage (referti medici, vaccinazioni, farmaci, spese, ecc.).
 *
 * Prima esisteva definito identico, carattere per carattere, in medical-context.tsx e
 * animal-health-context.tsx — copiato invece che condiviso. Estratto qui: un solo posto da
 * mantenere per tutti i context che seguono questo stesso pattern load/save.
 *
 * Usa deliberatamente la forma funzionale di `setItems`/`persist` (mai lo stato catturato
 * dalla closure): due scritture di seguito nello stesso gestore di evento (es. due `add` in
 * fila) altrimenti si perderebbero a vicenda, perché entrambe partirebbero dallo stesso stato
 * "vecchio" catturato al momento della chiamata invece che dal risultato dell'una sull'altra.
 */
export function useCollection<T extends { id: string }>(key: string) {
  const [items, setItems] = useState<T[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setItems(JSON.parse(raw) as T[]);
    } catch {
      // dati corrotti: riparte da una lista vuota
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback(
    (updater: T[] | ((prev: T[]) => T[])) => {
      setItems((prev) => {
        const next = typeof updater === "function" ? (updater as (p: T[]) => T[])(prev) : updater;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // storage non disponibile: continua solo in memoria
        }
        return next;
      });
    },
    [key]
  );

  const add = useCallback((item: Omit<T, "id">) => persist((prev) => [...prev, { ...item, id: newId() } as T]), [persist]);
  const update = useCallback(
    (id: string, patch: Partial<Omit<T, "id">>) => persist((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    [persist]
  );
  const remove = useCallback((id: string) => persist((prev) => prev.filter((x) => x.id !== id)), [persist]);
  const removeWhere = useCallback((predicate: (item: T) => boolean) => persist((prev) => prev.filter((x) => !predicate(x))), [persist]);

  return { items, hydrated, add, update, remove, removeWhere };
}
