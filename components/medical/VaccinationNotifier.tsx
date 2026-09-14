"use client";
import { useRef } from "react";
import { useMedical } from "@/lib/medical-context";
import { useNotificationPolling } from "@/lib/use-notification-polling";
import { isVaccinationReminderDue } from "@/lib/vaccination-reminder";

/**
 * Le vaccinazioni umane avevano lo stesso `nextDueDate` di quelle animali (vedi
 * AnimalNotifier.tsx) ma, a differenza loro, non erano mai state collegate a nessun
 * notificatore — un richiamo scaduto restava visibile solo aprendo la scheda Salute per
 * caso. Stesso scheletro esterno degli altri *Notifier (guardia permesso + polling al
 * minuto, vedi lib/use-notification-polling.ts) e stessa strategia di dedup a Set effimero
 * di MedicationNotifier/AnimalNotifier: qui serve "un promemoria al giorno finché non
 * aggiornata", non un evento singolo con flag persistito come in TaskNotifier.
 */
export function VaccinationNotifier() {
  const { vaccinations } = useMedical();
  const remindedRef = useRef<Set<string>>(new Set());

  useNotificationPolling(() => {
    const today = new Date().toISOString().slice(0, 10);

    vaccinations
      .filter((v) => v.nextDueDate && isVaccinationReminderDue(v.nextDueDate, v.reminderDaysBefore, today))
      .forEach((v) => {
        const key = `vaccino-${v.id}-${today}`;
        if (remindedRef.current.has(key)) return;
        remindedRef.current.add(key);
        const isToday = v.nextDueDate === today;
        const isOverdue = v.nextDueDate! < today;
        const body = isOverdue ? `${v.name} · scaduto` : isToday ? v.name : `${v.name} · tra pochi giorni`;
        new Notification("Richiamo vaccino", { body });
      });
  });

  return null;
}
