"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { newId } from "./id";
import { deleteImage, isDataUrl } from "./image-store";
import { Person, PersonKind } from "./types";

const PRODUCTS_KEY = "vitae:animal-food-products";

/** Sotto quale percentuale di porzioni rimaste scatta l'avviso di scorta in esaurimento —
 * fissa (non configurabile per prodotto), come da richiesta esplicita ("es. 20%"). */
export const LOW_STOCK_THRESHOLD = 0.2;

export type FoodScope =
  | { type: "animal"; animalId: string }
  | { type: "animals"; animalIds: string[] }
  | { type: "species"; species: PersonKind };

export interface FoodProduct {
  id: string;
  name: string;
  brand?: string;
  /** Testo libero, solo descrittivo — "1,5 kg", "24 lattine da 85 g" — non entra nel calcolo
   * delle porzioni, che usa unitsTotal/portionsPerUnit qui sotto. */
  quantity?: string;
  imageKey?: string;
  /** Quante unità fisiche compongono la confezione: 1 per una busta di crocchette (un solo
   * pacco = un intero), 24 per una scatola di lattine di umido. Insieme a portionsPerUnit
   * copre sia il caso "pacco singolo" sia quello "unità multiple" richiesto. */
  unitsTotal: number;
  /** Quante porzioni dà ciascuna unità — es. 40 scoop per l'intera busta (unitsTotal=1), o 1
   * porzione per lattina (unitsTotal=24). */
  portionsPerUnit: number;
  /** Un solo contatore totale invece di uno stato per ogni singola unità aperta — scelta di
   * semplicità: "quante scatolette restano" si mostra come valore derivato (vedi
   * remainingUnitsDisplay), non tracciato unità per unità. */
  portionsRemaining: number;
  scope: FoodScope;
  /** Segnabile anche prima che le porzioni arrivino a 0 (il prodotto può rompersi, scadere,
   * o semplicemente l'utente lo sa già) — resta comunque cliccabile, solo oscurato, per poter
   * essere riacquistato senza doverlo prima ricreare da zero. */
  exhausted: boolean;
  /** Evita di riavvisare a ogni pasto una volta già sotto soglia — si azzera solo al
   * riacquisto, quando le porzioni tornano al massimo. */
  lowStockAlerted: boolean;
  createdAt: string;
}

interface AnimalFoodContextValue {
  hydrated: boolean;
  products: FoodProduct[];
  addProduct: (
    input: Omit<FoodProduct, "id" | "createdAt" | "portionsRemaining" | "exhausted" | "lowStockAlerted">
  ) => FoodProduct;
  updateProduct: (id: string, patch: Partial<Omit<FoodProduct, "id" | "createdAt">>) => void;
  removeProduct: (id: string) => void;
  /** L'azione centrale: dare da mangiare consuma esattamente 1 porzione, e se questa era
   * l'ultima segna da sola il prodotto esaurito — nessun altro punto dell'app deve rifare
   * questo calcolo a mano. */
  consumePortion: (id: string) => void;
  setRemainingPortions: (id: string, portions: number) => void;
  markRepurchased: (id: string) => void;
  /** Tutti i prodotti assegnati a quell'animale (per id, per gruppo, o per specie) e non
   * esauriti — quello che deve comparire nella lista cibo quando ha fame. */
  productsForAnimal: (animal: Pick<Person, "id" | "kind">) => FoodProduct[];
}

const AnimalFoodContext = createContext<AnimalFoodContextValue | null>(null);

function totalCapacity(p: Pick<FoodProduct, "unitsTotal" | "portionsPerUnit">): number {
  return Math.max(0, p.unitsTotal) * Math.max(0, p.portionsPerUnit);
}

/** Percentuale di porzioni rimaste, 0-1. */
export function remainingPct(p: FoodProduct): number {
  const total = totalCapacity(p);
  return total > 0 ? Math.max(0, Math.min(1, p.portionsRemaining / total)) : 0;
}

/** "Quante scatolette/unità restano", arrotondato per eccesso sulle porzioni per unità — un
 * valore derivato, non un contatore separato per ogni unità (vedi il commento su
 * portionsRemaining). */
