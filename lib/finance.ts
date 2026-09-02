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

export interface CycleRange {
  start: Date;
  end: Date; // esclusivo
}

/**
 * Il ciclo di budget corrente rispetto a `ref` — dal giorno `cycleStartDay` del mese (quello
 * corrente se `ref` è già arrivato lì, altrimenti quello precedente) fino al giorno prima
 * della prossima occorrenza dello stesso giorno. `cycleStartDay` è sempre 1-28 (vedi
 * `setCycleStartDay` in finance-context.tsx), quindi esiste in qualunque mese, febbraio
 * compreso — nessun bisogno di adattarlo ai mesi corti. Con cycleStartDay=1 questo coincide
 * esattamente col vecchio comportamento a mese di calendario, quindi chi non lo cambia mai
 * non vede alcuna differenza.
 */
export function currentCycleRange(cycleStartDay: number, ref: Date = new Date()): CycleRange {
  const start =
    ref.getDate() >= cycleStartDay
      ? new Date(ref.getFullYear(), ref.getMonth(), cycleStartDay)
      : new Date(ref.getFullYear(), ref.getMonth() - 1, cycleStartDay);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, cycleStartDay);
  return { start, end };
}

/**
 * Proiezione a fine ciclo al ritmo di spesa attuale: se hai speso `total` nei primi
 * `daysElapsed` giorni del ciclo, a fine ciclo saresti a `total * cycleDays / daysElapsed`
 * — un avviso predittivo su dove arriveresti, non solo una fotografia di dove sei ora.
 * Nei primissimi giorni del ciclo la proiezione è ancora poco affidabile (pochi dati),
 * quindi non viene mostrata prima del terzo giorno — vedi PROJECTION_MIN_DAY nel componente.
 */
export function projectedMonthlySpending(total: number, range: CycleRange, ref: Date = new Date()): number {
  const daysElapsed = Math.max(1, Math.round((ref.getTime() - range.start.getTime()) / 86_400_000) + 1);
  const cycleDays = Math.round((range.end.getTime() - range.start.getTime()) / 86_400_000);
  return (total / daysElapsed) * cycleDays;
}

function weeksInMonth(ref: Date): number {
  const days = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  return days / 7;
}

/** Le voci discrete (task completate, visite a un luogo, spese manuali) con un importo e una
 * data vera — mai le ricorrenti, che sono una configurazione, non un evento databile: non
 * hanno senso in una cronologia di transazioni reali. Senza `range` restituisce tutte le
 * voci di sempre (usato dalla tabella cronologica); con `range` solo quelle dentro il ciclo
 * (usato dal calcolo del ciclo corrente) — stessa costruzione, un solo posto da mantenere
 * invece di due copie quasi identiche.
 */
function buildDiscreteItems(tasks: Task[], places: Place[], singleExpenses: SingleExpense[], range?: CycleRange): MonthlyExpenseItem[] {
  const inScope = (iso: string) => !range || (new Date(iso) >= range.start && new Date(iso) < range.end);
  const items: MonthlyExpenseItem[] = [];

  tasks.forEach((t) => {
    if (t.spentAmount === undefined || !t.completedAt || !inScope(t.completedAt)) return;
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
      if (v.spentAmount === undefined || !inScope(v.date)) return;
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
    if (!inScope(e.date)) return;
    items.push({ id: e.id, label: e.label, amount: e.amount, category: e.category, date: e.date, source: "manuale" });
  });

  return items;
}

export function computeMonthlySpending(
  tasks: Task[],
  places: Place[],
  singleExpenses: SingleExpense[],
  recurringExpenses: RecurringExpense[],
  cycleStartDay = 1,
  ref: Date = new Date()
) {
  const range = currentCycleRange(cycleStartDay, ref);
  const items = buildDiscreteItems(tasks, places, singleExpenses, range);

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

  return { items, total, byCategory, range };
}

/** Tutte le voci discrete di sempre, più recenti prima — la tabella cronologica richiesta
 * esplicitamente. Le ricorrenti restano fuori (vedi buildDiscreteItems): sono già mostrate
 * nell'anello del ciclo corrente, qui servono solo transazioni reali con una data vera. */
export function allExpenseItems(tasks: Task[], places: Place[], singleExpenses: SingleExpense[]): MonthlyExpenseItem[] {
  return buildDiscreteItems(tasks, places, singleExpenses).sort((a, b) => b.date.localeCompare(a.date));
}
