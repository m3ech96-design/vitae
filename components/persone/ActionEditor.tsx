"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { ActionPhrase, ActionMode } from "@/lib/types";
import { newId } from "@/lib/id";
import { lowercaseFirst } from "@/lib/text";
import { Button } from "../ui/Button";

const MAX_ACTION_CHARS = 50;

/** Su richiesta esplicita non è più una lista: al più una Frase Azione, sempre modificabile
 * e sempre quella in vigore — niente più "aggiungi un'altra azione", il campo mostra la
 * frase attuale (se c'è) pronta da cambiare o cancellare, o il modulo per crearne una se non
 * c'è ancora. Il conteggio dei 50 caratteri esclude il prefisso "Sta", che non fa parte del
 * testo salvato — viene aggiunto solo in visualizzazione (vedi lib/dialogue.ts). */
export function ActionEditor({
  action,
  onChange,
}: {
  action?: ActionPhrase;
  onChange: (action: ActionPhrase | undefined) => void;
}) {
  const [editing, setEditing] = useState(!action);
  const [text, setText] = useState(action?.text ?? "");
  const [mode, setMode] = useState<ActionMode>(action?.mode ?? "casuale");
  const [start, setStart] = useState(action?.startTime ?? "09:00");
  const [end, setEnd] = useState(action?.endTime ?? "18:00");

  const confirm = () => {
    const v = lowercaseFirst(text.trim()).slice(0, MAX_ACTION_CHARS);
    if (!v) return;
    onChange({
      id: action?.id ?? newId(),
      text: v,
      mode,
      startTime: mode === "orario" ? start : undefined,
      endTime: mode === "orario" ? end : undefined,
    });
    setEditing(false);
  };

  if (!editing && action) {
    return (
      <div className="flex items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm">
        <div>
          <p className="text-ink-100">Sta {action.text}</p>
          <p className="text-[11px] text-ink-800">
            {action.mode === "orario" ? `${action.startTime} — ${action.endTime}` : "in qualsiasi momento"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setEditing(true)} className="focus-ring rounded px-2 py-1 text-[11px] text-ink-600 hover:text-ink-200">
            Modifica
          </button>
          <button onClick={() => onChange(undefined)} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 rounded-xl2 border border-aura-violet/30 bg-white/[0.03] p-3">
      <div className="flex items-center gap-2 text-sm text-ink-400">
        <span>Sta</span>
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_ACTION_CHARS))}
          placeholder="giocando ai videogiochi"
          maxLength={MAX_ACTION_CHARS}
          className="focus-ring flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-100 placeholder:text-ink-800"
        />
      </div>
      <p className="text-right text-[10px] text-ink-800">{text.length}/{MAX_ACTION_CHARS}</p>
      <div className="flex gap-2">
        <button
          onClick={() => setMode("casuale")}
          className={`focus-ring rounded-full border px-3 py-1.5 text-xs ${mode === "casuale" ? "border-aura-cyan/60 bg-aura-cyan/15 text-ink-100" : "border-white/10 text-ink-600"}`}
        >
          Casuale
        </button>
        <button
          onClick={() => setMode("orario")}
          className={`focus-ring rounded-full border px-3 py-1.5 text-xs ${mode === "orario" ? "border-aura-cyan/60 bg-aura-cyan/15 text-ink-100" : "border-white/10 text-ink-600"}`}
        >
          Orario fisso
        </button>
      </div>
      {mode === "orario" && (
        <div className="grid grid-cols-2 gap-2">
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="focus-ring rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-ink-100" />
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="focus-ring rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-ink-100" />
        </div>
      )}
      <div className="flex justify-end gap-2">
        {action && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Annulla
          </Button>
        )}
        <Button size="sm" onClick={confirm} disabled={!text.trim()}>
          Salva
        </Button>
      </div>
    </div>
  );
}
