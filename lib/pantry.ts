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

/** Sotto quale percentuale di quantità residua (rispetto all'ultimo acquisto tracciato,
 * vedi ingredientStockStatus sotto) un ingrediente conta come "in esaurimento" — stessa
 * soglia già in uso per il cibo degli animali (LOW_STOCK_THRESHOLD in
 * lib/animal-food-context.tsx), non una coincidenza: è lo stesso concetto ("un quinto o
 * meno della confezione piena"), applicato qui a un dominio diverso. Tenuta come costante
 * propria invece di importarla da quel file: cibo umano e cibo animali sono moduli
 * volutamente separati altrove nel codice (dati, provider, notifier distinti), e una soglia
 * che per caso oggi coincide non deve accoppiare i due moduli — se domani cambiasse per uno
 * dei due, non deve cambiare per forza anche per l'altro. */
export const PANTRY_LOW_STOCK_THRESHOLD = 0.2;

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

export interface IngredientStockStatus {
  ingredientId: string;
  ingredientName: string;
  /** Somma di remainingQuantity su tutte le entry non consumate CON tracking attivo di
   * questo ingrediente — più acquisti tracciati dello stesso ingrediente (es. due confezioni
   * di pasta aperte insieme) si sommano in un'unica scorta, non restano conteggi separati:
   * è quanto ne hai davvero in casa, a prescindere da quante confezioni lo compongono. */
  remaining: number;
  /** Somma di initialQuantity sulle stesse entry — la "capacità piena" di riferimento per
   * calcolare una percentuale. Non è mai una quantità "ideale" dichiarata a parte (questa
   * app non ha un concetto di scorta-obiettivo per ingrediente): è semplicemente quanto era
   * stato acquistato l'ultima volta che è stato tracciato, lo stesso principio già in uso
   * per il cibo animali (unitsTotal × portionsPerUnit), riletto qui come "l'ultima
   * confezione piena che conosciamo" invece di un numero configurato a mano. */
  capacity: number;
  unit: Ingredient["unit"];
  unitLabel?: string;
  /** L'entry più di recente acquistata tra quelle che compongono questa scorta — è quella
   * su cui si legge/scrive `lowStockAlerted` (vedi il commento su quel campo in
   * food-types.ts): un'unica bandiera per ingrediente, non una per singola confezione,
   * altrimenti due confezioni della stessa pasta finite quasi insieme genererebbero due
   * notifiche invece di una. */
  mostRecentEntry: PantryEntry;
}

/** Percentuale di scorta residua, 0-1, per un IngredientStockStatus — null se capacity è 0
 * (nessuna quantità iniziale nota, quindi nessuna percentuale onesta da calcolare). */
export function stockRemainingPct(s: Pick<IngredientStockStatus, "remaining" | "capacity">): number | null {
  if (s.capacity <= 0) return null;
  return Math.max(0, Math.min(1, s.remaining / s.capacity));
}

export function isIngredientLowStock(s: Pick<IngredientStockStatus, "remaining" | "capacity">): boolean {
  const pct = stockRemainingPct(s);
  return pct !== null && pct < PANTRY_LOW_STOCK_THRESHOLD;
}

/**
 * Stato di scorta per ogni ingrediente che ha almeno un acquisto non consumato CON
 * tracking quantità attivo (`initialQuantity`/`remainingQuantity` impostati, vedi
 * AddPantryEntryModal) — un ingrediente i cui acquisti non tracciano mai la quantità
 * semplicemente non compare qui: non esiste una scorta da poter dire "bassa" senza sapere
 * quanto ne resta, esattamente come pantryEntryStatuses non inventa una scadenza per chi
 * non l'ha scritta. Aggrega tutte le entry attive dello stesso ingrediente in un'unica riga
 * (vedi il commento su IngredientStockStatus.remaining) invece di trattarle come scorte
 * indipendenti — così comprare una seconda confezione mentre la prima è ancora a metà
 * alza correttamente la percentuale invece di far coesistere "una scorta bassa e una piena"
 * per lo stesso ingrediente.
 */
export function ingredientStockStatuses(entries: PantryEntry[], ingredients: Ingredient[]): IngredientStockStatus[] {
  const tracked = entries.filter((e) => !e.consumedDate && e.initialQuantity !== undefined && e.remainingQuantity !== undefined);
  const byIngredient = new Map<string, PantryEntry[]>();
  tracked.forEach((e) => {
    const list = byIngredient.get(e.ingredientId) ?? [];
    list.push(e);
    byIngredient.set(e.ingredientId, list);
  });

  const statuses: IngredientStockStatus[] = [];
  byIngredient.forEach((group, ingredientId) => {
    const ingredient = ingredients.find((i) => i.id === ingredientId);
    if (!ingredient) return;
    const remaining = group.reduce((sum, e) => sum + (e.remainingQuantity ?? 0), 0);
    const capacity = group.reduce((sum, e) => sum + (e.initialQuantity ?? 0), 0);
    const mostRecentEntry = [...group].sort((a, b) => b.purchasedDate.localeCompare(a.purchasedDate))[0];
    statuses.push({
      ingredientId,
      ingredientName: ingredient.name,
      remaining,
      capacity,
      unit: ingredient.unit,
      unitLabel: ingredient.unitLabel,
      mostRecentEntry,
    });
  });

  return statuses.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName, "it", { sensitivity: "base" }));
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
