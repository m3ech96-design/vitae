"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { newId } from "./id";
import { WishlistItem } from "./wishlist-types";
import { deleteImage, isDataUrl } from "./image-store";

const ITEMS_KEY = "vitae:wishlist-items";

interface WishlistContextValue {
  hydrated: boolean;
  items: WishlistItem[];
  addItem: (input: Omit<WishlistItem, "id" | "createdAt" | "savedAmount">) => WishlistItem;
  updateItem: (id: string, patch: Partial<Omit<WishlistItem, "id" | "createdAt">>) => void;
  removeItem: (id: string) => void;
  /**
   * Corretto secondo le istruzioni: il flusso versa/preleva NON è più bilaterale — un
   * articolo non ha più pulsanti +/- propri (rimossi `addFunds`/`removeFunds`), perché
   * versare o prelevare accade sempre in Finanze (salvadanaio generale o un obiettivo), mai
   * sull'articolo. Imposta/rimuove SOLO il riferimento alla destinazione: questo contesto
   * non vede FinanceContext (vedi app/layout.tsx, Wishlist è più esterno), quindi non può
   * lui stesso verificare che un obiettivo esista o spostare fondi. Chi collega/scollega
   * (nei componenti, che vedono entrambi i contesti) chiama questa funzione per il
   * riferimento, poi tiene `savedAmount` allineato con `setSavedAmount` qui sotto.
   */
  setLinkedTo: (id: string, linkedTo: WishlistItem["linkedTo"]) => void;
  /** Scrittura diretta di `savedAmount`, senza clamp su `price` — serve a tenere l'articolo
   * allineato al saldo reale della destinazione collegata (salvadanaio generale o un
   * obiettivo), che può legittimamente superare il prezzo dell'articolo: quel tetto riguarda
   * solo la vista wishlist, mai il dato vero in Finanze. Usata SOLO per un articolo
   * collegato e non ancora esaudito — vedi i componenti chiamanti. */
  setSavedAmount: (id: string, amount: number) => void;
  /** "Esaudisci" — l'articolo è stato acquistato. `amount` è quanto viene fissato per
   * sempre come `fulfilledAmount` (il prelievo vero dalla destinazione, con la sua voce in
   * cronologia, lo fa chi chiama — vedi WishlistItemSheet): da qui in poi la quota
   * dell'articolo resta ferma a questo importo, sganciata dalla destinazione. */
  fulfillItem: (id: string, amount: number) => void;
  /** Riapre un articolo già esaudito — resta collegato a quello che era prima
   * (`linkedTo` non cambia), ma la sua quota torna a seguire dal vivo la destinazione. */
  unfulfillItem: (id: string) => void;
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

  const setLinkedTo = useCallback(
    (id: string, linkedTo: WishlistItem["linkedTo"]) =>
      persistItems((prev) => prev.map((it) => (it.id === id ? { ...it, linkedTo } : it))),
    [persistItems]
  );

  const setSavedAmount = useCallback(
    (id: string, amount: number) =>
      persistItems((prev) => prev.map((it) => (it.id === id ? { ...it, savedAmount: Math.max(0, amount) } : it))),
    [persistItems]
  );

  const fulfillItem = useCallback(
    (id: string, amount: number) =>
      persistItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, fulfilledAmount: Math.max(0, amount), fulfilledAt: new Date().toISOString() } : it))
      ),
    [persistItems]
  );

  const unfulfillItem = useCallback(
    (id: string) =>
      persistItems((prev) => prev.map((it) => (it.id === id ? { ...it, fulfilledAmount: undefined, fulfilledAt: undefined } : it))),
    [persistItems]
  );

  const value = useMemo(
    () => ({ hydrated, items, addItem, updateItem, removeItem, setLinkedTo, setSavedAmount, fulfillItem, unfulfillItem }),
    [hydrated, items, addItem, updateItem, removeItem, setLinkedTo, setSavedAmount, fulfillItem, unfulfillItem]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist va usato dentro un WishlistProvider");
  return ctx;
}
