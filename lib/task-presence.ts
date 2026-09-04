import { Task } from "./types";

/** Nessuna Task ha un orario di fine: assumo una durata di un'ora, come per gli Impegni.
 * Esportata (oltre che usata qui sotto) perché il widget Interazione Rapida se ne serve per
 * richiamare in automatico le persone taggate in una task in corso — stessa identica finestra
 * oraria, non una seconda versione da tenere allineata a mano. */
export function isTaskActiveNow(task: Task, now: Date = new Date()): boolean {
  if (task.completed || !task.time) return false;
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (task.date !== todayIso) return false;
  const [h, m] = task.time.split(":").map(Number);
  const start = new Date(now);
  start.setHours(h, m, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return now >= start && now <= end;
}

export type TaskLocation = "casa" | "fuori-casa" | null;

/**
 * Se la persona ha in questo momento una Task attiva con l'utente e un luogo collegato,
 * quel luogo decide dove appare in Home — a Casa se è "Casa Di [Utente]", altrimenti Fuori
 * Casa — finché la task non finisce. Se non c'è nessuna Task attiva, ritorna null: si
 * userà il valore predefinito (Vive Con Te).
 */
export function taskDrivenLocation(
  personId: string,
  tasks: Task[],
  homePlaceId: string | undefined,
  now: Date = new Date()
): TaskLocation {
  const active = tasks.find((t) => t.linkedPersonIds.includes(personId) && isTaskActiveNow(t, now));
  if (!active || !active.linkedPlaceId) return null;
  return homePlaceId && active.linkedPlaceId === homePlaceId ? "casa" : "fuori-casa";
}

/**
 * Per l'utente: qualunque sua task attiva con un luogo collegato decide la posizione,
 * indipendentemente dal fatto che coinvolga altre persone o meno — l'utente è sempre
 * implicitamente parte di ogni sua task. Ha priorità sul GPS quando il rilevamento è spento
 * o non ha ancora una lettura — MA MAI quando il GPS conferma che sei fisicamente a casa: in
 * quel caso vince sempre la posizione reale (vedi app/home/page.tsx, `gpsConfirmsHome`), un
 * Impegno "Fuori casa" non può più contraddire il posto in cui il telefono ti vede davvero.
 */
export function userTaskDrivenLocation(tasks: Task[], homePlaceId: string | undefined, now: Date = new Date()): TaskLocation {
  const active = tasks.find((t) => isTaskActiveNow(t, now) && t.linkedPlaceId);
  if (!active || !active.linkedPlaceId) return null;
  return homePlaceId && active.linkedPlaceId === homePlaceId ? "casa" : "fuori-casa";
}

export type PersonWorldStatus = "casa" | "fuori-casa" | "mondo";

/**
 * Lo stato "vivo" di una persona in Home:
 * - Chi vive con te resta in Casa, a meno che non abbia in corso una task condivisa altrove
 *   o un proprio Impegno (indipendente dall'utente) in un luogo diverso da Casa.
 * - Chi NON vive con te resta solo nella scheda Mondo, a meno che non abbia in corso una
 *   task condivisa con te (o con chi vive con te) altrove — allora appare in Fuori Casa
 *   finché la task non finisce. Non entra mai in Casa solo perché esiste come persona.
 */
export function personWorldStatus(
  person: { id: string; livesAtHome: boolean },
  tasks: Task[],
  homePlaceId: string | undefined,
  currentEngagementPlaceId: string | null | undefined
): PersonWorldStatus {
  const taskLoc = taskDrivenLocation(person.id, tasks, homePlaceId);

  if (person.livesAtHome) {
    if (taskLoc) return taskLoc;
    if (currentEngagementPlaceId) {
      return currentEngagementPlaceId === homePlaceId ? "casa" : "fuori-casa";
    }
    return "casa";
  }

  return taskLoc ?? "mondo";
}
