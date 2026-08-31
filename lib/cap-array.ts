/** Mantiene solo le ultime `max` voci, scartando le più vecchie — evita che gli
 * array di cronologia (visite, rapporti, pappa, streak) crescano per sempre. */
export function capArray<T>(arr: T[], max: number): T[] {
  return arr.length > max ? arr.slice(arr.length - max) : arr;
}
