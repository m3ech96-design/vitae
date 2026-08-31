import { Task, taskGroup } from "./types";

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

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vitae//Task//IT",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    allDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`,
    allDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICSText(task.title)}`,
  ];
  if (task.notes) lines.push(`DESCRIPTION:${escapeICSText(task.notes)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}

/** Apre il file .ics generato: sia Android che iOS riconoscono il tipo e offrono di
 * aggiungerlo al calendario di sistema da soli. */
export function openTaskInCalendar(task: Task) {
  const ics = taskToICS(task);
  if (!ics) return;
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
