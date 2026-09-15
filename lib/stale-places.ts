import { Place } from "./types";

/** Un luogo con rating alto (≥80, cioè "Adoro" — vedi lib/rating.ts) ma senza nessuna visita
 * negli ultimi `staleDays` giorni — un posto che piace molto ma che si è smesso di
 * frequentare, non un luogo qualunque poco visitato (un dentista con rating basso non ha
 * senso segnalarlo per "non vai qui da tempo": lì semplicemente non ci si vuole andare più
 * spesso). Esclusa la Casa (non è un luogo da "tornare a visitare") e i luoghi mai visitati
 * almeno una volta (non c'è un "da quanto non ci vai" senza una prima visita).
 *
 * Vive solo nella scheda Mappa, deliberatamente — un suggerimento analogo per le persone
 * (vedi checkpoint 87 nello storico del progetto) era stato eliminato del tutto perché
 * intrusivo nella vita quotidiana dell'utente; per i luoghi la stessa idea resta, ma confinata
 * a un puntino discreto sull'icona della scheda Mappa (lo stesso linguaggio visivo già usato
 * altrove nell'app per una notifica non invasiva),
 * mai un banner in Home o altrove: si vede solo aprendo la Mappa, non si impone.
 */
const STALE_DAYS = 30;
const HIGH_RATING_THRESHOLD = 80;

export interface StalePlace {
  place: Place;
  daysSinceLastVisit: number;
}

export function stalePlaces(places: Place[], today: Date = new Date()): StalePlace[] {
  const todayMs = today.getTime();
  return places
    .filter((p) => !p.isPrimaryHome && p.rating !== null && p.rating >= HIGH_RATING_THRESHOLD && p.visitsHistory.length > 0)
    .map((p) => {
      const lastVisit = p.visitsHistory.reduce((latest, v) => (v.date > latest ? v.date : latest), p.visitsHistory[0].date);
      const daysSinceLastVisit = Math.floor((todayMs - new Date(lastVisit).getTime()) / 86400000);
      return { place: p, daysSinceLastVisit };
    })
    .filter((x) => x.daysSinceLastVisit >= STALE_DAYS)
    .sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);
}
