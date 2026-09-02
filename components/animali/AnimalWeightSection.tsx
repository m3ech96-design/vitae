"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useAnimalHealth, AnimalWeightEntry } from "@/lib/animal-health-context";
import { todayIso } from "@/lib/date-format";
import { MiniLineChart } from "../medical/MiniLineChart";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";

export function AnimalWeightSection({ animalId, weightEntries }: { animalId: string; weightEntries: AnimalWeightEntry[] }) {
  const { addWeightEntry } = useAnimalHealth();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayIso());
  const [value, setValue] = useState("");

  const submit = () => {
    const n = parseFloat(value.replace(",", "."));
    if (Number.isNaN(n) || n <= 0) return;
    addWeightEntry({ animalId, date, value: n });
    setValue("");
    setDate(todayIso());
    setOpen(false);
  };

  return (
    <div>
      <MiniLineChart points={weightEntries.map((e) => ({ date: e.date, value: e.value }))} unit="kg" color="#00E5C7" />

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-ink-600 hover:border-aura-violet/50 hover:text-ink-200"
        >
          <Plus size={14} /> Registra peso
        </button>
      ) : (
        <div className="mt-3 space-y-2.5 rounded-xl2 border border-aura-violet/30 bg-white/[0.03] p-3">
          <div className="grid grid-cols-2 gap-2.5">
            <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <TextField label="Peso (kg)" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button size="sm" onClick={submit} disabled={!value.trim()}>
              Salva
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
