"use client";
import { useMemo, useState } from "react";
import { Search, X, Check } from "lucide-react";
import { AuraAvatar } from "./AuraAvatar";
import { personColor } from "@/lib/person-color";
import { PickableOption } from "./PersonPicker";
import { isEmptyAvatar, emptyAvatarLabel } from "@/lib/unknown-relative";
import { Button } from "./Button";

/**
 * Come PersonPicker ma per scegliere più persone insieme (task condivise, accompagnatori,
 * amicizie) — stessa ricerca per nome, stesso limite superato: con centinaia di persone un
 * muro di pulsanti da scandagliare a occhio non è più praticabile, questo resta usabile a
 * qualunque numero perché filtra invece di mostrare tutto insieme.
 */
export function MultiPersonPicker({
  label,
  values,
  options,
  onChange,
  trigger,
}: {
  label: string;
  values: string[];
  options: PickableOption[];
  onChange: (ids: string[]) => void;
  /** Se non fornito, il trigger di serie è un pulsante col conteggio selezionato. */
  trigger?: (open: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("it-IT");
    if (!q) return options;
    return options.filter((o) => `${o.firstName} ${o.lastName}`.toLocaleLowerCase("it-IT").includes(q));
  }, [options, query]);

  const toggle = (id: string) => {
    onChange(values.includes(id) ? values.filter((x) => x !== id) : [...values, id]);
  };

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <div>
      <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">{label}</span>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="focus-ring flex w-full items-center justify-between rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-left"
        >
          <span className={values.length > 0 ? "text-ink-100" : "text-ink-800"}>
            {values.length > 0 ? `${values.length} Selezionate` : "Nessuna"}
          </span>
          <Search size={15} className="shrink-0 text-ink-800" />
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center"
          onClick={close}
        >
          <div
            className="glass-strong flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
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
                  placeholder="Cerca Per Nome…"
                  className="w-full bg-transparent text-sm text-ink-100 placeholder:text-ink-800 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-3 flex-1 overflow-y-auto px-5">
              {filtered.length === 0 && <p className="py-8 text-center text-xs text-ink-800">Nessuna Persona Trovata.</p>}
              {filtered.map((o) => {
                const isSelected = values.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => toggle(o.id)}
                    className={`focus-ring flex w-full items-center gap-3 rounded-xl2 px-3 py-2.5 text-left transition ${
                      isSelected ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
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
                      {o.id === "user" ? "Tu" : isEmptyAvatar(o) ? emptyAvatarLabel(o.kind ?? "") : `${o.firstName} ${o.lastName}`}
                    </span>
                    {isSelected && <Check size={15} className="shrink-0 text-aura-cyan" />}
                  </button>
                );
              })}
            </div>
            <div className="shrink-0 px-5 py-4">
              <Button className="w-full justify-center" onClick={close}>
                Fatto{values.length > 0 ? ` (${values.length})` : ""}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
