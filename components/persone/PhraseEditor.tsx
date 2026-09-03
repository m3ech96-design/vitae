"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { RecurringPhrase } from "@/lib/types";
import { newId } from "@/lib/id";
import { capitalizeSentence } from "@/lib/text";

const MAX_PHRASE_CHARS = 40;
const MAX_PHRASES = 10;

export function PhraseEditor({
  phrases,
  onChange,
}: {
  phrases: RecurringPhrase[];
  onChange: (phrases: RecurringPhrase[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const atLimit = phrases.length >= MAX_PHRASES;

  const add = () => {
    if (atLimit) return;
    const v = capitalizeSentence(draft.trim()).slice(0, MAX_PHRASE_CHARS);
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
      {atLimit ? (
        <p className="text-center text-[11px] text-ink-800">Massimo {MAX_PHRASES} frasi — rimuovine una per aggiungerne un'altra.</p>
      ) : (
        <div className="flex items-center gap-2 rounded-xl2 border border-dashed border-white/15 pl-3 pr-1.5 py-1.5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_PHRASE_CHARS))}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
            placeholder="Es. Non vedo l'ora che sia weekend"
            maxLength={MAX_PHRASE_CHARS}
            className="focus-ring flex-1 bg-transparent text-sm text-ink-100 placeholder:text-ink-800 outline-none"
          />
          <span className="shrink-0 text-[10px] text-ink-800">{draft.length}/{MAX_PHRASE_CHARS}</span>
          <button onClick={add} disabled={!draft.trim()} className="focus-ring rounded-full p-1.5 text-ink-600 hover:text-aura-cyan disabled:opacity-30" aria-label="Aggiungi">
            <Plus size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
