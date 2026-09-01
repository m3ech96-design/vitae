import { ActionPhrase, RecurringPhrase } from "./types";

/** Solo i campi davvero letti qui — non l'intero `PersonalDetails` — perché lo stesso
 * meccanismo deve valere anche per un `VitaecomAccount` altrui (dimostrativo o, un giorno,
 * vero), che non ha né avrà mai il resto del profilo. Facoltativi apposta: la maggior parte
 * degli account (e alcune persone) non li avranno mai impostati. */
export interface DialoguePresentable {
  dialogModeEnabled?: boolean;
  recurringPhrases?: RecurringPhrase[];
}
export interface ActionPresentable {
  liveModeEnabled?: boolean;
  actionPhrase?: ActionPhrase;
}

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

/** Solo le Frasi Ricorrenti (Modalità Dialogo) — mostrate nella nuvoletta sopra l'avatar.
 * Simmetrico in entrambe le direzioni: vale per il tuo profilo, per una Persona in Mondo, e
 * per un account Vitaecom altrui — chiunque abbia questi due campi, comunque popolati. */
export function pickDialoguePhrase(person: DialoguePresentable): string | null {
  if (!person.dialogModeEnabled || !person.recurringPhrases || person.recurringPhrases.length === 0) return null;
  const chosen = person.recurringPhrases[Math.floor(Math.random() * person.recurringPhrases.length)];
  return chosen.text;
}

/** Solo la Frase Azione (Modalità Vivo) — mostrata come riga di testo nella card, non nella
 * nuvoletta. Su richiesta esplicita non è più una fra tante scelte a caso: al più una sola,
 * quindi qui non c'è più nulla da "pescare" — solo da mostrare se attiva ora (se ha un
 * orario fisso) o sempre (se casuale). Il prefisso è sempre "Sta", mai più "Forse Sta" o
 * "Probabilmente Sta" a sorte: con una sola frase, quella scelta a sorte era solo rumore.
 * Stessa simmetria di `pickDialoguePhrase` qui sopra. */
export function pickActionPhrase(person: ActionPresentable): string | null {
  if (!person.liveModeEnabled || !person.actionPhrase) return null;
  if (!actionIsActiveNow(person.actionPhrase)) return null;
  return `Sta ${person.actionPhrase.text}`;
}
