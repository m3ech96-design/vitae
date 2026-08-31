"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { ActionPhrase, ActionMode } from "@/lib/types";
import { newId } from "@/lib/id";
import { lowercaseFirst } from "@/lib/text";
import { Button } from "../ui/Button";

export function ActionEditor({
  actions,
  onChange,
}: {
  actions: ActionPhrase[];
  onChange: (actions: ActionPhrase[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<ActionMode>("casuale");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");

  const reset = () => {
    setText("");
    setMode("casuale");
    setOpen(false);
  };

  const confirm = () => {
    const v = lowercaseFirst(text.trim());
    if (!v) return;
    onChange([
      ...actions,
      { id: newId(), text: v, mode, startTime: mode === "orario" ? start : undefined, endTime: mode === "orario" ? end : undefined },
    ]);
    reset();
  };

  return (
    <div className="space-y-2">
      {actions.map((a) => (
        <div key={a.id} className="flex items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm">
          <div>
            <p className="text-ink-100">Forse sta {a.text}</p>
            <p className="text-[11px] text-ink-800">
              {a.mode === "orario" ? `${a.startTime} — ${a.endTime}` : "In Qualsiasi Momento"}
            </p>
          </div>
          <button onClick={() => onChange(actions.filter((x) => x.id !== a.id))} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
            <X size={14} />
          </button>
        </div>
      ))}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-ink-600 hover:border-aura-violet/50 hover:text-ink-200"
        >
          <Plus size={14} /> Aggiungi azione
        </button>
      ) : (
        <div className="space-y-2.5 rounded-xl2 border border-aura-violet/30 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2 text-sm text-ink-400">
            <span>Forse sta</span>
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="giocando ai videogiochi"
              className="focus-ring flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-100 placeholder:text-ink-800"
            />
          </div>
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
            <Button variant="ghost" size="sm" onClick={reset}>
              Annulla
            </Button>
            <Button size="sm" onClick={confirm} disabled={!text.trim()}>
              Aggiungi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
