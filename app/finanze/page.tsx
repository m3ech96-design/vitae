"use client";
import { useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTasks } from "@/lib/tasks-context";
import { usePlaces } from "@/lib/places-context";
import { useFinance } from "@/lib/finance-context";
import { computeMonthlySpending, projectedMonthlySpending, allExpenseItems } from "@/lib/finance";
import { useMood } from "@/lib/mood-context";
import { GlassCard } from "@/components/ui/GlassCard";
import { BudgetRing } from "@/components/finance/BudgetRing";
import { CategoryDonut } from "@/components/finance/CategoryDonut";
import { RecurringExpensesSection } from "@/components/finance/RecurringExpensesSection";
import { PlannedExpensesSection } from "@/components/finance/PlannedExpensesSection";
import { SingleExpensesSection } from "@/components/finance/SingleExpensesSection";
import { SavingsSection } from "@/components/finance/SavingsSection";
import { SalarySplitCalculator } from "@/components/finance/SalarySplitCalculator";
import { ChronologicalExpensesTable } from "@/components/finance/ChronologicalExpensesTable";

export default function FinanzePage() {
  const { hydrated: tasksHydrated, tasks } = useTasks();
  const { hydrated: placesHydrated, places } = usePlaces();
  const {
    hydrated: financeHydrated,
    monthlyBudget,
    setMonthlyBudget,
    cycleStartDay,
    setCycleStartDay,
    recurringExpenses,
    plannedExpenses,
    singleExpenses,
  } = useFinance();

  const { total, byCategory, range } = useMemo(
    () => computeMonthlySpending(tasks, places, singleExpenses, recurringExpenses, plannedExpenses, cycleStartDay),
    [tasks, places, singleExpenses, recurringExpenses, plannedExpenses, cycleStartDay]
  );
  const projected = useMemo(() => projectedMonthlySpending(total, range), [total, range]);
  const allItems = useMemo(
    () => allExpenseItems(tasks, places, singleExpenses, plannedExpenses),
    [tasks, places, singleExpenses, plannedExpenses]
  );
  const { fireTrigger } = useMood();

  // Una volta sola per ciclo, non ad ogni apertura della pagina — altrimenti sarebbe solo
  // rumore: la prima volta che vedi la proiezione sforare (o restare sotto, negli ultimi
  // giorni del ciclo) conta, non ogni singola occhiata a Finanze.
  useEffect(() => {
    if (!monthlyBudget) return;
    // Chiave per l'inizio del ciclo, non per mese di calendario: due cicli diversi che
    // capitano nello stesso mese (dopo un reset manuale) devono poter innescare entrambi.
    const cycleKey = range.start.toISOString().slice(0, 10);
    const storeKey = "vitae:budget-mood-cycle";
    let already: string | null = null;
    try {
      already = window.localStorage.getItem(storeKey);
    } catch {
      // storage non disponibile: salta, non blocca la pagina
    }
    if (already === cycleKey) return;

    const now = new Date();
    const cycleDays = Math.round((range.end.getTime() - range.start.getTime()) / 86_400_000);
    const daysElapsed = Math.round((now.getTime() - range.start.getTime()) / 86_400_000) + 1;
    const isLastDaysOfCycle = daysElapsed >= cycleDays - 2;

    if (projected > monthlyBudget) {
      fireTrigger("finanze:sopra-budget");
    } else if (isLastDaysOfCycle) {
      fireTrigger("finanze:sotto-budget");
    } else {
      return; // troppo presto per dire se resterai sotto budget: non segnare il ciclo ancora
    }
    try {
      window.localStorage.setItem(storeKey, cycleKey);
    } catch {
      // storage non disponibile: l'innesco funziona comunque per questa sessione
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthlyBudget, projected, range]);

  const risparmioDelMese = monthlyBudget !== null ? monthlyBudget - total : null;
  const indiceRisparmio =
    monthlyBudget && monthlyBudget > 0 ? Math.round(((monthlyBudget - total) / monthlyBudget) * 100) : null;

  if (!tasksHydrated || !placesHydrated || !financeHydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Finanze</p>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Dove va il tuo denaro</h1>

      <GlassCard glow="violet" className="mt-6 flex flex-col items-center gap-5 p-6">
        <BudgetRing
          spent={total}
          budget={monthlyBudget}
          projected={projected}
          onSetBudget={setMonthlyBudget}
          cycleStartDay={cycleStartDay}
          onSetCycleStartDay={setCycleStartDay}
          cycleRange={range}
        />
        <div className="w-full border-t border-white/[0.06] pt-5">
          <CategoryDonut byCategory={byCategory} total={total} />
        </div>
      </GlassCard>

      {monthlyBudget !== null && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <GlassCard className="p-4 text-center">
            {risparmioDelMese !== null && risparmioDelMese >= 0 ? (
              <TrendingUp size={16} className="mx-auto text-aura-emerald" />
            ) : (
              <TrendingDown size={16} className="mx-auto text-aura-pink" />
            )}
            <p className="mt-2 font-display text-lg text-ink-100">
              {risparmioDelMese !== null ? Math.round(risparmioDelMese).toLocaleString("it-IT") : "—"}€
            </p>
            <p className="text-[10px] text-ink-800">Risparmio del ciclo</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p
              className="font-display text-lg"
              style={{ color: (indiceRisparmio ?? 0) >= 0 ? "#00E5C7" : "#FF6B9D" }}
            >
              {indiceRisparmio !== null ? `${indiceRisparmio}%` : "—"}
            </p>
            <p className="mt-2 text-[10px] text-ink-800">Indice di risparmio</p>
          </GlassCard>
        </div>
      )}

      <div className="mt-9 space-y-9">
        <SalarySplitCalculator />
        <RecurringExpensesSection />
        <PlannedExpensesSection />
        <SingleExpensesSection />
        <ChronologicalExpensesTable items={allItems} />
        <SavingsSection />
      </div>
    </div>
  );
}
