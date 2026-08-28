/**
 * Una Polaroid vera si sviluppa in circa 15 minuti — non un numero a caso, quello reale
 * della pellicola istantanea. Prima erano 40 ore ("essiccazione"): troppo, tolto di netto.
 */
export const DEVELOP_MINUTES = 15;

export function developedFraction(photoAddedAt: string | undefined): number {
  if (!photoAddedAt) return 1;
  const minutesPassed = (Date.now() - new Date(photoAddedAt).getTime()) / 60_000;
  return Math.max(0, Math.min(1, minutesPassed / DEVELOP_MINUTES));
}
