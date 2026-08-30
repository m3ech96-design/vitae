"use client";
import { RelationshipEvent } from "@/lib/types";

export function RelationshipChart({ events }: { events: RelationshipEvent[] }) {
  if (events.length < 2) return null;

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date)).slice(-40);
  let running = 0;
  const points = sorted.map((e) => {
    running += e.delta;
    return running;
  });

  const w = 320;
  const h = 84;
  const padX = 6;
  const padY = 10;
  const min = Math.min(0, ...points);
  const max = Math.max(0, ...points);
  const range = max - min || 1;
  const stepX = (w - padX * 2) / (points.length - 1);
  const scaleY = (v: number) => h - padY - ((v - min) / range) * (h - padY * 2);

  const coords = points.map((p, i) => ({ x: padX + i * stepX, y: scaleY(p) }));
  const pathD = coords.map((c, i) => (i === 0 ? `M${c.x},${c.y}` : `L${c.x},${c.y}`)).join(" ");
  const zeroY = scaleY(0);
  const trendUp = points[points.length - 1] >= points[0];
  const color = trendUp ? "#00E5C7" : "#FF6B9D";

  return (
    <div>
      <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">
        Andamento nel tempo
      </p>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full overflow-visible">
        <defs>
          <linearGradient id="relFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={padX} y1={zeroY} x2={w - padX} y2={zeroY} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 4" />
        <path
          d={`${pathD} L${coords[coords.length - 1].x},${zeroY} L${coords[0].x},${zeroY} Z`}
          fill="url(#relFill)"
          stroke="none"
        />
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r={3.5} fill={color} />
      </svg>
    </div>
  );
}
