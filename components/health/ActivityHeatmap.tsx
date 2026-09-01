"use client";
import { activityHeatmap } from "@/lib/activity-stats";
import { Workout } from "@/lib/types";
import { formatDateShort } from "@/lib/date-format";

/** Un colpo d'occhio sui giorni attivi, come i contributi di GitHub — quadratini per gli
 * ultimi ~17 settimane (119 giorni), disposti per colonne di 7 (una settimana ciascuna). */
export function ActivityHeatmap({ workouts }: { workouts: Workout[] }) {
  const days = 119;
  const cells = activityHeatmap(workouts, days);
  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const shade = (count: number) => {
    if (count === 0) return "rgba(255,255,255,0.05)";
    if (count === 1) return "#00E5C766";
    if (count === 2) return "#00E5C7AA";
    return "#00E5C7";
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell) => (
              <div key={cell.date} title={`${formatDateShort(cell.date)} · ${cell.count} attività`} className="h-2.5 w-2.5 rounded-sm" style={{ background: shade(cell.count) }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
