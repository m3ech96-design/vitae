"use client";
import { useState } from "react";
import { ListChecks } from "lucide-react";
import { WorkoutPlanTable, WorkoutPlanExercise } from "@/lib/types";
import { useWorkoutPlans } from "@/lib/workout-plans-context";
import { GlassCard } from "@/components/ui/GlassCard";
import { WorkoutTableHeader } from "./WorkoutTableHeader";
import { ExerciseRow } from "./ExerciseRow";
import { ExerciseDetailSheet } from "./ExerciseDetailSheet";
import { ExerciseFormSheet } from "./ExerciseFormSheet";

type Sheet = { kind: "add" } | { kind: "detail"; exerciseId: string } | { kind: "edit"; exerciseId: string };

export function WorkoutTableCard({ planId, table }: { planId: string; table: WorkoutPlanTable }) {
  const { addExercise, updateExercise, removeExercise } = useWorkoutPlans();
  const [sheet, setSheet] = useState<Sheet | null>(null);

  const openExercise: WorkoutPlanExercise | undefined =
    sheet && sheet.kind !== "add" ? table.exercises.find((ex) => ex.id === sheet.exerciseId) : undefined;

  return (
    <GlassCard className="p-4">
      <WorkoutTableHeader planId={planId} tableId={table.id} name={table.name} onAddExercise={() => setSheet({ kind: "add" })} />

      {table.exercises.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 rounded-xl2 border border-dashed border-white/10 py-8 text-center">
          <ListChecks size={16} className="text-ink-800" />
          <p className="text-xs text-ink-600">Nessun esercizio ancora in questa tabella.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {table.exercises.map((ex) => (
            <ExerciseRow key={ex.id} exercise={ex} onClick={() => setSheet({ kind: "detail", exerciseId: ex.id })} />
          ))}
        </div>
      )}

      {sheet?.kind === "add" && (
        <ExerciseFormSheet
          onSave={(input) => addExercise(planId, table.id, input)}
          onClose={() => setSheet(null)}
        />
      )}

      {sheet?.kind === "detail" && openExercise && (
        <ExerciseDetailSheet
          exercise={openExercise}
          onEdit={() => setSheet({ kind: "edit", exerciseId: openExercise.id })}
          onDelete={() => {
            removeExercise(planId, table.id, openExercise.id);
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}

      {sheet?.kind === "edit" && openExercise && (
        <ExerciseFormSheet
          initial={openExercise}
          onSave={(input) => updateExercise(planId, table.id, openExercise.id, input)}
          onDelete={() => {
            removeExercise(planId, table.id, openExercise.id);
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </GlassCard>
  );
}
