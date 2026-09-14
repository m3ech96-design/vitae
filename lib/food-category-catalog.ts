import { Milk, Beef, Fish, Carrot, Apple, Wheat, Snowflake, Package, Sparkle, type LucideIcon } from "lucide-react";

/**
 * Variante "leggera" alla scadenza per-ingrediente (che richiederebbe segnare a mano una
 * data ogni volta che si compra qualcosa): la scadenza si stima da UNA scelta fatta una
 * volta sola per categoria — "i latticini freschi durano ~7 giorni" — non da un'informazione
 * chiesta ripetutamente per ogni confezione comprata. `typicalShelfLifeDays` è un valore di
 * buon senso, pensato per essere corretto se non calza (frigo più freddo, prodotto a lunga
 * conservazione nella stessa categoria, ecc.), non un dato scientifico da prendere alla
 * lettera — la stima resta comunque più utile di nessuna scadenza tracciata affatto.
 */
export interface FoodCategory {
  id: string;
  label: string;
  color: string;
  icon: LucideIcon;
  typicalShelfLifeDays: number;
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  { id: "latticini-freschi", label: "Latticini freschi", color: "#5EC8FF", icon: Milk, typicalShelfLifeDays: 7 },
  { id: "carne-pesce-freschi", label: "Carne e pesce freschi", color: "#FF6B9D", icon: Fish, typicalShelfLifeDays: 2 },
  { id: "salumi-carni-conservate", label: "Salumi e carni conservate", color: "#FFB454", icon: Beef, typicalShelfLifeDays: 14 },
  { id: "verdura-foglia", label: "Verdura a foglia", color: "#34D399", icon: Carrot, typicalShelfLifeDays: 4 },
  { id: "verdura-frutta-dura", label: "Verdura e frutta dura", color: "#8FD8A0", icon: Apple, typicalShelfLifeDays: 10 },
  { id: "pane-fresco", label: "Pane fresco", color: "#D9A066", icon: Wheat, typicalShelfLifeDays: 3 },
  { id: "surgelati", label: "Surgelati", color: "#8FD8FF", icon: Snowflake, typicalShelfLifeDays: 90 },
  { id: "dispensa-secca", label: "Dispensa secca (pasta, riso, scatolame)", color: "#B79A6B", icon: Package, typicalShelfLifeDays: 365 },
  { id: "altro", label: "Altro", color: "#8B90A8", icon: Sparkle, typicalShelfLifeDays: 7 },
];

export function foodCategoryOf(categoryId: string | undefined): FoodCategory {
  return FOOD_CATEGORIES.find((c) => c.id === categoryId) ?? FOOD_CATEGORIES[FOOD_CATEGORIES.length - 1];
}
