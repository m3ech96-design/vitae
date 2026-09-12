"use client";
import { useState } from "react";
import { Check, Pencil, Trash2, Plus } from "lucide-react";
import { useWorkoutPlans } from "@/lib/workout-plans-context";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function WorkoutTableHeader({
  planId,
  tableId,
  name,
  onAddExercise,
}: {
  planId: string;
  tableId: string;
  name: string;
  onAddExercise: () => void;
}) {
  const { renameTable, removeTable } = useWorkoutPlans();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = () => {
    if (draft.trim()) renameTable(planId, tableId, draft.trim());
    setEditing(false);
  };

  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      {editing ? (
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="focus-ring min-w-0 flex-1 rounded-lg border border-aura-violet/40 bg-white/[0.05] px-2 py-1 text-sm text-ink-100"
          />
          <button onClick={save} className="focus-ring shrink-0 text-aura-emerald" aria-label="Conferma">
            <Check size={14} />
          </button>
        </div>
      ) : (
        <p className="min-w-0 truncate font-display text-sm text-ink-100">{name}</p>
      )}
      <div className="flex shrink-0 items-center gap-2.5">
        {!editing && (
          <>
            <button onClick={onAddExercise} className="focus-ring text-ink-800 hover:text-aura-violet" aria-label="Aggiungi esercizio">
              <Plus size={15} />
            </button>
            <button
              onClick={() => {
                setDraft(name);
                setEditing(true);
              }}
              className="focus-ring text-ink-800 hover:text-ink-200"
              aria-label="Rinomina tabella"
            >
              <Pencil size={13} />
            </button>
          </>
        )}
        <button onClick={() => setConfirmDelete(true)} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label="Elimina tabella">
          <Trash2 size={13} />
        </button>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminare questa tabella?"
          description="Tutti gli esercizi al suo interno andranno persi. L'azione non si può annullare."
          onConfirm={() => {
            removeTable(planId, tableId);
            setConfirmDelete(false);
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
