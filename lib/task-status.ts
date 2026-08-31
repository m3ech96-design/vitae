import { Task, taskGroup, REMINDER_OFFSET_MINUTES } from "./types";

export type TaskCategory = "attive" | "non-completate" | "completate";

function toDateTime(date: string, time?: string): Date | null {
  if (!time) return null;
  return new Date(`${date}T${time}:00`);
}

/** Solo Evento/Appuntamento: quando finiscono davvero (con fallback a 1 ora se manca l'orario di fine). */
export function taskEndDateTime(task: Pick<Task, "type" | "date" | "time" | "endTime">): Date | null {
  if (taskGroup(task.type) !== "tempo") return null;
  const start = toDateTime(task.date, task.time);
  if (!start) return null;
  if (task.endTime) {
    const [h, m] = task.endTime.split(":").map(Number);
    const end = new Date(start);
    end.setHours(h, m, 0, 0);
    if (end < start) end.setDate(end.getDate() + 1);
    return end;
  }
  return new Date(start.getTime() + 60 * 60 * 1000);
}

/** Solo Promemoria/Obiettivo/Spesa: la scadenza dichiarata. */
export function taskDueDateTime(task: Pick<Task, "type" | "dueDate" | "dueTime">): Date | null {
  if (taskGroup(task.type) !== "scadenza") return null;
  if (!task.dueDate) return null;
  return toDateTime(task.dueDate, task.dueTime || "23:59");
}

/** Il momento in cui scatta l'avviso anticipato: prima dell'inizio (Evento/Appuntamento) o
 * prima della scadenza (Promemoria/Obiettivo/Spesa). */
export function taskReminderDateTime(
  task: Pick<Task, "type" | "date" | "time" | "endTime" | "dueDate" | "dueTime" | "reminderOffset">
): Date | null {
  const minutes = REMINDER_OFFSET_MINUTES[task.reminderOffset];
  if (minutes === null || minutes === undefined) return null;
  const group = taskGroup(task.type);
  const anchor = group === "tempo" ? toDateTime(task.date, task.time) : taskDueDateTime(task);
  if (!anchor) return null;
  return new Date(anchor.getTime() - minutes * 60000);
}

/** L'istante a cui punta il countdown: inizio per Evento/Appuntamento, scadenza per gli altri. */
export function taskAnchorDateTime(
  task: Pick<Task, "type" | "date" | "time" | "dueDate" | "dueTime">
): Date | null {
  const group = taskGroup(task.type);
  return group === "tempo" ? toDateTime(task.date, task.time) : taskDueDateTime(task);
}

/** Task il cui avviso è scattato ma il momento di riferimento non è ancora arrivato — per il
 * log con countdown in Home. */
export function tasksInReminderWindow<T extends Task>(tasks: T[], now: Date = new Date()): T[] {
  return tasks.filter((t) => {
    if (t.completed || t.reminderOffset === "none") return false;
    const remindAt = taskReminderDateTime(t);
    const anchor = taskAnchorDateTime(t);
    if (!remindAt || !anchor) return false;
    return now >= remindAt && now < anchor;
  });
}
export function taskCategory(task: Task, now: Date = new Date()): TaskCategory {
  if (task.completed) return "completate";
  if (taskGroup(task.type) === "scadenza") {
    const due = taskDueDateTime(task);
    if (due && now >= due) return "non-completate";
  }
  return "attive";
}

/** Evento/Appuntamento non si spuntano: si completano da soli a fine orario. */
export function shouldAutoComplete(task: Task, now: Date = new Date()): boolean {
  if (task.completed || taskGroup(task.type) !== "tempo") return false;
  const end = taskEndDateTime(task);
  return Boolean(end && now >= end);
}

/** Streak che valgono un innesco per lo stato d'animo (vedi lib/mood-catalog.ts,
 * "task:streak") — condivisa tra la lista Task e il chip delle quotidiane, non duplicata. */
export const STREAK_MILESTONES = [7, 14, 30, 60, 100, 200, 365];
