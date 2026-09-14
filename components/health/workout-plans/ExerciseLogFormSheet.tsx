"use client";
import { useState } from "react";
import { ExerciseLogEntry } from "@/lib/types";
import { todayIso } from "@/lib/date-format";
import { PersonalCardSheet } from "@/components/home/PersonalCardSheet";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";

export function ExerciseLogFormSheet({
  exerciseName,
  onSave,
  onClose,
}: {
  exerciseName: string;
  onSave: (entry: Omit<ExerciseLogEntry, "id">) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(todayIso());
  const [weightKg, setWeightKg] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState("1");

  const weightNum = parseFloat(weightKg.replace(",", "."));
  const repsNum = parseInt(reps, 10);
  const setsNum = parseInt(sets, 10) || 1;
  const canSave = weightKg.trim() !== "" && !Number.isNaN(weightNum) && !Number.isNaN(repsNum) && repsNum > 0;

  const submit = () => {
    if (!canSave) return;
    onSave({ date, weightKg: weightNum, reps: repsNum, sets: setsNum });
    onClose();
  };

  return (
    <PersonalCardSheet title={`Registra · ${exerciseName}`} onClose={onClose}>
      <div className="space-y-3">
        <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="grid grid-cols-3 gap-2.5">
          <TextField
            label="Peso (kg)"
            type="number"
            inputMode="decimal"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="60"
            autoFocus
          />
          <TextField
            label="Ripetizioni"
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="10"
          />
          <TextField
            label="Serie"
            type="number"
            inputMode="numeric"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            placeholder="1"
          />
        </div>
        <Button className="w-full justify-center" onClick={submit} disabled={!canSave}>
          Salva sessione
        </Button>
      </div>
    </PersonalCardSheet>
  );
}
