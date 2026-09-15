import {
  Milk,
  Beef,
  Fish,
  Carrot,
  Apple,
  Wheat,
  Snowflake,
  Package,
  Sparkle,
  Egg,
  Soup,
  Nut,
  Cookie,
  CupSoda,
  Coffee,
  Droplet,
  CircleDot,
  IceCreamBowl,
  type LucideIcon,
} from "lucide-react";

/**
 * Il catalogo delle categorie alimentari — usato per classificare un ingrediente (vedi
 * AddIngredientModal.tsx), indipendentemente dalla sua scadenza in dispensa: quella si
 * scrive a mano al momento dell'acquisto (vedi PantryEntry.expiryDateOverride in
 * lib/food-types.ts), non si stima più da questa categoria. Prima esisteva anche un campo
 * `typicalShelfLifeDays` usato proprio per quella stima automatica — rimosso insieme alla
 * stima stessa: nessun codice lo leggeva più una volta tolta quella logica da lib/pantry.ts.
 *
 * Le 10 categorie aggiunte dopo le prime 9 (Uova, Formaggi stagionati, ... Bevande aperte)
 * derivano da una ricerca sui tempi di conservazione tipici raccomandati da fonti come
 * Ministero della Salute (via divulgazione ilgiornaledelcibo.it/cookist.it), U.Di.Con e
 * Bennet — scelte per non sovrapporsi concettualmente alle categorie già esistenti: niente
 * doppioni tipo "un'altra carne fresca", ma casi distinti (uova, formaggi stagionati contro
 * i "latticini freschi" già presenti, piatti già cucinati, alimenti secchi non da dispensa
 * come frutta secca/caffè, bevande e salse una volta aperte). `altro` resta l'ultima voce
 * dell'array: `foodCategoryOf` sotto usa sempre l'ultimo elemento come ripiego, quindi va
 * mantenuta lì qualunque categoria si aggiunga in futuro.
 */
export interface FoodCategory {
  id: string;
  label: string;
  color: string;
  icon: LucideIcon;
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  { id: "latticini-freschi", label: "Latticini freschi", color: "#5EC8FF", icon: Milk },
  { id: "carne-pesce-freschi", label: "Carne e pesce freschi", color: "#FF6B9D", icon: Fish },
  { id: "salumi-carni-conservate", label: "Salumi e carni conservate", color: "#FFB454", icon: Beef },
  { id: "verdura-foglia", label: "Verdura a foglia", color: "#34D399", icon: Carrot },
  { id: "verdura-frutta-dura", label: "Verdura e frutta dura", color: "#8FD8A0", icon: Apple },
  { id: "pane-fresco", label: "Pane fresco", color: "#D9A066", icon: Wheat },
  { id: "surgelati", label: "Surgelati", color: "#8FD8FF", icon: Snowflake },
  { id: "dispensa-secca", label: "Dispensa secca (pasta, riso, scatolame)", color: "#B79A6B", icon: Package },
  { id: "uova", label: "Uova", color: "#F5D67A", icon: Egg },
  { id: "formaggi-stagionati", label: "Formaggi stagionati", color: "#E0B25C", icon: CircleDot },
  { id: "piatti-pronti-avanzi", label: "Piatti pronti e avanzi cucinati", color: "#C87DFF", icon: Soup },
  { id: "frutta-secca-semi", label: "Frutta secca e semi", color: "#B08968", icon: Nut },
  { id: "dolci-forno-confezionati", label: "Dolci e prodotti da forno confezionati", color: "#F2A65A", icon: Cookie },
  { id: "bevande-aperte", label: "Bevande aperte", color: "#5CC9E0", icon: CupSoda },
  { id: "caffe-te-infusi", label: "Caffè, tè e infusi", color: "#8B5E3C", icon: Coffee },
  { id: "yogurt-dessert", label: "Yogurt e dessert al cucchiaio", color: "#7ED9C3", icon: IceCreamBowl },
  { id: "salse-condimenti-aperti", label: "Salse e condimenti aperti", color: "#D96C6C", icon: Droplet },
  { id: "altro", label: "Altro", color: "#8B90A8", icon: Sparkle },
];

export function foodCategoryOf(categoryId: string | undefined): FoodCategory {
  return FOOD_CATEGORIES.find((c) => c.id === categoryId) ?? FOOD_CATEGORIES[FOOD_CATEGORIES.length - 1];
}
