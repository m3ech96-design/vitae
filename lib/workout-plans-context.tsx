"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { newId } from "./id";
import { deleteImage } from "./image-store";
import { deleteVideo } from "./video-store";
import { WorkoutPlan, WorkoutPlanTable, WorkoutPlanExercise, WorkoutPlanExerciseMediaType } from "./types";

const WORKOUT_PLANS_KEY = "vitae:workout-plans";

/** Elimina dal proprio store IndexedDB il media locale di un esercizio (se ne ha uno) —
 * mai per un link YouTube, quella è solo una stringa URL, non una chiave locale. Stesso
 * principio di pulizia già seguito altrove nell'app (es. cleanupPhotos in hobby-context.tsx):
 * eliminare un esercizio/tabella/scheda non deve lasciare media orfani in IndexedDB. */
function cleanupExerciseMedia(exercise: WorkoutPlanExercise) {
  if (!exercise.mediaValue) return;
  if (exercise.mediaType === "video") deleteVideo(exercise.mediaValue);
  else if (exercise.mediaType === "image") deleteImage(exercise.mediaValue);
}

interface WorkoutPlansContextValue {
  hydrated: boolean;
  plans: WorkoutPlan[];
  addPlan: (name: string) => WorkoutPlan;
  renamePlan: (planId: string, name: string) => void;
  removePlan: (planId: string) => void;

  addTable: (planId: string, name: string) => void;
  renameTable: (planId: string, tableId: string, name: string) => void;
  removeTable: (planId: string, tableId: string) => void;

  addExercise: (planId: string, tableId: string, input: Omit<WorkoutPlanExercise, "id">) => void;
  updateExercise: (planId: string, tableId: string, exerciseId: string, patch: Partial<Omit<WorkoutPlanExercise, "id">>) => void;
  removeExercise: (planId: string, tableId: string, exerciseId: string) => void;
}

const WorkoutPlansContext = createContext<WorkoutPlansContextValue | null>(null);

export function WorkoutPlansProvider({ children }: { children: React.ReactNode }) {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(WORKOUT_PLANS_KEY);
      if (raw) setPlans(JSON.parse(raw));
    } catch {
      // dati locali non leggibili: si riparte da zero
    } finally {
      setHydrated(true);
    }
  }, []);

  const persist = useCallback((updater: WorkoutPlan[] | ((prev: WorkoutPlan[]) => WorkoutPlan[])) => {
    setPlans((prev) => {
      const next = typeof updater === "function" ? (updater as (p: WorkoutPlan[]) => WorkoutPlan[])(prev) : updater;
      try {
        window.localStorage.setItem(WORKOUT_PLANS_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const addPlan = useCallback(
    (name: string) => {
      const plan: WorkoutPlan = { id: newId(), name, tables: [], createdAt: new Date().toISOString() };
      persist((prev) => [...prev, plan]);
      return plan;
    },
    [persist]
  );

  const renamePlan = useCallback(
    (planId: string, name: string) => persist((prev) => prev.map((p) => (p.id === planId ? { ...p, name } : p))),
    [persist]
  );

  const removePlan = useCallback(
    (planId: string) =>
      persist((prev) => {
        const plan = prev.find((p) => p.id === planId);
        plan?.tables.forEach((t) => t.exercises.forEach(cleanupExerciseMedia));
        return prev.filter((p) => p.id !== planId);
      }),
    [persist]
  );

  const addTable = useCallback(
    (planId: string, name: string) => {
      const table: WorkoutPlanTable = { id: newId(), name, exercises: [] };
      persist((prev) => prev.map((p) => (p.id === planId ? { ...p, tables: [...p.tables, table] } : p)));
    },
    [persist]
  );

  const renameTable = useCallback(
    (planId: string, tableId: string, name: string) =>
      persist((prev) =>
        prev.map((p) =>
          p.id === planId ? { ...p, tables: p.tables.map((t) => (t.id === tableId ? { ...t, name } : t)) } : p
        )
      ),
    [persist]
  );

  const removeTable = useCallback(
    (planId: string, tableId: string) =>
      persist((prev) =>
        prev.map((p) => {
          if (p.id !== planId) return p;
          const table = p.tables.find((t) => t.id === tableId);
          table?.exercises.forEach(cleanupExerciseMedia);
          return { ...p, tables: p.tables.filter((t) => t.id !== tableId) };
        })
      ),
    [persist]
  );

  const addExercise = useCallback(
    (planId: string, tableId: string, input: Omit<WorkoutPlanExercise, "id">) => {
      const exercise: WorkoutPlanExercise = { ...input, id: newId() };
      persist((prev) =>
        prev.map((p) =>
          p.id === planId
            ? {
                ...p,
                tables: p.tables.map((t) => (t.id === tableId ? { ...t, exercises: [...t.exercises, exercise] } : t)),
              }
            : p
        )
      );
    },
    [persist]
  );

  const updateExercise = useCallback(
    (planId: string, tableId: string, exerciseId: string, patch: Partial<Omit<WorkoutPlanExercise, "id">>) =>
      persist((prev) =>
        prev.map((p) => {
          if (p.id !== planId) return p;
          return {
            ...p,
            tables: p.tables.map((t) => {
              if (t.id !== tableId) return t;
              return {
                ...t,
                exercises: t.exercises.map((ex) => {
                  if (ex.id !== exerciseId) return ex;
                  // Se il media cambia (o viene rimosso), il vecchio media locale va ripulito
                  // da IndexedDB — altrimenti resterebbe orfano per sempre, mai più
                  // raggiungibile da nessuna scheda ma comunque occupando spazio.
                  const mediaChanged = "mediaValue" in patch && patch.mediaValue !== ex.mediaValue;
                  if (mediaChanged) cleanupExerciseMedia(ex);
                  return { ...ex, ...patch };
                }),
              };
            }),
          };
        })
      ),
    [persist]
  );

  const removeExercise = useCallback(
    (planId: string, tableId: string, exerciseId: string) =>
      persist((prev) =>
        prev.map((p) => {
          if (p.id !== planId) return p;
          return {
            ...p,
            tables: p.tables.map((t) => {
              if (t.id !== tableId) return t;
              const exercise = t.exercises.find((ex) => ex.id === exerciseId);
              if (exercise) cleanupExerciseMedia(exercise);
              return { ...t, exercises: t.exercises.filter((ex) => ex.id !== exerciseId) };
            }),
          };
        })
      ),
    [persist]
  );

  const value = useMemo(
    () => ({
      hydrated,
      plans,
      addPlan,
      renamePlan,
      removePlan,
      addTable,
      renameTable,
      removeTable,
      addExercise,
      updateExercise,
      removeExercise,
    }),
    [hydrated, plans, addPlan, renamePlan, removePlan, addTable, renameTable, removeTable, addExercise, updateExercise, removeExercise]
  );

  return <WorkoutPlansContext.Provider value={value}>{children}</WorkoutPlansContext.Provider>;
}

export function useWorkoutPlans(): WorkoutPlansContextValue {
  const ctx = useContext(WorkoutPlansContext);
  if (!ctx) throw new Error("useWorkoutPlans va usato dentro un WorkoutPlansProvider");
  return ctx;
}

export type { WorkoutPlanExerciseMediaType };
