import { hashToUnit } from "./hash";

/**
 * "I movimenti Casa-Fuori Casa e le aure aggiornate sono visibili a tutti gli utenti
 * aggiunti al riquadro Casa" — ma un account Vitaecom dimostrativo non ha un dispositivo
 * proprio che mandi una posizione vera. Per non lasciare la funzione a vuoto (un membro
 * fermo per sempre in un solo riquadro non sarebbe onesto neanche come anteprima), la sua
 * posizione cambia da sola nel tempo: deterministica (stesso account, stesso quarto d'ora,
 * stesso risultato — non un `Math.random()` diverso a ogni render) ma non fissa, per dare
 * l'idea vera di "qualcuno che si muove" senza dover inventare un finto GPS.
 */
const BUCKET_MS = 15 * 60 * 1000;

export function vitaecomMemberIsHome(accountId: string, now: number = Date.now()): boolean {
  const bucket = Math.floor(now / BUCKET_MS);
  return hashToUnit(`${accountId}:${bucket}`) > 0.35;
}
