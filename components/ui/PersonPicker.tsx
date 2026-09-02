"use client";
import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, X, Check, HelpCircle } from "lucide-react";
import { AuraAvatar } from "./AuraAvatar";
import { personColor } from "@/lib/person-color";
import { isEmptyAvatar, emptyAvatarLabel } from "@/lib/unknown-relative";

export interface PickableOption {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  kind?: string;
}

function displayNameOf(o: PickableOption): string {
  if (o.id === "user") return "Tu";
  return isEmptyAvatar(o) ? emptyAvatarLabel(o.kind ?? "") : `${o.firstName} ${o.lastName}`;
}

/**
 * Selettore di una persona tra centinaia, con ricerca — sostituisce sia il `<select>`
 * nativo (su mobile è una rotella non filtrabile) sia il muro di pulsanti, uno per persona
 * (con tante persone diventa semplicemente inutilizzabile, e a schermo non si capisce nemmeno
 * quali sono già selezionati). Mostra sempre nome E cognome, mai solo il nome: con più
 * persone omonime altrimenti non sapresti chi stai scegliendo davvero.
 */
export function PersonPicker({
  label,
  value,
  options,
  onChange,
  allowNone = true,
  unknownOption,
}: {
  label: string;
  value: string | undefined;
  options: PickableOption[];
  onChange: (id: string | undefined) => void;
  allowNone?: boolean;
  /** Per Padre/Madre: sai che esiste ma non sai chi sia. Crea un segnaposto reale — conta
   * a tutti gli effetti nell'albero (fratelli, nonni, tutto si calcola comunque) — con un
   * nome provvisorio che diventa una vera Scoperta il giorno che lo impari davvero. */
  unknownOption?: { label: string; onCreate: () => void };
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const selected = options.find((o) => o.id === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("it-IT");
    if (!q) return options;
    return options.filter((o) => `${o.firstName} ${o.lastName}`.toLocaleLowerCase("it-IT").includes(q));
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <div>
      <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">{label}</span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring flex w-full items-center justify-between rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-left"
      >
        <span className={selected ? "text-ink-100" : "text-ink-800"}>
          {selected ? displayNameOf(selected) : "Nessuno"}
        </span>
        <Search size={15} className="shrink-0 text-ink-800" />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center"
            onClick={close}
          >
          <div
            className="glass-strong flex max-h-[80dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 flex items-center justify-between px-5 pt-5">
              <p className="font-display text-base text-ink-100">{label}</p>
              <button onClick={close} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
                <X size={18} />
              </button>
            </div>
            <div className="shrink-0 px-5 pt-4">
              <div className="flex items-center gap-2 rounded-xl2 border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
                <Search size={15} className="shrink-0 text-ink-800" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cerca per nome…"
                  className="w-full bg-transparent text-sm text-ink-100 placeholder:text-ink-800 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-3 flex-1 overflow-y-auto px-5 pb-5">
              {allowNone && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(undefined);
                    close();
                  }}
                  className={`focus-ring flex w-full items-center justify-between rounded-xl2 px-3 py-2.5 text-sm transition ${
                    !value ? "bg-white/[0.06] text-ink-100" : "text-ink-600 hover:bg-white/[0.03]"
                  }`}
                >
                  Nessuno
                  {!value && <Check size={15} className="text-aura-cyan" />}
                </button>
              )}
              {unknownOption && (
                <button
                  type="button"
                  onClick={() => {
                    unknownOption.onCreate();
                    close();
                  }}
                  className="focus-ring flex w-full items-center gap-3 rounded-xl2 px-3 py-2.5 text-left text-ink-400 hover:bg-white/[0.03]"
                >
                  <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-dashed border-white/20">
                    <HelpCircle size={15} className="text-ink-800" />
                  </span>
                  <span className="flex-1 text-sm">{unknownOption.label}</span>
                </button>
              )}
              {filtered.length === 0 && <p className="py-8 text-center text-xs text-ink-800">Nessuna persona trovata.</p>}
              {filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onChange(o.id);
                    close();
                  }}
                  className={`focus-ring flex w-full items-center gap-3 rounded-xl2 px-3 py-2.5 text-left transition ${
                    value === o.id ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <AuraAvatar
                    imageUrl={o.avatarUrl}
                    firstName={o.firstName}
                    lastName={o.lastName}
                    size={34}
                    ring="idle"
                    glowColor={personColor(o.id)}
                    empty={isEmptyAvatar(o)}
                  />
                  <span className="flex-1 truncate text-sm text-ink-100">
                    {displayNameOf(o)}
                  </span>
                  {value === o.id && <Check size={15} className="shrink-0 text-aura-cyan" />}
                </button>
              ))}
            </div>
          </div>
        </div>,
          document.body
        )}
    </div>
  );
}
