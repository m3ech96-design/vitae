import { Workout } from "./types";
import { metOf } from "./activity-catalog";

/**
 * "Carico" di una sessione: MET × ore, indipendente dal peso della persona (a differenza
 * delle calorie) — è la stessa quantità che si userebbe per calcolare le calorie dividendo
 * per il peso, qui presa da sola perché il tempo di recupero dipende da QUANTO hai spinto
 * il corpo, non da quanto pesi. Uno sprint di 10 minuti a MET 14.8 e una camminata di 60
 * minuti a MET 2.5 possono avere un carico simile pur essendo esperienze molto diverse — la
 * formula li tratta alla pari perché, ai fini del recupero, è il prodotto intensità×durata
 * a contare, non uno dei due fattori da solo.
 */
function workoutLoad(workout: Workout): number {
  const met = metOf(workout.activityId);
  const hours = workout.minutes / 60;
  return met * hours;
}

/**
 * Ore di recupero stimate da un singolo carico — soglie di buon senso, non una formula
 * clinica: sotto un carico leggero (es. una camminata di mezz'ora) il recupero è
 * sostanzialmente immediato; oltre una soglia alta (es. una sessione lunga e intensa) il
 * recupero pieno richiede una notte di sonno. La progressione è volutamente non lineare —
 * raddoppiare il carico non raddoppia mai il recupero 1:1, il corpo non funziona così anche
 * nell'approssimazione più grezza.
 */
function hoursForLoad(load: number): number {
  if (load <= 2) return 0;
  if (load <= 5) return 3;
  if (load <= 10) return 8;
  if (load <= 18) return 16;
  return 24;
}

export interface RecoveryEstimate {
  /** Ore di recupero ancora residue ORA — già scalate per il tempo passato dalla fine
   * della sessione, non le ore di recupero "totali" richieste dalla sessione in sé. */
  hoursRemaining: number;
  /** La sessione che sta ancora pesando di più sul recupero residuo, tra quelle recenti —
   * mostrata come riferimento ("soprattutto per: Corsa"), non sommata a caso con le altre:
   * il recupero non è la somma delle sessioni, è dominato da quella più pesante ancora in
   * corso di recupero. */
  dominantWorkout: Workout | null;
}

interface BestCandidate {
  hoursRemaining: number;
  workout: Workout;
}

/**
 * Il recupero residuo NON è la somma dei recuperi di ogni sessione (allenarsi 3 volte in
 * un giorno non triplica linearmente le ore di riposo necessarie) — è dominato dalla
 * sessione singola che, scalando il proprio recupero per le ore già trascorse, ne ha ancora
 * di più residue delle altre. Un modello più preciso esisterebbe, ma per una stima onesta
 * mostrata in un'app personale "quale sessione ti sta ancora pesando addosso, e per quanto
 * ancora" è più utile e più comprensibile di un numero cumulativo che cresce all'infinito
 * quante più sessioni fai.
 */
export function recoveryEstimate(recentWorkouts: Workout[], now: Date = new Date()): RecoveryEstimate {
  let best: BestCandidate | null = null;

  recentWorkouts.forEach((workout) => {
    const totalHours = hoursForLoad(workoutLoad(workout));
    if (totalHours <= 0) return;
    const elapsedHours = (now.getTime() - new Date(workout.createdAt).getTime()) / 3600000;
    const remaining = totalHours - elapsedHours;
    if (remaining <= 0) return;
    if (!best || remaining > best.hoursRemaining) best = { hoursRemaining: remaining, workout };
  });

  if (!best) return { hoursRemaining: 0, dominantWorkout: null };
  const found = best as BestCandidate;
  return { hoursRemaining: Math.round(found.hoursRemaining * 10) / 10, dominantWorkout: found.workout };
}
