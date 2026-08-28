/**
 * Calcola solo i campi che sono davvero cambiati tra `before` e `after` — usato per
 * confrontare una bozza con l'originale al momento del salvataggio, così si scrive (e si
 * notifica in Novità) solo cosa è cambiato per davvero, non l'intero oggetto.
 */
export function diffPatch<T extends object>(before: T, after: T): Partial<T> {
  const patch: Partial<T> = {};
  (Object.keys(after) as (keyof T)[]).forEach((key) => {
    const a = before[key];
    const b = after[key];
    const isObjectLike = (v: unknown) => Array.isArray(v) || (v !== null && typeof v === "object");
    const changed = isObjectLike(a) || isObjectLike(b) ? JSON.stringify(a) !== JSON.stringify(b) : a !== b;
    if (changed) patch[key] = b;
  });
  return patch;
}
