"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { Workout, WeightEntry } from "./types";
import { newId } from "./id";

const WORKOUTS_KEY = "vitae:workouts";
const WEIGHT_KEY = "vitae:weight-entries";
const GOAL_KEY = "vitae:weight-goal";

interface HealthContextValue {
  hydrated: boolean;
  workouts: Workout[];
  weightEntries: WeightEntry[];
  weightGoal: number | null;
  addWorkout: (input: Omit<Workout, "id" | "createdAt">) => void;
  updateWorkout: (id: string, patch: Partial<Omit<Workout, "id" | "createdAt">>) => void;
  removeWorkout: (id: string) => void;
  addWeightEntry: (value: number, date: string) => void;
  updateWeightEntry: (id: string, patch: Partial<Omit<WeightEntry, "id">>) => void;
  removeWeightEntry: (id: string) => void;
  setWeightGoal: (value: number | null) => void;
}

const HealthContext = createContext<HealthContextValue | null>(null);

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [weightGoal, setWeightGoalState] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const w = window.localStorage.getItem(WORKOUTS_KEY);
      if (w) setWorkouts(JSON.parse(w));
      const we = window.localStorage.getItem(WEIGHT_KEY);
      if (we) setWeightEntries(JSON.parse(we));
      const g = window.localStorage.getItem(GOAL_KEY);
      if (g) setWeightGoalState(parseFloat(g));
    } catch {
      // dati locali non leggibili: si riparte da zero
    } finally {
      setHydrated(true);
    }
  }, []);

  /** Forma funzionale — vedi la stessa correzione, con la stessa causa reale, in
   * household-context.tsx (`persistPeople`): due chiamate di seguito nello stesso gestore
   * di evento, basate su una copia dell'array catturata al render, facevano sì che la
   * seconda sovrascrivesse silenziosamente la prima invece di sommarsi. */
  const persistWorkouts = useCallback((updater: Workout[] | ((prev: Workout[]) => Workout[])) => {
    setWorkouts((prev) => {
      const next = typeof updater === "function" ? (updater as (w: Workout[]) => Workout[])(prev) : updater;
      try {
        window.localStorage.setItem(WORKOUTS_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const persistWeight = useCallback((updater: WeightEntry[] | ((prev: WeightEntry[]) => WeightEntry[])) => {
    setWeightEntries((prev) => {
      const next = typeof updater === "function" ? (updater as (w: WeightEntry[]) => WeightEntry[])(prev) : updater;
      try {
        window.localStorage.setItem(WEIGHT_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const addWorkout = useCallback(
    (input: Omit<Workout, "id" | "createdAt">) => {
      persistWorkouts((prev) => [...prev, { ...input, id: newId(), createdAt: new Date().toISOString() }]);
    },
    [persistWorkouts]
  );

  const updateWorkout = useCallback(
    (id: string, patch: Partial<Omit<Workout, "id" | "createdAt">>) =>
      persistWorkouts((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w))),
    [persistWorkouts]
  );

  const removeWorkout = useCallback(
    (id: string) => persistWorkouts((prev) => prev.filter((w) => w.id !== id)),
    [persistWorkouts]
  );

  const addWeightEntry = useCallback(
    (value: number, date: string) => {
      persistWeight((prev) => [...prev, { id: newId(), value, date }]);
    },
    [persistWeight]
  );

  const updateWeightEntry = useCallback(
    (id: string, patch: Partial<Omit<WeightEntry, "id">>) =>
      persistWeight((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w))),
    [persistWeight]
  );

  const removeWeightEntry = useCallback(
    (id: string) => persistWeight((prev) => prev.filter((w) => w.id !== id)),
    [persistWeight]
  );

  const setWeightGoal = useCallback((value: number | null) => {
    setWeightGoalState(value);
    try {
      if (value === null) window.localStorage.removeItem(GOAL_KEY);
      else window.localStorage.setItem(GOAL_KEY, String(value));
    } catch {
      // ignorato
    }
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      workouts,
      weightEntries,
      weightGoal,
      addWorkout,
      updateWorkout,
      removeWorkout,
      addWeightEntry,
      updateWeightEntry,
      removeWeightEntry,
      setWeightGoal,
    }),
    [
      hydrated,
      workouts,
      weightEntries,
      weightGoal,
      addWorkout,
      updateWorkout,
      removeWorkout,
      addWeightEntry,
      updateWeightEntry,
      removeWeightEntry,
      setWeightGoal,
    ]
  );

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
}

export function useHealth(): HealthContextValue {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error("useHealth va usato dentro un HealthProvider");
  return ctx;
}
