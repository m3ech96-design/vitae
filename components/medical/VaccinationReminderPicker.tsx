"use client";
import clsx from "clsx";
import { DEFAULT_VACCINATION_REMINDER_DAYS } from "@/lib/vaccination-reminder";

/** Scelte rapide a tocco invece di un numero libero da digitare — su mobile, scegliere tra
 * poche opzioni sensate è più veloce e meno soggetto a errori ("quanti giorni voglio
 * davvero?") di un campo numerico vuoto da riempire ogni volta. */
const OPTIONS = [
  { days: 1, label: "1 giorno prima" },
  { days: DEFAULT_VACCINATION_REMINDER_DAYS, label: "1 settimana prima" },
  { days: 14, label: "2 settimane prima" },
  { days: 30, label: "1 mese prima" },
];

export function VaccinationReminderPicker({ value, onChange }: { value: number; onChange: (days: number) => void }) {
  return (
    <div>
      <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">Avvisami</span>
      <div className="flex flex-wrap gap-1.5">
        {OPTIONS.map((opt) => (
          <button
            key={opt.days}
            type="button"
            onClick={() => onChange(opt.days)}
            className={clsx(
              "focus-ring rounded-full border px-3 py-1.5 text-[11px] transition",
              value === opt.days
                ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100"
                : "border-white/10 text-ink-600 hover:border-white/20 hover:text-ink-300"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
