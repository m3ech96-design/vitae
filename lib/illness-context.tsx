"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ILLNESS_KEY = "vitae:illness";

export interface ActiveIllness {
  label: string;
  startedAt: string;
  /** Solo una nota per te stesso ("Penso Mi Servano 3 Giorni") — mai un timer che spegne
   * tutto da solo: serve solo a decidere quando proporre l'unico promemoria gentile. */
  estimatedDays?: number;
  /** Impostato la prima (e unica) volta che il promemoria viene mostrato — non torna più
   * finché non cambi tu qualcosa (nuova malattia, nuova stima). */
  remindedAt?: string;
}

interface IllnessContextValue {
  hydrated: boolean;
  illness: ActiveIllness | null;
  setIllness: (label: string, estimatedDays?: number) => void;
  clearIllness: () => void;
  markReminded: () => void;
  /** true una sola volta, quando la stima è passata e non è ancora stato chiesto nulla. */
  shouldAskHowAreYou: boolean;
}

const IllnessContext = createContext<IllnessContextValue | null>(null);

export function IllnessProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [illness, setIllnessState] = useState<ActiveIllness | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ILLNESS_KEY);
      if (raw) setIllnessState(JSON.parse(raw) as ActiveIllness);
    } catch {
      // storage non disponibile o dati corrotti: riparte da nessuna malattia attiva
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: ActiveIllness | null) => {
    setIllnessState(next);
    try {
      if (next) window.localStorage.setItem(ILLNESS_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(ILLNESS_KEY);
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  const setIllness = useCallback(
    (label: string, estimatedDays?: number) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      persist({ label: trimmed, startedAt: new Date().toISOString(), estimatedDays });
    },
    [persist]
  );

  const clearIllness = useCallback(() => persist(null), [persist]);

  const markReminded = useCallback(() => {
    if (!illness) return;
    persist({ ...illness, remindedAt: new Date().toISOString() });
  }, [illness, persist]);

  const shouldAskHowAreYou = Boolean(
    illness &&
      illness.estimatedDays &&
      !illness.remindedAt &&
      Date.now() - new Date(illness.startedAt).getTime() >= illness.estimatedDays * 86400000
  );

  return (
    <IllnessContext.Provider
      value={{ hydrated, illness, setIllness, clearIllness, markReminded, shouldAskHowAreYou }}
    >
      {children}
    </IllnessContext.Provider>
  );
}

export function useIllness(): IllnessContextValue {
  const ctx = useContext(IllnessContext);
  if (!ctx) throw new Error("useIllness deve essere usato dentro IllnessProvider");
  return ctx;
}
