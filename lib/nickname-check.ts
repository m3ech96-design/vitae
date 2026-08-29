import { DEMO_ACCOUNTS } from "./vitaecom-demo-data";

const RULE = /^[a-z0-9._]{3,24}$/;

export function normalizeNickname(raw: string): string {
  return raw.trim().toLowerCase();
}

export function nicknameFormatError(raw: string): string | undefined {
  const n = normalizeNickname(raw);
  if (!n) return undefined;
  if (!RULE.test(n)) return "Solo Minuscolo, Numeri, Punto E Underscore — Da 3 A 24 Caratteri.";
  return undefined;
}

/**
 * Non esiste ancora un vero server (vedi README: l'app oggi vive solo sul dispositivo).
 * Qui il controllo è quindi solo locale — contro gli account dimostrativi di
 * vitaecom-demo-data.ts, e contro il proprio nickname già impostato — abbastanza per far
 * vedere davvero sia il messaggio di errore sia quello di successo come richiesto, ma non
 * un vero controllo globale finché non esiste un database. Il giorno che ci sarà, questa
 * funzione — e solo questa — dovrà interrogare l'API al suo posto: NicknameField non
 * cambia, chiama sempre e solo questa funzione.
 */
export function isNicknameTaken(candidate: string, currentOwnNickname?: string): boolean {
  const n = normalizeNickname(candidate);
  if (currentOwnNickname && normalizeNickname(currentOwnNickname) === n) return false;
  return DEMO_ACCOUNTS.some((a) => normalizeNickname(a.nickname) === n);
}
