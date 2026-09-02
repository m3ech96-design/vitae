"use client";
import { useMemo, useState } from "react";
import { Search, Check } from "lucide-react";
import { WIDGET_REGISTRY } from "@/lib/widgets/registry";
import { useWidgets } from "@/lib/widgets/widgets-context";
import { PersonalCardSheet } from "../home/PersonalCardSheet";

/**
 * Il catalogo intero — tutti i widget esistono qui sempre, a prescindere da quanti ne hai
 * già in home: è l'utente a scegliere quali inserire, il sistema si occupa solo di quelli
 * effettivamente piazzati. Raggruppato per categoria e filtrabile per nome, dato che sono
 * decine.
 */
export function AddWidgetSheet({ onClose }: { onClose: () => void }) {
  const { canAdd, addWidget } = useWidgets();
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? WIDGET_REGISTRY.filter((w) => w.title.toLowerCase().includes(q) || w.category.toLowerCase().includes(q)) : WIDGET_REGISTRY;
    const byCategory = new Map<string, typeof WIDGET_REGISTRY>();
    filtered.forEach((w) => {
      const list = byCategory.get(w.category) ?? [];
      list.push(w);
      byCategory.set(w.category, list);
    });
    return Array.from(byCategory.entries());
  }, [query]);

  return (
    <PersonalCardSheet title="Aggiungi widget" onClose={onClose}>
      <div className="relative mb-4">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-800" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca un widget..."
          className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] py-2.5 pl-8 pr-3 text-sm text-ink-100 placeholder:text-ink-800"
        />
      </div>

      {grouped.length === 0 && <p className="py-8 text-center text-sm text-ink-800">Nessun widget trovato.</p>}

      <div className="space-y-5">
        {grouped.map(([category, widgets]) => (
          <div key={category}>
            <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-ink-800">{category}</p>
            <div className="space-y-1.5">
              {widgets.map((w) => {
                const already = !canAdd(w.id);
                return (
                  <button
                    key={w.id}
                    disabled={already}
                    onClick={() => {
                      addWidget(w.id, w.defaultSize);
                      onClose();
                    }}
                    className={`focus-ring flex w-full items-center justify-between rounded-xl2 border px-3.5 py-2.5 text-left transition ${
                      already ? "border-white/[0.04] text-ink-800" : "border-white/10 text-ink-200 hover:border-aura-violet/50"
                    }`}
                  >
                    <span className="text-sm">{w.title}</span>
                    {already && (
                      <span className="flex items-center gap-1 text-[11px] text-aura-emerald">
                        <Check size={11} /> Già in home
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </PersonalCardSheet>
  );
}
