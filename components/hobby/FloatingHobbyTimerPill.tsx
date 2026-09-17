"use client";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Timer, Pause, Play } from "lucide-react";
import { useHobbyTimer, formatElapsed } from "@/lib/hobby-timer-context";

/**
 * Rende visibile ovunque nell'app un cronometro Hobby lasciato attivo — senza questa
 * pillola, uscire dalla scheda Hobby per controllare qualcos'altro avrebbe fatto sparire
 * ogni traccia del cronometraggio in corso (il componente MetricTimer originale viveva solo
 * dentro il blocco, smontato appena si cambiava scheda). Lo stato vero vive nel context
 * (lib/hobby-timer-context.tsx), sopravvive alla navigazione perché quel context è montato
 * una volta sola nel layout radice — questa pillola ne è solo una vetrina sempre visibile.
 *
 * Posizionata sopra la pillola di navigazione inferiore (che è essa stessa fluttuante, non
 * un'unica barra piena): la distanza qui sotto è una stima della sua altezza reale più un
 * margine, non un valore che BottomNav espone — se in futuro cambiasse sensibilmente
 * dimensione, andrebbe aggiustata di conseguenza qui.
 */
export function FloatingHobbyTimerPill() {
  const router = useRouter();
  const pathname = usePathname();
  const { active, elapsedMs, toggle } = useHobbyTimer();

  // Sulla pagina dell'hobby a cui il cronometro appartiene già, il blocco Metrica mostra il
  // proprio cronometro inline con tutti i controlli — la pillola qui diventerebbe solo un
  // duplicato ridondante nello stesso schermo.
  if (!active || pathname === `/hobby/${active.hobbyId}`) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 8 }}
        className="fixed right-4 z-[45] bottom-[calc(env(safe-area-inset-bottom)+84px)]"
      >
        <button
          onClick={() => router.push(`/hobby/${active.hobbyId}`)}
          className="focus-ring glass-nav flex items-center gap-2 rounded-full py-2 pl-3 pr-2 shadow-glass"
        >
          <Timer size={13} className="shrink-0 text-aura-violet" />
          <div className="text-left leading-tight">
            <p className="max-w-[110px] truncate text-[10px] text-ink-600">{active.blockTitle}</p>
            <p className="font-display text-sm tabular-nums text-ink-100">{formatElapsed(elapsedMs)}</p>
          </div>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                toggle();
              }
            }}
            className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aura-gradient text-void-950"
            aria-label={active.running ? "Metti in pausa" : "Riprendi"}
          >
            {active.running ? <Pause size={13} /> : <Play size={13} />}
          </span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
