import { Task, Place } from "./types";

export interface FrequencyPoint {
  label: string;
  count: number;
}

/**
 * Un'uscita è una task collegata alla persona SENZA luogo (completarla non genera anche
 * una voce in `visitsHistory`), oppure una visita registrata a un Luogo con lei tra gli
 * accompagnatori — manuale, o generata in automatico da una task CON luogo (`logTaskVisit`
 * scrive lì). Contare anche le task con luogo qui le conterebbe due volte: la task e la
 * visita che genera sono lo stesso evento reale, non due uscite diverse.
 */
function outingDates(personId: string, tasks: Task[], places: Place[]): string[] {
  const dates: string[] = [];
  tasks.forEach((t) => {
    if (t.completed && t.completedAt && !t.linkedPlaceId && t.linkedPersonIds.includes(personId)) {
      dates.push(t.completedAt);
    }
  });
  places.forEach((p) => {
    p.visitsHistory.forEach((v) => {
      if (v.withPersonIds.includes(personId)) dates.push(v.date);
    });
  });
  return dates;
}

/** Quante volte l'utente ha frequentato questa persona, mese per mese: conta sia le task
 * completate che la coinvolgono sia le visite ai luoghi fatte insieme. */
export function outingsPerMonth(personId: string, tasks: Task[], places: Place[], months = 6): FrequencyPoint[] {
  const now = new Date();
  const buckets: { key: string; label: string; count: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("it-IT", { month: "short" }),
      count: 0,
    });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));

  outingDates(personId, tasks, places).forEach((iso) => {
    const d = new Date(iso);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = byKey.get(key);
    if (bucket) bucket.count += 1;
  });

  return buckets.map((b) => ({ label: b.label, count: b.count }));
}

/**
 * Totale delle uscite, sempre — non solo gli ultimi mesi. Sostituisce il vecchio contatore
 * `outingsCount` salvato sulla persona, che si aggiornava solo completando una Task e non
 * contava mai le visite ai Luoghi: un solo numero coerente, calcolato dal vivo dagli stessi
 * dati del grafico, non più due contatori che potevano disallinearsi tra loro.
 */
export function totalOutings(personId: string, tasks: Task[], places: Place[]): number {
  return outingDates(personId, tasks, places).length;
}

/** Data dell'ultima uscita con questa persona (task senza luogo o visita a un Luogo), o
 * `null` se non ce n'è mai stata una. */
export function lastOutingDate(personId: string, tasks: Task[], places: Place[]): string | null {
  const dates = outingDates(personId, tasks, places);
  if (dates.length === 0) return null;
  return dates.reduce((latest, d) => (d > latest ? d : latest), dates[0]);
}
