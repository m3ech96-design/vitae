"use client";
import { Wallet, PiggyBank, Receipt, Tag, TrendingUp, TrendingDown, CalendarClock } from "lucide-react";
import { useFinance } from "@/lib/finance-context";
import { useTasks } from "@/lib/tasks-context";
import { usePlaces } from "@/lib/places-context";
import { computeMonthlySpending, allExpenseItems, currentCycleRange } from "@/lib/finance";
import { EXPENSE_CATEGORY_META } from "@/lib/finance-meta";
import { todayIso } from "@/lib/date-format";
import { WidgetRing, WidgetStat, WidgetEmpty, WidgetComparison } from "../primitives";
import { WidgetSize } from "@/lib/widgets/types";

export function BudgetCycleWidget({ size }: { size: WidgetSize }) {
  const { monthlyBudget, cycleStartDay, recurringExpenses, singleExpenses, plannedExpenses } = useFinance();
  const { tasks } = useTasks();
  const { places } = usePlaces();
  const { total } = computeMonthlySpending(tasks, places, singleExpenses, recurringExpenses, plannedExpenses, cycleStartDay);
  if (!monthlyBudget) return <WidgetEmpty icon={Wallet} label="Nessun budget impostato" />;
  const pct = total / monthlyBudget;
  const color = pct < 0.7 ? "#00E5C7" : pct < 1 ? "#FFB454" : "#FF4D6D";
  return <WidgetRing pct={pct} color={color} label="Budget del ciclo" centerValue={`${Math.round(total)}€`} />;
}

export function LastExpenseWidget({ size }: { size: WidgetSize }) {
  const { singleExpenses, plannedExpenses } = useFinance();
  const { tasks } = useTasks();
  const { places } = usePlaces();
  const items = allExpenseItems(tasks, places, singleExpenses, plannedExpenses);
  const last = items[0];
  if (!last) return <WidgetEmpty icon={Receipt} label="Ancora nessuna spesa" />;
  return <WidgetStat icon={Receipt} value={`${Math.round(last.amount)}€`} label={last.label} color="#8B90A8" />;
}

export function SavingsGoalsTotalWidget({ size }: { size: WidgetSize }) {
  const { savingsGoals } = useFinance();
  const total = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  return <WidgetStat icon={PiggyBank} value={`${Math.round(total)}€`} label="Risparmiato sugli obiettivi" color="#34D399" />;
}

export function CycleLeftoverWidget({ size }: { size: WidgetSize }) {
  const { monthlyBudget, cycleStartDay, recurringExpenses, singleExpenses, plannedExpenses } = useFinance();
  const { tasks } = useTasks();
  const { places } = usePlaces();
  const { total } = computeMonthlySpending(tasks, places, singleExpenses, recurringExpenses, plannedExpenses, cycleStartDay);
  if (!monthlyBudget) return <WidgetEmpty icon={Wallet} label="Nessun budget impostato" />;
  const leftover = monthlyBudget - total;
  return (
    <WidgetStat
      icon={Wallet}
      value={`${Math.round(leftover)}€`}
      label={leftover >= 0 ? "Rimasto nel ciclo" : "Sforato di"}
      color={leftover >= 0 ? "#34D399" : "#FF4D6D"}
    />
  );
}

export function NextPlannedExpenseWidget({ size }: { size: WidgetSize }) {
  const { plannedExpenses } = useFinance();
  const next = [...plannedExpenses].filter((p) => !p.paid).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  if (!next) return <WidgetEmpty icon={CalendarClock} label="Nessuna spesa pianificata" />;
  return <WidgetStat icon={CalendarClock} value={`${next.amount}€`} label={next.label} color="#FFB454" />;
}

export function TopCategoryWidget({ size }: { size: WidgetSize }) {
  const { cycleStartDay, recurringExpenses, singleExpenses, plannedExpenses } = useFinance();
  const { tasks } = useTasks();
  const { places } = usePlaces();
  const { byCategory } = computeMonthlySpending(tasks, places, singleExpenses, recurringExpenses, plannedExpenses, cycleStartDay);
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const top = entries[0];
  if (!top) return <WidgetEmpty icon={Tag} label="Ancora nessuna spesa" />;
  const meta = EXPENSE_CATEGORY_META[top[0] as keyof typeof EXPENSE_CATEGORY_META];
  return <WidgetStat icon={meta?.icon ?? Tag} value={`${Math.round(top[1])}€`} label={meta?.label ?? top[0]} color={meta?.color ?? "#8B90A8"} />;
}

export function CycleComparisonWidget({ size }: { size: WidgetSize }) {
  const { cycleStartDay, recurringExpenses, singleExpenses, plannedExpenses } = useFinance();
  const { tasks } = useTasks();
  const { places } = usePlaces();
  const today = todayIso();
  const range = currentCycleRange(cycleStartDay, new Date(today));
  const previousRef = new Date(range.start);
  previousRef.setDate(previousRef.getDate() - 1);
  const current = computeMonthlySpending(tasks, places, singleExpenses, recurringExpenses, plannedExpenses, cycleStartDay).total;
  const previous = computeMonthlySpending(tasks, places, singleExpenses, recurringExpenses, plannedExpenses, cycleStartDay, previousRef).total;
  return (
    <WidgetComparison
      icon={current >= previous ? TrendingUp : TrendingDown}
      title="Ciclo vs precedente"
      currentLabel="Questo ciclo"
      currentValue={`${Math.round(current)}€`}
      previousLabel="Ciclo scorso"
      previousValue={`${Math.round(previous)}€`}
      color={current > previous ? "#FF6B9D" : "#34D399"}
    />
  );
}

export function CycleCountdownWidget({ size }: { size: WidgetSize }) {
  const { cycleStartDay } = useFinance();
  const range = currentCycleRange(cycleStartDay);
  const daysLeft = Math.max(0, Math.round((range.end.getTime() - Date.now()) / 86_400_000));
  return <WidgetStat icon={CalendarClock} value={daysLeft} label={daysLeft === 1 ? "Giorno al nuovo ciclo" : "Giorni al nuovo ciclo"} color="#8B90A8" />;
}

export function SavingsGoalVesselWidget({ size }: { size: WidgetSize }) {
  const { savingsGoals } = useFinance();
  const active = savingsGoals.find((g) => g.currentAmount < g.targetAmount) ?? savingsGoals[0];
  if (!active) return <WidgetEmpty icon={PiggyBank} label="Nessun obiettivo di risparmio" />;
  const pct = active.targetAmount > 0 ? active.currentAmount / active.targetAmount : 0;
  return <WidgetRing pct={pct} color="#34D399" label={active.label} centerValue={`${Math.round(active.currentAmount)}€`} />;
}
