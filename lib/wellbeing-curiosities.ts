import { Workout } from "./types";
import { FoodEntry, Ingredient, WaterLog } from "./food-types";
import { addDaysIso, todayIso } from "./date-format";
import { monthOverMonth } from "./activity-stats";
import { mostAndLeastEaten } from "./food-stats";
import { FOOD_EQUIVALENTS, bestDistanceEquivalent } from "./wellbeing-reference-data";
import { WALKING_KCAL_PER_KG_PER_KM, WHO_GLOBAL_INACTIVITY_SHARE } from "./health-guidelines";

export interface Curiosity {
  id: string;
  text: string;
}

/**
 * Ogni funzione qui produce zero o una curiosità — mai un testo forzato quando i dati non
 * la sostengono (niente "hai bruciato 0 calorie equivalenti a 0 pizze", che sarebbe solo
 * rumore). Il chiamante (vedi il componente UI) filtra quelle che tornano `null` e mostra
 * solo il resto: alcune settimane avranno 3 curiosità, altre 7, a seconda di cosa i dati
 * reali permettono di dire con onestà.
 */

function caloriesBurnedThisWeek(workouts: Workout[], weekStart: string, today: string): number {
  return workouts.filter((w) => w.date >= weekStart && w.date <= today).reduce((sum, w) => sum + w.calories, 0);
}

/** Punto 14: calorie bruciate ↔ un alimento comune. Sceglie l'alimento con kcal più vicine
 * dal basso (non supera mai il totale reale bruciato) tra quelli della piccola tabella di
 * riferimento — se le calorie bruciate sono troppo poche per eguagliare anche il più
 * leggero della tabella, niente curiosità piuttosto che un confronto risibile ("un decimo
 * di mela"). */
export function caloriesAsFoodCuriosity(workouts: Workout[]): Curiosity | null {
  const today = todayIso();
  const weekStart = addDaysIso(today, -6);
  const kcal = caloriesBurnedThisWeek(workouts, weekStart, today);
  const candidates = FOOD_EQUIVALENTS.filter((f) => f.kcal <= kcal).sort((a, b) => b.kcal - a.kcal);
  const best = candidates[0];
  if (!best || kcal <= 0) return null;
  const count = Math.floor(kcal / best.kcal);
  return {
    id: "calorie-cibo",
    text:
      count <= 1
        ? `Questa settimana hai bruciato una quantità di calorie pari a ${best.article} ${best.label} (${Math.round(kcal)} kcal).`
        : `Questa settimana hai bruciato l'equivalente di ${count} ${best.label.replace(/^(un|una) /, "")} (${Math.round(kcal)} kcal).`,
  };
}

/** Punto 15: distanza percorsa ↔ una tratta geografica nota. Solo dai workout con
 * `distanceKm` effettivamente registrato — mai stimata dai minuti (richiederebbe
 * assumere una velocità arbitraria, che sarebbe un dato inventato spacciato per fatto). */
export function distanceCuriosity(workouts: Workout[]): Curiosity | null {
  const today = todayIso();
  const weekStart = addDaysIso(today, -6);
  const totalKm = workouts.filter((w) => w.date >= weekStart && w.date <= today).reduce((sum, w) => sum + (w.distanceKm ?? 0), 0);
  if (totalKm <= 0) return null;
  const equivalent = bestDistanceEquivalent(totalKm);
  if (!equivalent) {
    return { id: "distanza", text: `Questa settimana hai percorso ${totalKm.toFixed(1)} km in totale.` };
  }
  return {
    id: "distanza",
    text: `Questa settimana hai percorso ${totalKm.toFixed(1)} km — come da ${equivalent.label} (${equivalent.km} km).`,
  };
}

/** Punto 16: tempo totale di attività ↔ episodi di una serie TV (durata media ~45 min a
 * episodio, cifra dichiarata come tale, non una fonte specifica — è un confronto
 * scherzoso, non un dato clinico, quindi qui una stima tonda è appropriata). */
export function timeAsEpisodesCuriosity(workouts: Workout[]): Curiosity | null {
  const today = todayIso();
  const weekStart = addDaysIso(today, -6);
  const minutes = workouts.filter((w) => w.date >= weekStart && w.date <= today).reduce((sum, w) => sum + w.minutes, 0);
  const EPISODE_MINUTES = 45;
  const episodes = minutes / EPISODE_MINUTES;
  if (episodes < 1) return null;
  return {
    id: "tempo-episodi",
    text: `Il tempo che hai dedicato all'attività fisica questa settimana (${minutes} min) equivale a circa ${episodes.toFixed(1)} episodi di una serie TV.`,
  };
}

