"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { Task, SubTask, ShoppingItem } from "./types";
import { newId } from "./id";
import { usePlaces } from "./places-context";
import { SPENDING_PLACE_TYPES } from "./places-meta";
import { capArray } from "./cap-array";
import { shouldAutoComplete } from "./task-status";
import { openTaskCancelInCalendar } from "./ics";

const TASKS_KEY = "vitae:tasks";

type NewTaskInput = Omit<
  Task,
  "id" | "createdAt" | "completed" | "completedAt" | "completionLog" | "spentAmount"
>;

interface CompleteResult {
  streak: number;
  askSpent: boolean;
}

interface TasksContextValue {
  hydrated: boolean;
  tasks: Task[];
  addTask: (input: NewTaskInput) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  toggleShoppingItem: (taskId: string, itemId: string) => void;
  completeTask: (id: string) => CompleteResult;
  uncompleteTask: (id: string) => void;
  setSpentAmount: (id: string, amount: number, chargedToBudget?: boolean) => void;
  setSpentBreakdown: (id: string, breakdown: { category: string; amount: number }[], chargedToBudget?: boolean) => void;
  streakFor: (task: Task) => number;
}

const TasksContext = createContext<TasksContextValue | null>(null);

function isConsecutiveDay(prevIso: string, currIso: string): boolean {
  const prev = new Date(prevIso);
  const curr = new Date(currIso);
  const diff = Math.round(
    (Date.UTC(curr.getFullYear(), curr.getMonth(), curr.getDate()) -
      Date.UTC(prev.getFullYear(), prev.getMonth(), prev.getDate())) /
      86400000
  );
  return diff === 1;
}

