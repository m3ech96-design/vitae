import { Workout, WeightEntry } from "./types";
import { FoodEntry, Ingredient, WaterLog } from "./food-types";
import { addDaysIso } from "./date-format";
import { metOf, categoryOf } from "./activity-catalog";
import { weeklyTotals } from "./food-stats";
import { weightTendencyDelta } from "./weight-trend";
import {
  WHO_WEEKLY_MODERATE_MINUTES,
  WHO_WEEKLY_STRENGTH_SESSIONS,
  WHO_MAX_SUGAR_PERCENT_OF_KCAL,
  WHO_MAX_SALT_GRAMS_PER_DAY,
  WHO_MAX_FAT_PERCENT_OF_KCAL,
  RECOMMENDED_FRUIT_VEG_PORTIONS_PER_DAY,
  INDICATIVE_DAILY_WATER_LITERS,
} from "./health-guidelines";

/**
 * Tre fasce, mai due — un binario "in linea / non in linea" costringerebbe chi è appena
 * sotto una soglia nella stessa categoria di chi ne è lontanissimo, il che è sia meno
 * accurato sia più scoraggiante di quanto serva. "Dati insufficienti" è il quarto stato,
 * separato dagli altri tre: non è un giudizio, è l'assenza delle condizioni per darne uno
 * onesto (vedi il punto 5 del brainstorming — mai giudicare su un campione minuscolo).
 */
export type AspectStatus = "in-linea" | "vicino" | "lontano" | "dati-insufficienti";

export interface AspectResult {
  id: string;
  label: string;
  status: AspectStatus;
  /** Il numero vero confrontato con la soglia — sempre mostrato per esteso insieme al
   * giudizio, mai un'etichetta senza il dato che la sostiene (vedi il punto 2 del
   * brainstorming: ogni giudizio cita il numero esatto, non solo un verdetto). */
  detail: string;
  source: string;
}

export interface WellbeingReport {
  aspects: AspectResult[];
  /** Quanti aspetti sono valutabili (esclusi quelli a dati insufficienti) e quanti, tra
   * questi, sono almeno "vicino" alla soglia — la sintesi finale è un rapporto onesto tipo
   * "4 aspetti su 5 in linea", MAI un'etichetta binaria "in salute/non in salute" (vedi il
   * disclaimer nel componente UI sul perché quell'etichetta è stata scartata). */
  evaluableCount: number;
  goodCount: number;
  /** Andamento del peso — SOLO informativo, mai uno "status" come gli altri aspetti: non
   * esiste una soglia sanitaria ufficiale su "quanto è normale variare di peso in una
   * settimana", dipende troppo da fattori individuali (obiettivo scelto, ritenzione idrica,
   * ciclo, composizione corporea) per pretendere un giudizio "in linea/lontano" onesto.
   * `null` se lo storico non permette di calcolare una tendenza. */
  weightTrendKg: number | null;
}

const WATER_TOLERANCE = 0.85; // "vicino" se raggiunge almeno l'85% del riferimento indicativo
const MIN_FOOD_DAYS_FOR_JUDGEMENT = 4; // sotto questa soglia di giorni-con-dati, niente giudizio alimentare
const MIN_CATEGORIZED_SHARE_FOR_FRUIT_VEG = 0.5; // se meno di metà degli ingredienti ha una categoria, il conteggio frutta/verdura sarebbe inaffidabile

function aerobicMinutesEquivalent(workouts: Workout[], weekStart: string, today: string): number {
  // Segue esattamente la stessa equivalenza usata dall'OMS per sommare intensità diverse:
  // i minuti vigorosi (MET>6) contano doppio verso il traguardo dei 150 "moderati" —
  // sommarli 1:1 sottostimerebbe chi fa sessioni brevi ma intense.
  return workouts
    .filter((w) => w.date >= weekStart && w.date <= today)
    .reduce((sum, w) => sum + (metOf(w.activityId) > 6 ? w.minutes * 2 : w.minutes), 0);
}

function strengthSessions(workouts: Workout[], weekStart: string, today: string): number {
  return workouts.filter((w) => w.date >= weekStart && w.date <= today && categoryOf(w.activityId).id === "forza").length;
}

