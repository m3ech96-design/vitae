"use client";

const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

/**
 * Giorno, mese e anno di morte — ognuno facoltativo E indipendente dagli altri: potresti
 * sapere solo l'anno, solo il mese e il giorno, o nessuno dei tre. Lasciare un campo vuoto
 * è una risposta valida ("Non Lo So"), non un errore da correggere — vedi lib/date-format.ts
 * per come questi tre pezzi diventano "????" ovunque servano.
 */
export function DeceasedDateFields({
  day,
  month,
  year,
  onChange,
}: {
  day?: number;
  month?: number;
  year?: number;
  onChange: (patch: { deceasedDay?: number; deceasedMonth?: number; deceasedYear?: number }) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      <label className="block">
        <span className="mb-1.5 block text-[10px] uppercase tracking-[0.1em] text-ink-800">Giorno</span>
        <select
          value={day ?? ""}
          onChange={(e) => onChange({ deceasedDay: e.target.value ? Number(e.target.value) : undefined })}
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
          onChange={(e) => onChange({ deceasedMonth: e.target.value ? Number(e.target.value) : undefined })}
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
          placeholder="????"
          value={year ?? ""}
          onChange={(e) => onChange({ deceasedYear: e.target.value ? Number(e.target.value) : undefined })}
          className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-2 py-2.5 text-sm text-ink-100 placeholder:text-ink-800"
        />
      </label>
    </div>
  );
}
