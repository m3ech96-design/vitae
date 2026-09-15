import { PantryEntry, Ingredient } from "./food-types";

export interface PantryEntryStatus {
  entry: PantryEntry;
  ingredientName: string;
  /** Assente se l'acquisto non ha una scadenza scritta a mano — vedi il commento sopra
   * PantryEntry.expiryDateOverride in lib/food-types.ts: non esiste più una stima
   * automatica di ripiego, quindi senza quella data questo campo non ha semplicemente un
   * valore, invece di mostrarne uno inventato. */
  expiryDate?: string;
  daysRemaining: number | null;
  status: "senza-scadenza" | "fresco" | "in-scadenza" | "scaduto";
}

/** Sotto questa soglia di giorni residui un acquisto passa da "fresco" a "in scadenza" —
 * non aspetta il giorno esatto, stesso principio già adottato per il preavviso vaccinazioni
 * (vedi lib/vaccination-reminder.ts): un margine per accorgersene in tempo, non un avviso
 * dell'ultimo secondo. */
const WARNING_WINDOW_DAYS = 2;

/**
 * Stato di ogni acquisto ancora non consumato — pensato per la vista dispensa e per il
 * notificatore: entrambi hanno bisogno esattamente di questi stessi numeri (scadenza,
 * giorni residui, categoria di stato), calcolati nello stesso modo per non rischiare che i
 * due punti dell'app dicano cose leggermente diverse sulla stessa voce.
 *
 * Corretto secondo le istruzioni: prima, in assenza di una scadenza scritta a mano
 * (`expiryDateOverride`), si ricorreva a una stima automatica per categoria dell'ingrediente
 * (`typicalShelfLifeDays` in lib/food-category-catalog.ts). Quella stima è stata rimossa del
 * tutto: la scadenza di un acquisto ora esiste solo se l'utente l'ha scritta, letta dalla
 * confezione vera. Un acquisto senza quella data non ha scadenza tracciata — status
 * "senza-scadenza", mai un valore inventato spacciato per una data reale.
 */
export function pantryEntryStatuses(entries: PantryEntry[], ingredients: Ingredient[], today: string): PantryEntryStatus[] {
  const todayMs = new Date(today).getTime();

  return entries
    .filter((e) => !e.consumedDate)
    .map((entry) => {
      const ingredient = ingredients.find((i) => i.id === entry.ingredientId);
      const expiry = entry.expiryDateOverride;
      if (!expiry) {
        return {
          entry,
          ingredientName: ingredient?.name ?? "Ingrediente eliminato",
          expiryDate: undefined,
          daysRemaining: null,
          status: "senza-scadenza" as const,
        };
      }
      const daysRemaining = Math.round((new Date(expiry).getTime() - todayMs) / 86400000);
      const status: PantryEntryStatus["status"] =
        daysRemaining < 0 ? "scaduto" : daysRemaining <= WARNING_WINDOW_DAYS ? "in-scadenza" : "fresco";
      return {
        entry,
        ingredientName: ingredient?.name ?? "Ingrediente eliminato",
        expiryDate: expiry,
        daysRemaining,
        status,
      };
    })
    // Le voci con scadenza vera vengono prima, ordinate dalla più vicina; quelle senza
    // scadenza restano in fondo, ordinate per data di acquisto (non hanno una scadenza con
    // cui ordinarle, ma un ordine stabile è comunque meglio di uno arbitrario).
    .sort((a, b) => {
      if (a.expiryDate && b.expiryDate) return a.expiryDate.localeCompare(b.expiryDate);
      if (a.expiryDate) return -1;
      if (b.expiryDate) return 1;
      return a.entry.purchasedDate.localeCompare(b.entry.purchasedDate);
    });
}

/** true se almeno un acquisto non ancora consumato è "in-scadenza" o "scaduto" — pilota
 * solo il puntino discreto sull'icona della scheda Alimentazione nella barra di
 * navigazione (stesso principio già usato da hasStalePlaces per la scheda Mappa in
 * lib/stale-places.ts), mai un banner altrove nell'app. Le voci "senza-scadenza" non
 * contano: senza una data reale non c'è nulla da segnalare come imminente. */
export function hasExpiringPantryEntries(entries: PantryEntry[], ingredients: Ingredient[], today: string): boolean {
  return pantryEntryStatuses(entries, ingredients, today).some((s) => s.status === "in-scadenza" || s.status === "scaduto");
}

