"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Clock, Flame, Trash2, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { Workout } from "@/lib/types";
import { categoryOf, activityLabel } from "@/lib/activity-catalog";
import { formatDateShort } from "@/lib/date-format";
import { useHealth } from "@/lib/health-context";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";

export function WorkoutDetail({ workout, onClose }: { workout: Workout; onClose: () => void }) {
  const { updateWorkout, removeWorkout } = useHealth();
  const cat = categoryOf(workout.activityId);
  const Icon = cat.icon;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [minutes, setMinutes] = useState(String(workout.minutes));
  const [calories, setCalories] = useState(String(workout.calories));
  const [date, setDate] = useState(workout.date);

  const save = () => {
    const m = Math.max(1, Math.round(parseFloat(minutes.replace(",", ".")) || workout.minutes));
    const c = Math.max(0, Math.round(parseFloat(calories.replace(",", ".")) || 0));
    updateWorkout(workout.id, { minutes: m, calories: c, date });
    setEditing(false);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong w-full max-w-xs rounded-t-xl3 p-6 sm:rounded-xl3"
      >
        <div className="mb-4 flex items-start justify-between">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: `${cat.color}22` }}
          >
            <Icon size={22} style={{ color: cat.color }} />
          </span>
          <div className="flex items-center gap-1">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="focus-ring rounded-full p-1.5 text-ink-600 hover:text-ink-200"
                aria-label="Modifica"
              >
                <Pencil size={16} />
              </button>
            )}
            <button onClick={onClose} className="focus-ring rounded-full p-1.5 text-ink-600 hover:text-ink-200" aria-label="Chiudi">
              <X size={18} />
            </button>
          </div>
        </div>
        <p className="font-display text-lg text-ink-100">{activityLabel(workout.activityId)}</p>

        {!editing ? (
          <>
            <p className="mb-4 text-xs text-ink-600">{formatDateShort(workout.date)}</p>
            <div className="flex gap-4 text-sm text-ink-400">
              <span className="flex items-center gap-1.5">
                <Clock size={14} /> {workout.minutes} min
              </span>
              <span className="flex items-center gap-1.5">
                <Flame size={14} /> {workout.calories} kcal
              </span>
            </div>
            <Button variant="danger" size="sm" className="mt-6 w-full justify-center" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={13} /> Elimina
            </Button>
          </>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <TextField label="Minuti" type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} autoFocus />
              <TextField label="Calorie" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
            </div>
            <div className="mt-3">
              <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1 justify-center" onClick={() => setEditing(false)}>
                Annulla
              </Button>
              <Button size="sm" className="flex-1 justify-center" onClick={save}>
                Salva
              </Button>
            </div>
          </>
        )}
      </motion.div>

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminare questa attività?"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            removeWorkout(workout.id);
            onClose();
          }}
        />
      )}
    </div>,
    document.body
  );
}
