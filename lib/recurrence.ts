import { Recurrence, Weekday } from "./types";

interface RecurringDated {
  date: string;
  recurrence: Recurrence;
  customDays?: Weekday[];
}

const JS_DAY_TO_WEEKDAY: Weekday[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

/** Ultimo giorno del mese di `year`/`month` (0-indicizzato come Date.getMonth()) — es.
 * lastDayOfMonth(2025, 1) → 28 (febbraio). Serve a far occorrere una ricorrenza mensile o
 * annuale ancorata a un giorno che un dato mese non ha (29, 30, 31) nell'ultimo giorno
 * disponibile invece di farla sparire silenziosamente. */
function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Corretto secondo le istruzioni: una ricorrenza mensile/annuale ancorata al giorno 29, 30 o
 * 31 prima confrontava solo `getDate()` — nei mesi che non arrivano a quel giorno (es. il 31
 * gennaio contro febbraio) il confronto non poteva mai combaciare, quindi il task saltava
 * silenziosamente quel mese, ogni volta, senza errore né avviso. Ora se il giorno di ancoraggio
 * supera i giorni del mese di `iso`, la ricorrenza occorre l'ultimo giorno di quel mese —
 * comportamento comune ("fine mese") invece di un buco silenzioso.
 */
function matchesAnchorDay(anchorDay: number, targetYear: number, targetMonth: number, targetDate: number): boolean {
  const effectiveAnchor = Math.min(anchorDay, lastDayOfMonth(targetYear, targetMonth));
  return targetDate === effectiveAnchor;
}

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
      return matchesAnchorDay(a.getDate(), b.getFullYear(), b.getMonth(), b.getDate());
    }
    case "annuale": {
      const a = new Date(task.date + "T00:00:00");
      const b = new Date(iso + "T00:00:00");
      return a.getMonth() === b.getMonth() && matchesAnchorDay(a.getDate(), b.getFullYear(), b.getMonth(), b.getDate());
    }
    default:
      return task.date === iso;
  }
}
