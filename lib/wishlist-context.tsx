"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { newId } from "./id";
import { WishlistItem, applyFundsDelta } from "./wishlist-types";
import { deleteImage, isDataUrl } from "./image-store";

const ITEMS_KEY = "vitae:wishlist-items";

interface WishlistContextValue {
  hydrated: boolean;
  items: WishlistItem[];
  addItem: (input: Omit<WishlistItem, "id" | "createdAt" | "savedAmount">) => WishlistItem;
  updateItem: (id: string, patch: Partial<Omit<WishlistItem, "id" | "createdAt">>) => void;
  removeItem: (id: string) => void;
  addFunds: (id: string, amount: number) => void;
  removeFunds: (id: string, amount: number) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ITEMS_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // dati locali non leggibili: si riparte da zero
    } finally {
      setHydrated(true);
    }
  }, []);

  /** Forma funzionale fin dal primo giorno — stesso standard ormai stabilito in tutto il
   * progetto (vedi food-context.tsx, health-context.tsx e la nota su household-context.tsx). */
  const persistItems = useCallback((updater: WishlistItem[] | ((prev: WishlistItem[]) => WishlistItem[])) => {
    setItems((prev) => {
      const next = typeof updater === "function" ? (updater as (v: WishlistItem[]) => WishlistItem[])(prev) : updater;
      try {
        window.localStorage.setItem(ITEMS_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const addItem = useCallback(
    (input: Omit<WishlistItem, "id" | "createdAt" | "savedAmount">) => {
      const item: WishlistItem = { ...input, id: newId(), createdAt: new Date().toISOString(), savedAmount: 0 };
      persistItems((prev) => [...prev, item]);
      return item;
    },
    [persistItems]
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<Omit<WishlistItem, "id" | "createdAt">>) =>
      persistItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it))),
    [persistItems]
  );

  const removeItem = useCallback(
    (id: string) => {
      const toRemove = items.find((it) => it.id === id);
      if (toRemove?.photoKey && !isDataUrl(toRemove.photoKey)) deleteImage(toRemove.photoKey);
      persistItems((prev) => prev.filter((it) => it.id !== id));
    },
    [persistItems, items]
  );

  // Aggiungere/togliere fondi in due scritture di fila (es. "correggo un importo sbagliato
  // appena inserito") deve leggere sempre lo stato più aggiornato — la stessa causa di bug
  // già vista e corretta più volte in questo progetto, evitata qui fin da subito.
  const addFunds = useCallback(
    (id: string, amount: number) =>
      persistItems((prev) => prev.map((it) => (it.id === id ? applyFundsDelta(it, amount) : it))),
    [persistItems]
  );

  const removeFunds = useCallback((id: string, amount: number) => addFunds(id, -amount), [addFunds]);

  const value = useMemo(
    () => ({ hydrated, items, addItem, updateItem, removeItem, addFunds, removeFunds }),
    [hydrated, items, addItem, updateItem, removeItem, addFunds, removeFunds]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist va usato dentro un WishlistProvider");
  return ctx;
}
