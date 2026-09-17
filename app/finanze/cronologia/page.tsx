"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, History, Briefcase, MapPin, Receipt } from "lucide-react";
import { useTasks } from "@/lib/tasks-context";
import { usePlaces } from "@/lib/places-context";
import { useFinance } from "@/lib/finance-context";
import { allExpenseItems } from "@/lib/finance";
import { EXPENSE_CATEGORY_META } from "@/lib/finance-meta";
import { formatDateShort } from "@/lib/date-format";

const SOURCE_ICON = { task: Briefcase, luogo: MapPin, manuale: Receipt } as const;
const SOURCE_LABEL = { task: "Task", luogo: "Luogo", manuale: "Manuale" } as const;

/**
 * Elenco completo della cronologia spese, senza il limite di 5 righe mostrato nella scheda
 * Finanze (vedi ChronologicalExpensesTable) — stesso dato (`allExpenseItems`), qui semplicemente
 * senza tetto: chi vuole risalire a una spesa vecchia la trova qui invece di dover "caricare
 * altro" più volte dentro la scheda principale.
 */
export default function CronologiaFinanzePage() {
  const router = useRouter();
  const { hydrated: tasksHydrated, tasks } = useTasks();
  const { hydrated: placesHydrated, places } = usePlaces();
  const { hydrated: financeHydrated, plannedExpenses, singleExpenses } = useFinance();

  const items = useMemo(
    () => allExpenseItems(tasks, places, singleExpenses, plannedExpenses),
    [tasks, places, singleExpenses, plannedExpenses]
  );

  if (!tasksHydrated || !placesHydrated || !financeHydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <button
        onClick={() => router.back()}
        className="focus-ring flex items-center gap-1.5 text-xs text-ink-600 hover:text-ink-200"
      >
        <ArrowLeft size={14} /> Indietro
      </button>

      <p className="mt-4 flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.28em] text-ink-600">
        <History size={12} /> Finanze
      </p>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Cronologia spese</h1>
      <p className="mt-1 text-sm text-ink-600">
        {items.length === 0
          ? "Ancora nessuna spesa registrata."
          : `${items.length} ${items.length === 1 ? "movimento" : "movimenti"} in totale`}
      </p>

      <div className="mt-6 space-y-1.5">
        {items.map((item) => {
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
    </div>
  );
}