export function wellbeingReport(
  data: {
    workouts: Workout[];
    foodEntries: FoodEntry[];
    ingredients: Ingredient[];
    waterLog: WaterLog;
    weightEntries: WeightEntry[];
  },
  ref: Date = new Date()
): WellbeingReport {
  const today = ref.toISOString().slice(0, 10);
  const weekStart = addDaysIso(today, -6);
  const aspects: AspectResult[] = [];

  // --- Attività aerobica
  const aerobicMinutes = aerobicMinutesEquivalent(data.workouts, weekStart, today);
  aspects.push({
    id: "attivita-aerobica",
    label: "Attività fisica aerobica",
    status:
      aerobicMinutes >= WHO_WEEKLY_MODERATE_MINUTES ? "in-linea" : aerobicMinutes >= WHO_WEEKLY_MODERATE_MINUTES * 0.6 ? "vicino" : "lontano",
    detail: `${Math.round(aerobicMinutes)} min equivalenti su ${WHO_WEEKLY_MODERATE_MINUTES} raccomandati`,
    source: "OMS 2020",
  });

  // --- Rafforzamento muscolare
  const strength = strengthSessions(data.workouts, weekStart, today);
  aspects.push({
    id: "rafforzamento",
    label: "Rafforzamento muscolare",
    status: strength >= WHO_WEEKLY_STRENGTH_SESSIONS ? "in-linea" : strength >= 1 ? "vicino" : "lontano",
    detail: `${strength} session${strength === 1 ? "e" : "i"} su ${WHO_WEEKLY_STRENGTH_SESSIONS} raccomandate`,
    source: "OMS 2020",
  });

  // --- Alimentazione: solo se ci sono abbastanza giorni con dati registrati questa
  // settimana — un giudizio su 1-2 giorni di menù non direbbe nulla di affidabile su
  // un'abitudine, solo sul caso di quei pochi pasti.
  const weekFoodEntries = data.foodEntries.filter((e) => e.date >= weekStart && e.date <= today);
  const daysWithFood = new Set(weekFoodEntries.map((e) => e.date)).size;

  if (daysWithFood < MIN_FOOD_DAYS_FOR_JUDGEMENT) {
    aspects.push({ id: "zuccheri", label: "Zuccheri aggiunti", status: "dati-insufficienti", detail: `Registrati solo ${daysWithFood} giorni questa settimana`, source: "OMS" });
    aspects.push({ id: "sale", label: "Sale", status: "dati-insufficienti", detail: `Registrati solo ${daysWithFood} giorni questa settimana`, source: "OMS" });
    aspects.push({ id: "grassi", label: "Grassi totali", status: "dati-insufficienti", detail: `Registrati solo ${daysWithFood} giorni questa settimana`, source: "OMS" });
  } else {
    const totals = weeklyTotals(data.foodEntries, data.ingredients, today);
    const sugarPercent = totals.kcal > 0 ? (totals.sugars * 4 * 100) / totals.kcal : 0;
    const fatPercent = totals.kcal > 0 ? (totals.fat * 9 * 100) / totals.kcal : 0;
    const avgSaltPerDay = totals.salt / daysWithFood;

    aspects.push({
      id: "zuccheri",
      label: "Zuccheri aggiunti",
      status: sugarPercent <= WHO_MAX_SUGAR_PERCENT_OF_KCAL ? "in-linea" : sugarPercent <= WHO_MAX_SUGAR_PERCENT_OF_KCAL * 1.4 ? "vicino" : "lontano",
      detail: `${Math.round(sugarPercent)}% delle calorie, sotto ${WHO_MAX_SUGAR_PERCENT_OF_KCAL}% raccomandato`,
      source: "OMS",
    });
    aspects.push({
      id: "sale",
      label: "Sale",
      status: avgSaltPerDay <= WHO_MAX_SALT_GRAMS_PER_DAY ? "in-linea" : avgSaltPerDay <= WHO_MAX_SALT_GRAMS_PER_DAY * 1.4 ? "vicino" : "lontano",
      detail: `${avgSaltPerDay.toFixed(1)}g/giorno in media, sotto ${WHO_MAX_SALT_GRAMS_PER_DAY}g raccomandati`,
      source: "OMS",
    });
    aspects.push({
      id: "grassi",
      label: "Grassi totali",
      status: fatPercent <= WHO_MAX_FAT_PERCENT_OF_KCAL ? "in-linea" : fatPercent <= WHO_MAX_FAT_PERCENT_OF_KCAL * 1.3 ? "vicino" : "lontano",
      detail: `${Math.round(fatPercent)}% delle calorie, sotto ${WHO_MAX_FAT_PERCENT_OF_KCAL}% raccomandato`,
      source: "OMS",
    });

    // --- Frutta e verdura: solo se abbastanza ingredienti hanno una categoria assegnata —
    // altrimenti il conteggio delle porzioni sarebbe falsato non da quanto l'utente mangia
    // ma da quanto ha compilato la categoria (opzionale) dei suoi ingredienti.
    const usedIngredientIds = new Set(weekFoodEntries.map((e) => e.ingredientId));
    const usedIngredients = data.ingredients.filter((i) => usedIngredientIds.has(i.id));
    const categorizedShare = usedIngredients.length > 0 ? usedIngredients.filter((i) => i.categoryId).length / usedIngredients.length : 0;

    if (categorizedShare < MIN_CATEGORIZED_SHARE_FOR_FRUIT_VEG) {
      aspects.push({
        id: "frutta-verdura",
        label: "Frutta e verdura",
        status: "dati-insufficienti",
        detail: "Categoria non impostata per la maggior parte degli ingredienti",
        source: "OMS/CREA",
      });
    } else {
      const fruitVegIds = new Set(
        usedIngredients.filter((i) => i.categoryId === "verdura-foglia" || i.categoryId === "verdura-frutta-dura").map((i) => i.id)
      );
      const portions = weekFoodEntries.filter((e) => fruitVegIds.has(e.ingredientId)).length;
      const avgPortionsPerDay = portions / daysWithFood;
      aspects.push({
        id: "frutta-verdura",
        label: "Frutta e verdura",
        status:
          avgPortionsPerDay >= RECOMMENDED_FRUIT_VEG_PORTIONS_PER_DAY
            ? "in-linea"
            : avgPortionsPerDay >= RECOMMENDED_FRUIT_VEG_PORTIONS_PER_DAY * 0.6
            ? "vicino"
            : "lontano",
        detail: `${avgPortionsPerDay.toFixed(1)} porzioni/giorno in media, su ${RECOMMENDED_FRUIT_VEG_PORTIONS_PER_DAY} raccomandate`,
        source: "OMS/CREA",
      });
    }
  }

  // --- Acqua
  const weekWaterDays = Object.entries(data.waterLog).filter(([date]) => date >= weekStart && date <= today);
  if (weekWaterDays.length < MIN_FOOD_DAYS_FOR_JUDGEMENT) {
    aspects.push({
      id: "acqua",
      label: "Idratazione",
      status: "dati-insufficienti",
      detail: `Registrati solo ${weekWaterDays.length} giorni questa settimana`,
      source: "riferimento generico",
    });
  } else {
    const avgWater = weekWaterDays.reduce((sum, [, liters]) => sum + liters, 0) / weekWaterDays.length;
    aspects.push({
      id: "acqua",
      label: "Idratazione",
      status: avgWater >= INDICATIVE_DAILY_WATER_LITERS ? "in-linea" : avgWater >= INDICATIVE_DAILY_WATER_LITERS * WATER_TOLERANCE ? "vicino" : "lontano",
      detail: `${avgWater.toFixed(1)}L/giorno in media, su ${INDICATIVE_DAILY_WATER_LITERS}L di riferimento`,
      source: "riferimento generico",
    });
  }

  const evaluable = aspects.filter((a) => a.status !== "dati-insufficienti");
  const good = evaluable.filter((a) => a.status === "in-linea" || a.status === "vicino");
  const { delta: weightTrendKg } = weightTendencyDelta(data.weightEntries);

  return { aspects, evaluableCount: evaluable.length, goodCount: good.length, weightTrendKg };
}

