import { Task, Place, SingleExpense, RecurringExpense, PlannedExpense, SavingsEntry, ExpenseCategory } from "./types";
import { currentCycleRange, computeMonthlySpending, CycleRange } from "./finance";

export interface MonthlyReport {
  range: CycleRange;
  income: number;
  expenses: number;
  net: number;
  byCategory: Partial<Record<ExpenseCategory, number>>;
}

/**
 * Le "entrate" del ciclo sono la somma delle retribuzioni applicate col calcolatore
 * stipendio in quella finestra (vedi SavingsEntry.totalIncomeAmount) — l'unico dato di
 * reddito che l'app registra davvero. Un ciclo senza nessuna applicazione dello stipendio
 * avrà `income` a 0: onesto, non un buco silenzioso — se non hai mai usato quel
 * calcolatore in un dato mese, il report non finge di sapere quanto hai guadagnato.
 */
function incomeInRange(savingsEntries: SavingsEntry[], range: CycleRange): number {
  return savingsEntries
    .filter((e) => e.totalIncomeAmount !== undefined && new Date(e.date) >= range.start && new Date(e.date) < range.end)
    .reduce((sum, e) => sum + (e.totalIncomeAmount ?? 0), 0);
}

/**
 * Report per il ciclo che contiene `ref` (di default ora, cioè il ciclo corrente) — stessa
 * definizione di ciclo già in uso ovunque nell'app (vedi currentCycleRange in finance.ts),
 * non un mese di calendario separato: un report "di gennaio" per chi ha impostato il ciclo
 * dal 15 del mese userebbe comunque i suoi stessi confini, non ricadrebbe silenziosamente
 * sul mese solare che l'utente ha scelto di non usare altrove nell'app.
 */
export function monthlyReport(
  tasks: Task[],
  places: Place[],
  singleExpenses: SingleExpense[],
  recurringExpenses: RecurringExpense[],
  plannedExpenses: PlannedExpense[],
  savingsEntries: SavingsEntry[],
  cycleStartDay: number,
  ref: Date = new Date()
): MonthlyReport {
  const { total, byCategory, range } = computeMonthlySpending(tasks, places, singleExpenses, recurringExpenses, plannedExpenses, cycleStartDay, ref);
  const income = incomeInRange(savingsEntries, range);
  return { range, income, expenses: total, net: income - total, byCategory };
}

/** Un ciclo indietro rispetto a `ref` — per confrontare il ciclo corrente col precedente, o
 * per sfogliare report passati un ciclo alla volta. Sposta `ref` a un istante dentro il
 * ciclo precedente (l'ultimo istante prima dell'inizio di quello corrente) invece che al
 * primo giorno esatto, così `currentCycleRange` lo individua correttamente indipendentemente
 * dalla durata esatta in giorni del ciclo precedente. */
export function previousCycleRef(cycleStartDay: number, ref: Date = new Date()): Date {
  const current = currentCycleRange(cycleStartDay, ref);
  return new Date(current.start.getTime() - 1);
}
