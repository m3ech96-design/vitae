"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { newId } from "../id";
import { PlacedWidget, WidgetSize } from "./types";

const PLACED_KEY = "vitae:home-widgets";

interface WidgetsContextValue {
  hydrated: boolean;
  placed: PlacedWidget[];
  /** False se quel widget di catalogo è già piazzato — "non possono essere inseriti due
   * widget uguali", come richiesto. */
  canAdd: (widgetId: string) => boolean;
  addWidget: (widgetId: string, size: WidgetSize) => void;
  removeWidget: (id: string) => void;
  resizeWidget: (id: string, size: WidgetSize) => void;
  /** Sposta un widget in una nuova posizione dell'elenco — la pressione lunga su una card
   * per posizionarla, come richiesto. */
  reorder: (fromIndex: number, toIndex: number) => void;
}

const WidgetsContext = createContext<WidgetsContextValue | null>(null);

export function WidgetsProvider({ children }: { children: React.ReactNode }) {
  const [placed, setPlaced] = useState<PlacedWidget[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PLACED_KEY);
      if (raw) setPlaced(JSON.parse(raw));
    } catch {
      // dati locali non leggibili: si riparte da zero
    } finally {
      setHydrated(true);
    }
  }, []);

  const persist = useCallback((updater: PlacedWidget[] | ((prev: PlacedWidget[]) => PlacedWidget[])) => {
    setPlaced((prev) => {
      const next = typeof updater === "function" ? (updater as (v: PlacedWidget[]) => PlacedWidget[])(prev) : updater;
      try {
        window.localStorage.setItem(PLACED_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const canAdd = useCallback((widgetId: string) => !placed.some((p) => p.widgetId === widgetId), [placed]);

  const addWidget = useCallback(
    (widgetId: string, size: WidgetSize) =>
      persist((prev) => (prev.some((p) => p.widgetId === widgetId) ? prev : [...prev, { id: newId(), widgetId, size }])),
    [persist]
  );

  const removeWidget = useCallback((id: string) => persist((prev) => prev.filter((p) => p.id !== id)), [persist]);

  const resizeWidget = useCallback(
    (id: string, size: WidgetSize) => persist((prev) => prev.map((p) => (p.id === id ? { ...p, size } : p))),
    [persist]
  );

  const reorder = useCallback(
    (fromIndex: number, toIndex: number) =>
      persist((prev) => {
        if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) return prev;
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      }),
    [persist]
  );

  const value = useMemo(
    () => ({ hydrated, placed, canAdd, addWidget, removeWidget, resizeWidget, reorder }),
    [hydrated, placed, canAdd, addWidget, removeWidget, resizeWidget, reorder]
  );

  return <WidgetsContext.Provider value={value}>{children}</WidgetsContext.Provider>;
}

export function useWidgets(): WidgetsContextValue {
  const ctx = useContext(WidgetsContext);
  if (!ctx) throw new Error("useWidgets va usato dentro un WidgetsProvider");
  return ctx;
}
