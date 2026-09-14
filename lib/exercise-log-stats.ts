import { ExerciseLogEntry } from "./types";

/**
 * Stima del massimale (1RM) con la formula di Epley — standard usato per confrontare
 * sessioni con peso e ripetizioni diversi tra loro: "80kg × 5" e "70kg × 10" da soli non
 * si possono confrontare direttamente, ma le loro stime di massimale sì. Sopra le ~12
 * ripetizioni la stima perde attendibilità (la formula è pensata per sforzi vicini al
 * massimale, non per serie ad alte reps), quindi oltre quella soglia non la calcoliamo.
 */
export function estimatedOneRepMax(entry: ExerciseLogEntry): number | null {
  if (entry.reps > 12) return null;
  if (entry.reps === 1) return entry.weightKg;
  return entry.weightKg * (1 + entry.reps / 30);
}

export interface ExerciseLogStats {
  totalSessions: number;
  bestWeight: { weightKg: number; reps: number; date: string } | null;
  bestEstimatedOneRepMax: { value: number; date: string } | null;
  /** Volume di una singola sessione (peso × reps × serie) più alto mai registrato — un
   * indicatore di "lavoro totale" diverso dal massimale: puoi migliorare l'uno senza
   * migliorare l'altro (più serie a peso minore, o un singolo carico più alto ma con meno
   * volume complessivo), quindi vale la pena mostrarli entrambi invece di sceglierne uno. */
  bestSessionVolume: { volume: number; date: string } | null;
  lastEntry: ExerciseLogEntry | null;
}

export function exerciseLogStats(log: ExerciseLogEntry[]): ExerciseLogStats {
  if (log.length === 0) {
    return { totalSessions: 0, bestWeight: null, bestEstimatedOneRepMax: null, bestSessionVolume: null, lastEntry: null };
  }

  const sorted = [...log].sort((a, b) => a.date.localeCompare(b.date));

  const bestWeightEntry = [...log].reduce((a, b) => (b.weightKg > a.weightKg ? b : a));

  let bestOneRepMax: { value: number; date: string } | null = null;
  log.forEach((e) => {
    const est = estimatedOneRepMax(e);
    if (est === null) return;
    if (!bestOneRepMax || est > bestOneRepMax.value) bestOneRepMax = { value: est, date: e.date };
  });

  const bestVolumeEntry = log.reduce<{ volume: number; date: string } | null>((best, e) => {
    const volume = e.weightKg * e.reps * e.sets;
    if (!best || volume > best.volume) return { volume, date: e.date };
    return best;
  }, null);

  return {
    totalSessions: log.length,
    bestWeight: { weightKg: bestWeightEntry.weightKg, reps: bestWeightEntry.reps, date: bestWeightEntry.date },
    bestEstimatedOneRepMax: bestOneRepMax,
    bestSessionVolume: bestVolumeEntry,
    lastEntry: sorted[sorted.length - 1],
  };
}
