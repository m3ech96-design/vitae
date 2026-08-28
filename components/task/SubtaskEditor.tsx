"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { SubTask } from "@/lib/types";
import { newId } from "@/lib/id";
import { capitalizeSentence } from "@/lib/text";
import { Button } from "../ui/Button";

export function SubtaskEditor({
  subtasks,
  onChange,
}: {
  subtasks: SubTask[];
  onChange: (subtasks: SubTask[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const reset = () => {
    setTitle("");
    setDate("");
    setTime("");
    setOpen(false);
  };

  const confirm = () => {
    if (!title.trim()) return;
    onChange([
      ...subtasks,
      { id: newId(), title: capitalizeSentence(title.trim()), date: date || undefined, time: time || undefined, done: false },
    ]);
    reset();
  };

  return (
    <div>
      <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">
        Sub-Task
      </span>
      <div className="space-y-2">
        {subtasks.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm"
          >
            <div>
              <p className="text-ink-100">{s.title}</p>
              {(s.date || s.time) && (
                <p className="text-[11px] text-ink-800">
                  {s.date} {s.time}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onChange(subtasks.filter((x) => x.id !== s.id))}
              className="focus-ring text-ink-800 hover:text-aura-pink"
              aria-label="Rimuovi Sub-Task"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="focus-ring mt-2 flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-ink-600 hover:border-aura-violet/50 hover:text-ink-200"
        >
          <Plus size={14} /> Aggiungi Sub-Task
        </button>
      ) : (
        <div className="mt-2 space-y-2 rounded-xl2 border border-aura-violet/30 bg-white/[0.03] p-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titolo Sub-Task"
            className="focus-ring w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-100 placeholder:text-ink-800"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="focus-ring rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-ink-100"
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="focus-ring rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-ink-100"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={reset}>
              Annulla
            </Button>
            <Button size="sm" onClick={confirm} disabled={!title.trim()}>
              Aggiungi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
