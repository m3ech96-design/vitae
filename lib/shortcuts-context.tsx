"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { SHORTCUT_CATALOG } from "./shortcuts-catalog";

const KEY = "vitae:home-shortcuts";

/** Le quattro voci che vivevano fisse nella Home prima che "Scorciatoie" diventasse un
 * widget spostabile — di default per chi non ha ancora scelto nulla, così il primo giro
 * mostra comunque qualcosa invece di un widget vuoto appena aggiunto. */
const DEFAULT_HREFS = ["/salute", "/attivita-peso", "/finanze", "/rapporti"];

interface ShortcutsContextValue {
  hydrated: boolean;
  /** Gli href scelti, nell'ordine in cui compaiono nel widget. */
  hrefs: string[];
  addShortcut: (href: string) => void;
  removeShortcut: (href: string) => void;
}

const ShortcutsContext = createContext<ShortcutsContextValue | null>(null);

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [hrefs, setHrefs] = useState<string[]>(DEFAULT_HREFS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setHrefs(JSON.parse(raw));
    } catch {
      // dati locali non leggibili: restano i default
    } finally {
      setHydrated(true);
    }
  }, []);

  const persist = useCallback((updater: string[] | ((prev: string[]) => string[])) => {
    setHrefs((prev) => {
      const next = typeof updater === "function" ? (updater as (v: string[]) => string[])(prev) : updater;
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const addShortcut = useCallback(
    (href: string) => persist((prev) => (prev.includes(href) ? prev : [...prev, href])),
    [persist]
  );
  const removeShortcut = useCallback((href: string) => persist((prev) => prev.filter((h) => h !== href)), [persist]);

  const value = useMemo(
    () => ({ hydrated, hrefs, addShortcut, removeShortcut }),
    [hydrated, hrefs, addShortcut, removeShortcut]
  );

  return <ShortcutsContext.Provider value={value}>{children}</ShortcutsContext.Provider>;
}

export function useShortcuts(): ShortcutsContextValue {
  const ctx = useContext(ShortcutsContext);
  if (!ctx) throw new Error("useShortcuts va usato dentro uno ShortcutsProvider");
  return ctx;
}

export { SHORTCUT_CATALOG };
