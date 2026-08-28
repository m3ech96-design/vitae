"use client";
import { FrequencyPoint } from "@/lib/frequency";

export function FrequencyChart({ points }: { points: FrequencyPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const total = points.reduce((s, p) => s + p.count, 0);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="font-display text-xs uppercase tracking-[0.14em] text-ink-600">Quanto Vi Frequentate</p>
        <p className="text-[11px] text-ink-800">{total} Negli Ultimi 6 Mesi</p>
      </div>
      <div className="flex h-24 items-end gap-2.5">
        {points.map((p, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-full w-full items-end">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-aura-cyan/70 to-aura-violet/70"
                style={{ height: `${(p.count / max) * 100}%`, minHeight: p.count > 0 ? 4 : 0 }}
              />
            </div>
            <span className="text-[10px] text-ink-800">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
