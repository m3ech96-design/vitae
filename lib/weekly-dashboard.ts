import { Task, Workout, Place, SingleExpense, PlannedExpense } from "./types";
import { DiaryEntry } from "./diary-types";
import { FoodEntry, Ingredient } from "./food-types";
import { Hobby } from "./hobby-types";
import { WishlistItem, isFulfilled } from "./wishlist-types";
import { addDaysIso, todayIso } from "./date-format";
import { weeklyTotals } from "./food-stats";
import { weekOverWeek } from "./activity-stats";
import { completionBreakdown } from "./completion-rate";
import { allExpenseItems } from "./finance";

export interface WeeklyDashboard {
  range: { start: string; end: string };
  tasks: { completionRate: number | null };
  food: { avgKcalPerDay: number; daysWithEntries: number };
  activity: { minutesThisWeek: number; minutesPreviousWeek: number };
  finance: { totalSpent: number };
  diary: { entriesCount: number };
  hobby: { activitiesCount: number };
  wishlist: { fulfilledCount: number; fulfilledAmount: number };
}

/**
 * Un solo posto che aggrega "la settimana" da OGNI modulo che ha davvero qualcosa di
 * significativo da dire su base settimanale — non tutti i moduli dell'app ce l'hanno
 * (la Mappa, per dire, non ha un ritmo settimanale, quindi non compare qui).
 * Ogni funzione di calcolo già esistente nel proprio modulo viene riusata così com'è
 * (weeklyTotals, weekOverWeek, completionBreakdown, allExpenseItems) — questo file
 * orchestra, non ricalcola la logica di dominio di ciascun modulo da capo.
 *
 * Stessa finestra "ultimi 7 giorni da oggi" già in uso ovunque nell'app (vedi il commento
 * su weeklyTotals in food-stats.ts) — non una settimana di calendario lun-dom, per restare
 * coerente con tutto il resto.
 */
export function weeklyDashboard(data: {
  tasks: Task[];
  foodEntries: FoodEntry[];
  ingredients: Ingredient[];
  workouts: Workout[];
  places: Place[];
  singleExpenses: SingleExpense[];
  plannedExpenses: PlannedExpense[];
  diaryEntries: DiaryEntry[];
  hobbies: Hobby[];
  wishlistItems: WishlistItem[];
}): WeeklyDashboard {
  const today = todayIso();
  const weekStart = addDaysIso(today, -6);

  // --- Task
  const { overall: completionRate } = completionBreakdown(data.tasks, 7);

  // --- Alimentazione: media giornaliera, non il totale grezzo — un totale da solo
  // dipenderebbe troppo da quanti giorni hai effettivamente registrato qualcosa, mentre la
  // media per giorno CON dati resta sensata anche se hai saltato la registrazione un paio
  // di giorni.
  const foodTotals = weeklyTotals(data.foodEntries, data.ingredients, today);
  const daysWithFoodEntries = new Set(
    data.foodEntries.filter((e) => e.date >= weekStart && e.date <= today).map((e) => e.date)
  ).size;
  const avgKcalPerDay = daysWithFoodEntries > 0 ? foodTotals.kcal / daysWithFoodEntries : 0;

  // --- Attività
  const { current, previous } = weekOverWeek(data.workouts);

  // --- Finanze: solo spese discrete della settimana (task/luogo/manuali/pianificate) — le
  // ricorrenti non hanno una data puntuale in questo senso (sono "attive nel ciclo", non
  // "accadute un giorno preciso"), pro-rate su 7 giorni sarebbe un numero inventato, non
  // qualcosa realmente speso quella settimana.
  const weekExpenses = allExpenseItems(data.tasks, data.places, data.singleExpenses, data.plannedExpenses).filter(
    (e) => e.chargedToBudget && e.date >= weekStart && e.date <= today
  );
  const totalSpent = weekExpenses.reduce((sum, e) => sum + e.amount, 0);

  // --- Diario
  const entriesCount = data.diaryEntries.filter((e) => e.date >= weekStart && e.date <= today).length;

  // --- Hobby: somma di ogni tipo di "cosa fatta" con una data reale, attraverso ogni
  // hobby e ogni blocco — partite giocate, progetti finiti, libreria completata,
  // registrazioni di progresso. Un conteggio unico invece di sette numeri separati per
  // blocco: la domanda a cui risponde è "quanto sei stato attivo nei tuoi hobby", non il
  // dettaglio di quale blocco specifico.
  let activitiesCount = 0;
  data.hobbies.forEach((h) => {
    h.blocks.forEach((block) => {
      if (block.kind === "partite") {
        activitiesCount += block.matches.filter((m) => m.date >= weekStart && m.date <= today).length;
      } else if (block.kind === "progetti") {
        activitiesCount += block.projects.filter((p) => p.finishedDate && p.finishedDate >= weekStart && p.finishedDate <= today).length;
      } else if (block.kind === "libreria") {
        activitiesCount += block.items.filter((i) => i.completedDate && i.completedDate >= weekStart && i.completedDate <= today).length;
      } else if (block.kind === "metrica") {
        activitiesCount += block.entries.filter((e) => e.date >= weekStart && e.date <= today).length;
      }
    });
  });

  // --- Wishlist: desideri realizzati questa settimana
  const fulfilledThisWeek = data.wishlistItems.filter(
    (item) => isFulfilled(item) && item.fulfilledAt! >= weekStart && item.fulfilledAt! <= today
  );
  const fulfilledAmount = fulfilledThisWeek.reduce((sum, item) => sum + (item.fulfilledAmount ?? 0), 0);

  return {
    range: { start: weekStart, end: today },
    tasks: { completionRate },
    food: { avgKcalPerDay, daysWithEntries: daysWithFoodEntries },
    activity: { minutesThisWeek: current.minutes, minutesPreviousWeek: previous.minutes },
    finance: { totalSpent },
    diary: { entriesCount },
    hobby: { activitiesCount },
    wishlist: { fulfilledCount: fulfilledThisWeek.length, fulfilledAmount },
  };
}
