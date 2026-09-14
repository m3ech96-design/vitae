import { PantryEntry, Ingredient } from "./food-types";
import { foodCategoryOf } from "./food-category-catalog";

export interface PantryEntryStatus {
  entry: PantryEntry;
  ingredientName: string;
  estimatedExpiryDate: string;
  daysRemaining: number;
  status: "fresco" | "in-scadenza" | "scaduto";
}

/** Sotto questa soglia di giorni residui un acquisto passa da "fresco" a "in scadenza" —
 * non aspetta il giorno esatto, stesso principio già adottato per il preavviso vaccinazioni
 * (vedi lib/vaccination-reminder.ts): un margine per accorgersene in tempo, non un avviso
 * dell'ultimo secondo. */
const WARNING_WINDOW_DAYS = 2;

export function estimatedExpiryDate(purchasedDate: string, ingredient: Pick<Ingredient, "categoryId">): string {
  const category = foodCategoryOf(ingredient.categoryId);
  const purchased = new Date(purchasedDate);
  purchased.setDate(purchased.getDate() + category.typicalShelfLifeDays);
  return purchased.toISOString().slice(0, 10);
}

/**
 * Stato di ogni acquisto ancora non consumato — pensato per la vista dispensa e per il
 * notificatore: entrambi hanno bisogno esattamente di questi stessi tre numeri (scadenza
 * stimata, giorni residui, categoria di stato), calcolati nello stesso modo per non
 * rischiare che i due punti dell'app dicano cose leggermente diverse sulla stessa voce.
 */
export function pantryEntryStatuses(entries: PantryEntry[], ingredients: Ingredient[], today: string): PantryEntryStatus[] {
  const todayMs = new Date(today).getTime();

  return entries
    .filter((e) => !e.consumedDate)
    .map((entry) => {
      const ingredient = ingredients.find((i) => i.id === entry.ingredientId);
      const expiry = estimatedExpiryDate(entry.purchasedDate, ingredient ?? {});
      const daysRemaining = Math.round((new Date(expiry).getTime() - todayMs) / 86400000);
      const status: PantryEntryStatus["status"] =
        daysRemaining < 0 ? "scaduto" : daysRemaining <= WARNING_WINDOW_DAYS ? "in-scadenza" : "fresco";
      return {
        entry,
        ingredientName: ingredient?.name ?? "Ingrediente eliminato",
        estimatedExpiryDate: expiry,
        daysRemaining,
        status,
      };
    })
    .sort((a, b) => a.estimatedExpiryDate.localeCompare(b.estimatedExpiryDate));
}