export function remainingUnitsDisplay(p: FoodProduct): number {
  if (p.portionsPerUnit <= 0) return 0;
  return Math.ceil(Math.max(0, p.portionsRemaining) / p.portionsPerUnit);
}

export function isLowStock(p: FoodProduct): boolean {
  return !p.exhausted && remainingPct(p) < LOW_STOCK_THRESHOLD;
}

export function matchesScope(p: FoodProduct, animal: Pick<Person, "id" | "kind">): boolean {
  if (p.scope.type === "animal") return p.scope.animalId === animal.id;
  if (p.scope.type === "animals") return p.scope.animalIds.includes(animal.id);
  return p.scope.species === animal.kind;
}

export function AnimalFoodProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<FoodProduct[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PRODUCTS_KEY);
      if (raw) setProducts(JSON.parse(raw));
    } catch {
      // dati locali non leggibili: si riparte da zero
    } finally {
      setHydrated(true);
    }
  }, []);

  const persist = useCallback((updater: FoodProduct[] | ((prev: FoodProduct[]) => FoodProduct[])) => {
    setProducts((prev) => {
      const next = typeof updater === "function" ? (updater as (v: FoodProduct[]) => FoodProduct[])(prev) : updater;
      try {
        window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const addProduct = useCallback(
    (input: Omit<FoodProduct, "id" | "createdAt" | "portionsRemaining" | "exhausted" | "lowStockAlerted">) => {
      const product: FoodProduct = {
        ...input,
        id: newId(),
        createdAt: new Date().toISOString(),
        portionsRemaining: totalCapacity(input),
        exhausted: false,
        lowStockAlerted: false,
      };
      persist((prev) => [...prev, product]);
      return product;
    },
    [persist]
  );

  const updateProduct = useCallback(
    (id: string, patch: Partial<Omit<FoodProduct, "id" | "createdAt">>) =>
      persist((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    [persist]
  );

  const removeProduct = useCallback(
    (id: string) => {
      const toRemove = products.find((p) => p.id === id);
      if (toRemove?.imageKey && !isDataUrl(toRemove.imageKey)) deleteImage(toRemove.imageKey);
      persist((prev) => prev.filter((p) => p.id !== id));
    },
    [persist, products]
  );

  const consumePortion = useCallback(
    (id: string) =>
      persist((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          const portionsRemaining = Math.max(0, p.portionsRemaining - 1);
          return { ...p, portionsRemaining, exhausted: p.exhausted || portionsRemaining === 0 };
        })
      ),
    [persist]
  );

  const setRemainingPortions = useCallback(
    (id: string, portions: number) =>
      persist((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          const clamped = Math.max(0, Math.min(totalCapacity(p), Math.round(portions)));
          return { ...p, portionsRemaining: clamped, exhausted: clamped === 0 };
        })
      ),
    [persist]
  );

  const markRepurchased = useCallback(
    (id: string) =>
      persist((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, portionsRemaining: totalCapacity(p), exhausted: false, lowStockAlerted: false } : p
        )
      ),
    [persist]
  );

  const productsForAnimal = useCallback(
    (animal: Pick<Person, "id" | "kind">) => products.filter((p) => !p.exhausted && matchesScope(p, animal)),
    [products]
  );

  const value = useMemo(
    () => ({
      hydrated,
      products,
      addProduct,
      updateProduct,
      removeProduct,
      consumePortion,
      setRemainingPortions,
      markRepurchased,
      productsForAnimal,
    }),
    [hydrated, products, addProduct, updateProduct, removeProduct, consumePortion, setRemainingPortions, markRepurchased, productsForAnimal]
  );

  return <AnimalFoodContext.Provider value={value}>{children}</AnimalFoodContext.Provider>;
}

export function useAnimalFood(): AnimalFoodContextValue {
  const ctx = useContext(AnimalFoodContext);
  if (!ctx) throw new Error("useAnimalFood va usato dentro un AnimalFoodProvider");
  return ctx;
}
