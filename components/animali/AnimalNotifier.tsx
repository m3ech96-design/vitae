"use client";
import { useEffect, useRef } from "react";
import { useHousehold } from "@/lib/household-context";
import { useAnimalHealth } from "@/lib/animal-health-context";
import { ANIMAL_KINDS } from "@/lib/types";

/**
 * Notifica pappa/vaccinazioni/farmaci/appuntamenti per OGNI animale, a prescindere da dove
 * (o se) compare sullo schermo in quel momento — il bug reale da evitare era che tutto
 * questo dipendesse dal riquadro Casa: un animale con `kind` cane/gatto esiste sempre in
 * `people` a prescindere dal suo stato calcolato (casa/fuori casa/nel mondo — vedi
 * `personWorldStatus`), quindi qui si legge direttamente da lì, mai dalle liste già filtrate
 * per il riquadro Casa/Fuori Casa della Home. Montato una sola volta nel layout radice,
 * esattamente come TaskNotifier e MedicationNotifier — funziona su qualunque schermata.
 *
 * Stesso limite onesto di quei due file, mai nascosto: un controllo ogni minuto mentre
 * l'app è aperta, non una vera notifica push che arriva ad app chiusa (richiederebbe un
 * service worker con abbonamento push e un server dietro a inviarla, che questa app non ha).
 */
export function AnimalNotifier() {
  const { people } = useHousehold();
  const { vaccinations, medications, appointments } = useAnimalHealth();
  const remindedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const animals = people.filter((p) => ANIMAL_KINDS.includes(p.kind));
    if (animals.length === 0) return;

    const check = () => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const today = now.toISOString().slice(0, 10);

      animals.forEach((animal) => {
        const name = animal.firstName || "Il tuo animale";

        // --- Pappa: stesso calcolo di lib/feeding.ts (isHungry), ma per singolo orario —
        // serve sapere QUALE orario è scattato per non notificare due volte lo stesso pasto.
        const lastMealToday = [...animal.feedingLog]
          .filter((f) => f.date.slice(0, 10) === today)
          .sort((a, b) => a.date.localeCompare(b.date))
          .pop();
        const lastMealMinutes = lastMealToday
          ? new Date(lastMealToday.date).getHours() * 60 + new Date(lastMealToday.date).getMinutes()
          : -1;
        animal.feedingTimes.forEach((f) => {
          const [h, m] = f.time.split(":").map(Number);
          const feedMinutes = h * 60 + m;
          const isDue = feedMinutes <= nowMinutes && feedMinutes > lastMealMinutes;
          if (!isDue) return;
          const key = `pappa-${animal.id}-${f.time}-${today}`;
          if (remindedRef.current.has(key)) return;
          remindedRef.current.add(key);
          new Notification(`È ora della pappa di ${name}`, { body: `Orario delle ${f.time}` });
        });

        // --- Vaccinazioni in scadenza o già scadute — un promemoria al giorno, non uno al
        // minuto, ma continua a ripresentarsi finché non viene aggiornata.
        vaccinations
          .filter((v) => v.animalId === animal.id && v.nextDueDate && v.nextDueDate <= today)
          .forEach((v) => {
            const key = `vaccino-${v.id}-${today}`;
            if (remindedRef.current.has(key)) return;
            remindedRef.current.add(key);
            new Notification(`Richiamo vaccino per ${name}`, { body: v.name });
          });

        // --- Farmaci: stesso identico meccanismo di MedicationNotifier, per animale.
        medications
          .filter((m) => m.animalId === animal.id && (!m.endDate || m.endDate >= today))
          .forEach((m) => {
            m.times.forEach((t) => {
              if (t !== hhmm) return;
              const key = `farmaco-${m.id}-${t}-${today}`;
              if (remindedRef.current.has(key)) return;
              remindedRef.current.add(key);
              new Notification(`È ora del farmaco di ${name}`, { body: `${m.name}${m.dosage ? " · " + m.dosage : ""}` });
            });
          });

        // --- Appuntamenti dal veterinario di oggi, non ancora segnati come fatti.
        appointments
          .filter((a) => a.animalId === animal.id && a.date.slice(0, 10) === today && !a.completed)
          .forEach((a) => {
            const key = `appuntamento-${a.id}-${today}`;
            if (remindedRef.current.has(key)) return;
            remindedRef.current.add(key);
            new Notification(`Appuntamento oggi per ${name}`, { body: a.title });
          });
      });
    };

    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, [people, vaccinations, medications, appointments]);

  return null;
}
