import { Task, taskGroup, Weekday } from "./types";

/** Crea una task di qualunque tipo, eccetto "Attività Quotidiana", genera l'evento nel
 * calendario predefinito del sistema — rispettando data, orario di inizio e orario di fine.
 * Non esiste un'API browser per scrivere direttamente nel calendario di sistema: la strada
 * standard, su Android e iOS, è generare un file .ics e farlo aprire dal browser — il sistema
 * lo riconosce e offre "Aggiungi al Calendario" da solo, con un tocco di conferma dell'utente
 * (lo stesso comportamento di qualunque altro sito che offre "Aggiungi a Calendario").
 *
 * Mappatura dei campi:
 * - Gruppo "tempo" (Evento/Appuntamento): Data+Ora Inizio → inizio evento; Ora Fine (se
 *   presente) → fine evento, altrimenti un'ora di durata di default.
 * - Gruppo "scadenza" (Promemoria/Obiettivo/Spesa): Data Inizio+Ora Inizio → inizio evento;
 *   Data Scadenza+Ora Scadenza (se presenti) → fine evento, altrimenti stessa logica di sopra.
 * - Se manca l'orario, l'evento diventa un evento "Tutto Il Giorno" sulla sola data.
 * - "Attività Quotidiana" non genera mai un evento: si ripete ogni giorno da sola, un
 *   evento di calendario non aggiungerebbe nulla che l'app non mostri già.
 */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toICSDateTime(dateIso: string, time: string): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}00`;
}

function toICSDate(dateIso: string): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  return `${y}${pad(m)}${pad(d)}`;
}

function escapeICSText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** La ricorrenza di Vitae, tradotta in RRULE — così l'evento nel calendario di sistema si
 * ripete davvero da solo, invece di restare la singola data di creazione. "Nessuna" non
 * genera nessuna riga (evento singolo, come sempre). */
function recurrenceToRRule(recurrence: Task["recurrence"], customDays: Weekday[]): string | null {
  switch (recurrence) {
    case "quotidiano":
      return "RRULE:FREQ=DAILY";
    case "settimanale":
      return "RRULE:FREQ=WEEKLY";
    case "mensile":
      return "RRULE:FREQ=MONTHLY";
    case "annuale":
      return "RRULE:FREQ=YEARLY";
    case "personalizzato":
      return customDays.length > 0 ? `RRULE:FREQ=WEEKLY;BYDAY=${customDays.join(",")}` : null;
    default:
      return null;
  }
}

export function taskToICS(task: Task): string | null {
  if (task.type === "quotidiana") return null;

  const group = taskGroup(task.type);
  const startDate = task.date;
  const startTime = task.time;
  const endDate = group === "scadenza" && task.dueDate ? task.dueDate : task.date;
  const endTime = group === "scadenza" ? task.dueTime : task.endTime;

  let dtStart: string;
  let dtEnd: string;
  let allDay = false;

  if (startTime) {
    dtStart = toICSDateTime(startDate, startTime);
    if (endTime) {
      dtEnd = toICSDateTime(endDate, endTime);
    } else {
      // Nessun orario di fine: un'ora di durata di default.
      const [y, m, d] = startDate.split("-").map(Number);
      const [hh, mm] = startTime.split(":").map(Number);
      const end = new Date(y, m - 1, d, hh, mm + 60);
      dtEnd = `${end.getFullYear()}${pad(end.getMonth() + 1)}${pad(end.getDate())}T${pad(end.getHours())}${pad(
        end.getMinutes()
      )}00`;
    }
  } else {
    allDay = true;
    dtStart = toICSDate(startDate);
    dtEnd = toICSDate(endDate || startDate);
  }

  const uid = `${task.id}@vitae`;
  const now = new Date();
  const dtStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(
    now.getUTCHours()
  )}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const rrule = recurrenceToRRule(task.recurrence, task.customDays);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vitae//Task//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    allDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`,
    allDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICSText(task.title)}`,
  ];
  if (rrule) lines.push(rrule);
  if (task.notes) lines.push(`DESCRIPTION:${escapeICSText(task.notes)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Un file .ics non è un canale a doppio senso: aprirlo fa creare all'app di calendario del
 * sistema una sua copia indipendente dell'evento, e da quel momento Vitae non ha modo di
 * sapere quale evento sia diventato né di cancellarlo da remoto — nessuna web app può farlo,
 * è lo stesso limite di piattaforma già documentato per notifiche e geolocalizzazione.
 * Quello che si può fare, senza fingere un collegamento che non esiste: generare un secondo
 * .ics con lo stesso UID e METHOD:CANCEL. Le app di calendario che sanno riconoscere un
 * annullamento (Google Calendar, Outlook, e buona parte delle app Android) tolgono da sole
 * l'evento corrispondente; altre (in particolare Calendario di iOS aperto da un file al di
 * fuori di un vero invito) potrebbero non far nulla — in quel caso resta da togliere a mano,
 * come specificato all'utente nell'interfaccia quando gli si offre questo file.
 */
export function taskCancelICS(task: Task): string | null {
  if (task.type === "quotidiana") return null;
  const now = new Date();
  const dtStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(
    now.getUTCHours()
  )}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const uid = `${task.id}@vitae`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vitae//Task//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:CANCEL",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    "SEQUENCE:1",
    "STATUS:CANCELLED",
    `SUMMARY:${escapeICSText(task.title)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

function downloadICS(ics: string) {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Apre il file .ics generato: sia Android che iOS riconoscono il tipo e offrono di
 * aggiungerlo al calendario di sistema da soli. */
export function openTaskInCalendar(task: Task) {
  const ics = taskToICS(task);
  if (!ics) return;
  downloadICS(ics);
}

/** Offerto quando si elimina una task già esportata (vedi nota su `taskCancelICS`). */
export function openTaskCancelInCalendar(task: Task) {
  const ics = taskCancelICS(task);
  if (!ics) return;
  downloadICS(ics);
}

/** Stessa strada di taskToICS, per un appuntamento medico (Salute) — un evento singolo,
 * mai ricorrente, con l'ora di fine un'ora dopo l'inizio se non specificata. */
export function medicalAppointmentToICS(appointment: { id: string; title: string; date: string; place?: string; notes?: string }): string {
  const start = new Date(appointment.date);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const now = new Date();
  const dtStamp = fmt(now);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vitae//Salute//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${appointment.id}@vitae-salute`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${escapeICSText(appointment.title)}`,
  ];
  if (appointment.place) lines.push(`LOCATION:${escapeICSText(appointment.place)}`);
  if (appointment.notes) lines.push(`DESCRIPTION:${escapeICSText(appointment.notes)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

export function openMedicalAppointmentInCalendar(appointment: { id: string; title: string; date: string; place?: string; notes?: string }) {
  downloadICS(medicalAppointmentToICS(appointment));
}
