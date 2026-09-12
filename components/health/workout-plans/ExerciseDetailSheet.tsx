"use client";
import { Pencil, Trash2 } from "lucide-react";
import { WorkoutPlanExercise } from "@/lib/types";
import { PersonalCardSheet } from "@/components/home/PersonalCardSheet";
import { Button } from "@/components/ui/Button";
import { ExerciseMediaPlayer } from "./ExerciseMediaPlayer";

export function ExerciseDetailSheet({
  exercise,
  onEdit,
  onDelete,
  onClose,
}: {
  exercise: WorkoutPlanExercise;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <PersonalCardSheet title={exercise.name} onClose={onClose}>
      <div className="space-y-4">
        {exercise.mediaType && <ExerciseMediaPlayer exercise={exercise} />}
        {exercise.reps && (
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-ink-600">Ripetizioni</p>
            <p className="mt-1 text-sm text-ink-100">{exercise.reps}</p>
          </div>
        )}
        {exercise.note && (
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-ink-600">Nota</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink-300">{exercise.note}</p>
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <Button variant="danger" size="sm" onClick={onDelete}>
            <Trash2 size={13} />
          </Button>
          <Button variant="outline" size="sm" className="flex-1 justify-center" onClick={onEdit}>
            <Pencil size={13} /> Modifica
          </Button>
        </div>
      </div>
    </PersonalCardSheet>
  );
}
