import { Task, taskGroup } from "./types";
import { taskOccursOnDate } from "./recurrence";
import { addDaysIso } from "./date-format";

export interface CompletionBreakdown {
  /** Aderenza alle attività quotidiane: giorni in cui erano previste (secondo la propria
   * ricorrenza, vedi taskOccursOnDate) diviso giorni in cui sono state davvero segnate
   * fatte — non "quante quotidiane esistono", ma "quanti giorni-previsti hai onorato". */
  dailyAdherence: number | null;
  /** Task con scadenza (Promemoria/Obiettivo/Spesa — vedi taskGroup) risolte in tempo
   * rispetto al totale di quelle la cui scadenza è già passata o è stata raggiunta nella
   * finestra: quelle ancora future non contano né a favore né contro, semplicemente non
   * hanno ancora avuto la loro occasione di essere onorate o mancate. */
  deadlineRate: number | null;
  /** Media delle due metriche disponibili, pesata per quante osservazioni ciascuna porta
   * (giorni-previsti per l'aderenza, task-scadute per le scadenze) — non una media
   * semplice 50/50: un utente con 20 giorni di quotidiane osservati e 2 sole scadenze
   * passate non deve vedere quelle 2 scadenze pesare quanto i 20 giorni. `null` quando
   * NESSUNA delle due metriche ha osservazioni sufficienti — non zero, che sembrerebbe un
   * fallimento invece di "ancora nessun dato". */
  overall: number | null;
}

/**
 * Eventi e Appuntamenti (taskGroup "tempo") sono esclusi da ogni metrica qui — non hanno
 * un concetto di "mancato": si completano da soli a fine orario (vedi shouldAutoComplete in
 * task-status.ts), quindi includerli distorcerebbe la percentuale con qualcosa che non è
 * mai stato davvero a rischio di fallire.
 */
export function completionBreakdown(tasks: Task[], windowDays: number = 30, now: Date = new Date()): CompletionBreakdown {
  const todayIso = now.toISOString().slice(0, 10);
  const windowStart = addDaysIso(todayIso, -(windowDays - 1));

  // --- Aderenza quotidiane: per ogni giorno della finestra, per ogni quotidiana prevista
  // quel giorno, conta se è stata segnata fatta. Un giorno prima della creazione della
  // task non è "previsto" nemmeno se la ricorrenza lo includerebbe in astratto — una
  // quotidiana creata ieri non può avere fallito i 29 giorni prima che esistesse.
  const dailies = tasks.filter((t) => taskGroup(t.type) === "quotidiana");
  let daysPrevisti = 0;
  let daysFatti = 0;
  for (let i = 0; i < windowDays; i++) {
    const iso = addDaysIso(windowStart, i);
    if (iso > todayIso) break; // non contare giorni futuri come "mancati in anticipo"
    dailies.forEach((t) => {
      if (iso < t.date) return;
      if (!taskOccursOnDate(t, iso)) return;
      daysPrevisti++;
      if (t.completionLog.some((d) => d.slice(0, 10) === iso)) daysFatti++;
    });
  }
  const dailyAdherence = daysPrevisti > 0 ? daysFatti / daysPrevisti : null;

  // --- Task con scadenza: quelle la cui scadenza (dueDate) cade dentro la finestra e non
  // è più futura — completate in tempo vs. non completate. Una task completata FUORI dalla
  // finestra temporale (es. una scadenza vecchia risolta tardi) conta comunque una volta
  // sola, ancorata alla propria dueDate, non alla data in cui è stata effettivamente
  // spuntata: altrimenti la stessa task rischierebbe di essere contata due volte in
  // finestre diverse o zero volte in nessuna.
  const deadlineTasks = tasks.filter(
    (t) => taskGroup(t.type) === "scadenza" && t.dueDate && t.dueDate >= windowStart && t.dueDate <= todayIso
  );
  const deadlineRate = deadlineTasks.length > 0 ? deadlineTasks.filter((t) => t.completed).length / deadlineTasks.length : null;

  let overall: number | null = null;
  if (dailyAdherence !== null && deadlineRate !== null) {
    const totalWeight = daysPrevisti + deadlineTasks.length;
    overall = (dailyAdherence * daysPrevisti + deadlineRate * deadlineTasks.length) / totalWeight;
  } else if (dailyAdherence !== null) {
    overall = dailyAdherence;
  } else if (deadlineRate !== null) {
    overall = deadlineRate;
  }

  return { dailyAdherence, deadlineRate, overall };
}
