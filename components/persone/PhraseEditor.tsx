"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { RecurringPhrase } from "@/lib/types";
import { newId } from "@/lib/id";
import { capitalizeSentence } from "@/lib/text";

export function PhraseEditor({
  phrases,
  onChange,
}: {
  phrases: RecurringPhrase[];
  onChange: (phrases: RecurringPhrase[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = capitalizeSentence(draft.trim());
    if (!v) return;
    onChange([...phrases, { id: newId(), text: v }]);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      {phrases.map((p) => (
        <div key={p.id} className="flex items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-ink-100">
          &ldquo;{p.text}&rdquo;
          <button onClick={() => onChange(phrases.filter((x) => x.id !== p.id))} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
            <X size={14} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2 rounded-xl2 border border-dashed border-white/15 pl-3 pr-1.5 py-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Es. Non Vedo L'Ora Che Sia Weekend"
          className="focus-ring flex-1 bg-transparent text-sm text-ink-100 placeholder:text-ink-800 outline-none"
        />
        <button onClick={add} disabled={!draft.trim()} className="focus-ring rounded-full p-1.5 text-ink-600 hover:text-aura-cyan disabled:opacity-30" aria-label="Aggiungi">
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}
