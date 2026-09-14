import { SavingsGoal, SavingsGoalContribution } from "./types";

export interface GoalProjection {
  /** Quanto manca per raggiungere l'obiettivo — mai negativo, 0 se già raggiunto. */
  remaining: number;
  /** Ritmo netto medio di risparmio per questo obiettivo, in valuta/giorno — può essere
   * negativo (se i prelievi superano i versamenti recenti) o zero (nessun movimento nella
   * finestra), non solo positivo. */
  dailyRate: number;
  /** Giorni stimati al ritmo attuale — `null` quando la stima non ha senso: obiettivo già
   * raggiunto (`remaining` 0), ritmo nullo o negativo (a questo ritmo non ci si arriva
   * MAI, non "tra un numero enorme di giorni" che sembrerebbe comunque una promessa). */
  estimatedDays: number | null;
  /** Quanti versamenti/prelievi distinti rientrano nella finestra usata per il calcolo —
   * sotto una soglia minima la stima non è ancora abbastanza fondata da mostrare (vedi
   * MIN_CONTRIBUTIONS_FOR_ESTIMATE), un singolo versamento isolato non è un "ritmo". */
  observedContributions: number;
}

/** Giorni di storico su cui calcolare il ritmo — abbastanza ampia da assorbire un mese con
 * un solo grande versamento e uno con niente, abbastanza stretta da non farsi dominare da
 * un'abitudine di risparmio ormai abbandonata da tempo. */
const RATE_WINDOW_DAYS = 60;
/** Sotto questa soglia di versamenti osservati nella finestra, la stima non si mostra: un
 * singolo contributo non è ancora un "ritmo", è solo un punto. */
const MIN_CONTRIBUTIONS_FOR_ESTIMATE = 2;

export function goalProjection(goal: SavingsGoal, contributions: SavingsGoalContribution[], now: Date = new Date()): GoalProjection {
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  const windowStart = now.getTime() - RATE_WINDOW_DAYS * 86400000;
  const recent = contributions.filter((c) => c.goalId === goal.id && new Date(c.date).getTime() >= windowStart);

  if (remaining === 0 || recent.length < MIN_CONTRIBUTIONS_FOR_ESTIMATE) {
    return { remaining, dailyRate: 0, estimatedDays: null, observedContributions: recent.length };
  }

  // Il ritmo copre dal PRIMO contributo osservato nella finestra a ora, non l'intera
  // finestra fissa — un obiettivo creato 10 giorni fa non deve vedere il proprio ritmo
  // diluito su 60 giorni di cui 50 semplicemente non esistevano ancora per lui.
  const oldestInWindow = Math.min(...recent.map((c) => new Date(c.date).getTime()));
  const spanDays = Math.max(1, (now.getTime() - oldestInWindow) / 86400000);
  const netAmount = recent.reduce((sum, c) => sum + c.amount, 0);
  const dailyRate = netAmount / spanDays;

  const estimatedDays = dailyRate > 0 ? Math.ceil(remaining / dailyRate) : null;

  return { remaining, dailyRate, estimatedDays, observedContributions: recent.length };
}
