import { Ingredient, FoodEntry, MealSlot, scaleFactor, baseQuantity, netCarbs } from "./food-types";
import { addDaysIso } from "./date-format";

export function findIngredient(ingredients: Ingredient[], id: string): Ingredient | undefined {
  return ingredients.find((i) => i.id === id);
}

export function kcalForEntry(entry: FoodEntry, ingredients: Ingredient[]): number {
  const ing = findIngredient(ingredients, entry.ingredientId);
  if (!ing) return 0;
  return ing.kcal * scaleFactor(ing, entry.quantity);
}

export interface MacroTotals {
  kcal: number;
  fat: number;
  saturatedFat: number;
  carbs: number;
  sugars: number;
  fiber: number;
  protein: number;
  salt: number;
}

const EMPTY_TOTALS: MacroTotals = { kcal: 0, fat: 0, saturatedFat: 0, carbs: 0, sugars: 0, fiber: 0, protein: 0, salt: 0 };

export function entriesForDate(entries: FoodEntry[], date: string): FoodEntry[] {
  return entries.filter((e) => e.date === date);
}

export function macroTotals(dayEntries: FoodEntry[], ingredients: Ingredient[]): MacroTotals {
  return dayEntries.reduce((acc, entry) => {
    const ing = findIngredient(ingredients, entry.ingredientId);
    if (!ing) return acc;
    const factor = scaleFactor(ing, entry.quantity);
    return {
      kcal: acc.kcal + ing.kcal * factor,
      fat: acc.fat + ing.fat * factor,
      saturatedFat: acc.saturatedFat + ing.saturatedFat * factor,
      carbs: acc.carbs + ing.carbs * factor,
      sugars: acc.sugars + ing.sugars * factor,
      fiber: acc.fiber + ing.fiber * factor,
      protein: acc.protein + ing.protein * factor,
      salt: acc.salt + ing.salt * factor,
    };
  }, EMPTY_TOTALS);
}

/** I Carboidrati di un totale già calcolato (vedi `macroTotals`/`weeklyTotals`) — totali o
 * netti a seconda di `netCarbsEnabled` (vedi FoodGoals). Un solo punto da cui leggere
 * "quanti carboidrati", invece di ripetere lo stesso controllo in ogni componente che li
 * mostra: dashboard, obiettivi, evidenziazione dello sforamento restano sempre d'accordo su
 * quale dei due numeri stanno guardando. */
export function carbsForDisplay(totals: Pick<MacroTotals, "carbs" | "fiber">, netCarbsEnabled: boolean): number {
  return netCarbsEnabled ? netCarbs(totals.carbs, totals.fiber) : totals.carbs;
}

/**
 * Macro e calorie "per 100 g" di una Ricetta, a partire dalla sua composizione (vedi
 * RecipeComposition) — somma pesata dei componenti (ciascuno scalato alla sua quantità
 * dichiarata, con `scaleFactor`, esattamente come per una voce di pasto) e poi normalizzata
 * sul peso totale della ricetta, non su 100 g fissi: una ricetta da 800 g con 40 g di
 * proteine totali ha 5 g di proteine per 100 g, non 40. Un componente "altro" senza
 * `gramsPerUnit` valorizzato contribuisce 0 al peso totale (non può, altrimenti dividere
 * per il peso totale) — la UI di creazione ricetta impedisce di salvare finché non è
 * risolto, non questa funzione. `null` se il peso totale è zero: non esiste un "per 100"
 * di una ricetta che non pesa nulla.
 *
 * Se la ricetta finita è dichiarata "per 100 ml" (una zuppa, un frullato — vedi la scelta
 * unità in RecipeComposer), la somma resta comunque calcolata in grammi dei componenti: la
 * stessa equivalenza 1g=1ml già assunta da `baseQuantity` per qualunque ingrediente "ml"
 * esistente in questa app, non un'approssimazione nuova introdotta qui. */
export function recipeMacrosPer100(
  lines: { ingredientId: string; quantity: number }[],
  ingredients: Ingredient[]
): (MacroTotals & { totalGrams: number }) | null {
  let totalGrams = 0;
  const sums: MacroTotals = { ...EMPTY_TOTALS };
  for (const line of lines) {
    const ing = findIngredient(ingredients, line.ingredientId);
    if (!ing) continue;
    const grams = baseQuantity(ing, line.quantity);
    const factor = grams / 100;
    totalGrams += grams;
    sums.kcal += ing.kcal * factor;
    sums.fat += ing.fat * factor;
    sums.saturatedFat += ing.saturatedFat * factor;
    sums.carbs += ing.carbs * factor;
    sums.sugars += ing.sugars * factor;
    sums.fiber += ing.fiber * factor;
    sums.protein += ing.protein * factor;
    sums.salt += ing.salt * factor;
  }
  if (totalGrams <= 0) return null;
  const scaleToHundred = 100 / totalGrams;
  return {
    totalGrams,
    kcal: sums.kcal * scaleToHundred,
    fat: sums.fat * scaleToHundred,
    saturatedFat: sums.saturatedFat * scaleToHundred,
    carbs: sums.carbs * scaleToHundred,
    sugars: sums.sugars * scaleToHundred,
    fiber: sums.fiber * scaleToHundred,
    protein: sums.protein * scaleToHundred,
    salt: sums.salt * scaleToHundred,
  };
}

/** Ultimi 7 giorni (compreso quello selezionato), stessa finestra mobile già usata in
 * "Attività e peso" — non la settimana di calendario lun-dom, per coerenza con il resto
 * dell'app. */
