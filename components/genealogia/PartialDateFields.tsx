"use client";

const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

/** Stesso modello di components/persone/DeceasedDateFields.tsx (giorno/mese/anno facoltativi e
 * indipendenti), reso generico qui perché nell'Albero serve due volte per persona — nascita e
 * morte — con nomi di campo diversi. */
export function PartialDateFields({
  label,
  day,
  month,
  year,
  onChange,
}: {
  label: string;
  day?: number;
  month?: number;
  year?: number;
  onChange: (patch: { day?: number; month?: number; year?: number }) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">{label}</span>
      <div className="grid grid-cols-3 gap-2">
        <label className="block">
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.1em] text-ink-800">Giorno</span>
          <select
            value={day ?? ""}
            onChange={(e) => onChange({ day: e.target.value ? Number(e.target.value) : undefined })}
            className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-2 py-2.5 text-sm text-ink-100"
          >
            <option value="">Non lo so</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.1em] text-ink-800">Mese</span>
          <select
            value={month ?? ""}
            onChange={(e) => onChange({ month: e.target.value ? Number(e.target.value) : undefined })}
            className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-2 py-2.5 text-sm text-ink-100"
          >
            <option value="">Non lo so</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.1em] text-ink-800">Anno</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Non lo so"
            value={year ?? ""}
            onChange={(e) => onChange({ year: e.target.value ? Number(e.target.value) : undefined })}
            className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-2 py-2.5 text-sm text-ink-100 placeholder:text-ink-800"
          />
        </label>
      </div>
    </div>
  );
}
