"use client";
import { useEffect } from "react";
import { pulseDurationSeconds, floatDurationSeconds } from "@/lib/day-rhythm";

/**
 * Il battito di tutta l'app (i respiri pulseSoft/float) segue l'ora del giorno — si stringe
 * a mezzogiorno, si allunga verso sera e nella notte. Calcolato in un solo posto (vedi
 * lib/day-rhythm.ts) e scritto come variabili CSS sulla radice del documento: ogni
 * componente che usa `animate-pulseSoft`/`animate-float` in tutta l'app lo eredita da solo,
 * senza che ognuno debba ricalcolarlo per conto proprio. Nessun elemento visibile: vive nel
 * layout radice e basta.
 */
export function DayRhythm() {
  useEffect(() => {
    const apply = () => {
      const root = document.documentElement;
      root.style.setProperty("--rhythm-pulse", `${pulseDurationSeconds().toFixed(2)}s`);
      root.style.setProperty("--rhythm-float", `${floatDurationSeconds().toFixed(2)}s`);
    };
    apply();
    // La curva si muove nell'arco di ore, non di minuti — ogni 5 minuti è già più che
    // sufficiente per seguirla senza sprecare cicli a ricalcolare qualcosa di impercettibile.
    const id = setInterval(apply, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return null;
}
