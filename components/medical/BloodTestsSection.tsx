"use client";
import { useMemo, useState } from "react";
import { Plus, X, TrendingUp } from "lucide-react";
import { useMedical } from "@/lib/medical-context";
import { formatDateShort, todayIso } from "@/lib/date-format";
import { newId } from "@/lib/id";
import { MiniLineChart } from "./MiniLineChart";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { PersonalCardSheet } from "../home/PersonalCardSheet";

interface DraftValue {
  key: string;
  name: string;
  value: string;
  unit: string;
}

export function BloodTestsSection() {
  const { bloodTests, addBloodTest, removeBloodTest } = useMedical();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayIso());
  const [lab, setLab] = useState("");
  const [draftValues, setDraftValues] = useState<DraftValue[]>([{ key: newId(), name: "", value: "", unit: "" }]);
  const [trendName, setTrendName] = useState<string | null>(null);

  const sorted = [...bloodTests].sort((a, b) => b.date.localeCompare(a.date));

  const trendPoints = useMemo(() => {
    if (!trendName) return [];
    const points: { date: string; value: number }[] = [];
    bloodTests.forEach((p) => {
      const v = p.values.find((x) => x.name.toLocaleLowerCase("it-IT") === trendName.toLocaleLowerCase("it-IT"));
      if (v) points.push({ date: p.date, value: v.value });
    });
    return points;
  }, [bloodTests, trendName]);

  const submit = () => {
    const values = draftValues
      .filter((v) => v.name.trim() && v.value.trim())
      .map((v) => ({ id: newId(), name: v.name.trim(), value: parseFloat(v.value.replace(",", ".")) || 0, unit: v.unit.trim() }));
    if (values.length === 0) return;
    addBloodTest({ date, lab: lab.trim() || undefined, values });
    setDate(todayIso());
    setLab("");
    setDraftValues([{ key: newId(), name: "", value: "", unit: "" }]);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {sorted.map((panel) => (
        <div key={panel.id} className="rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-100">
              {formatDateShort(panel.date)} {panel.lab && <span className="text-ink-800">· {panel.lab}</span>}
            </p>
            <button onClick={() => removeBloodTest(panel.id)} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
              <X size={14} />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {panel.values.map((v) => (
              <button
                key={v.id}
                onClick={() => setTrendName(v.name)}
                className="focus-ring flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-ink-300 hover:border-aura-cyan/50 hover:text-ink-100"
              >
                <TrendingUp size={10} /> {v.name}: {v.value} {v.unit}
              </button>
            ))}
          </div>
        </div>
      ))}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-ink-600 hover:border-aura-violet/50 hover:text-ink-200"
        >
          <Plus size={14} /> Aggiungi referto analisi
        </button>
      ) : (
        <div className="space-y-2.5 rounded-xl2 border border-aura-violet/30 bg-white/[0.03] p-3">
          <div className="grid grid-cols-2 gap-2.5">
            <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <TextField label="Laboratorio (facoltativo)" value={lab} onChange={(e) => setLab(e.target.value)} />
          </div>
          <p className="font-display text-xs uppercase tracking-[0.14em] text-ink-600">Valori</p>
          {draftValues.map((v, i) => (
            <div key={v.key} className="flex items-end gap-1.5">
              <TextField
                label="Nome"
                value={v.name}
                onChange={(e) => setDraftValues(draftValues.map((x, xi) => (xi === i ? { ...x, name: e.target.value } : x)))}
                placeholder="Es. Colesterolo totale"
              />
              <TextField
                label="Valore"
                inputMode="decimal"
                value={v.value}
                onChange={(e) => setDraftValues(draftValues.map((x, xi) => (xi === i ? { ...x, value: e.target.value } : x)))}
                placeholder="180"
              />
              <TextField
                label="Unità"
                value={v.unit}
                onChange={(e) => setDraftValues(draftValues.map((x, xi) => (xi === i ? { ...x, unit: e.target.value } : x)))}
                placeholder="mg/dL"
              />
              {draftValues.length > 1 && (
                <button
                  onClick={() => setDraftValues(draftValues.filter((_, xi) => xi !== i))}
                  className="focus-ring mb-3 shrink-0 text-ink-800 hover:text-aura-pink"
                  aria-label="Rimuovi valore"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setDraftValues([...draftValues, { key: newId(), name: "", value: "", unit: "" }])}
            className="focus-ring flex items-center gap-1.5 text-xs text-ink-600 hover:text-ink-200"
          >
            <Plus size={12} /> Aggiungi un altro valore
          </button>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button size="sm" onClick={submit}>
              Salva
            </Button>
          </div>
        </div>
      )}

      {trendName && (
        <PersonalCardSheet title={`Andamento — ${trendName}`} onClose={() => setTrendName(null)}>
          <MiniLineChart points={trendPoints} unit={bloodTests.flatMap((p) => p.values).find((v) => v.name === trendName)?.unit ?? ""} color="#7C5CFF" />
        </PersonalCardSheet>
      )}
    </div>
  );
}
