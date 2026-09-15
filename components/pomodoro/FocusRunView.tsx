"use client";
import { useEffect, useState } from "react";
import { Play, Pause, SkipForward, Square } from "lucide-react";
import { usePomodoro } from "@/lib/pomodoro-context";
import { useTasks } from "@/lib/tasks-context";
import { useHobby } from "@/lib/hobby-context";
import { Button } from "../ui/Button";

const PHASE_LABEL: Record<string, string> = {
  lavoro: "Lavoro",
  pausa: "Pausa",
  "pausa-lunga": "Pausa lunga",
};

const PHASE_COLOR: Record<string, string> = {
  lavoro: "#7C5CFF",
  pausa: "#34D399",
  "pausa-lunga": "#34D399",
};

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Vista completa del ciclo in corso — usata sia nella scheda Focus a pagina intera sia
 * (in versione compatta) dentro FloatingFocusTimer. Il tempo restante è sempre ricalcolato
 * da `phaseStartedAt`, mai un contatore proprio: la pagina o il widget possono smontarsi e
 * rimontarsi (cambio scheda) senza che il tempo mostrato sfasi da quello vero. */
export function FocusRunView({ compact = false }: { compact?: boolean }) {
  const { activeRun, settings, togglePause, advancePhase, stopRun } = usePomodoro();
  const { tasks } = useTasks();
  const { hobbies } = useHobby();
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 500);
    return () => clearInterval(id);
  }, []);

  if (!activeRun) return null;

  const elapsedMs = activeRun.paused
    ? activeRun.pausedElapsedMs
    : activeRun.pausedElapsedMs + (Date.now() - new Date(activeRun.phaseStartedAt).getTime());
  const durationMs = activeRun.phaseDurationMinutes * 60000;
  const remainingMs = durationMs - elapsedMs;
  const pct = Math.min(1, elapsedMs / durationMs);
  const color = PHASE_COLOR[activeRun.phase];

  const linkLabel = (() => {
    if (activeRun.link.kind === "task") {
      const t = tasks.find((x) => x.id === activeRun.link.taskId);
      return t ? `Task · ${t.title}` : null;
    }
    if (activeRun.link.kind === "metrica") {
      const h = hobbies.find((x) => x.id === activeRun.link.hobbyId);
      const b = h?.blocks.find((x) => x.id === activeRun.link.blockId);
      return h && b ? `${h.name} · ${b.title}` : null;
    }
    return activeRun.label ?? null;
  })();

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
          <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeDasharray={`${pct * 97.4} 97.4`}
              strokeLinecap="round"
            />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] text-ink-600">{PHASE_LABEL[activeRun.phase]}{linkLabel ? ` · ${linkLabel}` : ""}</p>
          <p className="font-display text-sm tabular-nums text-ink-100">{formatCountdown(remainingMs)}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePause();
          }}
          className="focus-ring text-ink-200 hover:text-ink-50"
          aria-label={activeRun.paused ? "Riprendi" : "Pausa"}
        >
          {activeRun.paused ? <Play size={16} /> : <Pause size={16} />}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-xs uppercase tracking-[0.18em]" style={{ color }}>
        {PHASE_LABEL[activeRun.phase]}
      </p>
      {linkLabel && <p className="text-xs text-ink-600">{linkLabel}</p>}
      <div className="relative flex h-48 w-48 items-center justify-center">
        <svg viewBox="0 0 100 100" className="absolute h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${pct * 276.5} 276.5`}
            style={{ filter: `drop-shadow(0 0 10px ${color}99)`, transition: "stroke-dasharray 0.4s linear" }}
          />
        </svg>
        <span className="font-display text-4xl tabular-nums text-ink-100">{formatCountdown(remainingMs)}</span>
      </div>
      <p className="text-[11px] text-ink-800">
        {activeRun.completedWorkCycles} cicli completati · prossima pausa lunga tra{" "}
        {settings.longBreakEvery - (activeRun.completedWorkCycles % settings.longBreakEvery)} ciclo/i
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={togglePause}>
          {activeRun.paused ? <Play size={16} /> : <Pause size={16} />}
          {activeRun.paused ? "Riprendi" : "Pausa"}
        </Button>
        <Button variant="outline" onClick={advancePhase} aria-label="Salta alla fase successiva">
          <SkipForward size={16} />
        </Button>
        <Button variant="danger" onClick={stopRun} aria-label="Interrompi sessione">
          <Square size={16} />
        </Button>
      </div>
    </div>
  );
}
