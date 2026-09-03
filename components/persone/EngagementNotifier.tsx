"use client";
import { useHousehold } from "@/lib/household-context";
import { REMINDER_OFFSET_MINUTES } from "@/lib/types";
import { useNotificationPolling } from "@/lib/use-notification-polling";

/**
 * Controlla periodicamente gli Impegni di ogni persona e invia una notifica del browser
 * al momento dell'avviso anticipato scelto. Funziona finché l'app resta aperta — come la
 * geolocalizzazione, è un limite della piattaforma, non nostro.
 */
export function EngagementNotifier() {
  const { people, updatePerson } = useHousehold();

  useNotificationPolling(() => {
    const now = new Date();
    people.forEach((person) => {
      person.engagements.forEach((e) => {
        if (!e.time || e.reminded || e.reminderOffset === "none") return;
        const minutes = REMINDER_OFFSET_MINUTES[e.reminderOffset];
        if (!minutes) return;
        const start = new Date(`${e.date}T${e.time}:00`);
        const remindAt = new Date(start.getTime() - minutes * 60000);
        const diff = (now.getTime() - remindAt.getTime()) / 60000;

        if (diff >= 0 && diff < 2) {
          new Notification(`${person.firstName}: ${e.title}`, { body: "Sta per iniziare" });
          updatePerson(person.id, {
            engagements: person.engagements.map((x) => (x.id === e.id ? { ...x, reminded: true } : x)),
          });
        }
      });
    });
  });

  return null;
}
