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
import { rebalanceThreeWaySplit } from "./split3";

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
  /** Presente solo per un ingrediente nato come Ricetta (vedi RecipeComposition qui sotto)
   * — la sua composizione, tenuta per poter tornare a modificarla; i macro/kcal "per 100"
   * qui sopra restano comunque gli stessi campi di un ingrediente qualunque, derivati dalla
   * composizione al momento del salvataggio (vedi `recipeMacrosPer100` in food-stats.ts),
   * così una ricetta si registra in un pasto esattamente come qualsiasi altro ingrediente,
   * senza che il resto dell'app debba sapere che dietro c'è una lista di componenti. */
  recipe?: RecipeComposition;
}

/** Una riga della composizione: quanto di quell'ingrediente (esistente o creato al momento
 * durante la stessa creazione della ricetta) entra nella ricetta — nell'unità propria
 * dell'ingrediente componente, non normalizzata: la normalizzazione a "per 100" della
 * ricetta risultante avviene una sola volta, sul totale (vedi `recipeMacrosPer100`). */
export interface RecipeIngredientLine {
  id: string;
  ingredientId: string;
  quantity: number;
}

export interface RecipeComposition {
  lines: RecipeIngredientLine[];
  /** Dimensione di servizio dichiarata per la ricetta finita (es. "1 porzione = 250 g") —
   * distinta dalla base "per 100" dei macro, che resta sempre la stessa di ogni altro
   * ingrediente: questo è solo un aiuto a registrare il pasto senza dover pesare la singola
   * porzione ogni volta. */
  servingSizeGrams?: number;
  servingLabel?: string;
  notes?: string;
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
  /** Suddivisione dei macronutrienti in percentuali complementari a 100 (come nelle diete
   * Low Carb, Keto, Low Fat, High Protein, ecc.) — quando attiva, le tre percentuali
   * decidono quanti grammi-obiettivo di Carboidrati/Proteine/Grassi derivano dall'obiettivo
   * calorico giornaliero (vedi `macroGramGoals`), e il menù segna in rosso ogni
   * macronutriente che nella giornata li supera. Le percentuali si muovono sempre insieme —
   * alzarne una abbassa le altre due, mai una scelta libera indipendente — così restano
   * sempre una suddivisione dell'intero, mai una somma arbitraria. Serve comunque un
   * obiettivo calorico giornaliero (`dailyKcalMax` o, in mancanza, `dailyKcalMin`): senza
   * un totale da suddividere le percentuali non hanno nulla su cui applicarsi.
   */
  macroSplitEnabled: boolean;
  carbsPercent: number;
  proteinPercent: number;
  fatPercent: number;
  /** "Carboidrati netti" (Carboidrati totali − Fibre — vedi `netCarbs` qui sotto):
   * un'opzione da attivare esplicitamente, non il comportamento di default, perché cambia
   * cosa conta davvero come "Carboidrati" ovunque nel modulo (menù del giorno, sforamento
   * dell'obiettivo, dashboard) — un cambiamento che chi non segue una dieta low-carb/cheto
   * non si aspetta un giorno.
   */
  netCarbsEnabled: boolean;
}

export const DEFAULT_FOOD_GOALS: FoodGoals = {
  dailyKcalMin: null,
  dailyKcalMax: null,
  weeklyKcalMin: null,
  weeklyKcalMax: null,
  waterGoalLiters: 2,
  macroSplitEnabled: false,
  carbsPercent: 50,
  proteinPercent: 20,
  fatPercent: 30,
  netCarbsEnabled: false,
};

/** Litri di acqua bevuti, un totale per giorno — data ISO come chiave. */
export type WaterLog = Record<string, number>;

export function computeKcal(fat: number, carbs: number, protein: number): number {
  return Math.round(fat * 9 + carbs * 4 + protein * 4);
}

/**
 * Carboidrati netti — quelli che il corpo digerisce e assorbe davvero, la cifra che conta
 * per chi segue una dieta Low Carb/Chetogenica: Carboidrati totali meno Fibre, mai sotto
 * zero (un ingrediente con più fibra che carboidrati totali non può avere carboidrati netti
 * negativi). Non sottrae i polioli (alcoli dello zucchero, es. eritritolo, maltitolo): la
 * scheda ingrediente di quest'app non li traccia come categoria propria, solo Grassi/di cui
 * Saturi/Carboidrati/di cui Zuccheri/Fibre/Proteine/Sale — dichiarato qui invece di far
 * finta che il calcolo sia più completo di quanto sia.
 */
export function netCarbs(carbs: number, fiber: number): number {
  return Math.max(0, carbs - fiber);
}

/**
 * Ribilancia le tre percentuali complementari (Carboidrati/Proteine/Grassi) quando una di
 * esse cambia: la percentuale toccata prende il valore scelto, le altre due si dividono
 * ciò che resta fino a 100 mantenendo tra loro la stessa proporzione che avevano prima.
 * Non più usata da FoodGoalsModal (che ora lascia ogni percentuale indipendente e si
 * limita a segnalare se il totale arriva a 100), tenuta come utility per chi la volesse
 * riusare altrove con questa meccanica. */
export function rebalanceMacroPercents(
  current: { carbs: number; protein: number; fat: number },
  changed: "carbs" | "protein" | "fat",
  newValue: number
): { carbs: number; protein: number; fat: number } {
  return rebalanceThreeWaySplit(current, ["carbs", "protein", "fat"], changed, newValue);
}

/** Grammi-obiettivo di ciascun macronutriente, derivati dalle percentuali complementari e
 * dall'obiettivo calorico giornaliero — Atwater alla rovescia (Grassi e Proteine 4/9
 * kcal/g invertito). `null` se manca un obiettivo calorico da cui partire (vedi il commento
 * su `macroSplitEnabled`) o se la suddivisione non è attiva. */
export function macroGramGoals(goals: FoodGoals): { carbs: number; protein: number; fat: number } | null {
  if (!goals.macroSplitEnabled) return null;
  const kcalGoal = goals.dailyKcalMax ?? goals.dailyKcalMin;
  if (!kcalGoal || kcalGoal <= 0) return null;
  return {
    carbs: (kcalGoal * (goals.carbsPercent / 100)) / 4,
    protein: (kcalGoal * (goals.proteinPercent / 100)) / 4,
    fat: (kcalGoal * (goals.fatPercent / 100)) / 9,
  };
}
