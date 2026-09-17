"use client";
import { Play, Pause, RotateCcw, Check, X } from "lucide-react";
import { Button } from "../ui/Button";
import { useHobbyTimer, formatElapsed } from "@/lib/hobby-timer-context";

/**
 * Cronometro per una voce di metrica basata sul tempo (vedi MetricBlock.isTimeBased) — non
 * scrive mai direttamente nel blocco: al termine passa i minuti trascorsi a `onFinish`.
 *
 * Lo stato vero vive nel context globale (lib/hobby-timer-context.tsx), non più qui dentro:
 * corretto secondo le istruzioni — prima il cronometro si azzerava non appena si usciva
 * dalla scheda Hobby (stato locale del componente, smontato con lei), impossibile lasciarlo
 * girare mentre si consultava qualunque altra parte dell'app. Ora sopravvive alla
 * navigazione, ed è la stessa istanza che la pillola flottante (FloatingHobbyTimerPill)
 * mostra quando questa vista non è a schermo.
 */
export function MetricTimer({
  hobbyId,
  hobbyName,
  blockId,
  blockTitle,
  onFinish,
}: {
  hobbyId: string;
  hobbyName: string;
  blockId: string;
  blockTitle: string;
  onFinish: (minutes: number) => void;
}) {
  const { active, elapsedMs, isBlockedByOtherBlock, start, toggle, reset, finishAndClear, discard } = useHobbyTimer();
  const isMine = active?.blockId === blockId;
  const blockedElsewhere = !isMine && isBlockedByOtherBlock(blockId);

  if (blockedElsewhere) {
    return (
      <div className="rounded-xl2 border border-aura-amber/30 bg-aura-amber/10 p-4 text-center">
        <p className="text-xs text-ink-300">
          C'è già un cronometro attivo su &ldquo;{active!.blockTitle}&rdquo; ({active!.hobbyName}). Fermalo prima di
          usarne uno qui.
        </p>
      </div>
    );
  }

  if (!isMine) {
    return (
      <div className="rounded-xl2 border border-white/10 bg-white/[0.03] p-4 text-center">
        <p className="mb-3 font-display text-2xl tabular-nums text-ink-100">00:00</p>
        <Button size="sm" onClick={() => start(hobbyId, hobbyName, blockId, blockTitle)}>
          <Play size={14} /> Avvia
        </Button>
      </div>
    );
  }

  const running = active!.running;

  return (
    <div className="rounded-xl2 border border-white/10 bg-white/[0.03] p-4">
      <p className="text-center font-display text-2xl tabular-nums text-ink-100">{formatElapsed(elapsedMs)}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Button variant="outline" size="sm" onClick={toggle}>
          {running ? <Pause size={14} /> : <Play size={14} />}
          {running ? "Pausa" : "Riprendi"}
        </Button>
        <Button variant="outline" size="sm" onClick={reset} disabled={elapsedMs === 0} aria-label="Azzera">
          <RotateCcw size={14} />
        </Button>
        <Button size="sm" onClick={() => onFinish(finishAndClear())} disabled={elapsedMs === 0}>
          <Check size={14} /> Usa questo tempo
        </Button>
        <button
          onClick={discard}
          className="focus-ring flex items-center gap-1 rounded-full px-2.5 text-xs text-ink-800 hover:text-aura-pink"
          aria-label="Annulla cronometraggio"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
