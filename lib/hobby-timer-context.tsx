"use client";
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

const STORAGE_KEY = "vitae:hobby-timer-v1";
const TICK_MS = 250;

interface StoredTimerState {
  hobbyId: string;
  hobbyName: string;
  blockId: string;
  blockTitle: string;
  running: boolean;
  accumulatedMs: number;
  /** Presente solo mentre running=true — istante da cui calcolare il tempo trascorso da
   * allora, invece di affidarsi a un intervallo che si fermerebbe alla chiusura della scheda
   * o al ricaricamento della pagina: ricalcolando da un timestamp reale, il cronometro torna
   * sempre corretto anche dopo una ricarica completa del browser. */
  startedAt: string | null;
}

interface HobbyTimerContextValue {
  hydrated: boolean;
  active: StoredTimerState | null;
  /** Millisecondi trascorsi, aggiornati a intervalli regolari mentre il cronometro è attivo
   * — calcolati sempre da `accumulatedMs` + `startedAt`, mai da un contatore proprio, per
   * restare corretti anche se il tab resta in background per un po' (dove i browser
   * rallentano i timer JS) e poi torna in primo piano. */
  elapsedMs: number;
  /** true solo se esiste già un cronometro attivo per un blocco DIVERSO da quello indicato
   * — un solo cronometro alla volta in tutta l'app, per restare un unico oggetto coerente
   * che la pillola flottante può sempre rappresentare senza ambiguità su quale dei tanti
   * mostrare. */
  isBlockedByOtherBlock: (blockId: string) => boolean;
  start: (hobbyId: string, hobbyName: string, blockId: string, blockTitle: string) => void;
  toggle: () => void;
  reset: () => void;
  /** Ferma il cronometro e restituisce i minuti trascorsi arrotondati, pronti per
   * `addMetricEntry` — svuota anche lo stato attivo, quindi la pillola sparisce subito dopo. */
  finishAndClear: () => number;
  /** Abbandona il cronometraggio corrente senza salvare nulla. */
  discard: () => void;
}

const HobbyTimerContext = createContext<HobbyTimerContextValue | null>(null);

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function computeElapsed(state: StoredTimerState | null): number {
  if (!state) return 0;
  if (!state.running || !state.startedAt) return state.accumulatedMs;
  return state.accumulatedMs + (Date.now() - new Date(state.startedAt).getTime());
}

export function HobbyTimerProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [active, setActive] = useState<StoredTimerState | null>(null);
  const [, forceTick] = useState(0);
  const activeRef = useRef<StoredTimerState | null>(null);
  activeRef.current = active;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setActive(JSON.parse(raw));
    } catch {
      // stato non leggibile: si riparte senza cronometro attivo
    } finally {
      setHydrated(true);
    }
  }, []);

  const persist = useCallback((next: StoredTimerState | null) => {
    setActive(next);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignorato
    }
  }, []);

  useEffect(() => {
    if (!active?.running) return;
    const id = setInterval(() => forceTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, [active?.running]);

  const isBlockedByOtherBlock = useCallback((blockId: string) => {
    const current = activeRef.current;
    return Boolean(current && current.blockId !== blockId);
  }, []);

  const start = useCallback(
    (hobbyId: string, hobbyName: string, blockId: string, blockTitle: string) => {
      const current = activeRef.current;
      if (current && current.blockId !== blockId) return;
      if (current && current.blockId === blockId) {
        if (!current.running) persist({ ...current, running: true, startedAt: new Date().toISOString() });
        return;
      }
      persist({ hobbyId, hobbyName, blockId, blockTitle, running: true, accumulatedMs: 0, startedAt: new Date().toISOString() });
    },
    [persist]
  );

  const toggle = useCallback(() => {
    const current = activeRef.current;
    if (!current) return;
    if (current.running) {
      persist({ ...current, running: false, accumulatedMs: computeElapsed(current), startedAt: null });
    } else {
      persist({ ...current, running: true, startedAt: new Date().toISOString() });
    }
  }, [persist]);

  const reset = useCallback(() => {
    const current = activeRef.current;
    if (!current) return;
    persist({ ...current, running: false, accumulatedMs: 0, startedAt: null });
  }, [persist]);

  const finishAndClear = useCallback((): number => {
    const current = activeRef.current;
    const ms = computeElapsed(current);
    persist(null);
    return Math.round((ms / 60000) * 100) / 100;
  }, [persist]);

  const discard = useCallback(() => {
    persist(null);
  }, [persist]);

  const value: HobbyTimerContextValue = {
    hydrated,
    active,
    elapsedMs: computeElapsed(active),
    isBlockedByOtherBlock,
    start,
    toggle,
    reset,
    finishAndClear,
    discard,
  };

  return <HobbyTimerContext.Provider value={value}>{children}</HobbyTimerContext.Provider>;
}

export function useHobbyTimer(): HobbyTimerContextValue {
  const ctx = useContext(HobbyTimerContext);
  if (!ctx) throw new Error("useHobbyTimer va usato dentro un HobbyTimerProvider");
  return ctx;
}
