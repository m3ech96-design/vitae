"use client";
import { WeightEntry } from "@/lib/types";

export function WeightChart({ entries, goal }: { entries: WeightEntry[]; goal: number | null }) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-20);

  if (sorted.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl2 border border-dashed border-white/10 text-xs text-ink-800">
        Nessuna pesata registrata ancora.
      </div>
    );
  }

  const values = sorted.map((e) => e.value);
  const allValues = goal ? [...values, goal] : values;
  const min = Math.min(...allValues) - 1;
  const max = Math.max(...allValues) + 1;
  const w = 320;
  const h = 128;
  const padX = 10;
  const padY = 14;
  const stepX = sorted.length > 1 ? (w - padX * 2) / (sorted.length - 1) : 0;
  const scaleY = (v: number) => h - padY - ((v - min) / (max - min || 1)) * (h - padY * 2);
  const points = sorted.map((e, i) => ({ x: padX + i * stepX, y: scaleY(e.value) }));
  const pathD = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  const areaD = `${pathD} L${points[points.length - 1].x},${h - padY} L${points[0].x},${h - padY} Z`;
  const goalY = goal !== null ? scaleY(goal) : null;
  const current = sorted[sorted.length - 1].value;
  const prev = sorted.length > 1 ? sorted[sorted.length - 2].value : null;
  const delta = prev !== null ? current - prev : null;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full overflow-visible">
        <defs>
          <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="weightStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7C5CFF" />
            <stop offset="100%" stopColor="#00E5C7" />
          </linearGradient>
          <filter id="weightGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {goalY !== null && (
          <line x1={padX} y1={goalY} x2={w - padX} y2={goalY} stroke="#34D399" strokeDasharray="4 4" strokeWidth={1} opacity={0.6} />
        )}
        <path d={areaD} fill="url(#weightFill)" stroke="none" />
        <path d={pathD} fill="none" stroke="url(#weightStroke)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" filter="url(#weightGlow)" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4 : 2.2} fill={i === points.length - 1 ? "#00E5C7" : "#7C5CFF"} />
        ))}
      </svg>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="font-display text-2xl text-ink-100">
          {current} <span className="text-sm text-ink-600">Kg</span>
        </span>
        {delta !== null && (
          <span className={`text-xs ${delta <= 0 ? "text-aura-emerald" : "text-aura-pink"}`}>
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)} Kg
          </span>
        )}
      </div>
    </div>
  );
}
