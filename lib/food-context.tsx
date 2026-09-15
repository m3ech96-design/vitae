"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { newId } from "./id";
import { Ingredient, FoodEntry, FoodGoals, DEFAULT_FOOD_GOALS, WaterLog, PantryEntry, MealSlot } from "./food-types";
import { consumeFromPantry, restoreToPantry } from "./pantry";
import { todayIso } from "./date-format";

const INGREDIENTS_KEY = "vitae:food-ingredients";
const ENTRIES_KEY = "vitae:food-entries";
const WATER_KEY = "vitae:food-water";
const GOALS_KEY = "vitae:food-goals";
const PANTRY_KEY = "vitae:food-pantry";

interface FoodContextValue {
  hydrated: boolean;
  ingredients: Ingredient[];
  entries: FoodEntry[];
  waterLog: WaterLog;
  goals: FoodGoals;
  addIngredient: (input: Omit<Ingredient, "id" | "createdAt">) => Ingredient;
  updateIngredient: (id: string, patch: Partial<Omit<Ingredient, "id" | "createdAt">>) => void;
  removeIngredient: (id: string) => void;
  addEntry: (input: Omit<FoodEntry, "id" | "createdAt">) => FoodEntry;
  updateEntry: (id: string, patch: Partial<Omit<FoodEntry, "id" | "createdAt">>) => void;
  removeEntry: (id: string) => void;
  setWater: (date: string, liters: number) => void;
  setGoals: (patch: Partial<FoodGoals>) => void;
  /** Voci copiate di un SINGOLO pasto (uno slot di un giorno), pronte per essere incollate
   * su un altro giorno nello stesso slot — vive solo in memoria per la sessione corrente,
   * non su localStorage: è un appunto "in mano" tra un copia e un incolla nella stessa
   * visita, non qualcosa da ritrovare riaprendo l'app un altro giorno. Pasto per pasto e
   * non l'intero menù di una giornata: si copia "la colazione di martedì", non "tutto
   * martedì" — un'incolla su un giorno che ha già altri pasti suoi non li tocca. */
  copiedMenu: { sourceDate: string; slot: MealSlot; entries: Pick<FoodEntry, "slot" | "ingredientId" | "quantity" | "time">[] } | null;
  copyMeal: (date: string, slot: MealSlot) => void;
  /** Incolla le voci copiate sul giorno indicato, nello STESSO slot da cui sono state
   * copiate — aggiungendosi alle voci già presenti quel pasto (non le sostituisce): ogni
   * voce copiata diventa una nuova voce con id proprio, così modificarla o eliminarla dopo
   * non tocca in alcun modo il pasto di origine da cui è stata copiata. */
  pasteMeal: (targetDate: string) => void;
  clearCopiedMenu: () => void;

  pantryEntries: PantryEntry[];
  addPantryEntry: (input: Omit<PantryEntry, "id">) => void;
  markPantryEntryConsumed: (id: string, consumedDate: string) => void;
  removePantryEntry: (id: string) => void;
  /** Correzione manuale del residuo di un'entry con tracking attivo — es. "ho versato via
   * mezzo litro per sbaglio". Un valore <= 0 marca l'entry consumata da sola, coerente con
   * lo svuotamento naturale via consumeFromPantry. */
  adjustPantryQuantity: (id: string, remainingQuantity: number) => void;
}

const FoodContext = createContext<FoodContextValue | null>(null);

