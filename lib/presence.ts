import { Person, Engagement } from "./types";

function toDate(dateIso: string, time: string): Date {
  return new Date(`${dateIso}T${time}:00`);
}

/** L'impegno in corso ora, se esiste — ha sempre precedenza sulle Azioni. */
export function currentEngagement(person: Person, now: Date = new Date()): Engagement | null {
  for (const e of person.engagements) {
    if (!e.time || e.completed) continue;
    const start = toDate(e.date, e.time);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    if (now >= start && now <= end) return e;
  }
  return null;
}

export function upcomingEngagements(person: Person, now: Date = new Date()): Engagement[] {
  return [...person.engagements]
    .filter((e) => !e.time || toDate(e.date, e.time) >= now || currentEngagement(person, now)?.id === e.id)
    .sort((a, b) => `${a.date}T${a.time || "23:59"}`.localeCompare(`${b.date}T${b.time || "23:59"}`));
}
