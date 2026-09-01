"use client";

/** Estratto dalla stessa logica di components/health/WeightChart.tsx, generalizzato per
 * qualunque serie {date, value} — parametri vitali e singoli valori delle analisi del
 * sangue nel tempo condividono la stessa forma di dato, niente da duplicare due volte. */
export function MiniLineChart({
  points: raw,
  unit,
  color = "#7C5CFF",
}: {
  points: { date: string; value: number }[];
  unit: string;
  color?: string;
}) {
  const sorted = [...raw].sort((a, b) => a.date.localeCompare(b.date)).slice(-20);

  if (sorted.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-xl2 border border-dashed border-white/10 text-xs text-ink-800">
        Nessun valore registrato ancora.
      </div>
    );
  }

  const values = sorted.map((e) => e.value);
  const min = Math.min(...values) - Math.max(1, Math.abs(Math.min(...values)) * 0.05);
  const max = Math.max(...values) + Math.max(1, Math.abs(Math.max(...values)) * 0.05);
  const w = 320;
  const h = 96;
  const padX = 10;
  const padY = 12;
  const stepX = sorted.length > 1 ? (w - padX * 2) / (sorted.length - 1) : 0;
  const scaleY = (v: number) => h - padY - ((v - min) / (max - min || 1)) * (h - padY * 2);
  const points = sorted.map((e, i) => ({ x: padX + i * stepX, y: scaleY(e.value) }));
  const pathD = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  const current = sorted[sorted.length - 1].value;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full overflow-visible">
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 3.5 : 2} fill={color} />
        ))}
      </svg>
      <p className="mt-1 font-display text-lg text-ink-100">
        {current} <span className="text-xs text-ink-600">{unit}</span>
      </p>
    </div>
  );
}
