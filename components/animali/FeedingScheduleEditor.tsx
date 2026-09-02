"use client";
import { useState } from "react";
import { Plus, X, Clock } from "lucide-react";
import { FeedingTime, FeedingLogEntry } from "@/lib/types";
import { newId } from "@/lib/id";
import { formatExactMoment } from "@/lib/date-format";

export function FeedingScheduleEditor({
  times,
  onChange,
  log,
}: {
  times: FeedingTime[];
  onChange: (times: FeedingTime[]) => void;
  log: FeedingLogEntry[];
}) {
  const [draft, setDraft] = useState("12:00");

  const add = () => {
    if (times.some((t) => t.time === draft)) return;
    onChange([...times, { id: newId(), time: draft }].sort((a, b) => a.time.localeCompare(b.time)));
  };

  const recentLog = [...log].reverse().slice(0, 6);

  return (
    <div className="space-y-4">
      <div>
        <span className="mb-2 flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.14em] text-ink-600">
          <Clock size={12} /> Orari della pappa
        </span>
        <div className="flex flex-wrap gap-2">
          {times.map((t) => (
            <span
              key={t.id}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-sm text-ink-100"
            >
              {t.time}
              <button onClick={() => onChange(times.filter((x) => x.id !== t.id))} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
                <X size={12} />
              </button>
            </span>
          ))}
          <div className="flex items-center gap-1.5 rounded-full border border-dashed border-white/15 pl-2 pr-1 py-1">
            <input
              type="time"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="focus-ring w-20 bg-transparent text-sm text-ink-100 outline-none"
            />
            <button onClick={add} className="focus-ring rounded-full p-1 text-ink-600 hover:text-aura-cyan" aria-label="Aggiungi orario">
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      {recentLog.length > 0 && (
        <div>
          <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Cronologia pappa</p>
          {/* Corretto secondo le istruzioni: prima mostrava solo il giorno, non l'orario
             esatto in cui il cibo è stato dato — formatExactMoment legge l'ora dal datetime
             ISO completo già salvato in ogni voce (nessun dato nuovo da aggiungere). */}
          <div className="space-y-1.5">
            {recentLog.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs">
                <span className="text-ink-300">{f.foodType}</span>
                <span className="text-ink-800">{formatExactMoment(f.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
