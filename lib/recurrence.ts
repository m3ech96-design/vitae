import { Recurrence } from "./types";

interface RecurringDated {
  date: string;
  recurrence: Recurrence;
}

export function taskOccursOnDate(task: RecurringDated, iso: string): boolean {
  if (iso < task.date) return false;
  switch (task.recurrence) {
    case "nessuna":
    case "personalizzato":
      return task.date === iso;
    case "quotidiano":
      return true;
    case "settimanale": {
      const a = new Date(task.date + "T00:00:00");
      const b = new Date(iso + "T00:00:00");
      return a.getDay() === b.getDay();
    }
    case "mensile": {
      const a = new Date(task.date + "T00:00:00");
      const b = new Date(iso + "T00:00:00");
      return a.getDate() === b.getDate();
    }
    case "annuale": {
      const a = new Date(task.date + "T00:00:00");
      const b = new Date(iso + "T00:00:00");
      return a.getDate() === b.getDate() && a.getMonth() === b.getMonth();
    }
    default:
      return task.date === iso;
  }
}