/**
 * Scala `quantity` dalle entry di dispensa di un ingrediente che hanno il tracking attivo
 * (`remainingQuantity` non `undefined`) — FIFO per scadenza stimata più vicina prima, non
 * per ordine di inserimento: si vuole consumare per prima la confezione che sta per scadere,
 * esattamente il criterio già usato per ordinare la vista dispensa (vedi
 * pantryEntryStatuses). Se la quantità richiesta supera la prima entry, la eccede a
 * cascata sulla successiva — una porzione può benissimo finire l'ultimo po' di una
 * confezione e intaccare quella nuova nella stessa registrazione. Un'entry che tocca 0 si
 * segna consumata da sola (`consumedDate`), stesso comportamento di spuntarla a mano.
 * Non tocca le entry senza tracking attivo (`remainingQuantity` assente): quelle restano
 * esattamente come sono sempre state, un acquisto che si marca consumato tutto insieme.
 * Ritorna il nuovo array di entry, da passare a persistPantry — non muta l'input.
 */
export function consumeFromPantry(
  entries: PantryEntry[],
  ingredientId: string,
  quantity: number,
  today: string
): PantryEntry[] {
  if (quantity <= 0) return entries;

  const eligible = entries
    .filter((e) => e.ingredientId === ingredientId && !e.consumedDate && e.remainingQuantity !== undefined)
    .sort((a, b) => a.purchasedDate.localeCompare(b.purchasedDate));

  let remaining = quantity;
  const updates = new Map<string, Partial<PantryEntry>>();

  for (const entry of eligible) {
    if (remaining <= 0) break;
    const available = entry.remainingQuantity!;
    const taken = Math.min(available, remaining);
    const newRemaining = Math.round((available - taken) * 100) / 100;
    updates.set(entry.id, newRemaining <= 0 ? { remainingQuantity: 0, consumedDate: today } : { remainingQuantity: newRemaining });
    remaining -= taken;
  }

  if (updates.size === 0) return entries;
  return entries.map((e) => (updates.has(e.id) ? { ...e, ...updates.get(e.id) } : e));
}

/**
 * L'inverso di consumeFromPantry — usata quando un pasto che aveva scalato la dispensa
 * viene eliminato o modificato: la quantità consumata deve tornare indietro, altrimenti
 * cancellare un pasto lascerebbe la dispensa scalata in modo scorretto per sempre. Ridà la
 * quantità alle entry più di recente intaccate per prime (l'inverso esatto dell'ordine di
 * consumo: se un consumo aveva intaccato prima A poi B, un ripristino restituisce prima a B
 * e poi, se avanza, ad A) — così ripristinare subito dopo un consumo lo annulla esattamente,
 * entry per entry, invece di finire su una confezione diversa da quella scalata.
 * Un'entry già segnata consumata che torna sopra 0 si "riapre" (consumedDate rimosso):
 * coerente con l'idea che il ripristino corregge un consumo, non impone un nuovo stato.
 * Non tocca le entry senza tracking attivo, come consumeFromPantry.
 */
export function restoreToPantry(
  entries: PantryEntry[],
  ingredientId: string,
  quantity: number
): PantryEntry[] {
  if (quantity <= 0) return entries;

  // Ordine inverso rispetto al consumo (che va dalla scadenza più vicina a quella più
  // lontana): qui si parte dalla più lontana, così la prima ad essere "riempita" indietro è
  // l'ultima che consumeFromPantry avrebbe intaccato.
  const eligible = entries
    .filter((e) => e.ingredientId === ingredientId && e.remainingQuantity !== undefined && e.initialQuantity !== undefined)
    .sort((a, b) => b.purchasedDate.localeCompare(a.purchasedDate));

  let remaining = quantity;
  const updates = new Map<string, Partial<PantryEntry>>();

  for (const entry of eligible) {
    if (remaining <= 0) break;
    const current = entry.remainingQuantity!;
    const capacity = entry.initialQuantity! - current;
    if (capacity <= 0) continue;
    const given = Math.min(capacity, remaining);
    const newRemaining = Math.round((current + given) * 100) / 100;
    updates.set(entry.id, { remainingQuantity: newRemaining, consumedDate: undefined });
    remaining -= given;
  }

  if (updates.size === 0) return entries;
  return entries.map((e) => (updates.has(e.id) ? { ...e, ...updates.get(e.id) } : e));
}
