"use client";
import { useMemo, useState } from "react";
import { History, Briefcase, MapPin, Receipt } from "lucide-react";
import { MonthlyExpenseItem } from "@/lib/finance";
import { EXPENSE_CATEGORY_META } from "@/lib/finance-meta";
import { formatDateShort } from "@/lib/date-format";

const SOURCE_ICON = { task: Briefcase, luogo: MapPin, manuale: Receipt } as const;
const SOURCE_LABEL = { task: "Task", luogo: "Luogo", manuale: "Manuale" } as const;

const PAGE_SIZE = 20;

/**
 * Ogni spesa reale di sempre (task completate, visite a un luogo, spese manuali — mai le
 * ricorrenti, che sono configurazione e non un evento databile), più recente prima. Il dato
 * arriva già pronto da `allExpenseItems` (lib/finance.ts): questa è solo la vetrina. "Carica
 * altre" invece di scrollare tutto insieme — con mesi di storia la lista può diventare lunga,
 * meglio caricarla a pezzi che bloccare il primo render con centinaia di righe.
 */
export function ChronologicalExpensesTable({ items }: { items: MonthlyExpenseItem[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  if (items.length === 0) {
    return (
      <div>
        <p className="mb-3 flex items-center gap-1.5 font-display text-sm text-ink-100">
          <History size={14} className="text-ink-600" /> Cronologia
        </p>
        <p className="text-xs text-ink-800">Ancora nessuna spesa registrata.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 font-display text-sm text-ink-100">
        <History size={14} className="text-ink-600" /> Cronologia
      </p>
      <div className="space-y-1.5">
        {visible.map((item) => {
          const meta = EXPENSE_CATEGORY_META[item.category];
          const SourceIcon = item.source in SOURCE_ICON ? SOURCE_ICON[item.source as keyof typeof SOURCE_ICON] : Receipt;
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.015] px-3.5 py-2.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: `${meta.color}1F` }}>
                <meta.icon size={13} style={{ color: meta.color }} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink-100">{item.label}</p>
                <p className="flex items-center gap-1 text-[11px] text-ink-800">
                  {formatDateShort(item.date)}
                  {item.source in SOURCE_LABEL && (
                    <>
                      <SourceIcon size={9} /> {SOURCE_LABEL[item.source as keyof typeof SOURCE_LABEL]}
                    </>
                  )}
                </p>
              </div>
              <span className="shrink-0 text-sm text-ink-200">{item.amount.toLocaleString("it-IT", { maximumFractionDigits: 2 })}€</span>
            </div>
          );
        })}
      </div>

      {visibleCount < items.length && (
        <button
          onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
          className="focus-ring mt-3 w-full rounded-xl2 border border-white/10 py-2.5 text-xs text-ink-400 hover:border-white/20 hover:text-ink-100"
        >
          Carica altre ({items.length - visibleCount} rimaste)
        </button>
      )}
    </div>
  );
}
