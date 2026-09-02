import {
  MetricBlock,
  MetricEntry,
  InventoryBlock,
  ProjectsBlock,
  Project,
  MatchesBlock,
  Match,
} from "./hobby-types";
import { addDaysIso, todayIso } from "./date-format";

// ---------------------------------------------------------------------------
// Metrica
// ---------------------------------------------------------------------------

/** Il valore "attuale" da mostrare in testa al blocco: per una metrica cumulativa è la
 * somma di tutte le voci (km totali percorsi), per una puntuale è l'ultimo valore
 * registrato in ordine di data (peso sollevato oggi, non la somma di tutti i pesi mai
 * sollevati — sommarli non vorrebbe dire niente). */
export function metricCurrentValue(block: MetricBlock): number {
  if (block.entries.length === 0) return 0;
  if (block.aggregation === "cumulativa") return block.entries.reduce((s, e) => s + e.value, 0);
  const sorted = [...block.entries].sort((a, b) => a.date.localeCompare(b.date));
  return sorted[sorted.length - 1].value;
}

/** Il record personale rispetto alla direzione dichiarata: il valore più alto se la
 * metrica vuole salire, il più basso se vuole scendere (un tempo sul giro migliora
 * scendendo, non salendo). */
export function metricPersonalRecord(block: MetricBlock): MetricEntry | null {
  if (block.entries.length === 0) return null;
  return block.entries.reduce((best, e) => {
    if (!best) return e;
    if (block.direction === "crescente") return e.value > best.value ? e : best;
    return e.value < best.value ? e : best;
  }, null as MetricEntry | null);
}

/** Confronto tra la finestra di `days` giorni più recente e quella immediatamente
 * precedente — stessa idea già usata in Attività e Peso, qui generalizzata a qualunque
 * metrica invece che solo ad allenamenti. */
export function metricPeriodComparison(block: MetricBlock, days = 7): { current: number; previous: number; deltaPct: number | null } {
  const today = todayIso();
  const currentStart = addDaysIso(today, -(days - 1));
  const previousStart = addDaysIso(today, -(days * 2 - 1));
  const previousEnd = addDaysIso(today, -days);

  const sum = (from: string, to: string) =>
    block.entries.filter((e) => e.date >= from && e.date <= to).reduce((s, e) => s + e.value, 0);

  const current = sum(currentStart, today);
  const previous = sum(previousStart, previousEnd);
  const deltaPct = previous > 0 ? ((current - previous) / previous) * 100 : null;
  return { current, previous, deltaPct };
}

/** Un quadratino per giorno delle ultime `days` giornate, come i contributi di GitHub —
 * generalizzato su un semplice elenco di date invece che sui Workout di Salute
 * (`lib/activity-stats.ts`), stessa idea, dato diverso. */
export function datesHeatmap(dates: string[], days = 119): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  dates.forEach((d) => counts.set(d, (counts.get(d) ?? 0) + 1));
  const today = todayIso();
  const cells: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDaysIso(today, -i);
    cells.push({ date, count: counts.get(date) ?? 0 });
  }
  return cells;
}

export function currentStreak(dates: string[]): number {
  const set = new Set(dates);
  let streak = 0;
  let cursor = todayIso();
  while (set.has(cursor)) {
    streak++;
    cursor = addDaysIso(cursor, -1);
  }
  return streak;
}

/** La striscia consecutiva più lunga MAI avuta, non solo quella corrente — scorre tutte le
 * date ordinate cercando la sequenza di giorni di fila più lunga in assoluto nella storia,
 * non solo quella che arriva fino a oggi. */
export function longestStreakEver(dates: string[]): number {
  const unique = Array.from(new Set(dates)).sort();
  if (unique.length === 0) return 0;
  let longest = 1;
  let running = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    if (diffDays === 1) {
      running++;
      longest = Math.max(longest, running);
    } else {
      running = 1;
    }
  }
  return longest;
}

// ---------------------------------------------------------------------------
// Inventario
// ---------------------------------------------------------------------------

/** Valore totale della collezione: stima attuale se c'è, altrimenti il prezzo pagato —
 * mai contare un pezzo a zero solo perché non hai ancora stimato quanto vale oggi. */
export function inventoryTotalValue(block: InventoryBlock): number {
  return block.items.reduce((s, i) => s + (i.estimatedValue ?? i.pricePaid ?? 0) * i.quantity, 0);
}

export function inventoryTotalPaid(block: InventoryBlock): number {
  return block.items.reduce((s, i) => s + (i.pricePaid ?? 0) * i.quantity, 0);
}

export function inventoryGainLoss(block: InventoryBlock): number {
  return inventoryTotalValue(block) - inventoryTotalPaid(block);
}

// ---------------------------------------------------------------------------
// Progetti
// ---------------------------------------------------------------------------

export function projectTotalCost(project: Project): number {
  return project.materials.reduce((s, m) => s + m.cost, 0);
}

export function projectsTotalCost(block: ProjectsBlock): number {
  return block.projects.reduce((s, p) => s + projectTotalCost(p), 0);
}

// ---------------------------------------------------------------------------
// Partite
// ---------------------------------------------------------------------------

export interface MatchRecord {
  wins: number;
  losses: number;
  draws: number;
  winRatePct: number;
  currentStreak: { result: Match["result"]; count: number } | null;
  longestWinStreak: number;
}

export function matchRecord(block: MatchesBlock): MatchRecord {
  const sorted = [...block.matches].sort((a, b) => a.date.localeCompare(b.date));
  const wins = sorted.filter((m) => m.result === "vittoria").length;
  const losses = sorted.filter((m) => m.result === "sconfitta").length;
  const draws = sorted.filter((m) => m.result === "pareggio").length;
  const total = sorted.length;
  const winRatePct = total > 0 ? (wins / total) * 100 : 0;

  let currentStreakResult: Match["result"] | null = null;
  let currentStreakCount = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (currentStreakResult === null) {
      currentStreakResult = sorted[i].result;
      currentStreakCount = 1;
    } else if (sorted[i].result === currentStreakResult) {
      currentStreakCount++;
    } else break;
  }

  let longestWinStreak = 0;
  let running = 0;
  for (const m of sorted) {
    if (m.result === "vittoria") {
      running++;
      longestWinStreak = Math.max(longestWinStreak, running);
    } else running = 0;
  }

  return {
    wins,
    losses,
    draws,
    winRatePct,
    currentStreak: currentStreakResult ? { result: currentStreakResult, count: currentStreakCount } : null,
    longestWinStreak,
  };
}
