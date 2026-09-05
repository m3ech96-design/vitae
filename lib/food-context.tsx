"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { newId } from "./id";
import { Ingredient, FoodEntry, FoodGoals, DEFAULT_FOOD_GOALS, WaterLog, computeKcal } from "./food-types";

const INGREDIENTS_KEY = "vitae:food-ingredients";
const ENTRIES_KEY = "vitae:food-entries";
const WATER_KEY = "vitae:food-water";
const GOALS_KEY = "vitae:food-goals";

interface FoodContextValue {
  hydrated: boolean;
  ingredients: Ingredient[];
  entries: FoodEntry[];
  waterLog: WaterLog;
  goals: FoodGoals;
  addIngredient: (input: Omit<Ingredient, "id" | "createdAt" | "kcal">) => Ingredient;
  updateIngredient: (id: string, patch: Partial<Omit<Ingredient, "id" | "createdAt" | "kcal">>) => void;
  removeIngredient: (id: string) => void;
  addEntry: (input: Omit<FoodEntry, "id" | "createdAt">) => FoodEntry;
  updateEntry: (id: string, patch: Partial<Omit<FoodEntry, "id" | "createdAt">>) => void;
  removeEntry: (id: string) => void;
  setWater: (date: string, liters: number) => void;
  setGoals: (patch: Partial<FoodGoals>) => void;
  /** Menù copiato (voci di un intero giorno), pronto per essere incollato su un altro
   * giorno — vive solo in memoria per la sessione corrente, non su localStorage: è un
   * appunto "in mano" tra un copia e un incolla nella stessa visita, non qualcosa da
   * ritrovare riaprendo l'app un altro giorno. */
  copiedMenu: { sourceDate: string; entries: Pick<FoodEntry, "slot" | "ingredientId" | "quantity" | "time">[] } | null;
  copyMenu: (date: string) => void;
  /** Incolla il menù copiato sul giorno indicato, aggiungendosi alle voci già presenti
   * quel giorno (non le sostituisce): ogni voce copiata diventa una nuova voce con id
   * proprio, così modificarla o eliminarla dopo non tocca in alcun modo il giorno di
   * origine da cui è stata copiata. */
  pasteMenu: (targetDate: string) => void;
  clearCopiedMenu: () => void;
}

const FoodContext = createContext<FoodContextValue | null>(null);

