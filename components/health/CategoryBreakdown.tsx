"use client";
import { minutesByCategory } from "@/lib/activity-stats";
import { Workout } from "@/lib/types";

/** Cardio contro forza contro sport, non solo il totale generico. Una barra orizzontale
 * per categoria, ordinata dalla più praticata — niente donut, a colpo d'occhio una lista
 * ordinata dice di più su cosa sta davvero dominando le ultime settimane. */
export function CategoryBreakdown({ workouts, sinceDate }: { workouts: Workout[]; sinceDate: string }) {
  const breakdown = minutesByCategory(workouts, sinceDate).sort((a, b) => b.minutes - a.minutes);
  const max = Math.max(...breakdown.map((b) => b.minutes), 1);

  if (breakdown.length === 0) {
    return <p className="py-6 text-center text-xs text-ink-800">Nessuna attività in questo periodo.</p>;
  }

  return (
    <div className="space-y-2.5">
      {breakdown.map((b) => (
        <div key={b.categoryId}>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-ink-300">{b.label}</span>
            <span className="text-ink-800">{b.minutes} min</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
            <div className="h-full rounded-full" style={{ width: `${(b.minutes / max) * 100}%`, background: b.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}
