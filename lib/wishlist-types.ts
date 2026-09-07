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

  /**
   * Corretto secondo le istruzioni: il flusso NON è bilaterale. Prima un versamento fatto
   * QUI sull'articolo si specchiava anche verso Finanze (per un articolo non collegato a un
   * obiettivo) — sbagliato. Il flusso vero va sempre e solo Finanze → Wishlist, mai il
   * contrario: versare o prelevare accade in Finanze (dal salvadanaio generale con
   * `addSavingsEntry`, o da un obiettivo con `contributeSavingsGoal`), e la quota mostrata
   * qui è un puro riflesso di quel movimento, MAI un'azione propria dell'articolo. Per
   * questo l'articolo non ha più pulsanti +/- manuali una volta collegato: la sua quota si
   * muove SOLO seguendo la destinazione scelta in `linkedTo` qui sotto.
   *
   * Resta comunque un campo scritto (non calcolato al volo) — sola lettura dal punto di
   * vista dell'utente, ma sincronizzato da chi vede entrambi i contesti (vedi
   * app/wishlist/page.tsx, che tiene questo valore allineato alla destinazione ogni volta
   * che quest'ultima cambia). 0 per un articolo senza alcuna destinazione collegata.
   */
  savedAmount: number;

  /**
   * La destinazione a cui questo articolo è collegato — se assente, l'articolo non ha
   * ancora una quota attiva (`savedAmount` resta 0 finché non se ne sceglie una, vedi
   * WishlistItemSheet). Due forme, sullo stesso piano, mai un default automatico dell'una
   * sull'altra:
   * - `{ kind: "general" }`: il salvadanaio generale delle Finanze (`savingsEntries` in
   *   lib/finance-context.tsx) — la quota riflette il suo saldo totale.
   * - `{ kind: "goal", goalId }`: un SavingsGoal specifico (vedi lib/types.ts) — la quota
   *   riflette il suo `currentAmount`.
   * Impostato/rimosso da `setLinkedTo` in wishlist-context.tsx (solo il riferimento: questo
   * contesto non vede FinanceContext, vedi app/layout.tsx — Wishlist è più esterno).
   */
  linkedTo?: { kind: "general" } | { kind: "goal"; goalId: string };

  /** "Esaudisci" — l'articolo è stato acquistato: i soldi accantonati per lui sono usciti
   * per sempre dalla destinazione collegata (un prelievo vero, con la sua voce in
   * cronologia — vedi WishlistItemSheet), e da qui in poi la quota resta ferma a questo
   * importo, sganciata dalla destinazione (che nel frattempo può continuare a muoversi per
   * altri motivi, senza più riflettersi su un articolo già esaudito). Assente = non ancora
   * esaudito, il comportamento di sempre. */
  fulfilledAmount?: number;
  fulfilledAt?: string;

  createdAt: string;
}

/** Un articolo esaudito resta tale per sempre — comodo da controllare in un solo punto
 * invece di ripetere `item.fulfilledAt !== undefined` ovunque serve. */
export function isFulfilled(item: WishlistItem): boolean {
  return item.fulfilledAt !== undefined;
}

/** La soglia REALE da raggiungere per poter esaudire l'articolo — non il suo prezzo, ma
 * il prezzo più un margine fisso di sicurezza (1000€): un articolo da 500€ richiede 1500€
 * accantonati prima di sbloccare "Esaudisci", non 500€. Il prezzo "nudo" (`item.price`)
 * resta il prezzo di listino mostrato com'è (etichetta articolo, form di modifica): è
 * SOLO la quota di risparmio — anello, percentuale, tetto di accantonamento — a doversi
 * riempire rispetto a questa soglia più alta, mai rispetto al prezzo da solo.
 * `null` se l'articolo non ha ancora un prezzo impostato (stesso caso già gestito da chi
 * chiama, vedi `savingsPct`). */
export function unlockThreshold(item: WishlistItem): number | null {
  if (item.price === null || item.price <= 0) return null;
  return item.price + 1000;
}

/** La percentuale mostrata nell'anello — calcolata su `fulfilledAmount` se l'articolo è
 * stato esaudito (un dato ormai fermo), altrimenti su `savedAmount` (il riflesso vivo della
 * destinazione collegata, o 0 se non è collegato a nessuna). Il denominatore è
 * `unlockThreshold`, non `item.price`: raggiungere il 100% richiede il margine di 1000€
 * oltre al prezzo, vedi `unlockThreshold`. */
export function savingsPct(item: WishlistItem): number {
  const threshold = unlockThreshold(item);
  if (threshold === null) return 0;
  const amount = isFulfilled(item) ? item.fulfilledAmount! : item.savedAmount;
  return Math.min(1, amount / threshold);
}