/** Punto 17: acqua bevuta ↔ bottiglie da 1.5L. */
export function waterAsBottlesCuriosity(waterLog: WaterLog): Curiosity | null {
  const today = todayIso();
  const weekStart = addDaysIso(today, -6);
  const totalLiters = Object.entries(waterLog)
    .filter(([date]) => date >= weekStart && date <= today)
    .reduce((sum, [, liters]) => sum + liters, 0);
  if (totalLiters <= 0) return null;
  const bottles = totalLiters / 1.5;
  return {
    id: "acqua-bottiglie",
    text: `Questa settimana hai bevuto l'equivalente di ${bottles.toFixed(1)} bottiglie da 1,5L (${totalLiters.toFixed(1)}L totali).`,
  };
}

/** Punto 18: confronto storico personale — calorie bruciate questo mese vs lo stesso
 * periodo del mese scorso. Zero ricerca esterna, solo dati propri dell'utente. */
export function monthlyComparisonCuriosity(workouts: Workout[]): Curiosity | null {
  const { current, previous } = monthOverMonth(workouts);
  if (current.calories === 0 && previous.calories === 0) return null;
  if (previous.calories === 0) return null; // nessun mese precedente da confrontare: il confronto non avrebbe senso
  const diff = current.calories - previous.calories;
  const verb = diff >= 0 ? "in più" : "in meno";
  return {
    id: "confronto-mensile",
    text: `Negli ultimi 30 giorni hai bruciato ${current.calories} kcal in attività fisica, ${Math.abs(diff)} kcal ${verb} rispetto al mese precedente.`,
  };
}

/** Punto 19: proiezione annuale sulle ore accumulate — se il ritmo di QUESTA settimana si
 * ripetesse per un anno intero. Dichiaratamente ipotetico ("se continui così"), non una
 * previsione: il testo lo rende esplicito per non far sembrare un fatto quello che è
 * un'estrapolazione. */
export function yearlyProjectionCuriosity(workouts: Workout[]): Curiosity | null {
  const today = todayIso();
  const weekStart = addDaysIso(today, -6);
  const minutes = workouts.filter((w) => w.date >= weekStart && w.date <= today).reduce((sum, w) => sum + w.minutes, 0);
  if (minutes <= 0) return null;
  const yearlyHours = (minutes * 52) / 60;
  const yearlyDays = yearlyHours / 24;
  return {
    id: "proiezione-annuale",
    text: `Se continui con questo ritmo per un anno intero, avrai dedicato all'attività fisica circa ${Math.round(
      yearlyHours
    )} ore — quasi ${yearlyDays.toFixed(1)} giorni interi.`,
  };
}

/** Punto 22: l'ingrediente più mangiato questa settimana. */
export function mostEatenCuriosity(entries: FoodEntry[], ingredients: Ingredient[]): Curiosity | null {
  const today = todayIso();
  const weekStart = addDaysIso(today, -6);
  const weekEntries = entries.filter((e) => e.date >= weekStart && e.date <= today);
  const { most } = mostAndLeastEaten(weekEntries, ingredients);
  if (!most || most.count < 2) return null; // comparso una volta sola non è un "più mangiato", è solo comparso
  return {
    id: "piu-mangiato",
    text: `Il cibo più presente nei tuoi pasti questa settimana è stato ${most.ingredient.name}, comparso in ${most.count} pasti.`,
  };
}

/** Punto 21: confronto con la statistica di inattività globale OMS — mostrata solo quando
 * la settimana corrente raggiunge il minimo aerobico raccomandato, altrimenti il confronto
 * suonerebbe come un rimprovero invece che un riconoscimento (l'obiettivo è far notare un
 * traguardo raggiunto, non far sentire l'utente parte della statistica sbagliata). */
export function populationComparisonCuriosity(aerobicMinutesThisWeek: number, whoThreshold: number): Curiosity | null {
  if (aerobicMinutesThisWeek < whoThreshold) return null;
  const percentReaching = Math.round((1 - WHO_GLOBAL_INACTIVITY_SHARE) * 100);
  return {
    id: "confronto-popolazione",
    text: `Secondo l'OMS, circa 1 adulto su 4 nel mondo non raggiunge i livelli minimi di attività fisica raccomandati — questa settimana tu sei tra il restante ${percentReaching}%.`,
  };
}

/** kcal bruciate tradotte in km camminati equivalenti (formula di Margaria) — non usata
 * direttamente come curiosità propria in questo file, ma incapsulata qui vicino alle
 * altre per riuso futuro con lo stesso criterio di stima. */
export function kcalToWalkingKm(kcal: number, weightKg: number): number {
  if (weightKg <= 0) return 0;
  return kcal / (WALKING_KCAL_PER_KG_PER_KM * weightKg);
}
