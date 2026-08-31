"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { todayIso } from "@/lib/date-format";
import { useHealth } from "@/lib/health-context";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";

export function WeightModal({ onClose }: { onClose: () => void }) {
  const { addWeightEntry, weightGoal, setWeightGoal } = useHealth();
  const [value, setValue] = useState("");
  const [date, setDate] = useState(todayIso());
  const [goalDraft, setGoalDraft] = useState(weightGoal !== null ? String(weightGoal) : "");

  const submit = () => {
    const v = parseFloat(value.replace(",", "."));
    if (!Number.isNaN(v) && v > 0) addWeightEntry(v, date);
    const g = parseFloat(goalDraft.replace(",", "."));
    setWeightGoal(!Number.isNaN(g) && g > 0 ? g : null);
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
          <p className="font-display text-lg text-ink-100">Registra peso</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          <TextField label="Peso (kg)" inputMode="decimal" placeholder="72,5" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <TextField label="Obiettivo (facoltativo)" inputMode="decimal" placeholder="Es. 70" value={goalDraft} onChange={(e) => setGoalDraft(e.target.value)} />
        </div>
        <Button className="mt-6 w-full justify-center" onClick={submit} disabled={!value.trim()}>
          Salva
        </Button>
      </motion.div>
    </div>
  );
}
