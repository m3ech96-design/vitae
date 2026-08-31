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
  removeWorkout: (id: string) => void;
  addWeightEntry: (value: number, date: string) => void;
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

  const persistWorkouts = useCallback((next: Workout[]) => {
    setWorkouts(next);
    try {
      window.localStorage.setItem(WORKOUTS_KEY, JSON.stringify(next));
    } catch {
      // ignorato
    }
  }, []);

  const persistWeight = useCallback((next: WeightEntry[]) => {
    setWeightEntries(next);
    try {
      window.localStorage.setItem(WEIGHT_KEY, JSON.stringify(next));
    } catch {
      // ignorato
    }
  }, []);

  const addWorkout = useCallback(
    (input: Omit<Workout, "id" | "createdAt">) => {
      persistWorkouts([
        ...workouts,
        { ...input, id: newId(), createdAt: new Date().toISOString() },
      ]);
    },
    [workouts, persistWorkouts]
  );

  const removeWorkout = useCallback(
    (id: string) => persistWorkouts(workouts.filter((w) => w.id !== id)),
    [workouts, persistWorkouts]
  );

  const addWeightEntry = useCallback(
    (value: number, date: string) => {
      persistWeight([...weightEntries, { id: newId(), value, date }]);
    },
    [weightEntries, persistWeight]
  );

  const removeWeightEntry = useCallback(
    (id: string) => persistWeight(weightEntries.filter((w) => w.id !== id)),
    [weightEntries, persistWeight]
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
      removeWorkout,
      addWeightEntry,
      removeWeightEntry,
      setWeightGoal,
    }),
    [hydrated, workouts, weightEntries, weightGoal, addWorkout, removeWorkout, addWeightEntry, removeWeightEntry, setWeightGoal]
  );

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
}

export function useHealth(): HealthContextValue {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error("useHealth va usato dentro un HealthProvider");
  return ctx;
}
