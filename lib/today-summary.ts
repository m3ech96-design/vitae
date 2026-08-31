import { Task, Place, SingleExpense, Workout } from "./types";

function isToday(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}

export interface TodaySummary {
  tasksCompleted: number;
  placesVisited: string[];
  peopleSeenIds: string[];
  spent: number;
  activityMinutes: number;
}

export function isTodayEmpty(s: TodaySummary): boolean {
  return (
    s.tasksCompleted === 0 &&
    s.placesVisited.length === 0 &&
    s.peopleSeenIds.length === 0 &&
    s.spent === 0 &&
    s.activityMinutes === 0
  );
}

/**
 * Tutto ciò che è successo oggi, attraverso i moduli — Task, Luoghi, Persone, Finanze,
 * Salute — raccolto in un solo posto invece di restare quattro mondi separati che non si
 * parlano mai in un'unica vista. Vive e cresce durante la giornata (non è un report fisso
 * di fine giornata): ogni cosa che fai altrove nell'app appare qui appena accade.
 *
 * Le spese ricorrenti restano fuori dal totale: in Finanze sono già prorate al mese
 * (l'importo mensile diviso sulle settimane), non transazioni avvenute davvero oggi —
 * mostrarle ogni singolo giorno sarebbe fuorviante, non un vero "hai speso oggi".
 */
export function todaySummary(
  tasks: Task[],
  places: Place[],
  singleExpenses: SingleExpense[],
  workouts: Workout[],
  ref: Date = new Date()
): TodaySummary {
  const tasksToday = tasks.filter((t) => t.completed && t.completedAt && isToday(t.completedAt, ref));

  const placesVisited = new Set<string>();
  const peopleSeenIds = new Set<string>();
  let spent = 0;

  tasksToday.forEach((t) => {
    t.linkedPersonIds.forEach((id) => peopleSeenIds.add(id));
    if (t.spentAmount !== undefined) spent += t.spentAmount;
  });

  places.forEach((p) => {
    p.visitsHistory.forEach((v) => {
      if (!isToday(v.date, ref)) return;
      placesVisited.add(p.name);
      v.withPersonIds.forEach((id) => peopleSeenIds.add(id));
      if (v.spentAmount !== undefined) spent += v.spentAmount;
    });
    if (p.currentVisitStartedAt && isToday(p.currentVisitStartedAt, ref)) {
      placesVisited.add(p.name);
    }
  });

  singleExpenses.forEach((e) => {
    if (isToday(e.date, ref)) spent += e.amount;
  });

  const activityMinutes = workouts.filter((w) => isToday(w.date, ref)).reduce((sum, w) => sum + w.minutes, 0);

  return {
    tasksCompleted: tasksToday.length,
    placesVisited: [...placesVisited],
    peopleSeenIds: [...peopleSeenIds],
    spent,
    activityMinutes,
  };
}
