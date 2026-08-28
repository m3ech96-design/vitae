import { Person, Task, Place } from "./types";
import { lastOutingDate } from "./frequency";

export interface ColdRelationship {
  person: Person;
  /** Giorni dall'ultimo contatto, `null` se non c'è ancora mai stato un contatto registrato. */
  daysSince: number | null;
}

/** Non proporre chi hai aggiunto da meno di così — appena creato, è normale non avere
 * ancora interagito. */
const MIN_ACCOUNT_AGE_DAYS = 3;
/** Non proporre chi hai sentito da meno di così — evita di tartassare per legami già freschi. */
const MIN_GAP_DAYS = 14;

export function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

/** L'ultima volta che hai interagito con questa persona: la più recente tra un'interazione
 * registrata in Rapporti e un'uscita (task o visita) fatta insieme. */
export function lastContactDate(person: Person, tasks: Task[], places: Place[]): string | null {
  const lastEvent =
    person.relationshipHistory.length > 0
      ? [...person.relationshipHistory].sort((a, b) => b.date.localeCompare(a.date))[0].date
      : null;
  const lastOuting = lastOutingDate(person.id, tasks, places);
  if (!lastEvent) return lastOuting;
  if (!lastOuting) return lastEvent;
  return lastEvent > lastOuting ? lastEvent : lastOuting;
}

/**
 * Chi frequenti meno tra le Persone e gli Animali che conosci da un po': quello con il
 * distacco più lungo dall'ultimo contatto (o mai sentito), sopra una soglia minima — così
 * non si propone sempre la stessa persona appena aggiunta o vista ieri.
 */
export function personNeedingAttention(
  people: Person[],
  tasks: Task[],
  places: Place[],
  now: Date = new Date()
): ColdRelationship | null {
  const candidates = people
    .filter((p) => daysBetween(new Date(p.createdAt), now) >= MIN_ACCOUNT_AGE_DAYS)
    .map((p) => {
      const last = lastContactDate(p, tasks, places);
      const daysSince = last ? daysBetween(new Date(last), now) : null;
      return { person: p, daysSince };
    })
    .filter((c) => c.daysSince === null || c.daysSince >= MIN_GAP_DAYS);

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (a.daysSince === null && b.daysSince === null) return 0;
    if (a.daysSince === null) return -1;
    if (b.daysSince === null) return 1;
    return b.daysSince - a.daysSince;
  });

  return candidates[0];
}
