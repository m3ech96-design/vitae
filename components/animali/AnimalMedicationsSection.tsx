"use client";
import { useState } from "react";
import { Plus, X, Pill } from "lucide-react";
import { useAnimalHealth, AnimalMedication } from "@/lib/animal-health-context";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";

export function AnimalMedicationsSection({ animalId, medications }: { animalId: string; medications: AnimalMedication[] }) {
  const { addMedication, removeMedication } = useAnimalHealth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [endDate, setEndDate] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    addMedication({
      animalId,
      name: name.trim(),
      dosage: dosage.trim() || undefined,
      times: times.filter(Boolean),
      startDate: new Date().toISOString().slice(0, 10),
      endDate: endDate || undefined,
    });
    setName("");
    setDosage("");
    setTimes(["08:00"]);
    setEndDate("");
    setOpen(false);
  };

  const today = new Date().toISOString().slice(0, 10);
  const ongoing = medications.filter((m) => !m.endDate || m.endDate >= today);
  const past = medications.filter((m) => m.endDate && m.endDate < today);

  const renderRow = (m: AnimalMedication) => (
    <div key={m.id} className="flex items-start justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm text-ink-100">
          <Pill size={13} className="shrink-0 text-aura-violet" /> {m.name}
          {m.dosage && <span className="text-ink-800">· {m.dosage}</span>}
        </p>
        {m.times.length > 0 && <p className="mt-0.5 text-[11px] text-ink-800">Orari: {m.times.join(", ")}</p>}
        {m.endDate && <p className="mt-0.5 text-[11px] text-ink-800">Terminato il {m.endDate}</p>}
      </div>
      <button onClick={() => removeMedication(m.id)} className="focus-ring shrink-0 text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
        <X size={14} />
      </button>
    </div>
  );

  return (
    <div className="space-y-2">
      {ongoing.map(renderRow)}
      {past.length > 0 && (
        <>
          <p className="pt-2 text-[10px] uppercase tracking-[0.14em] text-ink-800">Terminati</p>
          {past.map(renderRow)}
        </>
      )}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-ink-600 hover:border-aura-violet/50 hover:text-ink-200"
        >
          <Plus size={14} /> Aggiungi farmaco
        </button>
      ) : (
        <div className="space-y-2.5 rounded-xl2 border border-aura-violet/30 bg-white/[0.03] p-3">
          <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Antiparassitario" autoFocus />
          <TextField label="Dosaggio (facoltativo)" value={dosage} onChange={(e) => setDosage(e.target.value)} />
          <div>
            <span className="mb-1.5 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">Orari</span>
            <div className="flex flex-wrap gap-2">
              {times.map((t, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input
                    type="time"
                    value={t}
                    onChange={(e) => setTimes(times.map((x, xi) => (xi === i ? e.target.value : x)))}
                    className="focus-ring rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-ink-100"
                  />
                  {times.length > 1 && (
                    <button onClick={() => setTimes(times.filter((_, xi) => xi !== i))} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label="Rimuovi orario">
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
              {times.length < 6 && (
                <button onClick={() => setTimes([...times, "12:00"])} className="focus-ring rounded-lg border border-dashed border-white/15 px-2.5 py-1.5 text-xs text-ink-600 hover:text-ink-200">
                  <Plus size={12} />
                </button>
              )}
            </div>
          </div>
          <TextField label="Data fine (facoltativo — vuoto se in corso)" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
