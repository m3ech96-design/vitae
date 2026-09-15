"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Check } from "lucide-react";
import { Button } from "../ui/Button";

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Cronometro per una voce di metrica basata sul tempo (vedi MetricBlock.isTimeBased) — non
 * scrive mai direttamente nel blocco: al termine passa i minuti trascorsi a `onFinish`, che
 * li versa nel campo valore del form di inserimento già aperto sotto (vedi
 * MetricEntryModal), così l'utente vede comunque il numero prima di confermarlo e può
 * ancora correggerlo a mano se il cronometro non è stato preciso al secondo.
 *
 * Play/pausa multipli sono supportati (il tempo si accumula tra una pausa e la ripresa),
 * pensato per un'attività interrotta e ripresa nella stessa sessione — non per sopravvivere
 * alla chiusura del modal: chiudendo senza confermare, il tempo accumulato si perde, come
 * qualunque altro campo non salvato del form.
 */
export function MetricTimer({ onFinish }: { onFinish: (minutes: number) => void }) {
  const [running, setRunning] = useState(false);
  const [accumulatedMs, setAccumulatedMs] = useState(0);
  const [displayMs, setDisplayMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const runningSince = startedAtRef.current ?? Date.now();
      setDisplayMs(accumulatedMs + (Date.now() - runningSince));
    }, 250);
    return () => clearInterval(id);
  }, [running, accumulatedMs]);

  const toggle = () => {
    if (running) {
      const runningSince = startedAtRef.current ?? Date.now();
      const total = accumulatedMs + (Date.now() - runningSince);
      setAccumulatedMs(total);
      setDisplayMs(total);
      startedAtRef.current = null;
      setRunning(false);
    } else {
      startedAtRef.current = Date.now();
      setRunning(true);
    }
  };

  const reset = () => {
    setRunning(false);
    setAccumulatedMs(0);
    setDisplayMs(0);
    startedAtRef.current = null;
  };

  const confirm = () => {
    const finalMs = running ? accumulatedMs + (Date.now() - (startedAtRef.current ?? Date.now())) : displayMs;
    const minutes = Math.round((finalMs / 60000) * 100) / 100;
    onFinish(minutes);
    reset();
  };

  return (
    <div className="rounded-xl2 border border-white/10 bg-white/[0.03] p-4">
      <p className="text-center font-display text-2xl tabular-nums text-ink-100">{formatElapsed(displayMs)}</p>
      <div className="mt-3 flex justify-center gap-2">
        <Button variant="outline" size="sm" onClick={toggle}>
          {running ? <Pause size={14} /> : <Play size={14} />}
          {running ? "Pausa" : displayMs > 0 ? "Riprendi" : "Avvia"}
        </Button>
        <Button variant="outline" size="sm" onClick={reset} disabled={displayMs === 0 && !running} aria-label="Azzera">
          <RotateCcw size={14} />
        </Button>
        <Button size="sm" onClick={confirm} disabled={displayMs === 0 && !running}>
          <Check size={14} /> Usa questo tempo
        </Button>
      </div>
    </div>
  );
}
