"use client";
import { useMemo, useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { useAnimalHealth, AnimalAppointment } from "@/lib/animal-health-context";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";

function todayDateTimeLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function AnimalAppointmentsSection({ animalId, appointments }: { animalId: string; appointments: AnimalAppointment[] }) {
  const { addAppointment, updateAppointment, removeAppointment } = useAnimalHealth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [vetName, setVetName] = useState("");
  const [place, setPlace] = useState("");
  const [date, setDate] = useState(todayDateTimeLocal());
  const [notes, setNotes] = useState("");

  const nowIso = new Date().toISOString();
  const { upcoming, past } = useMemo(() => {
    const sorted = [...appointments].sort((a, b) => a.date.localeCompare(b.date));
    return {
      upcoming: sorted.filter((a) => !a.completed && a.date >= nowIso),
      past: sorted.filter((a) => a.completed || a.date < nowIso).reverse(),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments]);

  const submit = () => {
    if (!title.trim() || !date) return;
    addAppointment({
      animalId,
      title: title.trim(),
      vetName: vetName.trim() || undefined,
      place: place.trim() || undefined,
      date: new Date(date).toISOString(),
      notes: notes.trim() || undefined,
      completed: false,
    });
    setTitle("");
    setVetName("");
    setPlace("");
    setDate(todayDateTimeLocal());
    setNotes("");
    setOpen(false);
  };

  const renderRow = (a: AnimalAppointment) => (
    <div key={a.id} className="rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-sm ${a.completed ? "text-ink-600 line-through" : "text-ink-100"}`}>{a.title}</p>
          <p className="mt-0.5 text-[11px] text-ink-800">
            {new Date(a.date).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            {a.vetName ? ` · ${a.vetName}` : ""}
            {a.place ? ` · ${a.place}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!a.completed && (
            <button onClick={() => updateAppointment(a.id, { completed: true })} className="focus-ring text-ink-600 hover:text-aura-emerald" aria-label="Segna come fatto">
              <Check size={15} />
            </button>
          )}
          <button onClick={() => removeAppointment(a.id)} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {upcoming.length === 0 && past.length === 0 && <p className="py-4 text-center text-sm text-ink-800">Nessun appuntamento registrato.</p>}
      {upcoming.map(renderRow)}
      {past.length > 0 && (
        <>
          <p className="pt-2 text-[10px] uppercase tracking-[0.14em] text-ink-800">Passati</p>
          {past.slice(0, 10).map(renderRow)}
        </>
      )}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-ink-600 hover:border-aura-violet/50 hover:text-ink-200"
        >
          <Plus size={14} /> Aggiungi appuntamento
        </button>
      ) : (
        <div className="space-y-2.5 rounded-xl2 border border-aura-violet/30 bg-white/[0.03] p-3">
          <TextField label="Titolo" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es. Visita di controllo" autoFocus />
          <div className="grid grid-cols-2 gap-2.5">
            <TextField label="Veterinario (facoltativo)" value={vetName} onChange={(e) => setVetName(e.target.value)} />
            <TextField label="Luogo (facoltativo)" value={place} onChange={(e) => setPlace(e.target.value)} />
          </div>
          <TextField label="Data e ora" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          <TextField label="Note (facoltativo)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button size="sm" onClick={submit} disabled={!title.trim() || !date}>
              Salva
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
