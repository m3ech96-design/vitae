"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { searchAddress, AddressSuggestion } from "@/lib/geocode";

/**
 * Il testo digitato è SEMPRE ciò che viene salvato — anche se non corrisponde a nessun
 * suggerimento (es. un numero civico che OpenStreetMap non ha ancora indicizzato). I
 * suggerimenti servono solo a fornire le coordinate: selezionarne uno le imposta, ma
 * puoi continuare a scrivere liberamente dopo, incluso aggiungere un numero civico.
 */
export function AddressAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  onSelect,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (text: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
}) {
  const [results, setResults] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchAddress(value);
        setResults(r);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 550);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">{label}</span>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder || "Inizia A Scrivere Un Indirizzo..."}
          className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 pr-9 text-ink-100 placeholder:text-ink-800"
        />
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-800">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
        </span>
      </div>

      {open && results.length > 0 && (
        <div className="glass-strong absolute inset-x-0 top-full z-30 mt-1.5 max-h-64 overflow-y-auto rounded-xl2 border border-white/10 p-1.5">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onSelect(r);
                setResults([]);
                setOpen(false);
              }}
              className="focus-ring flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-ink-300 transition hover:bg-white/[0.06] hover:text-ink-100"
            >
              <MapPin size={13} className="mt-0.5 shrink-0 text-aura-cyan" />
              <span>{r.label}</span>
            </button>
          ))}
        </div>
      )}
      <p className="mt-1.5 text-[10px] text-ink-800">
        Dati indirizzi © OpenStreetMap Contributors — se manca il tuo numero civico, scrivilo comunque:
        resta salvato, e puoi sempre rifinire il punto sulla mappa qui sotto.
      </p>
    </div>
  );
}
