"use client";
import { useState } from "react";
import { Plus, X, Syringe } from "lucide-react";
import { useAnimalHealth } from "@/lib/animal-health-context";
import { formatDateShort, todayIso } from "@/lib/date-format";
import { DEFAULT_VACCINATION_REMINDER_DAYS, isVaccinationReminderDue } from "@/lib/vaccination-reminder";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { VaccinationReminderPicker } from "../medical/VaccinationReminderPicker";

export function AnimalVaccinationsSection({ animalId, vaccinations }: { animalId: string; vaccinations: ReturnType<typeof useAnimalHealth>["vaccinations"] }) {
  const { addVaccination, removeVaccination } = useAnimalHealth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState(todayIso());
  const [nextDueDate, setNextDueDate] = useState("");
  const [reminderDaysBefore, setReminderDaysBefore] = useState(DEFAULT_VACCINATION_REMINDER_DAYS);

  const submit = () => {
    if (!name.trim()) return;
    addVaccination({ animalId, name: name.trim(), date, nextDueDate: nextDueDate || undefined, reminderDaysBefore });
    setName("");
    setDate(todayIso());
    setNextDueDate("");
    setReminderDaysBefore(DEFAULT_VACCINATION_REMINDER_DAYS);
    setOpen(false);
  };

  const sorted = [...vaccinations].sort((a, b) => b.date.localeCompare(a.date));
  const today = todayIso();

  return (
    <div className="space-y-2">
      {sorted.map((v) => {
        const dueSoon = v.nextDueDate && isVaccinationReminderDue(v.nextDueDate, v.reminderDaysBefore, today);
        return (
          <div key={v.id} className="flex items-start justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm text-ink-100">
                <Syringe size={13} className="shrink-0 text-aura-emerald" /> {v.name}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-800">Fatta il {formatDateShort(v.date)}</p>
              {v.nextDueDate && (
                <p className={`mt-0.5 text-[11px] ${dueSoon ? "text-aura-amber" : "text-ink-800"}`}>
                  Richiamo previsto: {formatDateShort(v.nextDueDate)}
                </p>
              )}
            </div>
            <button onClick={() => removeVaccination(v.id)} className="focus-ring shrink-0 text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
              <X size={14} />
            </button>
          </div>
        );
      })}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-ink-600 hover:border-aura-violet/50 hover:text-ink-200"
        >
          <Plus size={14} /> Aggiungi vaccinazione
        </button>
      ) : (
        <div className="space-y-2.5 rounded-xl2 border border-aura-violet/30 bg-white/[0.03] p-3">
          <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Trivalente, antirabbica" autoFocus />
          <div className="grid grid-cols-2 gap-2.5">
            <TextField label="Fatta il" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <TextField label="Richiamo previsto" type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
          </div>
          {nextDueDate && <VaccinationReminderPicker value={reminderDaysBefore} onChange={setReminderDaysBefore} />}
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
