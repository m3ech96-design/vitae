"use client";
import { useMemo, useState } from "react";
import { History, Briefcase, MapPin, Receipt, ChevronDown } from "lucide-react";
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
 *
 * Chiusa di default (tendina): con le Spese Singole che dopo 24h confluiscono qui (vedi
 * SingleExpensesSection), la Cronologia può diventare lunga in fretta e occupare da sola
 * tutto lo schermo della scheda Finanze — un pannello richiudibile la tiene fuori dai piedi
 * finché non serve davvero consultarla, invece di essere sempre spalancata sotto tutto il
 * resto.
 */
export function ChronologicalExpensesTable({ items }: { items: MonthlyExpenseItem[] }) {
  const [open, setOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  const header = (
    <button
      onClick={() => setOpen((v) => !v)}
      className="focus-ring flex w-full items-center justify-between"
      aria-expanded={open}
    >
      <span className="flex items-center gap-1.5 font-display text-sm text-ink-100">
        <History size={14} className="text-ink-600" /> Cronologia
        {items.length > 0 && <span className="text-[11px] font-normal text-ink-800">({items.length})</span>}
      </span>
      <ChevronDown size={16} className={`text-ink-600 transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
  );

  if (items.length === 0) {
    return (
      <div>
        {header}
        {open && <p className="mt-3 text-xs text-ink-800">Ancora nessuna spesa registrata.</p>}
      </div>
    );
  }

  if (!open) return <div>{header}</div>;

  return (
    <div>
      {header}
      <div className="mt-3 space-y-1.5">
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
                  {!item.chargedToBudget && <span className="text-aura-amber">· solo informativa</span>}
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
