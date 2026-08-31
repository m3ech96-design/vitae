import { Person, ActionPhrase } from "./types";

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function inWindow(now: number, start: number, end: number): boolean {
  if (start === end) return true;
  if (start < end) return now >= start && now <= end;
  return now >= start || now <= end; // finestra che attraversa la mezzanotte
}

function actionIsActiveNow(a: ActionPhrase): boolean {
  if (a.mode === "casuale") return true;
  if (!a.startTime || !a.endTime) return true;
  return inWindow(nowMinutes(), timeToMinutes(a.startTime), timeToMinutes(a.endTime));
}

/** Solo le Frasi Ricorrenti (Modalità Dialogo) — mostrate nella nuvoletta sopra l'avatar. */
export function pickDialoguePhrase(person: Person): string | null {
  if (!person.dialogModeEnabled || person.recurringPhrases.length === 0) return null;
  const chosen = person.recurringPhrases[Math.floor(Math.random() * person.recurringPhrases.length)];
  return chosen.text;
}

/** Solo le Azioni (Modalità Vivo) — mostrate come riga di testo nella card, non nella nuvoletta. */
export function pickActionPhrase(person: Person): string | null {
  if (!person.liveModeEnabled || person.actionPhrases.length === 0) return null;
  const scheduled = person.actionPhrases.filter((a) => a.mode === "orario" && actionIsActiveNow(a));
  const pool = scheduled.length > 0 ? scheduled : person.actionPhrases.filter((a) => a.mode === "casuale");
  if (pool.length === 0) return null;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  const prefix = Math.random() < 0.5 ? "Forse sta" : "Probabilmente sta";
  return `${prefix} ${chosen.text}`;
}
