"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, Loader2 } from "lucide-react";
import { searchAddress, AddressSuggestion } from "@/lib/geocode";
import { flippedMenuTop } from "@/lib/dropdown-position";

const LIST_HEIGHT_ESTIMATE = 200;

/**
 * Il testo digitato è SEMPRE ciò che viene salvato — anche se non corrisponde a nessun
 * suggerimento (es. un numero civico che OpenStreetMap non ha ancora indicizzato). I
 * suggerimenti servono solo a fornire le coordinate: selezionarne uno le imposta, ma
 * puoi continuare a scrivere liberamente dopo, incluso aggiungere un numero civico.
 *
 * Bug corretto — lo stesso già risolto altrove nell'app (PersonalCardMenu, AddToHouseholdMenu,
 * PostMenu, MoodPicker, il badge "Fame" degli animali): l'elenco dei suggerimenti era
 * posizionato con CSS relativo al campo (`top-full`), non rispetto alla finestra — quando il
 * campo si trovava nella parte bassa di una scheda già scrollata al massimo (tipico, questo
 * campo vive spesso in fondo a un modulo), l'elenco restava tagliato e inutilizzabile. Ora
 * esce dal DOM con un portal e si apre verso l'alto quando sotto non c'entra.
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
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

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

  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      const el = fieldRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPos({ top: flippedMenuTop(rect, LIST_HEIGHT_ESTIMATE), left: rect.left, width: rect.width });
    };
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (fieldRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div>
      <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">{label}</span>
      <div ref={fieldRef} className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder || "Inizia a scrivere un indirizzo..."}
          className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 pr-9 text-ink-100 placeholder:text-ink-800"
        />
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-800">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
        </span>
      </div>

      {mounted &&
        open &&
        results.length > 0 &&
        pos &&
        createPortal(
          <div
            ref={listRef}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
            className="glass-strong z-[70] max-h-64 overflow-y-auto rounded-xl2 border border-white/10 p-1.5"
          >
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
          </div>,
          document.body
        )}

      <p className="mt-1.5 text-[10px] text-ink-800">
        Dati indirizzi © OpenStreetMap Contributors — se manca il tuo numero civico, scrivilo comunque:
        resta salvato, e puoi sempre rifinire il punto sulla mappa qui sotto.
      </p>
    </div>
  );
}
