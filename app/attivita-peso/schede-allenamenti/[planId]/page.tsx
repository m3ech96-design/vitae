"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Plus, Check } from "lucide-react";
import { useWorkoutPlans } from "@/lib/workout-plans-context";
import { WorkoutTableCard } from "@/components/health/workout-plans/WorkoutTableCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function WorkoutPlanDetailPage({ params }: { params: { planId: string } }) {
  const router = useRouter();
  const { hydrated, plans, renamePlan, removePlan, addTable } = useWorkoutPlans();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addingTable, setAddingTable] = useState(false);
  const [tableNameDraft, setTableNameDraft] = useState("");

  if (!hydrated) return null;

  const plan = plans.find((p) => p.id === params.planId);
  if (!plan) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-ink-600">Questa scheda allenamento non esiste più.</p>
        <button
          onClick={() => router.push("/attivita-peso/schede-allenamenti")}
          className="focus-ring mt-4 text-sm text-aura-cyan"
        >
          Torna alle schede
        </button>
      </div>
    );
  }

  const saveName = () => {
    if (nameDraft.trim()) renamePlan(plan.id, nameDraft.trim());
    setEditingName(false);
  };

  const createTable = () => {
    if (!tableNameDraft.trim()) return;
    addTable(plan.id, tableNameDraft.trim());
    setTableNameDraft("");
    setAddingTable(false);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/attivita-peso/schede-allenamenti")}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-aura-violet/50"
          aria-label="Torna alle schede"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          {!editingName && (
            <button
              onClick={() => {
                setNameDraft(plan.name);
                setEditingName(true);
              }}
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-aura-violet/50"
              aria-label="Rinomina scheda"
            >
              <Pencil size={14} />
            </button>
          )}
          <button
            onClick={() => setConfirmDelete(true)}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-aura-pink/50"
            aria-label="Elimina scheda"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {editingName ? (
        <div className="mt-4 flex items-center gap-1.5">
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && saveName()}
            className="focus-ring min-w-0 flex-1 rounded-xl2 border border-aura-violet/40 bg-white/[0.05] px-3 py-2 font-display text-xl text-ink-100"
          />
          <button onClick={saveName} className="focus-ring text-aura-emerald" aria-label="Conferma">
            <Check size={18} />
          </button>
        </div>
      ) : (
        <h1 className="mt-4 font-display text-2xl text-ink-100">{plan.name}</h1>
      )}

      <div className="mt-6 space-y-4">
        {plan.tables.map((table) => (
          <WorkoutTableCard key={table.id} planId={plan.id} table={table} />
        ))}
      </div>

      {addingTable ? (
        <div className="mt-4 flex items-center gap-1.5">
          <input
            value={tableNameDraft}
            onChange={(e) => setTableNameDraft(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && createTable()}
            placeholder="Nome tabella, es. Push day"
            className="focus-ring min-w-0 flex-1 rounded-xl2 border border-aura-violet/40 bg-white/[0.05] px-4 py-3 text-sm text-ink-100 placeholder:text-ink-800"
          />
          <button onClick={createTable} className="focus-ring text-aura-emerald" aria-label="Crea tabella">
            <Check size={18} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAddingTable(true)}
          className="focus-ring mt-4 flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-3.5 text-sm text-ink-400 transition hover:border-aura-violet/50 hover:text-ink-100"
        >
          <Plus size={15} /> Aggiungi tabella
        </button>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminare questa scheda allenamento?"
          description="Tutte le sue tabelle ed esercizi andranno persi. L'azione non si può annullare."
          onConfirm={() => {
            removePlan(plan.id);
            router.push("/attivita-peso/schede-allenamenti");
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
