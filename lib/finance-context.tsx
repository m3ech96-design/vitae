"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { RecurringExpense, PlannedExpense, SingleExpense, SavingsGoal, SavingsEntry, ExpenseCategory, ExpenseRecurrence } from "./types";
import { newId } from "./id";

const BUDGET_KEY = "vitae:finance-budget";
const RECURRING_KEY = "vitae:finance-recurring";
const PLANNED_KEY = "vitae:finance-planned";
const SINGLE_KEY = "vitae:finance-single";
const GOALS_KEY = "vitae:finance-goals";
const SAVINGS_KEY = "vitae:finance-savings";
const CYCLE_START_DAY_KEY = "vitae:finance-cycle-start-day";

interface FinanceContextValue {
  hydrated: boolean;
  monthlyBudget: number | null;
  setMonthlyBudget: (v: number | null) => void;
  /** Giorno del mese (1-28) in cui inizia il ciclo di budget corrente — 1 di default, cioè
   * il comportamento originale (mese di calendario). Cambiarlo sposta anche il confine di
   * "Attualità" nella tabella cronologica: i dati del ciclo precedente restano lì per
   * sempre, semplicemente smettono di contare nell'anello corrente — "diventano solo dati",
   * come richiesto, senza bisogno di cancellare o archiviare nulla a parte. */
  cycleStartDay: number;
  setCycleStartDay: (day: number) => void;
  recurringExpenses: RecurringExpense[];
  addRecurringExpense: (label: string, amount: number, category: ExpenseCategory, recurrence: ExpenseRecurrence) => void;
  toggleRecurringExpense: (id: string) => void;
  removeRecurringExpense: (id: string) => void;
  plannedExpenses: PlannedExpense[];
  addPlannedExpense: (label: string, amount: number, dueDate: string, category: ExpenseCategory) => void;
  markPlannedPaid: (id: string) => void;
  removePlannedExpense: (id: string) => void;
  singleExpenses: SingleExpense[];
  addSingleExpense: (label: string, amount: number, date: string, category: ExpenseCategory) => void;
  removeSingleExpense: (id: string) => void;
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (label: string, targetAmount: number) => void;
  contributeSavingsGoal: (id: string, amount: number) => void;
  removeSavingsGoal: (id: string) => void;
  savingsEntries: SavingsEntry[];
  addSavingsEntry: (amount: number, note?: string) => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

/** Forma funzionale fin da questa riscrittura — lo stesso pattern ormai standard nel resto
 * del progetto (vedi food-context.tsx, wishlist-context.tsx, hobby-context.tsx): due
 * scritture di fila sullo stesso elenco nello stesso gestore di evento (es. `markPlannedPaid`,
 * che tocca `plannedExpenses` e poi `singleExpenses`) non devono mai poter leggere uno stato
 * non ancora aggiornato. Prima di questa riscrittura `persist` accettava solo l'array intero
 * già calcolato dal chiamante — esattamente la forma già corretta altrove in questo progetto
 * dopo aver trovato lo stesso difetto più volte.
 */
function usePersistedList<T>(key: string) {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // dati non leggibili: si riparte da zero
    }
  }, [key]);
  const persist = useCallback(
    (updater: T[] | ((prev: T[]) => T[])) => {
      setItems((prev) => {
        const next = typeof updater === "function" ? (updater as (v: T[]) => T[])(prev) : updater;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // ignorato
        }
        return next;
      });
    },
    [key]
  );
  return [items, persist] as const;
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [monthlyBudget, setMonthlyBudgetState] = useState<number | null>(null);
  const [cycleStartDay, setCycleStartDayState] = useState(1);
  const [recurringExpenses, persistRecurring] = usePersistedList<RecurringExpense>(RECURRING_KEY);
  const [plannedExpenses, persistPlanned] = usePersistedList<PlannedExpense>(PLANNED_KEY);
  const [singleExpenses, persistSingle] = usePersistedList<SingleExpense>(SINGLE_KEY);
  const [savingsGoals, persistGoals] = usePersistedList<SavingsGoal>(GOALS_KEY);
  const [savingsEntries, persistSavings] = usePersistedList<SavingsEntry>(SAVINGS_KEY);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BUDGET_KEY);
      if (raw) setMonthlyBudgetState(parseFloat(raw));
      const rawCycle = window.localStorage.getItem(CYCLE_START_DAY_KEY);
      if (rawCycle) {
        const n = parseInt(rawCycle, 10);
        if (n >= 1 && n <= 28) setCycleStartDayState(n);
      }
    } catch {
      // ignorato
    } finally {
      setHydrated(true);
    }
  }, []);

  const setMonthlyBudget = useCallback((v: number | null) => {
    setMonthlyBudgetState(v);
    try {
      if (v === null) window.localStorage.removeItem(BUDGET_KEY);
      else window.localStorage.setItem(BUDGET_KEY, String(v));
    } catch {
      // ignorato
    }
  }, []);

  const setCycleStartDay = useCallback((day: number) => {
    const clamped = Math.min(28, Math.max(1, Math.round(day)));
    setCycleStartDayState(clamped);
    try {
      window.localStorage.setItem(CYCLE_START_DAY_KEY, String(clamped));
    } catch {
      // ignorato
    }
  }, []);

  const addRecurringExpense = useCallback(
    (label: string, amount: number, category: ExpenseCategory, recurrence: ExpenseRecurrence) =>
      persistRecurring((prev) => [
        ...prev,
        { id: newId(), label, amount, category, recurrence, active: true, createdAt: new Date().toISOString() },
      ]),
    [persistRecurring]
  );
  const toggleRecurringExpense = useCallback(
    (id: string) => persistRecurring((prev) => prev.map((e) => (e.id === id ? { ...e, active: !e.active } : e))),
    [persistRecurring]
  );
  const removeRecurringExpense = useCallback(
    (id: string) => persistRecurring((prev) => prev.filter((e) => e.id !== id)),
    [persistRecurring]
  );

  const addPlannedExpense = useCallback(
    (label: string, amount: number, dueDate: string, category: ExpenseCategory) =>
      persistPlanned((prev) => [
        ...prev,
        { id: newId(), label, amount, dueDate, category, paid: false, createdAt: new Date().toISOString() },
      ]),
    [persistPlanned]
  );
  const markPlannedPaid = useCallback(
    (id: string) => {
      const item = plannedExpenses.find((p) => p.id === id);
      if (!item) return;
      persistPlanned((prev) => prev.map((p) => (p.id === id ? { ...p, paid: true } : p)));
      persistSingle((prev) => [
        ...prev,
        {
          id: newId(),
          label: item.label,
          amount: item.amount,
          date: new Date().toISOString().slice(0, 10),
          category: item.category,
          createdAt: new Date().toISOString(),
        },
      ]);
    },
    [plannedExpenses, persistPlanned, persistSingle]
  );
  const removePlannedExpense = useCallback(
    (id: string) => persistPlanned((prev) => prev.filter((p) => p.id !== id)),
    [persistPlanned]
  );

  const addSingleExpense = useCallback(
    (label: string, amount: number, date: string, category: ExpenseCategory) =>
      persistSingle((prev) => [...prev, { id: newId(), label, amount, date, category, createdAt: new Date().toISOString() }]),
    [persistSingle]
  );
  const removeSingleExpense = useCallback(
    (id: string) => persistSingle((prev) => prev.filter((e) => e.id !== id)),
    [persistSingle]
  );

  const addSavingsGoal = useCallback(
    (label: string, targetAmount: number) =>
      persistGoals((prev) => [...prev, { id: newId(), label, targetAmount, currentAmount: 0, createdAt: new Date().toISOString() }]),
    [persistGoals]
  );
  const contributeSavingsGoal = useCallback(
    (id: string, amount: number) =>
      persistGoals((prev) => prev.map((g) => (g.id === id ? { ...g, currentAmount: Math.max(0, g.currentAmount + amount) } : g))),
    [persistGoals]
  );
  const removeSavingsGoal = useCallback((id: string) => persistGoals((prev) => prev.filter((g) => g.id !== id)), [persistGoals]);

  const addSavingsEntry = useCallback(
    (amount: number, note?: string) => persistSavings((prev) => [...prev, { id: newId(), amount, date: new Date().toISOString(), note }]),
    [persistSavings]
  );

  const value = useMemo(
    () => ({
      hydrated,
      monthlyBudget,
      setMonthlyBudget,
      cycleStartDay,
      setCycleStartDay,
      recurringExpenses,
      addRecurringExpense,
      toggleRecurringExpense,
      removeRecurringExpense,
      plannedExpenses,
      addPlannedExpense,
      markPlannedPaid,
      removePlannedExpense,
      singleExpenses,
      addSingleExpense,
      removeSingleExpense,
      savingsGoals,
      addSavingsGoal,
      contributeSavingsGoal,
      removeSavingsGoal,
      savingsEntries,
      addSavingsEntry,
    }),
    [
      hydrated,
      monthlyBudget,
      setMonthlyBudget,
      cycleStartDay,
      setCycleStartDay,
      recurringExpenses,
      addRecurringExpense,
      toggleRecurringExpense,
      removeRecurringExpense,
      plannedExpenses,
      addPlannedExpense,
      markPlannedPaid,
      removePlannedExpense,
      singleExpenses,
      addSingleExpense,
      removeSingleExpense,
      savingsGoals,
      addSavingsGoal,
      contributeSavingsGoal,
      removeSavingsGoal,
      savingsEntries,
      addSavingsEntry,
    ]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance va usato dentro un FinanceProvider");
  return ctx;
}
