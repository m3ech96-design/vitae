import {
  Carrot,
  Wheat,
  Beef,
  Bean,
  Milk,
  Droplet,
  Cookie,
  Sparkle,
  type LucideIcon,
} from "lucide-react";

/**
 * Il catalogo delle categorie alimentari — riprogettato dopo l'eliminazione dei "tipi di
 * conservazione" dal wizard ingredienti (quelli servivano a stimare la scadenza, funzione
 * poi rimossa: la scadenza in dispensa si scrive sempre a mano, vedi
 * PantryEntry.expiryDateOverride in lib/food-types.ts). Ridurre tutto a "Frutta e verdura" +
 * "Altro" (l'unico uso rimasto all'epoca) risultava però una lista visivamente monca,
 * giustificata da un solo calcolo — da qui questi 8 gruppi alimentari nutrizionali, che
 * riprendono la classificazione a gruppi delle Linee Guida CREA per una sana alimentazione
 * (revisione 2018): non una tassonomia inventata per l'occasione, ma la stessa suddivisione
 * (Cereali, Frutta/verdura, Carne-pesce-uova-legumi, Latte e derivati, Grassi da
 * condimento) con Proteine animali/vegetali e Dolci/zuccheri distinti perché il Resoconto
 * benessere (lib/wellbeing-report.ts) li legge separatamente per due calcoli diversi.
 *
 * Ogni gruppo qui ha un uso dichiarato nel Resoconto benessere, non solo "raccolto per il
 * futuro":
 * - `frutta-verdura` → porzioni giornaliere di frutta/verdura (OMS/CREA, invariato)
 * - `proteine-animali` e `proteine-vegetali` → bilanciamento tra le due fonti proteiche
 *   (raccomandazione CREA/LARN di assumerle in proporzione simile)
 * - tutti e otto insieme (incluso `altro`) → varietà settimanale della dieta (principio
 *   CREA: la varietà tra gruppi alimentari è associata a una migliore adeguatezza
 *   nutrizionale)
 *
 * `altro` resta l'ultima voce dell'array: `foodCategoryOf` sotto usa sempre l'ultimo
 * elemento come ripiego, quindi va mantenuta lì qualunque categoria si aggiunga in futuro.
 */
export interface FoodCategory {
  id: string;
  label: string;
  color: string;
  icon: LucideIcon;
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  { id: "frutta-verdura", label: "Frutta e verdura", color: "#34D399", icon: Carrot },
  { id: "cereali", label: "Cereali e derivati", color: "#D9A066", icon: Wheat },
  { id: "proteine-animali", label: "Proteine animali", color: "#FF6B9D", icon: Beef },
  { id: "proteine-vegetali", label: "Proteine vegetali", color: "#8FD8A0", icon: Bean },
  { id: "latticini", label: "Latticini", color: "#5EC8FF", icon: Milk },
  { id: "grassi-condimento", label: "Grassi da condimento", color: "#F2C464", icon: Droplet },
  { id: "dolci-zuccheri", label: "Dolci e zuccheri", color: "#C87DFF", icon: Cookie },
  { id: "altro", label: "Altro", color: "#8B90A8", icon: Sparkle },
];

export function foodCategoryOf(categoryId: string | undefined): FoodCategory {
  return FOOD_CATEGORIES.find((c) => c.id === categoryId) ?? FOOD_CATEGORIES[FOOD_CATEGORIES.length - 1];
}
