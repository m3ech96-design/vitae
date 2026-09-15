"use client";
import { useRef } from "react";
import { useFood } from "@/lib/food-context";
import { pantryEntryStatuses } from "@/lib/pantry";
import { todayIso } from "@/lib/date-format";
import { useNotificationPolling } from "@/lib/use-notification-polling";

/**
 * Stesso scheletro esterno degli altri *Notifier (guardia permesso + polling al minuto,
 * vedi lib/use-notification-polling.ts) e stessa strategia di dedup a Set effimero di
 * MedicationNotifier/AnimalNotifier: "un promemoria al giorno finché non consumato o
 * rimosso", non un evento singolo. Avvisa solo quando un acquisto ENTRA nello stato
 * "in-scadenza" o "scaduto" (vedi lib/pantry.ts) — non ripete la notifica ogni singolo
 * minuto della giornata, un controllo al giorno è più che sufficiente per una scadenza che
 * si muove in giorni, non in minuti.
 */
export function PantryNotifier() {
  const { pantryEntries, ingredients } = useFood();
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
  });

  return null;
}
