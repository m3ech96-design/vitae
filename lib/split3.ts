/**
 * Ribilancia tre quote percentuali complementari a 100 quando una di esse cambia — usata sia
 * dalla suddivisione dei macronutrienti (lib/food-types.ts) sia dal calcolatore "Suddividi lo
 * stipendio" (SalarySplitCalculator): stessa meccanica, generica per chiave invece di legata
 * al lessico di uno dei due usi. La quota toccata prende il valore scelto, le altre due si
 * dividono ciò che resta fino a 100 mantenendo tra loro la stessa proporzione che avevano
 * prima (non semplicemente "metà per una, metà per l'altra"). Se le altre due erano entrambe
 * a zero (caso limite, es. 100/0/0), si dividono il resto a metà — non c'è una proporzione
 * precedente da rispettare.
 */
export function rebalanceThreeWaySplit<K extends string>(
  current: Record<K, number>,
  keys: [K, K, K],
  changed: K,
  newValue: number
): Record<K, number> {
  const clamped = Math.max(0, Math.min(100, Math.round(newValue)));
  const remaining = 100 - clamped;
  const [a, b] = keys.filter((k) => k !== changed) as [K, K];
  const sumOthers = current[a] + current[b];
  const [shareA, shareB] = sumOthers > 0 ? [current[a] / sumOthers, current[b] / sumOthers] : [0.5, 0.5];
  const valueA = Math.round(remaining * shareA);
  const valueB = remaining - valueA; // l'ultima assorbe l'arrotondamento, la somma resta sempre 100
  return { ...current, [changed]: clamped, [a]: valueA, [b]: valueB } as Record<K, number>;
}
