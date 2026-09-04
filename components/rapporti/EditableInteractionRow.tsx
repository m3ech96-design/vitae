"use client";
import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { RelationshipEvent } from "@/lib/types";

/**
 * Una riga di Recenti/Cronologia, ora modificabile — pensata soprattutto per le interazioni
 * nate dal widget Interazione Rapida (vedi lib/relationship.ts, QUICK_INTERACTION_LABEL_*):
 * lì il gesto è volutamente senza testo, il racconto arriva qui dopo, con calma. Cambia solo
 * `label`: `delta`/`axis`/`date` restano quelli originali, un punteggio già maturato non deve
 * mai spostarsi per il fatto di aver raccontato l'episodio dopo.
 */
export function EditableInteractionRow({
  event,
  onSave,
}: {
  event: RelationshipEvent;
  onSave: (newLabel: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(event.label);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== event.label) onSave(trimmed);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-xl2 border border-aura-violet/40 bg-white/[0.03] px-3.5 py-2.5">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(event.label);
              setEditing(false);
            }
          }}
          className="focus-ring w-full min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-ink-100"
        />
        <button onClick={commit} className="focus-ring shrink-0 text-aura-cyan" aria-label="Salva">
          <Check size={14} />
        </button>
        <button
          onClick={() => {
            setDraft(event.label);
            setEditing(false);
          }}
          className="focus-ring shrink-0 text-ink-600 hover:text-ink-200"
          aria-label="Annulla"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="focus-ring flex w-full items-center justify-between gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-left transition hover:border-white/15"
    >
      <span className="flex min-w-0 items-center gap-1.5 text-xs text-ink-300">
        <Pencil size={11} className="shrink-0 text-ink-800" />
        <span className="truncate">{event.label}</span>
      </span>
      <span className={`shrink-0 font-display text-xs ${event.delta >= 0 ? "text-aura-cyan" : "text-aura-pink"}`}>
        {event.delta >= 0 ? "+" : ""}
        {event.delta.toFixed(1)}%
      </span>
    </button>
  );
}
