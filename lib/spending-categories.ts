import { PlaceType, ExpenseCategory } from "./types";

/** Bar e Ristorante restano semplici (un unico importo, salvato come Cibo). Supermercato,
 * Negozio e le task di tipo Spesa senza luogo collegato permettono di dividere la spesa.
 * Servizio ha le sue voci dedicate, diverse da tutte le altre. */
export function spendCategoriesFor(placeType: PlaceType | undefined): string[] | undefined {
  if (placeType === "bar" || placeType === "ristorante") return undefined;
  if (placeType === "servizio") return SERVICE_SPEND_CATEGORIES;
  return GENERIC_SPEND_CATEGORIES;
}

/** Categorie per la spesa in supermercato o negozio: si può dividere l'importo tra più
 * di queste, perché non si trova solo cibo o solo abbigliamento in un unico posto. */
export const GENERIC_SPEND_CATEGORIES = [
  "Cibo",
  "Casa",
  "Igiene E Cura Personale",
  "Abbigliamento",
  "Elettronica",
  "Libri E Cartoleria",
  "Giocattoli",
  "Animali",
  "Regali",
  "Altro",
];

/** Voci specifiche per i luoghi di tipo "Servizio" — non hanno senso per un supermercato. */
export const SERVICE_SPEND_CATEGORIES = [
  "Meccanico",
  "Elettrauto",
  "Gommista",
  "Banca",
  "Assicurazione",
  "Parrucchiere",
  "Estetista",
  "Idraulico",
  "Elettricista",
  "Avvocato",
  "Commercialista",
  "Veterinario",
  "Lavanderia",
  "Corriere",
  "Altro",
];

/** Dove finisce ogni voce di ripartizione nel budget di Finanze, che ha categorie più
 * ampie e fisse. Qualunque voce non elencata (inclusi i nomi scritti a mano in "Altro") cade
 * su "altro". */
export const SPEND_ITEM_TO_EXPENSE_CATEGORY: Record<string, ExpenseCategory> = {
  Cibo: "cibo",
  Casa: "casa",
  "Igiene E Cura Personale": "salute",
  Abbigliamento: "shopping",
  Elettronica: "shopping",
  "Libri E Cartoleria": "svago",
  Giocattoli: "svago",
  Animali: "shopping",
  Regali: "shopping",
  Meccanico: "trasporti",
  Elettrauto: "trasporti",
  Gommista: "trasporti",
  Banca: "servizi",
  Assicurazione: "servizi",
  Parrucchiere: "svago",
  Estetista: "svago",
  Idraulico: "casa",
  Elettricista: "casa",
  Avvocato: "servizi",
  Commercialista: "servizi",
  Veterinario: "salute",
  Lavanderia: "casa",
  Corriere: "servizi",
};
