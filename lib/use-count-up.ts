"use client";
import { useEffect, useState } from "react";

/**
 * Anima un numero da 0 al valore finale ogni volta che questo cambia, invece di scattarci
 * di colpo — usato nella card "Oggi" perché i numeri che crescono sotto i tuoi occhi
 * comunicano "sta succedendo ora" molto più di una cifra statica.
 */
export function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