export function FoodProvider({ children }: { children: React.ReactNode }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [waterLog, setWaterLogState] = useState<WaterLog>({});
  const [goals, setGoalsState] = useState<FoodGoals>(DEFAULT_FOOD_GOALS);
  const [pantryEntries, setPantryEntries] = useState<PantryEntry[]>([]);
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
      const p = window.localStorage.getItem(PANTRY_KEY);
      if (p) setPantryEntries(JSON.parse(p));
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

  const persistPantry = useCallback((updater: PantryEntry[] | ((prev: PantryEntry[]) => PantryEntry[])) => {
    setPantryEntries((prev) => {
      const next = typeof updater === "function" ? (updater as (v: PantryEntry[]) => PantryEntry[])(prev) : updater;
      try {
        window.localStorage.setItem(PANTRY_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  // Le kcal arrivano già decise dal chiamante (di norma il wizard, che le calcola con
  // Atwater ma permette di sovrascriverle a mano): il context non le ricalcola più da
  // fat/carbs/protein, altrimenti un valore kcal inserito manualmente verrebbe silenziosamente
  // buttato via ad ogni add/update.
  const addIngredient = useCallback(
    (input: Omit<Ingredient, "id" | "createdAt">) => {
      const ingredient: Ingredient = {
        ...input,
        id: newId(),
        createdAt: new Date().toISOString(),
      };
      persistIngredients((prev) => [...prev, ingredient]);
      return ingredient;
    },
    [persistIngredients]
  );

  const updateIngredient = useCallback(
    (id: string, patch: Partial<Omit<Ingredient, "id" | "createdAt">>) =>
      persistIngredients((prev) =>
        prev.map((ing) => {
          if (ing.id !== id) return ing;
          return { ...ing, ...patch };
        })
      ),
    [persistIngredients]
  );

  const removeIngredient = useCallback(
    (id: string) => {
      persistIngredients((prev) => prev.filter((ing) => ing.id !== id));
      persistEntries((prev) => prev.filter((e) => e.ingredientId !== id));
      persistPantry((prev) => prev.filter((p) => p.ingredientId !== id));
    },
    [persistIngredients, persistEntries, persistPantry]
  );

  const addEntry = useCallback(
    (input: Omit<FoodEntry, "id" | "createdAt">) => {
      const entry: FoodEntry = { ...input, id: newId(), createdAt: new Date().toISOString() };
      persistEntries((prev) => [...prev, entry]);
      // Scala la dispensa (solo le entry con tracking quantità attivo — vedi
      // consumeFromPantry): registrare un pasto è anche "consumare" quell'ingrediente da
      // qualche parte, se ne teniamo traccia lì.
      persistPantry((prev) => consumeFromPantry(prev, entry.ingredientId, entry.quantity, todayIso()));
      return entry;
    },
    [persistEntries, persistPantry]
  );

  const updateEntry = useCallback(
    (id: string, patch: Partial<Omit<FoodEntry, "id" | "createdAt">>) => {
      const previous = entries.find((e) => e.id === id);
      persistEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
      // Se cambia l'ingrediente o la quantità, il consumo precedente sulla dispensa non è
      // più corretto: si ripristina prima quello vecchio, poi si applica il nuovo — stesso
      // ingrediente o no, l'operazione resta corretta perché restoreToPantry e
      // consumeFromPantry sono ciascuna specifica al proprio ingredientId.
      if (previous && (patch.ingredientId !== undefined || patch.quantity !== undefined)) {
        const nextIngredientId = patch.ingredientId ?? previous.ingredientId;
        const nextQuantity = patch.quantity ?? previous.quantity;
        persistPantry((prev) => {
          const restored = restoreToPantry(prev, previous.ingredientId, previous.quantity);
          return consumeFromPantry(restored, nextIngredientId, nextQuantity, todayIso());
        });
      }
    },
    [persistEntries, persistPantry, entries]
  );

  const removeEntry = useCallback(
    (id: string) => {
      const removed = entries.find((e) => e.id === id);
      persistEntries((prev) => prev.filter((e) => e.id !== id));
      if (removed) {
        persistPantry((prev) => restoreToPantry(prev, removed.ingredientId, removed.quantity));
      }
    },
    [persistEntries, persistPantry, entries]
  );

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

  const copyMeal = useCallback(
    (date: string, slot: MealSlot) => {
      const slotEntries = entries.filter((e) => e.date === date && e.slot === slot);
      setCopiedMenu({
        sourceDate: date,
        slot,
        entries: slotEntries.map((e) => ({ slot: e.slot, ingredientId: e.ingredientId, quantity: e.quantity, time: e.time })),
      });
    },
    [entries]
  );

  const pasteMeal = useCallback(
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

  const addPantryEntry = useCallback(
    (input: Omit<PantryEntry, "id">) =>
      persistPantry((prev) => [
        ...prev,
        {
          ...input,
          id: newId(),
          // Alla creazione, il residuo parte sempre pieno quanto l'iniziale — non ha senso
          // che l'utente possa dichiararli diversi il primo giorno di una confezione.
          remainingQuantity: input.initialQuantity !== undefined ? input.initialQuantity : undefined,
        },
      ]),
    [persistPantry]
  );

  const markPantryEntryConsumed = useCallback(
    (id: string, consumedDate: string) => persistPantry((prev) => prev.map((p) => (p.id === id ? { ...p, consumedDate } : p))),
    [persistPantry]
  );

  const removePantryEntry = useCallback((id: string) => persistPantry((prev) => prev.filter((p) => p.id !== id)), [persistPantry]);

  const adjustPantryQuantity = useCallback(
    (id: string, remainingQuantity: number) =>
      persistPantry((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                remainingQuantity: Math.max(0, remainingQuantity),
                consumedDate: remainingQuantity <= 0 ? new Date().toISOString().slice(0, 10) : undefined,
              }
            : p
        )
      ),
    [persistPantry]
  );

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
      copyMeal,
      pasteMeal,
      clearCopiedMenu,
      pantryEntries,
      addPantryEntry,
      markPantryEntryConsumed,
      removePantryEntry,
      adjustPantryQuantity,
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
      copyMeal,
      pasteMeal,
      clearCopiedMenu,
      pantryEntries,
      addPantryEntry,
      markPantryEntryConsumed,
      removePantryEntry,
      adjustPantryQuantity,
    ]
  );

  return <FoodContext.Provider value={value}>{children}</FoodContext.Provider>;
}

export function useFood(): FoodContextValue {
  const ctx = useContext(FoodContext);
  if (!ctx) throw new Error("useFood va usato dentro un FoodProvider");
  return ctx;
}
