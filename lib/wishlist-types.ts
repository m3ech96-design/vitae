import { CustomField } from "./types";

/**
 * "Tutti i dettagli possibili per ogni tipo di articolo acquistabile" non è uno schema
 * fissabile in anticipo: un libro, un elettrodomestico e un paio di scarpe non condividono
 * campi utili. Stessa scelta già fatta altrove nel progetto (Interessi del wizard, sezioni
 * personalizzate) — dettagli come campi liberi "+", non un modulo diverso per categoria di
 * prodotto immaginata a tavolino.
 */
export interface WishlistItem {
  id: string;
  name: string;
  photoKey?: string;
  details: CustomField[];

  /** Luogo (marker) dove si trova l'articolo — un Luogo vero della Mappa, stesso
   * collegamento già usato dalle Task, più la posizione precisa dentro il negozio. */
  linkedPlaceId?: string;
  row?: string; // Fila
  aisle?: string; // Corsia
  shelfNumber?: string; // Numero
  shelf?: string; // Scaffale

  siteName?: string;
  siteUrl?: string;
  price: number | null;
  /** Testo libero, non una data precisa: un "periodo stimato" è per natura impreciso
   * ("a Natale", "tra 2-3 mesi", "quando esce il nuovo modello"). */
  estimatedPeriod?: string;

  /** Fondi accantonati finora — il tetto è sempre il prezzo, mai un obiettivo impostato a
   * parte, come richiesto esplicitamente. */
  savedAmount: number;

  createdAt: string;
}

export function savingsPct(item: WishlistItem): number {
  if (!item.price || item.price <= 0) return 0;
  return Math.min(1, item.savedAmount / item.price);
}

/** Applica una variazione di fondi rispettando il tetto: mai sotto zero, mai sopra il
 * prezzo (se impostato). Estratta come funzione pura, non scritta due volte, per essere
 * verificabile con un test diretto. */
export function applyFundsDelta(item: WishlistItem, delta: number): WishlistItem {
  const cap = item.price ?? Infinity;
  return { ...item, savedAmount: Math.min(cap, Math.max(0, item.savedAmount + delta)) };
}
