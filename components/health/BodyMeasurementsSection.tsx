"use client";
import { useMemo, useState } from "react";
import { Plus, X, Ruler } from "lucide-react";
import { useHealth } from "@/lib/health-context";
import { todayIso, formatDateShort } from "@/lib/date-format";
import { MiniLineChart } from "../medical/MiniLineChart";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";

/** Come le Analisi Del Sangue in Salute: nome libero (Vita, Petto, Braccia, quello che
 * conta per la persona), non un elenco chiuso di misure — ognuno ha le sue. */
export function BodyMeasurementsSection() {
  const { measurements, addMeasurement, removeMeasurement } = useHealth();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("cm");
  const [date, setDate] = useState(todayIso());

  const names = useMemo(() => [...new Set(measurements.map((m) => m.name))], [measurements]);
  const activeName = selected ?? names[0] ?? null;
  const chartPoints = useMemo(
    () => measurements.filter((m) => m.name === activeName).map((m) => ({ date: m.date, value: m.value })),
    [measurements, activeName]
  );
  const activeUnit = measurements.find((m) => m.name === activeName)?.unit ?? "cm";
  const history = useMemo(
    () => measurements.filter((m) => m.name === activeName).sort((a, b) => b.date.localeCompare(a.date)),
    [measurements, activeName]
  );

  const submit = () => {
    const v = parseFloat(value.replace(",", "."));
    if (!name.trim() || !v) return;
    addMeasurement({ name: name.trim(), value: v, unit: unit.trim() || "cm", date });
    setValue("");
    setDate(todayIso());
    setOpen(false);
    setSelected(name.trim());
  };

  return (
    <div>
      {names.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {names.map((n) => (
            <button
              key={n}
              onClick={() => setSelected(n)}
              className={`focus-ring rounded-full border px-3 py-1.5 text-xs transition ${
                activeName === n ? "border-aura-emerald/60 bg-aura-emerald/15 text-ink-100" : "border-white/10 text-ink-600"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {activeName ? (
        <>
          <MiniLineChart points={chartPoints} unit={activeUnit} color="#34D399" />
          <div className="mt-3 space-y-1.5">
            {history.slice(0, 6).map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm">
                <span className="text-ink-100">
                  {m.value} {m.unit}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-ink-800">{formatDateShort(m.date)}</span>
                  <button onClick={() => removeMeasurement(m.id)} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="py-4 text-center text-xs text-ink-800">Nessuna misura registrata ancora.</p>
      )}

      {!open ? (
        <button
          onClick={() => {
            setName(activeName ?? "");
            setUnit(activeUnit);
            setOpen(true);
          }}
          className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-ink-600 hover:border-aura-emerald/50 hover:text-ink-200"
        >
          <Plus size={14} /> <Ruler size={13} /> Registra misura
        </button>
      ) : (
        <div className="mt-3 space-y-2.5 rounded-xl2 border border-aura-emerald/30 bg-white/[0.03] p-3">
          <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Vita, petto, braccio destro" autoFocus />
          <div className="grid grid-cols-2 gap-2.5">
            <TextField label="Valore" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="80" />
            <TextField label="Unità" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="cm" />
          </div>
          <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button size="sm" onClick={submit} disabled={!name.trim() || !value.trim()}>
              Salva
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
