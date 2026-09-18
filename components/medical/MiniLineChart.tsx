"use client";
import { useId } from "react";

/** Estratto dalla stessa logica di components/health/WeightChart.tsx, generalizzato per
 * qualunque serie {date, value} — parametri vitali e singoli valori delle analisi del
 * sangue nel tempo condividono la stessa forma di dato, niente da duplicare due volte.
 *
 * Corretto secondo le istruzioni: la generalizzazione aveva perso per strada tutta la resa
 * visiva di WeightChart (area sfumata sotto la linea, bagliore) — restava una linea sottile a
 * tinta piatta, nettamente più spoglia della sua fonte pur comparendo, tra tutti i richiami,
 * in nove punti diversi dell'app (parametri vitali, analisi del sangue, peso degli animali,
 * metriche Hobby, misure corporee, permanenza nei luoghi...). Riportata alla stessa
 * ricchezza — un solo file, nove schermate che ne beneficiano insieme.
 *
 * L'id dei `<defs>` SVG (gradiente, sfocatura) è generato per istanza con `useId()`, non
 * scritto fisso come in WeightChart: quel componente compare una sola volta per pagina, questo
 * invece spesso più volte insieme sulla stessa schermata (BloodTestsSection può mostrarne
 * diversi in fila) — un id fisso avrebbe fatto sì che il browser usasse la prima definizione
 * trovata nel DOM per tutte le istanze successive con lo stesso id, sbagliando silenziosamente
 * i colori delle altre. Escluso per costruzione, non lasciato alla disciplina di chi lo
 * richiama in futuro. */
export function MiniLineChart({
  points: raw,
  unit,
  color = "#7C5CFF",
  hideCurrentValue = false,
}: {
  points: { date: string; value: number }[];
  unit: string;
  color?: string;
  /** Nasconde la riga "valore corrente" sotto il grafico — usata dal blocco Metrica degli
   * Hobby quando la metrica è cronometrata (isTimeBased in lib/hobby-types.ts): lì quel
   * valore è lo stesso già mostrato, con l'unità di tempo corretta, nella casella "Ultimo
   * cronometraggio" (vedi MetricBlockView.tsx) — ripeterlo qui sotto sarebbe un numero
   * duplicato, e per di più privo di unità quando `unit` (il campo libero della metrica) è
   * lasciato vuoto perché non serve più scriverlo a mano con il cronometro. */
  hideCurrentValue?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const fillId = `miniLineFill-${uid}`;
  const glowId = `miniLineGlow-${uid}`;

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
  const areaD = `${pathD} L${points[points.length - 1].x},${h - padY} L${points[0].x},${h - padY} Z`;
  const current = sorted[sorted.length - 1].value;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full overflow-visible">
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d={areaD} fill={`url(#${fillId})`} stroke="none" />
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 3.5 : 1.8}
            fill={color}
            opacity={i === points.length - 1 ? 1 : 0.5}
          />
        ))}
      </svg>
      {!hideCurrentValue && (
        <p className="mt-1 font-display text-lg text-ink-100">
          {current} <span className="text-xs text-ink-600">{unit}</span>
        </p>
      )}
    </div>
  );
}
