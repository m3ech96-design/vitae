/**
 * Tipi del modulo Alimentazione.
 *
 * Decisione sulla "dimensione di servizio" (grammi / millilitri / altro), corretta dopo un
 * primo giro sbagliato: i macronutrienti si chiedono SEMPRE "per 100" — per 100 g se l'unità
 * è grammi o "altro", per 100 ml se è millilitri — mai "per 1 unità". La base vera di un
 * cibo solido è sempre il suo peso, non un'unità di comodo come "un uovo": due uova non sono
 * mai davvero identiche, ma il loro peso in grammi sì che si converte in modo onesto in
 * calorie, tramite lo stesso valore per 100 g di qualunque altro ingrediente. Per questo
 * "altro" porta con sé `gramsPerUnit` — il peso reale di 1 unità (es. "1 uovo" = 50 g) — e i
 * macro/calorie di N unità si calcolano scalando quel peso, non chiedendoli mai a mano una
 * seconda volta in un'altra base.
 */
export type FoodUnit = "g" | "ml" | "altro";

export interface Ingredient {
  id: string;
  name: string;
  unit: FoodUnit;
  /** Nome dell'unità quando `unit` è "altro" (es. "uovo", "fetta", "cucchiaio"). */
  unitLabel?: string;
  /** Solo per "altro": peso reale di 1 unità, in grammi — es. 50 per "1 uovo". */
  gramsPerUnit?: number;
  /** Sempre "per 100": per 100 g (unità "g" o "altro") o per 100 ml (unità "ml"). */
  fat: number;
  saturatedFat: number;
  carbs: number;
  sugars: number;
  fiber: number;
  protein: number;
  salt: number;
  /** Calcolate con la formula di Atwater (grassi×9 + carboidrati×4 + proteine×4) sulla
   * stessa base "per 100" dei macro — mai chieste direttamente, sempre derivate. */
  kcal: number;
  createdAt: string;
}

/** Quanti grammi (o millilitri) rappresenta una quantità nell'unità propria
 * dell'ingrediente: per g/ml è la quantità stessa; per "altro" è quantity × gramsPerUnit, il
 * vero peso convertito. È la base comune su cui scalare i macro "per 100", qualunque sia
 * l'unità in cui l'utente ha effettivamente misurato la porzione. */
export function baseQuantity(ingredient: Pick<Ingredient, "unit" | "gramsPerUnit">, quantity: number): number {
  if (ingredient.unit === "altro") return quantity * (ingredient.gramsPerUnit ?? 0);
  return quantity;
}

export function scaleFactor(ingredient: Pick<Ingredient, "unit" | "gramsPerUnit">, quantity: number): number {
  return baseQuantity(ingredient, quantity) / 100;
}

export type MealSlot =
  | "colazione"
  | "pranzo"
  | "cena"
  | "spuntino-mattina"
  | "spuntino-pomeriggio"
  | "spuntino-sera";

export const BASE_SLOTS: MealSlot[] = ["colazione", "pranzo", "cena"];
export const SNACK_SLOTS: MealSlot[] = ["spuntino-mattina", "spuntino-pomeriggio", "spuntino-sera"];

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  colazione: "Colazione",
  pranzo: "Pranzo",
  cena: "Cena",
  "spuntino-mattina": "Spuntino · tra colazione e pranzo",
  "spuntino-pomeriggio": "Spuntino · tra pranzo e cena",
  "spuntino-sera": "Spuntino · dopo cena",
};

export interface FoodEntry {
  id: string;
  date: string; // yyyy-mm-dd
  slot: MealSlot;
  ingredientId: string;
  /** Nell'unità propria dell'ingrediente: grammi, millilitri, o conteggio di "altro". */
  quantity: number;
  /** Orario a cui è stato registrato il pasto (HH:MM), modificabile — serve al calcolo del
   * digiuno più lungo, non solo a ordinare la lista. */
  time: string;
  createdAt: string;
}

export interface FoodGoals {
  dailyKcalMin: number | null;
  dailyKcalMax: number | null;
  weeklyKcalMin: number | null;
  weeklyKcalMax: number | null;
  waterGoalLiters: number | null;
}

export const DEFAULT_FOOD_GOALS: FoodGoals = {
  dailyKcalMin: null,
  dailyKcalMax: null,
  weeklyKcalMin: null,
  weeklyKcalMax: null,
  waterGoalLiters: 2,
};

/** Litri di acqua bevuti, un totale per giorno — data ISO come chiave. */
export type WaterLog = Record<string, number>;

export function computeKcal(fat: number, carbs: number, protein: number): number {
  return Math.round(fat * 9 + carbs * 4 + protein * 4);
}
