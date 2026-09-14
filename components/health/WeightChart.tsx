"use client";
import { WeightEntry } from "@/lib/types";
import { weightTrend, weightTendencyDelta } from "@/lib/weight-trend";

export function WeightChart({ entries, goal }: { entries: WeightEntry[]; goal: number | null }) {
  const trend = weightTrend(entries, 20);

  if (trend.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl2 border border-dashed border-white/10 text-xs text-ink-800">
        Nessuna pesata registrata ancora.
      </div>
    );
  }

  const rawValues = trend.map((e) => e.raw);
  const smoothedValues = trend.map((e) => e.smoothed).filter((v): v is number => v !== null);
  const allValues = goal ? [...rawValues, ...smoothedValues, goal] : [...rawValues, ...smoothedValues];
  const min = Math.min(...allValues) - 1;
  const max = Math.max(...allValues) + 1;
  const w = 320;
  const h = 128;
  const padX = 10;
  const padY = 14;
  const stepX = trend.length > 1 ? (w - padX * 2) / (trend.length - 1) : 0;
  const scaleY = (v: number) => h - padY - ((v - min) / (max - min || 1)) * (h - padY * 2);

  const rawPoints = trend.map((e, i) => ({ x: padX + i * stepX, y: scaleY(e.raw) }));
  const rawPathD = rawPoints.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  const areaD = `${rawPathD} L${rawPoints[rawPoints.length - 1].x},${h - padY} L${rawPoints[0].x},${h - padY} Z`;

  // La linea di tendenza può avere "buchi" (i primi punti di uno storico corto non hanno
  // ancora una media affidabile, vedi lib/weight-trend.ts) — si spezza in più segmenti
  // invece di saltare da un punto valido al successivo attraverso quelli mancanti, che
  // disegnerebbe un tratto dritto falsato sopra un vuoto di dati.
  const smoothedSegments: { x: number; y: number }[][] = [];
  let currentSegment: { x: number; y: number }[] = [];
  trend.forEach((e, i) => {
    if (e.smoothed === null) {
      if (currentSegment.length > 1) smoothedSegments.push(currentSegment);
      currentSegment = [];
      return;
    }
    currentSegment.push({ x: padX + i * stepX, y: scaleY(e.smoothed) });
  });
  if (currentSegment.length > 1) smoothedSegments.push(currentSegment);
  const smoothedPathsD = smoothedSegments.map((seg) => seg.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" "));

  const goalY = goal !== null ? scaleY(goal) : null;
  const current = trend[trend.length - 1].raw;
  const { delta } = weightTendencyDelta(entries);
  const hasTrendLine = smoothedSegments.length > 0;

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
        {/* Pesate grezze: tratto sottile e più trasparente — è il dato reale, ma qui fa da
            sfondo alla tendenza, non il contrario. */}
        <path d={rawPathD} fill="none" stroke="url(#weightStroke)" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" opacity={hasTrendLine ? 0.35 : 1} />
        {rawPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === rawPoints.length - 1 && !hasTrendLine ? 4 : 2} fill="#7C5CFF" opacity={hasTrendLine ? 0.45 : 1} />
        ))}
        {/* Tendenza (media mobile adattiva): tratto pieno e in rilievo, quello che l'occhio
            deve seguire per capire la direzione reale senza il rumore di ogni singola pesata. */}
        {smoothedPathsD.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#00E5C7" strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round" filter="url(#weightGlow)" />
        ))}
      </svg>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="font-display text-2xl text-ink-100">
          {current} <span className="text-sm text-ink-600">Kg</span>
        </span>
        {delta !== null && (
          <span className={`text-xs ${delta <= 0 ? "text-aura-emerald" : "text-aura-pink"}`} title="Tendenza recente rispetto al periodo precedente">
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)} Kg · tendenza
          </span>
        )}
      </div>
    </div>
  );
}
