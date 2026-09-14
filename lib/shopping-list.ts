import { Ingredient, FoodEntry, RecipeIngredientLine, baseQuantity, PantryEntry } from "./food-types";

export interface ShoppingListItem {
  ingredientId: string;
  ingredientName: string;
  /** Somma nell'unità propria dell'ingrediente (g, ml, o conteggio di "altro") — mai
   * convertita in un'unica unità comune: sommare "200 g di farina" e "3 uova" in una sola
   * cifra non avrebbe senso, ogni ingrediente resta nella base in cui lo si compra
   * davvero. */
  quantity: number;
  unit: Ingredient["unit"];
  unitLabel?: string;
  /** Quante voci di menù distinte hanno contribuito — solo informativo (es. "usato in 3
   * pasti"), non incide sul calcolo. */
  occurrences: number;
}

export function formatShoppingListItem(item: ShoppingListItem): string {
  if (item.unit === "g") return `${item.ingredientName} · ${Math.ceil(item.quantity)} g`;
  if (item.unit === "ml") return `${item.ingredientName} · ${Math.ceil(item.quantity)} ml`;
  // Niente pluralizzazione automatica dell'unità (es. "uovo" → "uova" non è una semplice
  // regola meccanica in italiano) — mostriamo il conteggio e l'etichetta singolare così
  // com'è stata scritta dall'utente, onesto anche se a volte grammaticalmente imperfetto.
  const unitLabel = item.unitLabel || "unità";
  return `${item.ingredientName} · ${Math.ceil(item.quantity)} × ${unitLabel}`;
}

/**
 * Scompone una voce di menù nei suoi ingredienti "acquistabili" — se l'ingrediente è una
 * Ricetta (ha una composizione, vedi Ingredient.recipe in food-types.ts), la restituisce
 * scomposta nei componenti reali scalati in proporzione alla quantità effettivamente
 * pianificata; se è un ingrediente normale, restituisce sé stesso. Ricorsiva perché una
 * ricetta può a sua volta contenere un'altra ricetta come componente (es. un "sugo" dentro
 * una "pasta al sugo") — senza questo passo quella lista mostrerebbe "sugo" come articolo
 * da comprare invece dei suoi ingredienti veri.
 */
function expandToBaseIngredients(
  ingredientId: string,
  quantity: number,
  ingredients: Ingredient[],
  depth = 0
): { ingredientId: string; quantity: number }[] {
  // Guardia contro un riferimento circolare tra ricette (bug di dati, non un caso
  // legittimo) — senza un limite di profondità un ciclo manderebbe questa funzione in
  // ricorsione infinita invece di limitarsi a produrre una lista incompleta.
  if (depth > 5) return [];

  const ingredient = ingredients.find((i) => i.id === ingredientId);
  if (!ingredient) return [];
  if (!ingredient.recipe || ingredient.recipe.lines.length === 0) {
    return [{ ingredientId, quantity }];
  }

  const totalRecipeGrams = ingredient.recipe.lines.reduce((sum, line) => {
    const component = ingredients.find((i) => i.id === line.ingredientId);
    return component ? sum + baseQuantity(component, line.quantity) : sum;
  }, 0);
  if (totalRecipeGrams <= 0) return [];

  const requestedGrams = baseQuantity(ingredient, quantity);
  const scale = requestedGrams / totalRecipeGrams;

  return ingredient.recipe.lines.flatMap((line: RecipeIngredientLine) =>
    expandToBaseIngredients(line.ingredientId, line.quantity * scale, ingredients, depth + 1)
  );
}

/**
 * Lista della spesa per i prossimi `daysAhead` giorni (oggi escluso: quello che mangi oggi
 * lo hai già in casa, quello che manca è il menù futuro) — finestra mobile da oggi, non una
 * settimana di calendario fissa, stessa scelta già fatta altrove nell'app (vedi
 * weekOverWeek in activity-stats.ts) perché è quello che conta davvero indipendentemente
 * dal giorno della settimana in cui la si consulta.
 *
 * Sottrae quanto già presente in dispensa e non ancora consumato (vedi PantryEntry in
 * food-types.ts) SOLO per unità "altro" con conteggio intero, dove "ne ho già 2 quindi
 * mettine in lista solo altre 3" ha un senso letterale; per g/ml la dispensa traccia SE un
 * acquisto esiste, non quanti grammi restano di preciso, quindi lì la lista mostra la
 * quantità pianificata per intero — è comunque un punto di partenza da rivedere con
 * un'occhiata al frigo, non un conteggio a scorta zero.
 */
export function generateShoppingList(
  entries: FoodEntry[],
  ingredients: Ingredient[],
  pantryEntries: PantryEntry[],
  today: string,
  daysAhead: number = 7
): ShoppingListItem[] {
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + daysAhead);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  const futureEntries = entries.filter((e) => e.date > today && e.date <= cutoffIso);

  const totals = new Map<string, number>();
  futureEntries.forEach((entry) => {
    const expanded = expandToBaseIngredients(entry.ingredientId, entry.quantity, ingredients);
    expanded.forEach(({ ingredientId, quantity }) => {
      totals.set(ingredientId, (totals.get(ingredientId) ?? 0) + quantity);
    });
  });

  const occurrences = new Map<string, number>();
  futureEntries.forEach((entry) => {
    occurrences.set(entry.ingredientId, (occurrences.get(entry.ingredientId) ?? 0) + 1);
  });

  const inPantryCount = new Map<string, number>();
  pantryEntries
    .filter((p) => !p.consumedDate)
    .forEach((p) => inPantryCount.set(p.ingredientId, (inPantryCount.get(p.ingredientId) ?? 0) + 1));

  const items: ShoppingListItem[] = [];
  totals.forEach((quantity, ingredientId) => {
    const ingredient = ingredients.find((i) => i.id === ingredientId);
    if (!ingredient) return;
    // Le ricette non compaiono mai come articolo in sé (sono già state scomposte sopra),
    // qui per sicurezza nel caso restasse un riferimento a una che non ha componenti validi.
    if (ingredient.recipe) return;

    let adjustedQuantity = quantity;
    if (ingredient.unit === "altro") {
      const already = inPantryCount.get(ingredientId) ?? 0;
      adjustedQuantity = Math.max(0, Math.ceil(quantity) - already);
    }
    if (adjustedQuantity <= 0) return;

    items.push({
      ingredientId,
      ingredientName: ingredient.name,
      quantity: adjustedQuantity,
      unit: ingredient.unit,
      unitLabel: ingredient.unitLabel,
      occurrences: occurrences.get(ingredientId) ?? 0,
    });
  });

  return items.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName, "it", { sensitivity: "base" }));
}
