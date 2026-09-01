"use client";
import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { todayIso } from "@/lib/date-format";
import { WeightEntry } from "@/lib/types";
import { useHealth } from "@/lib/health-context";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";

/** Con `entry` passato si modifica una pesata già registrata invece di aggiungerne una
 * nuova — stesso foglio, così non serve un secondo componente quasi identico. */
export function WeightModal({ entry, onClose }: { entry?: WeightEntry; onClose: () => void }) {
  const { addWeightEntry, updateWeightEntry, removeWeightEntry, weightGoal, setWeightGoal } = useHealth();
  const [value, setValue] = useState(entry ? String(entry.value) : "");
  const [date, setDate] = useState(entry ? entry.date : todayIso());
  const [goalDraft, setGoalDraft] = useState(weightGoal !== null ? String(weightGoal) : "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const submit = () => {
    const v = parseFloat(value.replace(",", "."));
    if (!Number.isNaN(v) && v > 0) {
      if (entry) updateWeightEntry(entry.id, { value: v, date });
      else addWeightEntry(v, date);
    }
    if (!entry) {
      const g = parseFloat(goalDraft.replace(",", "."));
      setWeightGoal(!Number.isNaN(g) && g > 0 ? g : null);
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
        className="glass-strong w-full max-w-xs rounded-t-xl3 p-6 sm:rounded-xl3"
      >
        <div className="mb-5 flex items-center justify-between">
          <p className="font-display text-lg text-ink-100">{entry ? "Modifica pesata" : "Registra peso"}</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          <TextField label="Peso (kg)" inputMode="decimal" placeholder="72,5" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          {!entry && (
            <TextField label="Obiettivo (facoltativo)" inputMode="decimal" placeholder="Es. 70" value={goalDraft} onChange={(e) => setGoalDraft(e.target.value)} />
          )}
        </div>
        <div className="mt-6 flex gap-2">
          {entry && (
            <Button variant="danger" className="justify-center" onClick={() => setConfirmDelete(true)} aria-label="Elimina pesata">
              <Trash2 size={14} />
            </Button>
          )}
          <Button className="flex-1 justify-center" onClick={submit} disabled={!value.trim()}>
            Salva
          </Button>
        </div>
      </motion.div>

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminare questa pesata?"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            if (entry) removeWeightEntry(entry.id);
            onClose();
          }}
        />
      )}
    </div>
  );
}