export function weeklyTotals(entries: FoodEntry[], ingredients: Ingredient[], endDate: string): MacroTotals {
  const start = addDaysIso(endDate, -6);
  const weekEntries = entries.filter((e) => e.date >= start && e.date <= endDate);
  return macroTotals(weekEntries, ingredients);
}

export interface DayTotals {
  date: string;
  totals: MacroTotals;
}

/** Un totale per ciascuno degli ultimi 7 giorni (stessa finestra di `weeklyTotals`, ma
 * spezzata giorno per giorno) — la serie che alimenta il grafico a barre della vista
 * "Ultimi 7 giorni" espansa, così ogni giorno si vede separatamente invece che solo nel
 * cumulo. */
export function dailyTotalsForLastWeek(entries: FoodEntry[], ingredients: Ingredient[], endDate: string): DayTotals[] {
  const days: DayTotals[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDaysIso(endDate, -i);
    days.push({ date, totals: macroTotals(entriesForDate(entries, date), ingredients) });
  }
  return days;
}

export function entriesBySlot(dayEntries: FoodEntry[], slot: MealSlot): FoodEntry[] {
  return dayEntries.filter((e) => e.slot === slot).sort((a, b) => a.time.localeCompare(b.time));
}

export function slotsWithEntries(dayEntries: FoodEntry[]): Set<MealSlot> {
  return new Set(dayEntries.map((e) => e.slot));
}

/** Suggerimento: cosa è stato mangiato nello stesso slot esattamente una settimana fa. */
export function sameSlotLastWeek(entries: FoodEntry[], date: string, slot: MealSlot, ingredients: Ingredient[]): Ingredient[] {
  const lastWeekDate = addDaysIso(date, -7);
  const matches = entries.filter((e) => e.date === lastWeekDate && e.slot === slot);
  return matches
    .map((e) => findIngredient(ingredients, e.ingredientId))
    .filter((i): i is Ingredient => Boolean(i));
}

export interface EatenCount {
  ingredient: Ingredient;
  count: number;
}

/** "Il cibo che hai mangiato di più/di meno" — contate come numero di volte che l'ingrediente
 * compare in un pasto, non come quantità totale: unità diverse (g, ml, "altro") tra
 * ingredienti diversi non sarebbero altrimenti confrontabili in modo onesto. */
export function mostAndLeastEaten(entries: FoodEntry[], ingredients: Ingredient[]): { most: EatenCount | null; least: EatenCount | null } {
  const counts = new Map<string, number>();
  for (const e of entries) counts.set(e.ingredientId, (counts.get(e.ingredientId) ?? 0) + 1);
  if (counts.size === 0) return { most: null, least: null };

  let most: EatenCount | null = null;
  let least: EatenCount | null = null;
  for (const [ingredientId, count] of counts) {
    const ingredient = findIngredient(ingredients, ingredientId);
    if (!ingredient) continue;
    if (!most || count > most.count) most = { ingredient, count };
    if (!least || count < least.count) least = { ingredient, count };
  }
  return { most, least };
}

export interface BingeResult {
  date: string;
  kcal: number;
  entries: FoodEntry[];
}

/** "Migliore abbuffata" — il giorno con più calorie registrate in assoluto, con il menu di
 * quel giorno pronto da mostrare. */
export function bestBinge(entries: FoodEntry[], ingredients: Ingredient[]): BingeResult | null {
  const byDate = new Map<string, FoodEntry[]>();
  for (const e of entries) {
    const list = byDate.get(e.date) ?? [];
    list.push(e);
    byDate.set(e.date, list);
  }
  let best: BingeResult | null = null;
  for (const [date, dayEntries] of byDate) {
    const kcal = macroTotals(dayEntries, ingredients).kcal;
    if (!best || kcal > best.kcal) best = { date, kcal, entries: dayEntries };
  }
  return best;
}

export interface FastResult {
  hours: number;
  fromLabel: string;
  toLabel: string;
}

/** "Digiuno più lungo" — i pasti vengono raggruppati per (data, slot), ciascuno rappresentato
 * dall'orario più presto tra le sue voci (l'inizio di quel pasto); il digiuno più lungo è il
 * più grande intervallo tra due pasti consecutivi in tutta la cronologia. Misura tra pasti
 * registrati, non il tempo reale a stomaco vuoto — dichiarato qui perché non esiste un modo
 * di saperlo con certezza da un diario alimentare. */
export function longestFast(entries: FoodEntry[], slotLabels: Record<MealSlot, string>): FastResult | null {
  const meals = new Map<string, { date: string; slot: MealSlot; time: string }>();
  for (const e of entries) {
    const key = `${e.date}|${e.slot}`;
    const existing = meals.get(key);
    if (!existing || e.time < existing.time) meals.set(key, { date: e.date, slot: e.slot, time: e.time });
  }
  const sorted = [...meals.values()].sort((a, b) => (a.date + "T" + a.time).localeCompare(b.date + "T" + b.time));
  if (sorted.length < 2) return null;

  let longest: FastResult | null = null;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const from = new Date(`${a.date}T${a.time}:00`);
    const to = new Date(`${b.date}T${b.time}:00`);
    const hours = (to.getTime() - from.getTime()) / 3_600_000;
    if (!longest || hours > longest.hours) {
      longest = {
        hours,
        fromLabel: `${slotLabels[a.slot]} del ${a.date.slice(8, 10)}/${a.date.slice(5, 7)}`,
        toLabel: `${slotLabels[b.slot]} del ${b.date.slice(8, 10)}/${b.date.slice(5, 7)}`,
      };
    }
  }
  return longest;
}
