"use client";
import { useState } from "react";
import { X, Clock, Flame, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Workout } from "@/lib/types";
import { categoryOf, activityLabel } from "@/lib/activity-catalog";
import { formatDateShort } from "@/lib/date-format";
import { useHealth } from "@/lib/health-context";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";

export function WorkoutDetail({ workout, onClose }: { workout: Workout; onClose: () => void }) {
  const { removeWorkout } = useHealth();
  const cat = categoryOf(workout.activityId);
  const Icon = cat.icon;
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
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
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>
        <p className="font-display text-lg text-ink-100">{activityLabel(workout.activityId)}</p>
        <p className="mb-4 text-xs text-ink-600">{formatDateShort(workout.date)}</p>
        <div className="flex gap-4 text-sm text-ink-400">
          <span className="flex items-center gap-1.5">
            <Clock size={14} /> {workout.minutes} Min
          </span>
          <span className="flex items-center gap-1.5">
            <Flame size={14} /> {workout.calories} Kcal
          </span>
        </div>
        <Button variant="danger" size="sm" className="mt-6 w-full justify-center" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={13} /> Elimina
        </Button>
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
    </div>
  );
}
