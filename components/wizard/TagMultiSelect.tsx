"use client";
import { useMemo, useRef, useState, useEffect } from "react";
import { Search, Plus, Check } from "lucide-react";
import { Chip } from "../ui/Chip";
import { capitalizeWords } from "@/lib/text";

/**
 * Chip "Altro" sempre in fondo alla fila, nello stesso formato delle altre — cliccarla la
 * trasforma sul posto in un campo di testo (stessa forma a pillola, non un modale o una riga
 * separata sotto): scrivi, confermi (invio o l'icona di spunta) e il valore viene aggiunto
 * alla lista E selezionato subito, senza dover poi cercarlo e toccarlo una seconda volta.
 */
function AddOtherChip({ onAdd }: { onAdd: (value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const confirm = () => {
    const trimmed = capitalizeWords(value.trim());
    if (!trimmed) {
      setEditing(false);
      return;
    }
    onAdd(trimmed);
    setValue("");
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="focus-ring flex items-center gap-1 rounded-full border border-dashed border-white/15 px-3.5 py-1.5 text-sm text-ink-600 transition hover:border-white/30 hover:text-ink-200"
      >
        <Plus size={13} /> Altro
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1 rounded-full border border-aura-violet/50 bg-aura-violet/[0.06] py-1 pl-3 pr-1">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") confirm();
          if (e.key === "Escape") {
            setValue("");
            setEditing(false);
          }
        }}
        onBlur={confirm}
        placeholder="Scrivi e conferma…"
        className="w-32 bg-transparent text-sm text-ink-100 placeholder:text-ink-800 focus:outline-none"
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={confirm}
        className="focus-ring flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-aura-violet hover:text-ink-100"
        aria-label="Conferma"
      >
        <Check size={13} />
      </button>
    </span>
  );
}

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

  // I valori aggiunti con "Altro" non vivono nel catalogo condiviso (non è un campo da
  // riscrivere per tutti) — restano comunque in questa lista finché sono selezionati,
  // così non spariscono appena l'utente smette di cercarli.
  const allValues = useMemo(() => {
    const extra = selected.filter((v) => !options.includes(v));
    return [...options, ...extra];
  }, [options, selected]);

  const filtered = useMemo(
    () => allValues.filter((t) => t.toLowerCase().includes(query.toLowerCase())),
    [allValues, query]
  );

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((t) => t !== value) : [...selected, value]);
  };

  const addCustom = (value: string) => {
    if (!selected.includes(value)) onChange([...selected, value]);
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
        <AddOtherChip onAdd={addCustom} />
      </div>
    </div>
  );
}
