"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, MapPin, Flame, Clock, AlertTriangle, ListTodo } from "lucide-react";
import { Task, PRIORITY_TINT, TASK_TYPE_LABEL, taskGroup } from "@/lib/types";
import { formatDateTime } from "@/lib/date-format";
import { taskCategory } from "@/lib/task-status";
import { useHousehold } from "@/lib/household-context";
import { usePlaces } from "@/lib/places-context";
import { useProfile } from "@/lib/profile-context";
import { useTasks } from "@/lib/tasks-context";
import { personColor } from "@/lib/person-color";
import { auraIntensity } from "@/lib/aura-intensity";
import { AuraAvatar } from "../ui/AuraAvatar";
import { useMood } from "@/lib/mood-context";
import { STREAK_MILESTONES } from "@/lib/task-status";

export function TaskCard({
  task,
  onOpen,
  onCompleted,
}: {
  task: Task;
  onOpen: () => void;
  onCompleted?: (result: { askSpent: boolean; taskId: string }) => void;
}) {
  const { profile } = useProfile();
  const { people } = useHousehold();
  const { places } = usePlaces();
  const { completeTask, uncompleteTask, streakFor, tasks } = useTasks();
  const { fireTrigger } = useMood();
  const [burst, setBurst] = useState(false);

  const handleComplete = () => {
    const result = completeTask(task.id);
    onCompleted?.({ ...result, taskId: task.id });
    setBurst(true);
    setTimeout(() => setBurst(false), 650);
    fireTrigger(`task:${task.type}`);
    if (STREAK_MILESTONES.includes(result.streak)) fireTrigger("task:streak");
  };

  const linkedPeople = task.linkedPersonIds.map((id) => people.find((p) => p.id === id)).filter(Boolean);
  const stack = [{ isUser: true }, ...linkedPeople].slice(0, 3) as Array<{ isUser?: boolean } & Partial<(typeof linkedPeople)[number]>>;
  const extra = 1 + linkedPeople.length - stack.length;
  const place = task.linkedPlaceId ? places.find((p) => p.id === task.linkedPlaceId) : undefined;
  const tint = PRIORITY_TINT[task.priority];
  const streak = streakFor(task);
  const group = taskGroup(task.type);
  const category = taskCategory(task);
  const checkable = group !== "tempo";

  const subtitle =
    group === "tempo"
      ? `${formatDateTime(task.date, task.time)}${task.endTime ? ` – ${task.endTime}` : ""}`
      : group === "scadenza" && task.dueDate
      ? `Scade ${formatDateTime(task.dueDate, task.dueTime)}`
      : formatDateTime(task.date, task.time);

  // Riepilogo sub-task per la card compatta: solo conteggio + prossima da fare, mai l'elenco
  // intero — quello resta nel dettaglio (TaskWindow), dove si vedono e si spuntano tutte.
  const subtaskTotal = task.subtasks.length;
  const subtaskDone = task.subtasks.filter((s) => s.done).length;
  const nextSubtask = task.subtasks.find((s) => !s.done);

  return (
    <button
      onClick={onOpen}
      className="focus-ring relative flex w-full items-stretch gap-3 overflow-hidden rounded-xl2 border border-white/[0.06] bg-white/[0.02] p-3 text-left transition hover:border-white/15"
    >
      {tint && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(120px 60px at 100% 0%, ${tint}26, transparent)` }}
        />
      )}
      <span className="relative w-1 shrink-0 rounded-full" style={{ background: task.color }} />

      <div className="relative flex -space-x-3.5 self-center pl-0.5">
        {stack.map((p, i) =>
          p.isUser ? (
            <AuraAvatar
              key="user"
              imageUrl={profile.avatarUrl}
              firstName={profile.firstName}
              lastName={profile.lastName}
              size={36}
              ring="idle"
              glowColor={personColor("user")}
              innerClassName="ring-2 ring-void-900"
            />
          ) : (
            <AuraAvatar
              key={p.id ?? i}
              imageUrl={p.avatarUrl}
              firstName={p.firstName}
              lastName={p.lastName}
              size={36}
              ring="idle"
              glowColor={personColor(p.id ?? "")}
              glowIntensity={p.id ? auraIntensity(p as (typeof linkedPeople)[number] & { id: string }, tasks, places) : 1}
              deceased={p.deceased}
              innerClassName="ring-2 ring-void-900"
            />
          )
        )}
        {extra > 0 && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-void-700 text-[10px] text-ink-400 ring-2 ring-void-900">
            +{extra}
          </span>
        )}
      </div>

      <div className="relative min-w-0 flex-1 py-0.5">
        <p className={`truncate font-display text-sm ${task.completed ? "text-ink-800 line-through" : "text-ink-100"}`}>
          {task.title}
          {task.type === "quotidiana" && streak >= 2 && (
            <motion.span
              key={streak}
              initial={{ scale: 1.7, opacity: 0.35 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 14 }}
              className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-aura-amber"
            >
              <Flame size={11} /> {streak}
            </motion.span>
          )}
        </p>
        <p className={`mt-0.5 text-xs ${category === "non-completate" ? "text-aura-pink" : "text-ink-600"}`}>{subtitle}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-800">
          {place ? (
            <>
              <MapPin size={11} /> {place.name}
            </>
          ) : (
            TASK_TYPE_LABEL[task.type]
          )}
        </p>
        {subtaskTotal > 0 && (
          <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
            <ListTodo size={11} className="shrink-0 text-ink-800" />
            <div className="h-1 w-10 shrink-0 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-aura-cyan/70"
                style={{ width: `${(subtaskDone / subtaskTotal) * 100}%` }}
              />
            </div>
            <span className="min-w-0 truncate text-[11px] text-ink-800">
              {subtaskDone}/{subtaskTotal}
              {nextSubtask ? ` · ${nextSubtask.title}` : ""}
            </span>
          </div>
        )}
      </div>

      {checkable ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (task.completed) {
              uncompleteTask(task.id);
            } else {
              handleComplete();
            }
          }}
          className={`focus-ring relative my-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition ${
            task.completed
              ? "border-aura-cyan/60 bg-aura-cyan/20 text-aura-cyan"
              : category === "non-completate"
              ? "border-aura-pink/50 text-transparent hover:border-aura-pink"
              : "border-white/15 text-transparent hover:border-aura-cyan/50"
          }`}
          aria-label={task.completed ? "Segna come da fare" : "Segna Come Completata"}
        >
          <AnimatePresence>
            {burst && (
              <motion.span
                initial={{ scale: 0.5, opacity: 0.85 }}
                animate={{ scale: 2.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{ background: task.color }}
              />
            )}
          </AnimatePresence>
          {task.completed ? <Check size={14} /> : category === "non-completate" ? <AlertTriangle size={12} className="text-aura-pink" /> : null}
        </button>
      ) : (
        <span
          className={`relative my-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
            task.completed ? "border-aura-cyan/60 bg-aura-cyan/20 text-aura-cyan" : "border-white/10 text-ink-800"
          }`}
        >
          {task.completed ? <Check size={14} /> : <Clock size={13} />}
        </span>
      )}
    </button>
  );
}
