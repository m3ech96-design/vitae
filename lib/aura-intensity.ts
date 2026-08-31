import { Person, Task, Place } from "./types";
import { lastContactDate, daysBetween } from "./rapport-nudge";

/** Sotto questa soglia l'alone resta a piena intensità — un legame recente non deve
 * affievolirsi solo perché sono passati un paio di settimane. */
const FULL_DAYS = 14;
/** Da qui in poi l'alone è al minimo — non sparisce mai del tutto (resta comunque una
 * persona, non un fantasma), solo molto più fioco e molto più lento a respirare. */
const FADE_DAYS = 120;
const MIN_INTENSITY = 0.28;
/** Chi non hai ancora mai sentito parte da un'intensità intermedia, non piena e non al
 * minimo — potrebbe essere qualcuno appena aggiunto, non ha ancora senso spegnerlo del tutto. */
const NEVER_CONTACTED_INTENSITY = 0.55;

/**
 * Quanto è "vivo" l'alone di una persona — 1 = pieno colore e respiro normale, scendendo
 * fino a MIN_INTENSITY mano a mano che passa il tempo dall'ultimo contatto reale (task o
 * visita insieme, o un'interazione registrata in Rapporti). Chi frequenti ogni giorno resta
 * sempre acceso; chi hai dimenticato si vede prima ancora di leggere un nome.
 */
export function auraIntensity(person: Person, tasks: Task[], places: Place[], now: Date = new Date()): number {
  const last = lastContactDate(person, tasks, places);
  if (!last) return NEVER_CONTACTED_INTENSITY;

  const days = daysBetween(new Date(last), now);
  if (days <= FULL_DAYS) return 1;
  if (days >= FADE_DAYS) return MIN_INTENSITY;

  const t = (days - FULL_DAYS) / (FADE_DAYS - FULL_DAYS);
  return 1 - t * (1 - MIN_INTENSITY);
}
