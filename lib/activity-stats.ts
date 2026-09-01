import { Workout } from "./types";
import { ACTIVITIES, ACTIVITY_CATEGORIES, categoryOf } from "./activity-catalog";
import { addDaysIso, todayIso } from "./date-format";

/** "La sessione più lunga" e "quella con più calorie", per ogni attività praticata almeno
 * due volte — sotto quella soglia non è ancora un record, è l'unica volta che l'hai fatta. */
export interface PersonalRecord {
  activityId: string;
  longestMinutes: { minutes: number; date: string };
  mostCalories: { calories: number; date: string };
  timesPracticed: number;
}

export function personalRecords(workouts: Workout[]): PersonalRecord[] {
  const byActivity = new Map<string, Workout[]>();
  workouts.forEach((w) => {
    const list = byActivity.get(w.activityId) ?? [];
    list.push(w);
    byActivity.set(w.activityId, list);
  });

  const records: PersonalRecord[] = [];
  byActivity.forEach((list, activityId) => {
    if (list.length < 2) return;
    const longest = list.reduce((a, b) => (b.minutes > a.minutes ? b : a));
    const most = list.reduce((a, b) => (b.calories > a.calories ? b : a));
    records.push({
      activityId,
      longestMinutes: { minutes: longest.minutes, date: longest.date },
      mostCalories: { calories: most.calories, date: most.date },
      timesPracticed: list.length,
    });
  });

  return records.sort((a, b) => b.timesPracticed - a.timesPracticed);
}

/** Un giorno per cella, come i contributi di GitHub — quante sessioni quel giorno, non
 * quanti minuti: la sfumatura racconta la costanza, non lo sforzo (quello lo dice già il
 * grafico per categoria qui sotto). */
export function activityHeatmap(workouts: Workout[], days: number): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  workouts.forEach((w) => counts.set(w.date, (counts.get(w.date) ?? 0) + 1));

  const cells: { date: string; count: number }[] = [];
  const today = todayIso();
  for (let i = days - 1; i >= 0; i--) {
    const date = addDaysIso(today, -i);
    cells.push({ date, count: counts.get(date) ?? 0 });
  }
  return cells;
}

/** Minuti per categoria, in una finestra di giorni — cardio contro forza contro sport,
 * non solo il totale che già mostra il resto della scheda. */
export function minutesByCategory(workouts: Workout[], sinceDate: string): { categoryId: string; label: string; color: string; minutes: number }[] {
  const totals = new Map<string, number>();
  workouts
    .filter((w) => w.date >= sinceDate)
    .forEach((w) => {
      const cat = categoryOf(w.activityId);
      totals.set(cat.id, (totals.get(cat.id) ?? 0) + w.minutes);
    });

  return ACTIVITY_CATEGORIES.map((c) => ({ categoryId: c.id, label: c.label, color: c.color, minutes: totals.get(c.id) ?? 0 })).filter(
    (c) => c.minutes > 0
  );
}

export interface PeriodComparison {
  minutes: number;
  calories: number;
  sessions: number;
}

function summarize(workouts: Workout[], from: string, to: string): PeriodComparison {
  const inRange = workouts.filter((w) => w.date >= from && w.date <= to);
  return {
    minutes: inRange.reduce((s, w) => s + w.minutes, 0),
    calories: inRange.reduce((s, w) => s + w.calories, 0),
    sessions: inRange.length,
  };
}

/** Questa settimana (oggi compreso, gli ultimi 7 giorni) contro la settimana precedente —
 * stessa lunghezza di finestra su entrambi i lati, altrimenti il confronto non direbbe nulla. */
export function weekOverWeek(workouts: Workout[]): { current: PeriodComparison; previous: PeriodComparison } {
  const today = todayIso();
  const currentFrom = addDaysIso(today, -6);
  const previousTo = addDaysIso(currentFrom, -1);
  const previousFrom = addDaysIso(previousTo, -6);
  return {
    current: summarize(workouts, currentFrom, today),
    previous: summarize(workouts, previousFrom, previousTo),
  };
}

export function monthOverMonth(workouts: Workout[]): { current: PeriodComparison; previous: PeriodComparison } {
  const today = todayIso();
  const currentFrom = addDaysIso(today, -29);
  const previousTo = addDaysIso(currentFrom, -1);
  const previousFrom = addDaysIso(previousTo, -29);
  return {
    current: summarize(workouts, currentFrom, today),
    previous: summarize(workouts, previousFrom, previousTo),
  };
}

export function activityLabelOf(activityId: string): string {
  return ACTIVITIES.find((a) => a.id === activityId)?.label ?? "Attività";
}
