"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const PRESENT_KEY = "vitae:quick-interaction-present";
const RECENT_KEY = "vitae:quick-interaction-recent";
const MAX_RECENT = 3;

interface QuickInteractionContextValue {
  hydrated: boolean;
  /** Id delle persone "con te ora" — richiamate a mano, o dentro l'orario di una task che le
   * tagga (vedi useAutoRecallFromTasks in components/widgets/defs/quick-interaction-widget.tsx).
   * Un fatto solo di questo widget, non un dato della Persona: sparire da qui non tocca
   * `Person` in alcun modo, è solo "non più a portata di mano in questo momento". */
  presentIds: string[];
  /** Le ultime persone uscite con la X, più recente prima — al più MAX_RECENT, sempre
   * aggiornata quando qualcuno esce (vedi dismiss). Proposta pronta per richiamarle di
   * nuovo senza dover cercare. */
  recentIds: string[];
  recall: (id: string) => void;
  dismiss: (id: string) => void;
}

const QuickInteractionContext = createContext<QuickInteractionContextValue | null>(null);

export function QuickInteractionProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [presentIds, setPresentIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const rawPresent = window.localStorage.getItem(PRESENT_KEY);
      const rawRecent = window.localStorage.getItem(RECENT_KEY);
      if (rawPresent) setPresentIds(JSON.parse(rawPresent));
      if (rawRecent) setRecentIds(JSON.parse(rawRecent));
    } catch {
      // Stato vuoto se il salvataggio locale non è leggibile — non blocca il widget.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(PRESENT_KEY, JSON.stringify(presentIds));
    } catch {
      // Nessun blocco se lo storage non è scrivibile (es. modalità privata).
    }
  }, [presentIds, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(recentIds));
    } catch {
      // Come sopra.
    }
  }, [recentIds, hydrated]);

  const recall = useCallback((id: string) => {
    setPresentIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    // Richiamarla a mano la toglie anche dai "recenti": non ha senso proporla di nuovo come
    // "appena salutata" mentre è di nuovo con te.
    setRecentIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const dismiss = useCallback((id: string) => {
    setPresentIds((prev) => prev.filter((x) => x !== id));
    setRecentIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, MAX_RECENT));
  }, []);

  return (
    <QuickInteractionContext.Provider value={{ hydrated, presentIds, recentIds, recall, dismiss }}>
      {children}
    </QuickInteractionContext.Provider>
  );
}

export function useQuickInteraction(): QuickInteractionContextValue {
  const ctx = useContext(QuickInteractionContext);
  if (!ctx) throw new Error("useQuickInteraction va usato dentro QuickInteractionProvider");
  return ctx;
}
