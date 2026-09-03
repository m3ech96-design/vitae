"use client";
import { datesHeatmap } from "@/lib/hobby-stats";
import { formatDateShort } from "@/lib/date-format";

/** Stesso linguaggio visivo di `ActivityHeatmap.tsx` in Salute (quadratini stile GitHub),
 * generalizzato su un semplice elenco di date invece che sui Workout — qui serve per
 * qualunque blocco che vuole mostrare costanza nel tempo (Metrica, Partite). */
export function HeatmapGrid({ dates, color = "#7C5CFF" }: { dates: string[]; color?: string }) {
  const cells = datesHeatmap(dates, 119);
  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const shade = (count: number) => {
    if (count === 0) return "rgba(255,255,255,0.05)";
    if (count === 1) return `${color}66`;
    if (count === 2) return `${color}AA`;
    return color;
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell) => (
              <div
                key={cell.date}
                title={`${formatDateShort(cell.date)} · ${cell.count}`}
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: shade(cell.count) }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
