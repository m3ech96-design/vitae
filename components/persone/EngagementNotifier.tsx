"use client";
import { useEffect } from "react";
import { useHousehold } from "@/lib/household-context";
import { REMINDER_OFFSET_MINUTES } from "@/lib/types";

/**
 * Controlla periodicamente gli Impegni di ogni persona e invia una notifica del browser
 * al momento dell'avviso anticipato scelto. Funziona finché l'app resta aperta — come la
 * geolocalizzazione, è un limite della piattaforma, non nostro.
 */
export function EngagementNotifier() {
  const { people, updatePerson } = useHousehold();

  useEffect(() => {
    const check = () => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
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
            new Notification(`${person.firstName}: ${e.title}`, { body: "Sta Per Iniziare" });
            updatePerson(person.id, {
              engagements: person.engagements.map((x) => (x.id === e.id ? { ...x, reminded: true } : x)),
            });
          }
        });
      });
    };

    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, [people, updatePerson]);

  return null;
}
