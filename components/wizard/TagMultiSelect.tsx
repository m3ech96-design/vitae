"use client";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Chip } from "../ui/Chip";

export function TagMultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => options.filter((t) => t.toLowerCase().includes(query.toLowerCase())),
    [options, query]
  );

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((t) => t !== value) : [...selected, value]);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display text-xs uppercase tracking-[0.14em] text-ink-600">
          {label} &middot; {selected.length} Selezionati
        </span>
      </div>
      <div className="relative mb-3">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-800" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca..."
          className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-4 text-sm text-ink-100 placeholder:text-ink-800"
        />
      </div>
      <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
        {filtered.map((value) => (
          <Chip key={value} label={value} selected={selected.includes(value)} onClick={() => toggle(value)} />
        ))}
        {filtered.length === 0 && <p className="py-2 text-sm text-ink-800">Nessun risultato.</p>}
      </div>
    </div>
  );
}