function computeStreak(log: string[]): number {
  if (log.length === 0) return 0;
  const sorted = [...new Set(log.map((d) => d.slice(0, 10)))].sort();
  let streak = 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    if (isConsecutiveDay(sorted[i - 1], sorted[i])) streak++;
    else break;
  }
  return streak;
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const { logTaskVisit, places } = usePlaces();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TASKS_KEY);
      if (raw) setTasks(JSON.parse(raw));
    } catch {
      // dati locali non leggibili: si riparte da zero
    } finally {
      setHydrated(true);
    }
  }, []);

  const persist = useCallback((updater: Task[] | ((prev: Task[]) => Task[])) => {
    setTasks((prev) => {
      const next = typeof updater === "function" ? (updater as (t: Task[]) => Task[])(prev) : updater;
      try {
        window.localStorage.setItem(TASKS_KEY, JSON.stringify(next));
      } catch {
        // storage non disponibile: continua solo in memoria
      }
      return next;
    });
  }, []);

  // Evento e Appuntamento non si spuntano: si completano da soli quando l'orario di fine
  // coincide con l'ora reale.
  useEffect(() => {
    if (!hydrated) return;
    const check = () => {
      setTasks((current) => {
        const now = new Date();
        let changed = false;
        const next = current.map((t) => {
          if (shouldAutoComplete(t, now)) {
            changed = true;
            return { ...t, completed: true, completedAt: now.toISOString() };
          }
          return t;
        });
        if (changed) {
          try {
            window.localStorage.setItem(TASKS_KEY, JSON.stringify(next));
          } catch {
            // storage non disponibile
          }
          return next;
        }
        return current;
      });
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [hydrated]);

  const addTask = useCallback(
    (input: NewTaskInput) => {
      const task: Task = {
        ...input,
        id: newId(),
        completed: false,
        completionLog: [],
        createdAt: new Date().toISOString(),
      };
      persist((prev) => [...prev, task]);
      return task;
    },
    [persist]
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) => {
      persist((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    },
    [persist]
  );

  const removeTask = useCallback(
    (id: string) => {
      // Simmetrico alla creazione: aggiungere una task non "quotidiana" genera da sola
      // l'evento nel calendario di sistema, quindi eliminarla prova ad annullarlo allo
      // stesso modo — vedi la nota su `taskCancelICS` per il limite reale di questa strada
      // (nessuna web app può cancellare da remoto un evento già copiato altrove).
      const removed = tasks.find((t) => t.id === id);
      if (removed && removed.type !== "quotidiana") openTaskCancelInCalendar(removed);
      persist((prev) => prev.filter((t) => t.id !== id));
    },
    [tasks, persist]
  );

  const toggleSubtask = useCallback(
    (taskId: string, subtaskId: string) => {
      persist((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: t.subtasks.map((s: SubTask) =>
                  s.id === subtaskId ? { ...s, done: !s.done } : s
                ),
              }
            : t
        )
      );
    },
    [persist]
  );

  const toggleShoppingItem = useCallback(
    (taskId: string, itemId: string) => {
      persist((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                shoppingList: t.shoppingList.map((s: ShoppingItem) =>
                  s.id === itemId ? { ...s, done: !s.done } : s
                ),
              }
            : t
        )
      );
    },
    [persist]
  );

  const completeTask = useCallback(
    (id: string): CompleteResult => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return { streak: 0, askSpent: false };

      const nowIso = new Date().toISOString();
      const nextLog =
        task.type === "quotidiana" && !task.completionLog.some((d) => d.slice(0, 10) === nowIso.slice(0, 10))
          ? capArray([...task.completionLog, nowIso], 400)
          : task.completionLog;

      persist((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, completed: true, completedAt: nowIso, completionLog: nextLog } : t
        )
      );

      if (task.linkedPlaceId) {
        logTaskVisit(task.linkedPlaceId, task.linkedPersonIds);
      }

      const linkedPlace = task.linkedPlaceId ? places.find((p) => p.id === task.linkedPlaceId) : undefined;
      const askSpent = task.type === "spesa" || Boolean(linkedPlace && SPENDING_PLACE_TYPES.includes(linkedPlace.type));

      return { streak: computeStreak(nextLog), askSpent };
    },
    [tasks, persist, logTaskVisit, places]
  );

  const uncompleteTask = useCallback(
    (id: string) => {
      const todayKey = new Date().toISOString().slice(0, 10);
      persist((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                completed: false,
                completedAt: undefined,
                // Per le quotidiane, "fatta oggi" si legge da completionLog (vedi
                // app/task/page.tsx, doneToday), non da `completed` — annullare senza
                // togliere anche la voce di oggi qui lasciava la spunta stampata per
                // sempre, perché quel campo non veniva più letto da nessuno.
                completionLog: t.completionLog.filter((d) => d.slice(0, 10) !== todayKey),
              }
            : t
        )
      );
    },
    [persist]
  );

  const setSpentAmount = useCallback(
    (id: string, amount: number, chargedToBudget = true) => {
      persist((prev) => prev.map((t) => (t.id === id ? { ...t, spentAmount: amount, chargedToBudget } : t)));
    },
    [persist]
  );

  const setSpentBreakdown = useCallback(
    (id: string, breakdown: { category: string; amount: number }[], chargedToBudget = true) => {
      const total = breakdown.reduce((sum, b) => sum + b.amount, 0);
      persist((prev) => prev.map((t) => (t.id === id ? { ...t, spentAmount: total, spentBreakdown: breakdown, chargedToBudget } : t)));
    },
    [persist]
  );

  const streakFor = useCallback((task: Task) => computeStreak(task.completionLog), []);

  const value = useMemo(
    () => ({
      hydrated,
      tasks,
      addTask,
      updateTask,
      removeTask,
      toggleSubtask,
      toggleShoppingItem,
      completeTask,
      uncompleteTask,
      setSpentAmount,
      setSpentBreakdown,
      streakFor,
    }),
    [
      hydrated,
      tasks,
      addTask,
      updateTask,
      removeTask,
      toggleSubtask,
      toggleShoppingItem,
      completeTask,
      uncompleteTask,
      setSpentAmount,
      setSpentBreakdown,
      streakFor,
    ]
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks va usato dentro un TasksProvider");
  return ctx;
}
