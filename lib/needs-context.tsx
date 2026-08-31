"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { NEED_DURATION_DAYS } from "./needs-catalog";
import { newId } from "./id";

const NEEDS_KEY = "vitae:active-needs";
const DURATION_MS = NEED_DURATION_DAYS * 24 * 60 * 60 * 1000;

export interface ActiveNeed {
  id: string;
  label: string;
  startedAt: string;
}

interface NeedsContextValue {
  hydrated: boolean;
  needs: ActiveNeed[];
  addNeed: (label: string) => void;
  cancelNeed: (id: string) => void;
  /** true se esaudito con successo (esiste ancora ed entro i 7 giorni) — il chiamante
   * decide cosa fare con la celebrazione, questo contesto si limita a rimuoverlo. */
  fulfillNeed: (id: string) => boolean;
}

const NeedsContext = createContext<NeedsContextValue | null>(null);

export function NeedsProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [needs, setNeeds] = useState<ActiveNeed[]>([]);

  const persist = useCallback((next: ActiveNeed[]) => {
    setNeeds(next);
    try {
      window.localStorage.setItem(NEEDS_KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(NEEDS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ActiveNeed[];
        const now = Date.now();
        // Chi è scaduto da quando l'app era chiusa sparisce in silenzio, senza colpa —
        // non è un fallimento da segnalare, è solo passata la settimana.
        setNeeds(parsed.filter((n) => now - new Date(n.startedAt).getTime() < DURATION_MS));
      }
    } catch {
      // storage non disponibile o dati corrotti: riparte da una lista vuota
    }
    setHydrated(true);
  }, []);

  // Controlla ogni ora chi è scaduto — non serve più spesso, la finestra è di giorni.
  useEffect(() => {
    const id = setInterval(() => {
      setNeeds((cur) => {
        const now = Date.now();
        const alive = cur.filter((n) => now - new Date(n.startedAt).getTime() < DURATION_MS);
        if (alive.length !== cur.length) {
          try {
            window.localStorage.setItem(NEEDS_KEY, JSON.stringify(alive));
          } catch {
            // storage non disponibile: la lista in memoria resta comunque corretta
          }
        }
        return alive;
      });
    }, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const addNeed = useCallback(
    (label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      persist([...needs, { id: newId(), label: trimmed, startedAt: new Date().toISOString() }]);
    },
    [needs, persist]
  );

  const cancelNeed = useCallback(
    (id: string) => {
      persist(needs.filter((n) => n.id !== id));
    },
    [needs, persist]
  );

  const fulfillNeed = useCallback(
    (id: string) => {
      const exists = needs.some((n) => n.id === id);
      if (exists) persist(needs.filter((n) => n.id !== id));
      return exists;
    },
    [needs, persist]
  );

  return (
    <NeedsContext.Provider value={{ hydrated, needs, addNeed, cancelNeed, fulfillNeed }}>
      {children}
    </NeedsContext.Provider>
  );
}

export function useNeeds(): NeedsContextValue {
  const ctx = useContext(NeedsContext);
  if (!ctx) throw new Error("useNeeds deve essere usato dentro NeedsProvider");
  return ctx;
}