/** Una settimana conta come "in linea" se TUTTI gli aspetti valutabili quella settimana
 * erano almeno "vicino" — non una media, un tutto-o-niente sull'insieme di ciò che era
 * giudicabile in quel momento. Ferma il conteggio alla prima settimana che non lo era, o
 * a `maxWeeks` (limite di sicurezza: non ha senso guardare indietro anni interi per una
 * "curiosità" pensata per essere letta al volo). */
export function inLineStreakWeeks(
  data: { workouts: Workout[]; foodEntries: FoodEntry[]; ingredients: Ingredient[]; waterLog: WaterLog; weightEntries: WeightEntry[] },
  maxWeeks: number = 52
): number {
  let streak = 0;
  for (let i = 0; i < maxWeeks; i++) {
    const ref = new Date();
    ref.setDate(ref.getDate() - i * 7);
    const report = wellbeingReport(data, ref);
    if (report.evaluableCount === 0) break; // niente da valutare quella settimana: lo streak non può proseguire né essere smentito, si ferma qui
    if (report.goodCount < report.evaluableCount) break;
    streak++;
  }
  return streak;
}

/**
 * Vero se QUESTA settimana è la prima volta (tra le ultime `lookbackWeeks`) in cui tutti
 * gli aspetti valutabili sono in linea — usato per l'achievement del punto 20 del
 * brainstorming ("prima volta che raggiungi il minimo OMS"). Richiede che la settimana
 * corrente sia effettivamente riuscita E che nessuna delle precedenti lo fosse stata,
 * altrimenti non sarebbe una "prima volta" ma una ripetizione.
 */
export function isFirstTimeInLine(
  data: { workouts: Workout[]; foodEntries: FoodEntry[]; ingredients: Ingredient[]; waterLog: WaterLog; weightEntries: WeightEntry[] },
  lookbackWeeks: number = 52
): boolean {
  const current = wellbeingReport(data);
  if (current.evaluableCount === 0 || current.goodCount < current.evaluableCount) return false;

  for (let i = 1; i < lookbackWeeks; i++) {
    const ref = new Date();
    ref.setDate(ref.getDate() - i * 7);
    const report = wellbeingReport(data, ref);
    if (report.evaluableCount === 0) continue; // settimana senza dati: non conta né a favore né contro la "prima volta"
    if (report.goodCount >= report.evaluableCount) return false; // già riuscita prima: non è la prima volta
  }
  return true;
}
