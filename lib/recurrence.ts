import { Recurrence, Weekday } from "./types";

interface RecurringDated {
  date: string;
  recurrence: Recurrence;
  customDays?: Weekday[];
}

const JS_DAY_TO_WEEKDAY: Weekday[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export function taskOccursOnDate(task: RecurringDated, iso: string): boolean {
  if (iso < task.date) return false;
  switch (task.recurrence) {
    case "nessuna":
      return task.date === iso;
    case "personalizzato": {
      // "Personalizzato" senza nessun giorno scelto non si è mai potuto salvare dal form,
      // ma se capita si comporta come "Nessuna" invece di sparire silenziosamente.
      if (!task.customDays || task.customDays.length === 0) return task.date === iso;
      const b = new Date(iso + "T00:00:00");
      return task.customDays.includes(JS_DAY_TO_WEEKDAY[b.getDay()]);
    }
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
