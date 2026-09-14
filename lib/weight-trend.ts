import { WeightEntry } from "./types";

export interface WeightTrendPoint {
  date: string;
  raw: number;
  /** Media mobile centrata sulla finestra adattiva — `null` se non ci sono ancora abbastanza
   * pesate vicine per calcolarla in modo sensato (i primissimi punti di uno storico corto). */
  smoothed: number | null;
}

/**
 * Finestra della media mobile in GIORNI, non in numero di pesate — così si adatta da sola
 * a quanto spesso ti pesi davvero, invece di uno stesso "ultime N pesate" che coprirebbe
 * 3 giorni per chi si pesa ogni giorno e un mese per chi si pesa una volta a settimana.
 * La finestra è un multiplo dell'intervallo medio tra due pesate consecutive, con un minimo
 * e un massimo per restare comunque sensata agli estremi (pesate sporadiche o giornaliere).
 */
function adaptiveWindowDays(sorted: WeightEntry[]): number {
  if (sorted.length < 2) return 7;
  const first = new Date(sorted[0].date).getTime();
  const last = new Date(sorted[sorted.length - 1].date).getTime();
  const spanDays = (last - first) / 86400000;
  const avgGapDays = spanDays / (sorted.length - 1);
  // ~3 intervalli medi di copertura: abbastanza da smussare il rumore di una singola
  // pesata "fuori norma" senza appiattire una tendenza reale che dura settimane.
  const window = avgGapDays * 3;
  return Math.min(21, Math.max(3, window));
}

function average(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/**
 * Serie di pesate con una media mobile adattiva sovrapposta, calcolata sull'intero storico
 * disponibile (non solo sugli ultimi 20 punti mostrati) così anche il primo punto visibile
 * ha un contesto reale alle spalle da cui derivare la propria media.
 */
export function weightTrend(entries: WeightEntry[], visibleCount: number): WeightTrendPoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return [];

  const windowDays = adaptiveWindowDays(sorted);
  const halfWindowMs = ((windowDays / 2) * 86400000);

  const withSmoothed: WeightTrendPoint[] = sorted.map((entry, i) => {
    const t = new Date(entry.date).getTime();
    const nearby = sorted.filter((e) => Math.abs(new Date(e.date).getTime() - t) <= halfWindowMs);
    // Sotto le 2 pesate vicine la "media" coinciderebbe col dato grezzo: meglio non
    // disegnarla affatto che disegnare una linea identica ai punti, che non aggiungerebbe
    // nulla e confonderebbe con un secondo tracciato inutile.
    const smoothed = nearby.length >= 2 ? average(nearby.map((e) => e.value)) : null;
    return { date: entry.date, raw: entry.value, smoothed };
  });

  return withSmoothed.slice(-visibleCount);
}

export interface WeightTendencyDelta {
  /** Differenza tra la media recente e quella del periodo precedente, sulla stessa
   * finestra adattiva — non "ultima pesata meno penultima", che può ballare per una
   * singola pesata presa dopo un pasto o al mattino presto. `null` se lo storico è troppo
   * corto per avere due finestre distinte da confrontare. */
  delta: number | null;
}

export function weightTendencyDelta(entries: WeightEntry[]): WeightTendencyDelta {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return { delta: null };

  const windowDays = adaptiveWindowDays(sorted);
  const windowMs = windowDays * 86400000;
  const lastT = new Date(sorted[sorted.length - 1].date).getTime();

  const recentWindow = sorted.filter((e) => lastT - new Date(e.date).getTime() <= windowMs);
  const previousWindow = sorted.filter((e) => {
    const dt = lastT - new Date(e.date).getTime();
    return dt > windowMs && dt <= windowMs * 2;
  });

  if (recentWindow.length === 0 || previousWindow.length === 0) return { delta: null };

  return { delta: average(recentWindow.map((e) => e.value)) - average(previousWindow.map((e) => e.value)) };
}
