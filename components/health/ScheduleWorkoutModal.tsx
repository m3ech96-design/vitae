"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTasks } from "@/lib/tasks-context";
import { TASK_COLORS } from "@/lib/task-colors";
import { openTaskInCalendar } from "@/lib/ics";
import { todayIso } from "@/lib/date-format";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";

/**
 * "Pianifica un allenamento futuro" — non un sistema di programmazione a parte: usa
 * direttamente il sistema di Task già esistente (tipo "Evento"), con lo stesso promemoria e
 * la stessa possibilità di finire nel calendario di sistema che ha ogni altro evento
 * dell'app. Niente di nuovo da mantenere, solo un accesso più corto da qui.
 */
export function ScheduleWorkoutModal({ onClose }: { onClose: () => void }) {
  const { addTask } = useTasks();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState("18:00");

  const submit = () => {
    if (!title.trim()) return;
    const created = addTask({
      title: title.trim(),
      type: "evento",
      date,
      time,
      reminderOffset: "1h",
      recurrence: "nessuna",
      customDays: [],
      color: TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)],
      priority: "nessuna",
      tags: ["allenamento"],
      linkedPersonIds: [],
      subtasks: [],
      shoppingList: [],
    });
    openTaskInCalendar(created);
    onClose();
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <div className="glass-strong w-full max-w-xs rounded-t-xl3 p-6 sm:rounded-xl3">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-lg text-ink-100">Pianifica un allenamento</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          <TextField label="Cosa" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es. Palestra, corsa al parco" autoFocus />
          <div className="grid grid-cols-2 gap-2.5">
            <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <TextField label="Ora" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <p className="mt-3 text-[11px] text-ink-800">
          Diventa un Evento nella scheda Task, con promemoria un'ora prima — e ti viene
          offerto subito di aggiungerlo anche al calendario di sistema.
        </p>
        <Button className="mt-5 w-full justify-center" onClick={submit} disabled={!title.trim()}>
          Pianifica
        </Button>
      </div>
    </div>,
    document.body
  );
}
