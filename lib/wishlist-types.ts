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
   * parte, come richiesto esplicitamente. Significato diverso a seconda di
   * `linkedSavingsGoalId` qui sotto:
   * - NON collegato a un obiettivo: questo È il dato vero, un contatore proprio
   *   dell'articolo (come è sempre stato) — ma ogni versamento/prelievo qui genera anche
   *   una voce reale nel salvadanaio generale delle Finanze (`savingsEntries`), così le due
   *   contabilità non divergono mai (vedi wishlist-context.tsx, `addFunds`/`removeFunds`
   *   restano invariate; il movimento gemellato lo genera chi chiama, nei componenti che
   *   vedono sia Wishlist che Finanze — i due contesti non si vedono a vicenda, vedi
   *   app/layout.tsx).
   * - Collegato: questo campo diventa sola lettura, tenuto allineato per compatibilità con
   *   ciò che già lo legge (savingsPct, SavingsRing) ma mai più scritto direttamente da
   *   `addFunds`/`removeFunds` — la cifra vera vive in `SavingsGoal.currentAmount` (vedi
   *   lib/types.ts), l'unica in quel momento, non una copia mantenuta in sincrono a mano.
   */
  savedAmount: number;

  /** Se presente, questo articolo non ha una propria quota di risparmio: la quota è quella
   * (sempre aggiornata, mai una copia) del SavingsGoal con questo id nella scheda Finanze
   * (vedi lib/finance-context.tsx). Assente = comportamento di sempre, la quota fa capo ai
   * risparmi generali (vedi il commento su `savedAmount` sopra). Impostato/rimosso da
   * `linkToSavingsGoal`/`unlinkFromSavingsGoal` nei componenti (mai da wishlist-context.tsx
   * da solo: serve anche FinanceContext per spostare i fondi, che Wishlist non vede — stesso
   * motivo per cui questo file resta ignorante di SavingsGoal, solo l'id come riferimento).
   */
  linkedSavingsGoalId?: string;

  createdAt: string;
}

/** La percentuale mostrata nell'anello — SEMPRE calcolata su `savedAmount`, che per un
 * articolo collegato a un obiettivo (vedi `linkedSavingsGoalId`) è tenuto allineato al
 * `currentAmount` dell'obiettivo da chi gestisce il collegamento, non ricalcolato qui: questa
 * funzione non ha bisogno di conoscere SavingsGoal, resta valida in entrambi i casi. */
export function savingsPct(item: WishlistItem): number {
  if (!item.price || item.price <= 0) return 0;
  return Math.min(1, item.savedAmount / item.price);
}

/** Applica una variazione di fondi rispettando il tetto: mai sotto zero, mai sopra il
 * prezzo (se impostato). Estratta come funzione pura, non scritta due volte, per essere
 * verificabile con un test diretto. Usata sia per un articolo non collegato (il caso
 * normale) sia per tenere `savedAmount` allineato quando l'obiettivo collegato cambia
 * `currentAmount` altrove (vedi i componenti che leggono entrambi i contesti). */
export function applyFundsDelta(item: WishlistItem, delta: number): WishlistItem {
  const cap = item.price ?? Infinity;
  return { ...item, savedAmount: Math.min(cap, Math.max(0, item.savedAmount + delta)) };
}
