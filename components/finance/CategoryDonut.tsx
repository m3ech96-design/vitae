"use client";
import { ExpenseCategory } from "@/lib/types";
import { EXPENSE_CATEGORY_META } from "@/lib/finance-meta";

export function CategoryDonut({ byCategory, total }: { byCategory: Record<string, number>; total: number }) {
  const size = 130;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const entries = Object.entries(byCategory)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]) as [ExpenseCategory, number][];

  let cumulative = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} className="-rotate-90 shrink-0">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} fill="none" />
        {entries.map(([cat, amount]) => {
          const meta = EXPENSE_CATEGORY_META[cat];
          const fraction = total > 0 ? amount / total : 0;
          const dash = circumference * fraction;
          const offset = -cumulative * circumference;
          cumulative += fraction;
          return (
            <circle
              key={cat}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={meta.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
              style={{ filter: `drop-shadow(0 0 3px ${meta.color}aa)` }}
            />
          );
        })}
      </svg>
      <div className="min-w-0 flex-1 space-y-1.5">
        {entries.length === 0 && <p className="text-xs text-ink-800">Nessuna Spesa Questo Mese.</p>}
        {entries.slice(0, 5).map(([cat, amount]) => {
          const meta = EXPENSE_CATEGORY_META[cat];
          const Icon = meta.icon;
          return (
            <div key={cat} className="flex items-center gap-2 text-xs">
              <Icon size={12} style={{ color: meta.color }} />
              <span className="min-w-0 flex-1 truncate text-ink-400">{meta.label}</span>
              <span className="shrink-0 text-ink-200">{Math.round(amount)}€</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
