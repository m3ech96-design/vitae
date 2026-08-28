"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { Recurrence, Task } from "@/lib/types";
import { TASK_COLORS } from "@/lib/task-colors";
import { capitalizeSentence } from "@/lib/text";
import { todayIso } from "@/lib/date-format";
import { useTasks } from "@/lib/tasks-context";
import { Button } from "../ui/Button";
import { TaskFieldsForm, TaskDraftFields } from "./TaskFieldsForm";

const EMPTY: TaskDraftFields = {
  title: "",
  notes: "",
  type: "evento",
  date: todayIso(),
  time: "",
  endTime: "",
  dueDate: "",
  dueTime: "",
  reminderOffset: "none",
  recurrence: "nessuna",
  customDays: [],
  color: TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)],
  priority: "nessuna",
  tags: [],
  linkedPersonIds: [],
  linkedPlaceId: "",
  subtasks: [],
  shoppingList: [],
};

function draftFromTask(task: Task): TaskDraftFields {
  return {
    title: task.title,
    notes: task.notes || "",
    type: task.type,
    date: task.date,
    time: task.time || "",
    endTime: task.endTime || "",
    dueDate: task.dueDate || "",
    dueTime: task.dueTime || "",
    reminderOffset: task.reminderOffset,
    recurrence: task.recurrence,
    customDays: task.customDays,
    color: task.color,
    priority: task.priority,
    tags: task.tags,
    linkedPersonIds: task.linkedPersonIds,
    linkedPlaceId: task.linkedPlaceId || "",
    subtasks: task.subtasks,
    shoppingList: task.shoppingList,
  };
}

export function NewTaskModal({ onClose, task }: { onClose: () => void; task?: Task }) {
  const { addTask, updateTask } = useTasks();
  const [draft, setDraft] = useState<TaskDraftFields>(task ? draftFromTask(task) : EMPTY);

  const patch = (p: Partial<TaskDraftFields>) => setDraft((d) => ({ ...d, ...p }));

  const submit = () => {
    if (!draft.title.trim() || !draft.date) return;
    const effectiveRecurrence: Recurrence = draft.type === "quotidiana" ? "quotidiano" : draft.recurrence;
    const payload = {
      title: capitalizeSentence(draft.title.trim()),
      notes: draft.notes.trim() ? capitalizeSentence(draft.notes.trim()) : undefined,
      type: draft.type,
      date: draft.date,
      time: draft.time || undefined,
      endTime: draft.endTime || undefined,
      dueDate: draft.dueDate || undefined,
      dueTime: draft.dueTime || undefined,
      reminderOffset: draft.reminderOffset,
      recurrence: effectiveRecurrence,
      customDays: draft.customDays,
      color: draft.color,
      priority: draft.priority,
      tags: draft.tags,
      linkedPersonIds: draft.linkedPersonIds,
      linkedPlaceId: draft.linkedPlaceId || undefined,
      subtasks: draft.subtasks,
      shoppingList: draft.type === "spesa" ? draft.shoppingList : [],
    };
    if (task) {
      updateTask(task.id, payload);
    } else {
      addTask(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[92vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 relative z-10 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">{task ? "Modifica Task" : "Nuova Task"}</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <TaskFieldsForm value={draft} onChange={patch} />
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <Button className="w-full justify-center" onClick={submit} disabled={!draft.title.trim() || !draft.date}>
            {task ? "Salva Modifiche" : "Crea Task"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
