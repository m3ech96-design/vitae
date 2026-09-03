"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { searchAddress, AddressSuggestion } from "@/lib/geocode";
import { flippedMenuTop } from "@/lib/dropdown-position";

const LIST_HEIGHT_ESTIMATE = 200;

/**
 * Corretto secondo le istruzioni: prima un campo indirizzo con suggerimenti (vedi
 * AddressAutocomplete) impostava DIRETTAMENTE il punto finale — scegliere un suggerimento
 * bastava, la mappa sotto era solo una conferma visiva, mai davvero necessaria per
 * posizionare il marker. Dato che il punto si può già scegliere sulla mappa stessa, un
 * suggerimento qui non fa più questo: sposta solo la mappa in quella zona (stesso
 * meccanismo di "centra la mappa sul luogo" già in uso altrove, `flyToPlace`), e resta
 * SEMPRE l'utente a toccare il punto esatto — anche per un numero civico che i suggerimenti
 * non hanno. "Vai a: Napoli, Via Colonne" porta lì la mappa; il marker si mette toccandola.
 *
 * Campo autonomo, non collegato al testo dell'indirizzo salvato (quello resta un campo
 * normale, scritto a mano o compilato da solo col geocoding inverso quando si tocca la
 * mappa — vedi lib/use-map-address-pick.ts): una volta usato per arrivare in zona, si
 * svuota da solo, pronto per un'altra ricerca se serve.
 */
export function GoToAddressField({ onGoTo, label = "Vai a:" }: { onGoTo: (lat: number, lng: number) => void; label?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchAddress(query);
        setResults(r);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 550);
    return () => clearTimeout(t);
  }, [query]);

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

  const pick = (s: AddressSuggestion) => {
    onGoTo(s.lat, s.lng);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div>
      <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">{label}</span>
      <div ref={fieldRef} className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Es. Napoli, Via Colonne..."
          className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 pr-9 text-ink-100 placeholder:text-ink-800"
        />
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-800">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={15} />}
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
                onClick={() => pick(r)}
                className="focus-ring flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-ink-300 transition hover:bg-white/[0.06] hover:text-ink-100"
              >
                <MapPin size={13} className="mt-0.5 shrink-0 text-aura-cyan" />
                <span>{r.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
