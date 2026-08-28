"use client";
import { useState, KeyboardEvent } from "react";
import { Plus, X, ShoppingCart } from "lucide-react";
import { ShoppingItem } from "@/lib/types";
import { newId } from "@/lib/id";
import { capitalizeWords } from "@/lib/text";

export function ShoppingListEditor({
  items,
  onChange,
}: {
  items: ShoppingItem[];
  onChange: (items: ShoppingItem[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = capitalizeWords(draft.trim());
    if (!v) return;
    onChange([...items, { id: newId(), label: v, done: false }]);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  return (
    <div>
      <span className="mb-2 flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.14em] text-ink-600">
        <ShoppingCart size={12} /> Lista Della Spesa
      </span>
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-ink-100">
            {it.label}
            <button onClick={() => onChange(items.filter((x) => x.id !== it.id))} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 rounded-xl2 border border-dashed border-white/15 pl-3 pr-1.5 py-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Aggiungi Voce..."
          className="focus-ring flex-1 bg-transparent text-sm text-ink-100 placeholder:text-ink-800 outline-none"
        />
        <button onClick={add} disabled={!draft.trim()} className="focus-ring rounded-full p-1.5 text-ink-600 hover:text-aura-cyan disabled:opacity-30" aria-label="Aggiungi">
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}
