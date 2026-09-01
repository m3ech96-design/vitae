"use client";
import { useState } from "react";
import { weekOverWeek, monthOverMonth } from "@/lib/activity-stats";
import { Workout } from "@/lib/types";

function Delta({ current, previous, unit }: { current: number; previous: number; unit: string }) {
  const diff = current - previous;
  const pct = previous > 0 ? Math.round((diff / previous) * 100) : current > 0 ? 100 : 0;
  const positive = diff >= 0;
  return (
    <div>
      <p className="font-display text-lg text-ink-100">
        {current} <span className="text-xs text-ink-600">{unit}</span>
      </p>
      {previous > 0 || current > 0 ? (
        <p className={`text-[11px] ${positive ? "text-aura-emerald" : "text-aura-pink"}`}>
          {positive ? "+" : ""}
          {pct}% vs periodo prima
        </p>
      ) : (
        <p className="text-[11px] text-ink-800">Nessun dato nel periodo prima</p>
      )}
    </div>
  );
}

/** Questa settimana contro la scorsa, questo mese contro il precedente — lo stesso
 * confronto, solo con una finestra diversa. */
export function PeriodComparisonCard({ workouts }: { workouts: Workout[] }) {
  const [range, setRange] = useState<"settimana" | "mese">("settimana");
  const { current, previous } = range === "settimana" ? weekOverWeek(workouts) : monthOverMonth(workouts);

  return (
    <div>
      <div className="mb-3 flex gap-1.5">
        {(["settimana", "mese"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`focus-ring rounded-full border px-3 py-1.5 text-xs capitalize transition ${
              range === r ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-600"
            }`}
          >
            {r === "settimana" ? "Settimana" : "Mese"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Delta current={current.minutes} previous={previous.minutes} unit="min" />
        <Delta current={current.calories} previous={previous.calories} unit="kcal" />
        <Delta current={current.sessions} previous={previous.sessions} unit="sessioni" />
      </div>
    </div>
  );
}
