/** Se una vaccinazione non ha ancora un preavviso impostato esplicitamente, quanti giorni
 * prima avvisare comunque — una settimana è un margine ragionevole per prenotare un
 * richiamo senza essere così ampio da sembrare un avviso prematuro e ignorabile. */
export const DEFAULT_VACCINATION_REMINDER_DAYS = 7;

/**
 * Vero da `reminderDaysBefore` giorni prima di `nextDueDate` fino al giorno stesso incluso
 * (mai dopo: una volta passata la data, il "richiamo in scadenza" perde senso come tale —
 * resta comunque visibile come scaduto nella scheda, solo non ripete più la notifica ogni
 * giorno all'infinito). Usa il default condiviso quando la vaccinazione non ha ancora un
 * proprio valore impostato, così le vaccinazioni create prima di questo campo si comportano
 * comunque in modo sensato invece di non avvisare mai in anticipo.
 */
export function isVaccinationReminderDue(nextDueDate: string, reminderDaysBefore: number | undefined, today: string): boolean {
  const days = reminderDaysBefore ?? DEFAULT_VACCINATION_REMINDER_DAYS;
  const due = new Date(nextDueDate);
  const reminderStart = new Date(due);
  reminderStart.setDate(reminderStart.getDate() - days);
  const reminderStartIso = reminderStart.toISOString().slice(0, 10);
  return today >= reminderStartIso && today <= nextDueDate;
}
