"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ListChecks, CalendarDays, Flame, Check, ListTodo } from "lucide-react";
import { useTasks } from "@/lib/tasks-context";
import { Task, TaskType, TASK_TYPE_LABEL } from "@/lib/types";
import { taskOccursOnDate } from "@/lib/recurrence";
import { taskCategory, TaskCategory, STREAK_MILESTONES } from "@/lib/task-status";
import { spendCategoriesFor } from "@/lib/spending-categories";
import { usePlaces } from "@/lib/places-context";
import { useMood } from "@/lib/mood-context";
import { todayIso } from "@/lib/date-format";
import { TaskCard } from "@/components/task/TaskCard";
import { TaskWindow } from "@/components/task/TaskWindow";
import { NewTaskModal } from "@/components/task/NewTaskModal";
import { SpentPrompt } from "@/components/ui/SpentPrompt";
import { DayStrip } from "@/components/task/DayStrip";

const OTHER_TYPES: TaskType[] = ["evento", "appuntamento", "promemoria", "obiettivo", "spesa"];
const CATEGORIES: { id: TaskCategory; label: string }[] = [
  { id: "attive", label: "Attive" },
  { id: "non-completate", label: "Non completate" },
  { id: "completate", label: "Completate" },
];

export default function TaskPage() {
  const { hydrated, tasks, streakFor, completeTask, uncompleteTask, setSpentBreakdown } = useTasks();
  const { fireTrigger } = useMood();
  const { places } = usePlaces();
  const [addOpen, setAddOpen] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [spentPromptId, setSpentPromptId] = useState<string | null>(null);
  const [view, setView] = useState<"elenco" | "calendario">("elenco");
  const [typeFilter, setTypeFilter] = useState<TaskType | "tutti">("tutti");
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory>("attive");
  const [selectedDay, setSelectedDay] = useState(todayIso());

  const dailyActivities = useMemo(() => tasks.filter((t) => t.type === "quotidiana"), [tasks]);

  const otherTasks = useMemo(() => {
    let list = tasks.filter((t) => t.type !== "quotidiana" && taskCategory(t) === categoryFilter);
    if (typeFilter !== "tutti") list = list.filter((t) => t.type === typeFilter);
    return [...list].sort((a, b) => {
      const da = `${a.date}T${a.time || "23:59"}`;
      const db = `${b.date}T${b.time || "23:59"}`;
      return categoryFilter === "completate" ? db.localeCompare(da) : da.localeCompare(db);
    });
  }, [tasks, typeFilter, categoryFilter]);

  const calendarTasks = useMemo(
    () =>
      [...tasks]
        .filter((t) => taskOccursOnDate(t, selectedDay))
        .sort((a, b) => (a.time || "").localeCompare(b.time || "")),
    [tasks, selectedDay]
  );

  const openTask: Task | undefined = tasks.find((t) => t.id === openTaskId);

  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Task</p>
          <h1 className="mt-1 font-display text-2xl text-ink-100">Le tue giornate</h1>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="focus-ring flex items-center gap-1.5 rounded-full bg-aura-gradient px-4 py-2.5 text-xs font-display text-void-950 shadow-glow"
        >
          <Plus size={15} /> Task
        </button>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          onClick={() => setView("elenco")}
          className={`focus-ring flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs transition ${
            view === "elenco" ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-600"
          }`}
        >
          <ListChecks size={14} /> Elenco
        </button>
        <button
          onClick={() => setView("calendario")}
          className={`focus-ring flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs transition ${
            view === "calendario" ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-600"
          }`}
        >
          <CalendarDays size={14} /> Calendario
        </button>
      </div>

      {view === "elenco" ? (
        <>
          {dailyActivities.length > 0 && (
            <div className="mt-7">
              <p className="mb-3 font-display text-xs uppercase tracking-[0.14em] text-ink-600">
                Attività quotidiane
              </p>
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                {dailyActivities.map((t) => {
                  const streak = streakFor(t);
                  const doneToday = t.completionLog.some((d) => d.slice(0, 10) === todayIso());
                  const subtaskTotal = t.subtasks.length;
                  const subtaskDone = t.subtasks.filter((s) => s.done).length;
                  const hasSubtasks = subtaskTotal > 0;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        // Con sub-task, il tap apre il dettaglio invece di completare subito:
                        // lì si vedono, si spuntano una per una, e si può comunque segnare
                        // l'intera attività come fatta — evita di chiudere per errore
                        // un'attività composta da più passaggi con un tap solo.
                        if (hasSubtasks) {
                          setOpenTaskId(t.id);
                          return;
                        }
                        if (doneToday) uncompleteTask(t.id);
                        else {
                          const result = completeTask(t.id);
                          if (result.askSpent) setSpentPromptId(t.id);
                          fireTrigger("task:quotidiana");
                          if (STREAK_MILESTONES.includes(result.streak)) fireTrigger("task:streak");
                        }
                      }}
                      className="flex shrink-0 flex-col items-start gap-2 rounded-xl2 border p-3.5 text-left transition-all"
                      style={{
                        borderColor: doneToday ? `${t.color}88` : "rgba(255,255,255,0.08)",
                        background: doneToday ? `${t.color}1a` : "rgba(255,255,255,0.02)",
                        minWidth: 140,
                      }}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                            doneToday ? "border-transparent" : "border-white/25"
                          }`}
                          style={doneToday ? { background: t.color } : undefined}
                        >
                          {doneToday && <Check size={12} className="text-void-950" />}
                        </span>
                        {streak >= 2 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-aura-amber">
                            <Flame size={11} /> {streak}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-ink-100">{t.title}</p>
                      {hasSubtasks && (
                        <div className="flex w-full items-center gap-1.5">
                          <ListTodo size={11} className="shrink-0 text-ink-800" />
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-aura-cyan/70"
                              style={{ width: `${(subtaskDone / subtaskTotal) * 100}%` }}
                            />
                          </div>
                          <span className="shrink-0 text-[11px] text-ink-800">
                            {subtaskDone}/{subtaskTotal}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-7">
            <div className="mb-3 flex gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  className={`focus-ring flex-1 rounded-full border px-3 py-2 text-center text-[11px] transition ${
                    categoryFilter === c.id
                      ? c.id === "non-completate"
                        ? "border-aura-pink/60 bg-aura-pink/15 text-ink-100"
                        : "border-aura-violet/60 bg-aura-violet/15 text-ink-100"
                      : "border-white/10 text-ink-800"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="mb-3 flex gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setTypeFilter("tutti")}
                className={`focus-ring shrink-0 rounded-full border px-3 py-1.5 text-[11px] transition ${
                  typeFilter === "tutti" ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-800"
                }`}
              >
                Tutti
              </button>
              {OTHER_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`focus-ring shrink-0 rounded-full border px-3 py-1.5 text-[11px] transition ${
                    typeFilter === t ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-800"
                  }`}
                >
                  {TASK_TYPE_LABEL[t]}
                </button>
              ))}
            </div>

            <div className="space-y-2.5">
              {otherTasks.length === 0 && (
                <p className="py-10 text-center text-sm text-ink-800">
                  {categoryFilter === "attive"
                    ? "Nessuna task attiva per ora."
                    : categoryFilter === "non-completate"
                    ? "Nessuna task scaduta senza spunta."
                    : "Nessuna task completata ancora."}
                </p>
              )}
              <AnimatePresence initial={false}>
                {otherTasks.map((t) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={false}
                    exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.94 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <TaskCard
                      task={t}
                      onOpen={() => setOpenTaskId(t.id)}
                      onCompleted={(r) => r.askSpent && setSpentPromptId(r.taskId)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-6">
          <DayStrip
            selected={selectedDay}
            onSelect={setSelectedDay}
            hasTasks={(iso) => tasks.some((t) => taskOccursOnDate(t, iso))}
          />
          <div className="mt-5 space-y-2.5">
            {calendarTasks.length === 0 && (
              <p className="py-10 text-center text-sm text-ink-800">Nessuna task in questo giorno.</p>
            )}
            {calendarTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onOpen={() => setOpenTaskId(t.id)}
                onCompleted={(r) => r.askSpent && setSpentPromptId(r.taskId)}
              />
            ))}
          </div>
        </div>
      )}

      {addOpen && <NewTaskModal onClose={() => setAddOpen(false)} />}
      {openTask && <TaskWindow task={openTask} onClose={() => setOpenTaskId(null)} />}
      {spentPromptId &&
        (() => {
          const promptTask = tasks.find((t) => t.id === spentPromptId);
          const promptPlace = promptTask?.linkedPlaceId ? places.find((p) => p.id === promptTask.linkedPlaceId) : undefined;
          return (
            <SpentPrompt
              splitCategories={spendCategoriesFor(promptPlace?.type)}
              onConfirm={(breakdown, chargedToBudget) => setSpentBreakdown(spentPromptId, breakdown, chargedToBudget)}
              onClose={() => setSpentPromptId(null)}
            />
          );
        })()}
    </div>
  );
}
