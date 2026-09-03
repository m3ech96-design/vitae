"use client";
import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { useMedical, VitalType } from "@/lib/medical-context";
import { formatDateShort, todayIso } from "@/lib/date-format";
import { MiniLineChart } from "./MiniLineChart";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";

const VITAL_TYPES: { id: VitalType; label: string; unit: string; color: string }[] = [
  { id: "pressione", label: "Pressione", unit: "mmHg", color: "#FF6B9D" },
  { id: "battito", label: "Battito", unit: "bpm", color: "#00E5C7" },
  { id: "glicemia", label: "Glicemia", unit: "mg/dL", color: "#FFB454" },
];

export function VitalsSection() {
  const { vitals, addVital, removeVital } = useMedical();
  const [tab, setTab] = useState<VitalType>("pressione");
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayIso());
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [value, setValue] = useState("");

  const current = VITAL_TYPES.find((v) => v.id === tab)!;
  const entriesOfType = useMemo(() => vitals.filter((v) => v.type === tab).sort((a, b) => b.date.localeCompare(a.date)), [vitals, tab]);

  const chartPoints = useMemo(
    () =>
      entriesOfType
        .map((e) => ({ date: e.date, value: tab === "pressione" ? e.systolic ?? 0 : e.value ?? 0 }))
        .filter((p) => p.value > 0),
    [entriesOfType, tab]
  );

  const submit = () => {
    if (tab === "pressione") {
      const s = parseInt(systolic, 10);
      const d = parseInt(diastolic, 10);
      if (!s || !d) return;
      addVital({ type: "pressione", date, systolic: s, diastolic: d });
    } else {
      const v = parseFloat(value.replace(",", "."));
      if (!v) return;
      addVital({ type: tab, date, value: v });
    }
    setSystolic("");
    setDiastolic("");
    setValue("");
    setDate(todayIso());
    setOpen(false);
  };

  return (
    <div>
      <div className="mb-3 flex gap-1.5">
        {VITAL_TYPES.map((v) => (
          <button
            key={v.id}
            onClick={() => {
              setTab(v.id);
              setOpen(false);
            }}
            className="focus-ring rounded-full border px-3 py-1.5 text-xs transition"
            style={{
              borderColor: tab === v.id ? v.color : "rgba(255,255,255,0.1)",
              background: tab === v.id ? `${v.color}22` : "transparent",
              color: tab === v.id ? "#F1F1FA" : "#8B90A8",
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      <MiniLineChart points={chartPoints} unit={tab === "pressione" ? "mmHg (sistolica)" : current.unit} color={current.color} />

      <div className="mt-4 space-y-2">
        {entriesOfType.slice(0, 8).map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
            <div>
              <p className="text-sm text-ink-100">
                {e.type === "pressione" ? `${e.systolic}/${e.diastolic} mmHg` : `${e.value} ${current.unit}`}
              </p>
              <p className="text-[11px] text-ink-800">{formatDateShort(e.date)}</p>
            </div>
            <button onClick={() => removeVital(e.id)} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
              <X size={14} />
            </button>
          </div>
        ))}

        {!open ? (
          <button
            onClick={() => setOpen(true)}
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-ink-600 hover:border-aura-violet/50 hover:text-ink-200"
          >
            <Plus size={14} /> Registra {current.label.toLowerCase()}
          </button>
        ) : (
          <div className="space-y-2.5 rounded-xl2 border border-aura-violet/30 bg-white/[0.03] p-3">
            {tab === "pressione" ? (
              <div className="grid grid-cols-2 gap-2.5">
                <TextField label="Sistolica" type="number" value={systolic} onChange={(e) => setSystolic(e.target.value)} placeholder="120" autoFocus />
                <TextField label="Diastolica" type="number" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} placeholder="80" />
              </div>
            ) : (
              <TextField label={`${current.label} (${current.unit})`} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
            )}
            <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Annulla
              </Button>
              <Button size="sm" onClick={submit}>
                Salva
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
