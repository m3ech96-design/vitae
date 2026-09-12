"use client";
import { Youtube, Video, ImageIcon, StickyNote } from "lucide-react";
import { WorkoutPlanExercise } from "@/lib/types";

const MEDIA_ICON = { youtube: Youtube, video: Video, image: ImageIcon } as const;

export function ExerciseRow({ exercise, onClick }: { exercise: WorkoutPlanExercise; onClick: () => void }) {
  const MediaIcon = exercise.mediaType ? MEDIA_ICON[exercise.mediaType] : null;
  return (
    <button
      onClick={onClick}
      className="focus-ring flex w-full items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.015] px-4 py-3 text-left transition hover:border-white/20"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink-100">{exercise.name}</p>
        {exercise.reps && <p className="mt-0.5 text-xs text-ink-600">{exercise.reps}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2 text-ink-800">
        {exercise.note && <StickyNote size={13} />}
        {MediaIcon && <MediaIcon size={14} className="text-aura-violet" />}
      </div>
    </button>
  );
}
