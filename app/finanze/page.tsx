"use client";
import { useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTasks } from "@/lib/tasks-context";
import { usePlaces } from "@/lib/places-context";
import { useFinance } from "@/lib/finance-context";
import { computeMonthlySpending, projectedMonthlySpending } from "@/lib/finance";
import { useMood } from "@/lib/mood-context";
import { GlassCard } from "@/components/ui/GlassCard";
import { BudgetRing } from "@/components/finance/BudgetRing";
import { CategoryDonut } from "@/components/finance/CategoryDonut";
import { RecurringExpensesSection } from "@/components/finance/RecurringExpensesSection";
import { PlannedExpensesSection } from "@/components/finance/PlannedExpensesSection";
import { SingleExpensesSection } from "@/components/finance/SingleExpensesSection";
import { SavingsSection } from "@/components/finance/SavingsSection";

export default function FinanzePage() {
  const { hydrated: tasksHydrated, tasks } = useTasks();
  const { hydrated: placesHydrated, places } = usePlaces();
  const {
    hydrated: financeHydrated,
    monthlyBudget,
    setMonthlyBudget,
    recurringExpenses,
    plannedExpenses,
    singleExpenses,
  } = useFinance();

  const { total, byCategory } = useMemo(
    () => computeMonthlySpending(tasks, places, singleExpenses, recurringExpenses),
    [tasks, places, singleExpenses, recurringExpenses]
  );
  const projected = useMemo(() => projectedMonthlySpending(total), [total]);
  const { fireTrigger } = useMood();

  // Una volta sola per mese, non ad ogni apertura della pagina — altrimenti sarebbe solo
  // rumore: la prima volta che vedi la proiezione sforare (o restare sotto, negli ultimi
  // giorni del mese) conta, non ogni singola occhiata a Finanze.
  useEffect(() => {
    if (!monthlyBudget) return;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const storeKey = "vitae:budget-mood-month";
    let already: string | null = null;
    try {
      already = window.localStorage.getItem(storeKey);
    } catch {
      // storage non disponibile: salta, non blocca la pagina
    }
    if (already === monthKey) return;

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const isLastDaysOfMonth = now.getDate() >= daysInMonth - 2;

    if (projected > monthlyBudget) {
      fireTrigger("finanze:sopra-budget");
    } else if (isLastDaysOfMonth) {
      fireTrigger("finanze:sotto-budget");
    } else {
      return; // troppo presto per dire se resterai sotto budget: non segnare il mese ancora
    }
    try {
      window.localStorage.setItem(storeKey, monthKey);
    } catch {
      // storage non disponibile: l'innesco funziona comunque per questa sessione
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthlyBudget, projected]);

  const risparmioDelMese = monthlyBudget !== null ? monthlyBudget - total : null;
  const indiceRisparmio =
    monthlyBudget && monthlyBudget > 0 ? Math.round(((monthlyBudget - total) / monthlyBudget) * 100) : null;

  if (!tasksHydrated || !placesHydrated || !financeHydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Finanze</p>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Dove va il tuo denaro</h1>

      <GlassCard glow="violet" className="mt-6 flex flex-col items-center gap-5 p-6">
        <BudgetRing spent={total} budget={monthlyBudget} projected={projected} onSetBudget={setMonthlyBudget} />
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
            <p className="text-[10px] text-ink-800">Risparmio del mese</p>
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
        <RecurringExpensesSection />
        <PlannedExpensesSection />
        <SingleExpensesSection />
        <SavingsSection />
      </div>
    </div>
  );
}
