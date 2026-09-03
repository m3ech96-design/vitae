"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useMedical } from "@/lib/medical-context";
import { formatDateShort, todayIso } from "@/lib/date-format";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";

const SEVERITY_COLORS = ["#34D399", "#8FD8FF", "#FFB454", "#FF6B9D", "#FF4D6D"];

export function SymptomsSection() {
  const { symptoms, addSymptom, removeSymptom } = useMedical();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState(todayIso());
  const [severity, setSeverity] = useState(3);
  const [durationNote, setDurationNote] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    addSymptom({ name: name.trim(), date, severity, durationNote: durationNote.trim() || undefined });
    setName("");
    setDate(todayIso());
    setSeverity(3);
    setDurationNote("");
    setOpen(false);
  };

  const sorted = [...symptoms].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-2">
      {sorted.map((s) => (
        <div key={s.id} className="flex items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SEVERITY_COLORS[s.severity - 1] }} />
            <div>
              <p className="text-sm text-ink-100">{s.name}</p>
              <p className="text-[11px] text-ink-800">
                {formatDateShort(s.date)}
                {s.durationNote ? ` · ${s.durationNote}` : ""}
              </p>
            </div>
          </div>
          <button onClick={() => removeSymptom(s.id)} className="focus-ring shrink-0 text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
            <X size={14} />
          </button>
        </div>
      ))}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-ink-600 hover:border-aura-violet/50 hover:text-ink-200"
        >
          <Plus size={14} /> Registra sintomo
        </button>
      ) : (
        <div className="space-y-2.5 rounded-xl2 border border-aura-violet/30 bg-white/[0.03] p-3">
          <TextField label="Sintomo" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Mal di testa, nausea" autoFocus />
          <div className="grid grid-cols-2 gap-2.5">
            <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <TextField label="Durata (facoltativo)" value={durationNote} onChange={(e) => setDurationNote(e.target.value)} placeholder="Es. 2 giorni" />
          </div>
          <div>
            <span className="mb-1.5 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">Gravità</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setSeverity(n)}
                  className="focus-ring h-8 flex-1 rounded-lg border text-xs transition"
                  style={{
                    borderColor: severity === n ? SEVERITY_COLORS[n - 1] : "rgba(255,255,255,0.1)",
                    background: severity === n ? `${SEVERITY_COLORS[n - 1]}33` : "transparent",
                    color: severity === n ? "#F1F1FA" : "#8B90A8",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button size="sm" onClick={submit} disabled={!name.trim()}>
              Salva
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