export function FoodProvider({ children }: { children: React.ReactNode }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [waterLog, setWaterLogState] = useState<WaterLog>({});
  const [goals, setGoalsState] = useState<FoodGoals>(DEFAULT_FOOD_GOALS);
  const [hydrated, setHydrated] = useState(false);
  const [copiedMenu, setCopiedMenu] = useState<FoodContextValue["copiedMenu"]>(null);

  useEffect(() => {
    try {
      const i = window.localStorage.getItem(INGREDIENTS_KEY);
      if (i) setIngredients(JSON.parse(i));
      const e = window.localStorage.getItem(ENTRIES_KEY);
      if (e) setEntries(JSON.parse(e));
      const w = window.localStorage.getItem(WATER_KEY);
      if (w) setWaterLogState(JSON.parse(w));
      const g = window.localStorage.getItem(GOALS_KEY);
      if (g) setGoalsState({ ...DEFAULT_FOOD_GOALS, ...JSON.parse(g) });
    } catch {
      // dati locali non leggibili: si riparte da zero
    } finally {
      setHydrated(true);
    }
  }, []);

  /** Forma funzionale fin dal primo giorno — mai la causa di bug già vista più volte in
   * questo progetto (household-context, health-context, vitaecom-social-context): due
   * scritture di fila nello stesso gestore di evento non devono mai poter leggere lo stesso
   * stato non aggiornato. */
  const persistIngredients = useCallback((updater: Ingredient[] | ((prev: Ingredient[]) => Ingredient[])) => {
    setIngredients((prev) => {
      const next = typeof updater === "function" ? (updater as (v: Ingredient[]) => Ingredient[])(prev) : updater;
      try {
        window.localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const persistEntries = useCallback((updater: FoodEntry[] | ((prev: FoodEntry[]) => FoodEntry[])) => {
    setEntries((prev) => {
      const next = typeof updater === "function" ? (updater as (v: FoodEntry[]) => FoodEntry[])(prev) : updater;
      try {
        window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const persistWater = useCallback((updater: WaterLog | ((prev: WaterLog) => WaterLog)) => {
    setWaterLogState((prev) => {
      const next = typeof updater === "function" ? (updater as (v: WaterLog) => WaterLog)(prev) : updater;
      try {
        window.localStorage.setItem(WATER_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const addIngredient = useCallback(
    (input: Omit<Ingredient, "id" | "createdAt" | "kcal">) => {
      const ingredient: Ingredient = {
        ...input,
        id: newId(),
        createdAt: new Date().toISOString(),
        kcal: computeKcal(input.fat, input.carbs, input.protein),
      };
      persistIngredients((prev) => [...prev, ingredient]);
      return ingredient;
    },
    [persistIngredients]
  );

  const updateIngredient = useCallback(
    (id: string, patch: Partial<Omit<Ingredient, "id" | "createdAt" | "kcal">>) =>
      persistIngredients((prev) =>
        prev.map((ing) => {
          if (ing.id !== id) return ing;
          const merged = { ...ing, ...patch };
          return { ...merged, kcal: computeKcal(merged.fat, merged.carbs, merged.protein) };
        })
      ),
    [persistIngredients]
  );

  const removeIngredient = useCallback(
    (id: string) => {
      persistIngredients((prev) => prev.filter((ing) => ing.id !== id));
      persistEntries((prev) => prev.filter((e) => e.ingredientId !== id));
    },
    [persistIngredients, persistEntries]
  );

  const addEntry = useCallback(
    (input: Omit<FoodEntry, "id" | "createdAt">) => {
      const entry: FoodEntry = { ...input, id: newId(), createdAt: new Date().toISOString() };
      persistEntries((prev) => [...prev, entry]);
      return entry;
    },
    [persistEntries]
  );

  const updateEntry = useCallback(
    (id: string, patch: Partial<Omit<FoodEntry, "id" | "createdAt">>) =>
      persistEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    [persistEntries]
  );

  const removeEntry = useCallback((id: string) => persistEntries((prev) => prev.filter((e) => e.id !== id)), [persistEntries]);

  const setWater = useCallback(
    (date: string, liters: number) => persistWater((prev) => ({ ...prev, [date]: Math.max(0, liters) })),
    [persistWater]
  );

  const setGoals = useCallback((patch: Partial<FoodGoals>) => {
    setGoalsState((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(GOALS_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const copyMenu = useCallback(
    (date: string) => {
      const dayEntries = entries.filter((e) => e.date === date);
      setCopiedMenu({
        sourceDate: date,
        entries: dayEntries.map((e) => ({ slot: e.slot, ingredientId: e.ingredientId, quantity: e.quantity, time: e.time })),
      });
    },
    [entries]
  );

  const pasteMenu = useCallback(
    (targetDate: string) => {
      setCopiedMenu((menu) => {
        if (!menu) return menu;
        const newEntries: FoodEntry[] = menu.entries.map((line) => ({
          ...line,
          date: targetDate,
          id: newId(),
          createdAt: new Date().toISOString(),
        }));
        persistEntries((prev) => [...prev, ...newEntries]);
        return menu;
      });
    },
    [persistEntries]
  );

  const clearCopiedMenu = useCallback(() => setCopiedMenu(null), []);

  const value = useMemo(
    () => ({
      hydrated,
      ingredients,
      entries,
      waterLog,
      goals,
      addIngredient,
      updateIngredient,
      removeIngredient,
      addEntry,
      updateEntry,
      removeEntry,
      setWater,
      setGoals,
      copiedMenu,
      copyMenu,
      pasteMenu,
      clearCopiedMenu,
    }),
    [
      hydrated,
      ingredients,
      entries,
      waterLog,
      goals,
      addIngredient,
      updateIngredient,
      removeIngredient,
      addEntry,
      updateEntry,
      removeEntry,
      setWater,
      setGoals,
      copiedMenu,
      copyMenu,
      pasteMenu,
      clearCopiedMenu,
    ]
  );

  return <FoodContext.Provider value={value}>{children}</FoodContext.Provider>;
}

export function useFood(): FoodContextValue {
  const ctx = useContext(FoodContext);
  if (!ctx) throw new Error("useFood va usato dentro un FoodProvider");
  return ctx;
}
