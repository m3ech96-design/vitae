"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { Workout, WeightEntry } from "./types";
import { newId } from "./id";

const WORKOUTS_KEY = "vitae:workouts";
const WEIGHT_KEY = "vitae:weight-entries";
const GOAL_KEY = "vitae:weight-goal";
const WEEKLY_GOAL_KEY = "vitae:weekly-activity-goal";
const MEASUREMENTS_KEY = "vitae:body-measurements";
const PROGRESS_PHOTOS_KEY = "vitae:progress-photos";

export type WeeklyGoalType = "minuti" | "sessioni" | "calorie";

export interface WeeklyActivityGoal {
  type: WeeklyGoalType;
  target: number;
}

/** Una singola voce di una misura corporea — "Vita", "Petto", "Braccia", eccetera: nome
 * libero come i valori delle analisi del sangue in Salute, non un elenco chiuso, perché le
 * misure che contano cambiano da persona a persona. */
export interface BodyMeasurement {
  id: string;
  name: string;
  value: number;
  unit: string;
  date: string;
}

export interface ProgressPhoto {
  id: string;
  photoKey: string;
  date: string;
  note?: string;
}

interface HealthContextValue {
  hydrated: boolean;
  workouts: Workout[];
  weightEntries: WeightEntry[];
  weightGoal: number | null;
  weeklyGoal: WeeklyActivityGoal | null;
  measurements: BodyMeasurement[];
  progressPhotos: ProgressPhoto[];
  addWorkout: (input: Omit<Workout, "id" | "createdAt">) => void;
  updateWorkout: (id: string, patch: Partial<Omit<Workout, "id" | "createdAt">>) => void;
  removeWorkout: (id: string) => void;
  addWeightEntry: (value: number, date: string) => void;
  updateWeightEntry: (id: string, patch: Partial<Omit<WeightEntry, "id">>) => void;
  removeWeightEntry: (id: string) => void;
  setWeightGoal: (value: number | null) => void;
  setWeeklyGoal: (value: WeeklyActivityGoal | null) => void;
  addMeasurement: (m: Omit<BodyMeasurement, "id">) => void;
  removeMeasurement: (id: string) => void;
  addProgressPhoto: (p: Omit<ProgressPhoto, "id">) => void;
  removeProgressPhoto: (id: string) => void;
}

const HealthContext = createContext<HealthContextValue | null>(null);

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [weightGoal, setWeightGoalState] = useState<number | null>(null);
  const [weeklyGoal, setWeeklyGoalState] = useState<WeeklyActivityGoal | null>(null);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const w = window.localStorage.getItem(WORKOUTS_KEY);
      if (w) setWorkouts(JSON.parse(w));
      const we = window.localStorage.getItem(WEIGHT_KEY);
      if (we) setWeightEntries(JSON.parse(we));
      const g = window.localStorage.getItem(GOAL_KEY);
      if (g) setWeightGoalState(parseFloat(g));
      const wg = window.localStorage.getItem(WEEKLY_GOAL_KEY);
      if (wg) setWeeklyGoalState(JSON.parse(wg));
      const m = window.localStorage.getItem(MEASUREMENTS_KEY);
      if (m) setMeasurements(JSON.parse(m));
      const pp = window.localStorage.getItem(PROGRESS_PHOTOS_KEY);
      if (pp) setProgressPhotos(JSON.parse(pp));
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

  const setWeeklyGoal = useCallback((value: WeeklyActivityGoal | null) => {
    setWeeklyGoalState(value);
    try {
      if (value === null) window.localStorage.removeItem(WEEKLY_GOAL_KEY);
      else window.localStorage.setItem(WEEKLY_GOAL_KEY, JSON.stringify(value));
    } catch {
      // ignorato
    }
  }, []);

  const persistMeasurements = useCallback((updater: BodyMeasurement[] | ((prev: BodyMeasurement[]) => BodyMeasurement[])) => {
    setMeasurements((prev) => {
      const next = typeof updater === "function" ? (updater as (m: BodyMeasurement[]) => BodyMeasurement[])(prev) : updater;
      try {
        window.localStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const addMeasurement = useCallback(
    (m: Omit<BodyMeasurement, "id">) => persistMeasurements((prev) => [...prev, { ...m, id: newId() }]),
    [persistMeasurements]
  );
  const removeMeasurement = useCallback((id: string) => persistMeasurements((prev) => prev.filter((m) => m.id !== id)), [persistMeasurements]);

  const persistProgressPhotos = useCallback((updater: ProgressPhoto[] | ((prev: ProgressPhoto[]) => ProgressPhoto[])) => {
    setProgressPhotos((prev) => {
      const next = typeof updater === "function" ? (updater as (p: ProgressPhoto[]) => ProgressPhoto[])(prev) : updater;
      try {
        window.localStorage.setItem(PROGRESS_PHOTOS_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const addProgressPhoto = useCallback(
    (p: Omit<ProgressPhoto, "id">) => persistProgressPhotos((prev) => [...prev, { ...p, id: newId() }]),
    [persistProgressPhotos]
  );
  const removeProgressPhoto = useCallback(
    (id: string) => persistProgressPhotos((prev) => prev.filter((p) => p.id !== id)),
    [persistProgressPhotos]
  );

  const value = useMemo(
    () => ({
      hydrated,
      workouts,
      weightEntries,
      weightGoal,
      weeklyGoal,
      measurements,
      progressPhotos,
      addWorkout,
      updateWorkout,
      removeWorkout,
      addWeightEntry,
      updateWeightEntry,
      removeWeightEntry,
      setWeightGoal,
      setWeeklyGoal,
      addMeasurement,
      removeMeasurement,
      addProgressPhoto,
      removeProgressPhoto,
    }),
    [
      hydrated,
      workouts,
      weightEntries,
      weightGoal,
      weeklyGoal,
      measurements,
      progressPhotos,
      addWorkout,
      updateWorkout,
      removeWorkout,
      addWeightEntry,
      updateWeightEntry,
      removeWeightEntry,
      setWeightGoal,
      setWeeklyGoal,
      addMeasurement,
      removeMeasurement,
      addProgressPhoto,
      removeProgressPhoto,
    ]
  );

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
}

export function useHealth(): HealthContextValue {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error("useHealth va usato dentro un HealthProvider");
  return ctx;
}
