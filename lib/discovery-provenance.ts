import { Task, Place, taskGroup } from "./types";

function toDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

/** Una task Evento/Appuntamento, non completata, il cui intervallo orario contiene "ora",
 * che coinvolge questa persona — l'unico modo affidabile di sapere "sto facendo qualcosa
 * con lei proprio adesso", visto che gli accompagnatori di una Visita si scoprono solo
 * all'uscita (vedi checkOut in places-context.tsx), non all'ingresso. */
function activeTaskWith(personId: string, tasks: Task[], now: Date): Task | null {
  for (const t of tasks) {
    if (t.completed || taskGroup(t.type) !== "tempo" || !t.time) continue;
    if (!t.linkedPersonIds.includes(personId)) continue;
    const start = toDateTime(t.date, t.time);
    let end: Date;
    if (t.endTime) {
      const [h, m] = t.endTime.split(":").map(Number);
      end = new Date(start);
      end.setHours(h, m, 0, 0);
      if (end < start) end.setDate(end.getDate() + 1);
    } else {
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }
    if (now >= start && now <= end) return t;
  }
  return null;
}

/**
 * Dove/durante cosa stai scoprendo qualcosa su questa persona, adesso — se lo sai. Preferisce
 * una Task Evento/Appuntamento in corso che la coinvolge (segnale specifico: conferma che è
 * proprio con lei), altrimenti ripiega sul Luogo in cui sei attualmente check-in (segnale più
 * debole — sei lì, ma non è detto sia con lei). Restituisce `null` se non c'è alcun contesto
 * plausibile, nel qual caso la scoperta resta semplice, senza provenienza.
 */
export function discoveryProvenance(
  personId: string,
  tasks: Task[],
  places: Place[],
  now: Date = new Date()
): string | null {
  const activeTask = activeTaskWith(personId, tasks, now);
  if (activeTask) {
    if (activeTask.linkedPlaceId) {
      const place = places.find((p) => p.id === activeTask.linkedPlaceId);
      if (place) return `A ${place.name}`;
    }
    return `Durante ${activeTask.title}`;
  }

  const checkedIn = places.find((p) => p.currentVisitStartedAt);
  if (checkedIn) return `A ${checkedIn.name}`;

  return null;
}
