import { Task, Place, SingleExpense, RecurringExpense, ExpenseCategory } from "./types";
import { PLACE_TYPE_TO_CATEGORY } from "./finance-meta";
import { SPEND_ITEM_TO_EXPENSE_CATEGORY } from "./spending-categories";

export interface MonthlyExpenseItem {
  id: string;
  label: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  source: "task" | "luogo" | "manuale" | "ricorrente";
}

function isThisMonth(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

/**
 * Proiezione a fine mese al ritmo di spesa attuale: se hai speso `total` nei primi
 * `daysElapsed` giorni del mese, a fine mese saresti a `total * daysInMonth / daysElapsed`
 * — un avviso predittivo su dove arriveresti, non solo una fotografia di dove sei ora.
 * Nei primissimi giorni del mese la proiezione è ancora poco affidabile (pochi dati),
 * quindi non viene mostrata prima del terzo giorno — vedi PROJECTION_MIN_DAY nel componente.
 */
export function projectedMonthlySpending(total: number, ref: Date = new Date()): number {
  const daysElapsed = ref.getDate();
  const daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  if (daysElapsed <= 0) return total;
  return (total / daysElapsed) * daysInMonth;
}

function weeksInMonth(ref: Date): number {
  const days = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  return days / 7;
}

export function computeMonthlySpending(
  tasks: Task[],
  places: Place[],
  singleExpenses: SingleExpense[],
  recurringExpenses: RecurringExpense[],
  ref: Date = new Date()
) {
  const items: MonthlyExpenseItem[] = [];

  tasks.forEach((t) => {
    if (t.spentAmount === undefined || !t.completedAt || !isThisMonth(t.completedAt, ref)) return;
    if (t.spentBreakdown && t.spentBreakdown.length > 0) {
      t.spentBreakdown.forEach((b, i) => {
        const category: ExpenseCategory = SPEND_ITEM_TO_EXPENSE_CATEGORY[b.category] || "altro";
        items.push({ id: `${t.id}-${i}`, label: `${t.title} — ${b.category}`, amount: b.amount, category, date: t.completedAt!, source: "task" });
      });
      return;
    }
    const place = t.linkedPlaceId ? places.find((p) => p.id === t.linkedPlaceId) : undefined;
    const category: ExpenseCategory = (place && PLACE_TYPE_TO_CATEGORY[place.type]) || "altro";
    items.push({ id: t.id, label: t.title, amount: t.spentAmount, category, date: t.completedAt, source: "task" });
  });

  places.forEach((p) => {
    p.visitsHistory.forEach((v) => {
      if (v.spentAmount === undefined || !isThisMonth(v.date, ref)) return;
      if (v.spentBreakdown && v.spentBreakdown.length > 0) {
        v.spentBreakdown.forEach((b, i) => {
          const category: ExpenseCategory = SPEND_ITEM_TO_EXPENSE_CATEGORY[b.category] || "altro";
          items.push({ id: `${v.id}-${i}`, label: `${p.name} — ${b.category}`, amount: b.amount, category, date: v.date, source: "luogo" });
        });
        return;
      }
      const category: ExpenseCategory = PLACE_TYPE_TO_CATEGORY[p.type] || "altro";
      items.push({ id: v.id, label: p.name, amount: v.spentAmount, category, date: v.date, source: "luogo" });
    });
  });

  singleExpenses.forEach((e) => {
    if (!isThisMonth(e.date, ref)) return;
    items.push({ id: e.id, label: e.label, amount: e.amount, category: e.category, date: e.date, source: "manuale" });
  });

  recurringExpenses
    .filter((e) => e.active)
    .forEach((e) => {
      let monthlyAmount = e.amount;
      if (e.recurrence === "settimanale") monthlyAmount = e.amount * weeksInMonth(ref);
      if (e.recurrence === "annuale") monthlyAmount = e.amount / 12;
      items.push({
        id: e.id,
        label: e.label,
        amount: monthlyAmount,
        category: e.category,
        date: ref.toISOString(),
        source: "ricorrente",
      });
    });

  const total = items.reduce((s, i) => s + i.amount, 0);
  const byCategory = items.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + i.amount;
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  return { items, total, byCategory };
}
