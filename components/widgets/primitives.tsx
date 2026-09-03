"use client";
import { LucideIcon } from "lucide-react";

/** "Numero + etichetta" — la forma più comune tra i widget quadrati: una cifra sola,
 * grande, con un'icona sopra per il colpo d'occhio e un'etichetta che dice cosa significa. */
export function WidgetStat({
  icon: Icon,
  value,
  label,
  color = "#00E5C7",
  sub,
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
      <Icon size={16} style={{ color }} />
      <p className="font-display text-xl text-ink-100">{value}</p>
      <p className="text-[11px] leading-tight text-ink-600">{label}</p>
      {sub && <p className="text-[10px] text-ink-800">{sub}</p>}
    </div>
  );
}

/** Elenco breve — 2-4 righe, per le taglie a mezza larghezza o intere. */
export function WidgetList({
  title,
  icon: Icon,
  items,
  emptyLabel,
}: {
  title: string;
  icon: LucideIcon;
  items: { id: string; label: string; meta?: string; color?: string }[];
  emptyLabel: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <p className="mb-2 flex items-center gap-1.5 font-display text-xs text-ink-100">
        <Icon size={13} className="text-ink-600" /> {title}
      </p>
      {items.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-center text-[11px] text-ink-800">{emptyLabel}</p>
      ) : (
        <div className="flex-1 space-y-1.5 overflow-hidden">
          {items.slice(0, 4).map((it) => (
            <div key={it.id} className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-ink-200">{it.label}</span>
              {it.meta && (
                <span className="shrink-0 text-[11px]" style={{ color: it.color || "#8B90A8" }}>
                  {it.meta}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Un piccolo anello di progresso — versione compatta per un widget, non l'anello grande
 * di Finanze/Wishlist. */
export function WidgetRing({
  pct,
  color = "#00E5C7",
  label,
  centerValue,
}: {
  pct: number; // 0-1
  color?: string;
  label: string;
  centerValue: string;
}) {
  const size = 64;
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * Math.min(1, Math.max(0, pct));
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] text-ink-100">{centerValue}</span>
        </div>
      </div>
      <p className="text-[11px] text-ink-600">{label}</p>
    </div>
  );
}

export function WidgetEmpty({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center">
      <Icon size={16} className="text-ink-800" />
      <p className="text-[11px] text-ink-800">{label}</p>
    </div>
  );
}

/** Confronto tra due valori (es. questo periodo vs il precedente) — per le taglie a mezza
 * larghezza. */
export function WidgetComparison({
  icon: Icon,
  title,
  currentLabel,
  currentValue,
  previousLabel,
  previousValue,
  color = "#00E5C7",
}: {
  icon: LucideIcon;
  title: string;
  currentLabel: string;
  currentValue: string;
  previousLabel: string;
  previousValue: string;
  color?: string;
}) {
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <p className="flex items-center gap-1.5 font-display text-xs text-ink-100">
        <Icon size={13} style={{ color }} /> {title}
      </p>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-lg text-ink-100">{currentValue}</p>
          <p className="text-[10px] text-ink-800">{currentLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-ink-600">{previousValue}</p>
          <p className="text-[10px] text-ink-800">{previousLabel}</p>
        </div>
      </div>
    </div>
  );
}
