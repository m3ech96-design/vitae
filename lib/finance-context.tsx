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

interface FinanceContextValue {
  hydrated: boolean;
  monthlyBudget: number | null;
  setMonthlyBudget: (v: number | null) => void;
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
    (next: T[]) => {
      setItems(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignorato
      }
    },
    [key]
  );
  return [items, persist] as const;
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [monthlyBudget, setMonthlyBudgetState] = useState<number | null>(null);
  const [recurringExpenses, persistRecurring] = usePersistedList<RecurringExpense>(RECURRING_KEY);
  const [plannedExpenses, persistPlanned] = usePersistedList<PlannedExpense>(PLANNED_KEY);
  const [singleExpenses, persistSingle] = usePersistedList<SingleExpense>(SINGLE_KEY);
  const [savingsGoals, persistGoals] = usePersistedList<SavingsGoal>(GOALS_KEY);
  const [savingsEntries, persistSavings] = usePersistedList<SavingsEntry>(SAVINGS_KEY);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BUDGET_KEY);
      if (raw) setMonthlyBudgetState(parseFloat(raw));
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

  const addRecurringExpense = useCallback(
    (label: string, amount: number, category: ExpenseCategory, recurrence: ExpenseRecurrence) => {
      persistRecurring([
        ...recurringExpenses,
        { id: newId(), label, amount, category, recurrence, active: true, createdAt: new Date().toISOString() },
      ]);
    },
    [recurringExpenses, persistRecurring]
  );
  const toggleRecurringExpense = useCallback(
    (id: string) => persistRecurring(recurringExpenses.map((e) => (e.id === id ? { ...e, active: !e.active } : e))),
    [recurringExpenses, persistRecurring]
  );
  const removeRecurringExpense = useCallback(
    (id: string) => persistRecurring(recurringExpenses.filter((e) => e.id !== id)),
    [recurringExpenses, persistRecurring]
  );

  const addPlannedExpense = useCallback(
    (label: string, amount: number, dueDate: string, category: ExpenseCategory) => {
      persistPlanned([
        ...plannedExpenses,
        { id: newId(), label, amount, dueDate, category, paid: false, createdAt: new Date().toISOString() },
      ]);
    },
    [plannedExpenses, persistPlanned]
  );
  const markPlannedPaid = useCallback(
    (id: string) => {
      const item = plannedExpenses.find((p) => p.id === id);
      if (!item) return;
      persistPlanned(plannedExpenses.map((p) => (p.id === id ? { ...p, paid: true } : p)));
      persistSingle([
        ...singleExpenses,
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
    [plannedExpenses, persistPlanned, singleExpenses, persistSingle]
  );
  const removePlannedExpense = useCallback(
    (id: string) => persistPlanned(plannedExpenses.filter((p) => p.id !== id)),
    [plannedExpenses, persistPlanned]
  );

  const addSingleExpense = useCallback(
    (label: string, amount: number, date: string, category: ExpenseCategory) => {
      persistSingle([...singleExpenses, { id: newId(), label, amount, date, category, createdAt: new Date().toISOString() }]);
    },
    [singleExpenses, persistSingle]
  );
  const removeSingleExpense = useCallback(
    (id: string) => persistSingle(singleExpenses.filter((e) => e.id !== id)),
    [singleExpenses, persistSingle]
  );

  const addSavingsGoal = useCallback(
    (label: string, targetAmount: number) => {
      persistGoals([...savingsGoals, { id: newId(), label, targetAmount, currentAmount: 0, createdAt: new Date().toISOString() }]);
    },
    [savingsGoals, persistGoals]
  );
  const contributeSavingsGoal = useCallback(
    (id: string, amount: number) => {
      persistGoals(savingsGoals.map((g) => (g.id === id ? { ...g, currentAmount: Math.max(0, g.currentAmount + amount) } : g)));
    },
    [savingsGoals, persistGoals]
  );
  const removeSavingsGoal = useCallback(
    (id: string) => persistGoals(savingsGoals.filter((g) => g.id !== id)),
    [savingsGoals, persistGoals]
  );

  const addSavingsEntry = useCallback(
    (amount: number, note?: string) => {
      persistSavings([...savingsEntries, { id: newId(), amount, date: new Date().toISOString(), note }]);
    },
    [savingsEntries, persistSavings]
  );

  const value = useMemo(
    () => ({
      hydrated,
      monthlyBudget,
      setMonthlyBudget,
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
