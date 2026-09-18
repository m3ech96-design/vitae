/**
 * Un riferimento generico a QUALUNQUE entità dell'app — persone, animali, luoghi, task,
 * ingredienti/ricette, hobby, articoli wishlist, schede allenamento, voci di liste/note,
 * voci di diario. Deliberatamente {tipo, id} invece di un campo dedicato per ciascun tipo
 * (come fanno oggi Task.linkedPersonIds/linkedPlaceId): un campo per tipo esploderebbe a
 * dieci-e-più campi opzionali su ogni entità che vuole poter linkare "tutto", mentre un
 * array di riferimenti generico resta lo stesso identico campo ovunque venga usato,
 * qualunque sia il numero di tipi collegabili oggi o in futuro.
 *
 * Corretto secondo le istruzioni: "diario" era assente da questo elenco — il Diario poteva
 * collegarsi ad altre entità (è uno dei due consumatori del link generico, vedi il commento
 * in entity-resolver.ts), ma nulla poteva collegarsi A una voce di diario, e le voci di
 * diario non compaiono nella ricerca globale. Stesso concetto del catalogo dei trigger di
 * Stati d'animo rimasto indietro rispetto all'evoluzione dell'app — qui però riguardava
 * cosa può essere linkato/cercato, non cosa suggerisce uno stato d'animo.
 */
export type LinkableType =
  | "persona"
  | "animale"
  | "luogo"
  | "task"
  | "ingrediente"
  | "hobby"
  | "wishlist"
  | "scheda-allenamento"
  | "nota"
  | "diario";

export interface EntityLink {
  type: LinkableType;
  id: string;
}

export const LINKABLE_TYPE_LABEL: Record<LinkableType, string> = {
  persona: "Persona",
  animale: "Animale",
  luogo: "Luogo",
  task: "Task",
  ingrediente: "Ingrediente/Ricetta",
  hobby: "Hobby",
  wishlist: "Wishlist",
  "scheda-allenamento": "Scheda allenamento",
  nota: "Lista/Nota",
  diario: "Voce di diario",
};
