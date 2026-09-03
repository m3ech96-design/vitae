"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { NEWS_SOURCES } from "./news-sources-catalog";

const STORAGE_KEY = "vitae:news-selected-sources";

interface NewsSourcesContextValue {
  hydrated: boolean;
  /** Nessuna fonte selezionata di default — punto esplicito delle istruzioni: l'app non deve
   * scegliere lei le notizie da mostrare. Finché l'utente non ne sceglie almeno una, la
   * schermata News resta vuota con un invito a farlo, mai riempita da un default scelto qui. */
  selectedIds: string[];
  isSelected: (id: string) => boolean;
  toggleSource: (id: string) => void;
  selectAllInCategory: (categoryId: string) => void;
  clearCategory: (categoryId: string) => void;
}

const NewsSourcesContext = createContext<NewsSourcesContextValue | null>(null);

export function NewsSourcesProvider({ children }: { children: React.ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSelectedIds(JSON.parse(raw));
    } catch {
      // ignorato — resta la selezione vuota di default
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((updater: string[] | ((prev: string[]) => string[])) => {
    setSelectedIds((prev) => {
      const next = typeof updater === "function" ? (updater as (v: string[]) => string[])(prev) : updater;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds]);

  const toggleSource = useCallback(
    (id: string) => persist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [persist]
  );

  const selectAllInCategory = useCallback(
    (categoryId: string) => {
      const idsInCategory = NEWS_SOURCES.filter((s) => s.category === categoryId).map((s) => s.id);
      persist((prev) => [...new Set([...prev, ...idsInCategory])]);
    },
    [persist]
  );

  const clearCategory = useCallback(
    (categoryId: string) => {
      const idsInCategory = new Set(NEWS_SOURCES.filter((s) => s.category === categoryId).map((s) => s.id));
      persist((prev) => prev.filter((id) => !idsInCategory.has(id)));
    },
    [persist]
  );

  const value = useMemo(
    () => ({ hydrated, selectedIds, isSelected, toggleSource, selectAllInCategory, clearCategory }),
    [hydrated, selectedIds, isSelected, toggleSource, selectAllInCategory, clearCategory]
  );

  return <NewsSourcesContext.Provider value={value}>{children}</NewsSourcesContext.Provider>;
}

export function useNewsSources(): NewsSourcesContextValue {
  const ctx = useContext(NewsSourcesContext);
  if (!ctx) throw new Error("useNewsSources va usato dentro un NewsSourcesProvider");
  return ctx;
}
