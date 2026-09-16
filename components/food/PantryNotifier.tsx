"use client";
import { useRef } from "react";
import { useFood } from "@/lib/food-context";
import { pantryEntryStatuses, ingredientStockStatuses, isIngredientLowStock } from "@/lib/pantry";
import { todayIso } from "@/lib/date-format";
import { useNotificationPolling } from "@/lib/use-notification-polling";

/**
 * Stesso scheletro esterno degli altri *Notifier (guardia permesso + polling al minuto,
 * vedi lib/use-notification-polling.ts). Copre due segnali distinti della dispensa, con due
 * strategie di dedup diverse per un motivo reale, non per disattenzione:
 *
 * - Scadenza: dedup a Set effimero in memoria ("un promemoria al giorno finché non
 *   consumato o rimosso") — un acquisto è un record singolo, rinotificare ogni giorno finché
 *   resta scaduto in dispensa è il comportamento voluto (non lo vuoi dimenticare lì).
 * - Scorta bassa: dedup a flag persistito (`lowStockAlerted` sull'entry più recente di
 *   quell'ingrediente, vedi PantryEntry in lib/food-types.ts) — stesso principio già in uso
 *   per il cibo animali (FoodProduct.lowStockAlerted in lib/animal-food-context.tsx): un
 *   ingrediente sotto soglia notifica UNA volta, non ogni giorno, e il flag si resetta da
 *   solo quando la scorta torna sopra soglia (nuovo acquisto, correzione manuale, o un
 *   pasto eliminato che ripristina quantità) — letto qui a ogni giro invece che scritto una
 *   volta sola, perché a differenza degli animali (un unico "prodotto" da riattivare con un
 *   tap su "Riacquistato") qui non c'è un'azione utente esplicita di reset: la dispensa deve
 *   accorgersi da sola che la scorta è tornata su.
 */
export function PantryNotifier() {
  const { pantryEntries, ingredients, setPantryLowStockAlerted } = useFood();
  const remindedRef = useRef<Set<string>>(new Set());

  useNotificationPolling(() => {
    const today = todayIso();
    const statuses = pantryEntryStatuses(pantryEntries, ingredients, today);

    statuses
      .filter((s) => s.status === "in-scadenza" || s.status === "scaduto")
      .forEach((s) => {
        const key = `dispensa-${s.entry.id}-${today}`;
        if (remindedRef.current.has(key)) return;
        remindedRef.current.add(key);
        const body = s.status === "scaduto" ? `${s.ingredientName} · probabilmente scaduto` : `${s.ingredientName} · in scadenza a breve`;
        new Notification("Dispensa", { body });
      });

    // --- Scorta in esaurimento — solo per ingredienti con tracking quantità attivo (vedi
    // ingredientStockStatuses): un ingrediente i cui acquisti non tracciano mai quanto ne
    // resta non può avere una "scorta bassa" onesta da segnalare.
    const stockStatuses = ingredientStockStatuses(pantryEntries, ingredients);
    stockStatuses.forEach((s) => {
      const low = isIngredientLowStock(s);
      if (low && !s.mostRecentEntry.lowStockAlerted) {
        new Notification(`"${s.ingredientName}" sta per finire`, { body: "Scorta in esaurimento" });
        setPantryLowStockAlerted(s.mostRecentEntry.id, true);
      } else if (!low && s.mostRecentEntry.lowStockAlerted) {
        // La scorta è tornata sopra soglia (nuovo acquisto, correzione manuale, pasto
        // eliminato) — si riapre la possibilità di riavvisare in futuro, senza notificare
        // nulla ora: tornare "sopra soglia" non è un evento da notificare, solo un reset.
        setPantryLowStockAlerted(s.mostRecentEntry.id, false);
      }
    });
  });

  return null;
}
