"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useTasks } from "@/lib/tasks-context";
import { usePlaces } from "@/lib/places-context";
import { useFinance } from "@/lib/finance-context";
import { monthlyReport, previousCycleRef } from "@/lib/monthly-report";
import { EXPENSE_CATEGORY_META } from "@/lib/finance-meta";
import { GlassCard } from "@/components/ui/GlassCard";

function formatRange(range: { start: Date; end: Date }): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const endInclusive = new Date(range.end.getTime() - 86400000);
  return `${range.start.toLocaleDateString("it-IT", opts)} — ${endInclusive.toLocaleDateString("it-IT", opts)}`;
}

export default function MonthlyReportPage() {
  const router = useRouter();
  const { hydrated: tasksHydrated, tasks } = useTasks();
  const { hydrated: placesHydrated, places } = usePlaces();
  const { hydrated: financeHydrated, cycleStartDay, recurringExpenses, plannedExpenses, singleExpenses, savingsEntries } = useFinance();

  // `cyclesBack` invece di manipolare direttamente una data: ogni passo indietro deriva
  // dal precedente tramite previousCycleRef, così il confine di ogni ciclo resta sempre
  // quello vero calcolato da currentCycleRange — nessun rischio di "un mese fa" calcolato
  // a calendario mentre il resto dell'app ragiona per cicli di durata variabile.
  const [cyclesBack, setCyclesBack] = useState(0);

  const ref = useMemo(() => {
    let r = new Date();
    for (let i = 0; i < cyclesBack; i++) r = previousCycleRef(cycleStartDay, r);
    return r;
  }, [cyclesBack, cycleStartDay]);

  const report = useMemo(
    () => monthlyReport(tasks, places, singleExpenses, recurringExpenses, plannedExpenses, savingsEntries, cycleStartDay, ref),
    [tasks, places, singleExpenses, recurringExpenses, plannedExpenses, savingsEntries, cycleStartDay, ref]
  );

  const categoryRows = Object.entries(report.byCategory)
    .filter(([, amount]) => (amount ?? 0) > 0)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));

  const hydrated = tasksHydrated && placesHydrated && financeHydrated;
  if (!hydrated) return null;

  const isCurrentCycle = cyclesBack === 0;
  const hasIncomeData = report.income > 0;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <button onClick={() => router.back()} className="focus-ring flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-200">
        <ArrowLeft size={15} /> Indietro
      </button>

      <p className="mt-4 font-display text-xs uppercase tracking-[0.28em] text-ink-600">Finanze</p>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Report del ciclo</h1>

      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={() => setCyclesBack((c) => c + 1)}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-aura-violet/50"
          aria-label="Ciclo precedente"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="font-display text-sm text-ink-100">{isCurrentCycle ? "Ciclo in corso" : formatRange(report.range)}</p>
          {isCurrentCycle && <p className="text-[11px] text-ink-800">{formatRange(report.range)}</p>}
        </div>
        <button
          onClick={() => setCyclesBack((c) => Math.max(0, c - 1))}
          disabled={isCurrentCycle}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-aura-violet/50 disabled:opacity-30"
          aria-label="Ciclo successivo"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <GlassCard className="p-4">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-600">
            <TrendingUp size={12} className="text-aura-emerald" /> Entrate
          </p>
          <p className="mt-1.5 font-display text-lg text-ink-100">{Math.round(report.income).toLocaleString("it-IT")}€</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-600">
            <TrendingDown size={12} className="text-aura-pink" /> Uscite
          </p>
          <p className="mt-1.5 font-display text-lg text-ink-100">{Math.round(report.expenses).toLocaleString("it-IT")}€</p>
        </GlassCard>
      </div>

      <GlassCard className="mt-3 p-4">
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-600">
          <Wallet size={12} className="text-aura-cyan" /> Saldo netto del ciclo
        </p>
        <p className={`mt-1.5 font-display text-2xl ${report.net >= 0 ? "text-aura-emerald" : "text-aura-pink"}`}>
          {report.net >= 0 ? "+" : ""}
          {Math.round(report.net).toLocaleString("it-IT")}€
        </p>
        {!hasIncomeData && (
          <p className="mt-2 text-[11px] leading-relaxed text-ink-800">
            Nessuna entrata registrata in questo ciclo — applica il calcolatore stipendio nella scheda Finanze per
            includerla qui.
          </p>
        )}
      </GlassCard>

      {categoryRows.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Uscite per categoria</p>
          <div className="space-y-1.5">
            {categoryRows.map(([cat, amount]) => {
              const meta = EXPENSE_CATEGORY_META[cat as keyof typeof EXPENSE_CATEGORY_META];
              return (
                <div key={cat} className="flex items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-sm">
                  <span className="text-ink-300">{meta?.label ?? cat}</span>
                  <span className="text-ink-100">{Math.round(amount ?? 0).toLocaleString("it-IT")}€</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
