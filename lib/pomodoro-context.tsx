"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { newId } from "./id";
import { capArray } from "./cap-array";
import {
  FocusSession,
  FocusSettings,
  DEFAULT_FOCUS_SETTINGS,
  FocusLink,
  ActiveFocusRun,
  FocusPhase,
} from "./pomodoro-types";
import { useHobby } from "./hobby-context";

const SETTINGS_KEY = "vitae:focus-settings";
const SESSIONS_KEY = "vitae:focus-sessions";
const ACTIVE_RUN_KEY = "vitae:focus-active-run";
const MAX_SESSIONS = 1000;

interface PomodoroContextValue {
  hydrated: boolean;
  settings: FocusSettings;
  updateSettings: (patch: Partial<FocusSettings>) => void;
  sessions: FocusSession[];
  activeRun: ActiveFocusRun | null;
  /** Avvia un nuovo ciclo di lavoro — se un'altra sessione era già in corso, la sostituisce
   * (nessuna sovrapposizione: un solo timer di Focus alla volta ha senso, esattamente come
   * il cronometro dentro il blocco Metrica). */
  startRun: (link: FocusLink, label?: string) => void;
  togglePause: () => void;
  /** Salta subito alla fase successiva (lavoro→pausa o pausa→lavoro) senza aspettare che il
   * tempo scada — usata sia dal pulsante "Salta" sia dal timer stesso a fine fase. */
  advancePhase: () => void;
  /** Interrompe la sessione in corso registrandola comunque (`completed: false`) con il
   * tempo di lavoro maturato fin lì — il tempo impiegato non va mai perso, anche se il ciclo
   * non è arrivato in fondo. */
  stopRun: () => void;
  removeSession: (id: string) => void;
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

function elapsedMsInPhase(run: ActiveFocusRun): number {
  if (run.paused) return run.pausedElapsedMs;
  return run.pausedElapsedMs + (Date.now() - new Date(run.phaseStartedAt).getTime());
}

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const { addMetricEntry } = useHobby();
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState<FocusSettings>(DEFAULT_FOCUS_SETTINGS);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [activeRun, setActiveRun] = useState<ActiveFocusRun | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    try {
      const rawSettings = window.localStorage.getItem(SETTINGS_KEY);
      if (rawSettings) setSettings({ ...DEFAULT_FOCUS_SETTINGS, ...JSON.parse(rawSettings) });
      const rawSessions = window.localStorage.getItem(SESSIONS_KEY);
      if (rawSessions) setSessions(JSON.parse(rawSessions));
      const rawRun = window.localStorage.getItem(ACTIVE_RUN_KEY);
      if (rawRun) setActiveRun(JSON.parse(rawRun));
    } catch {
      // storage non disponibile: si parte dai default
    }
    setHydrated(true);
  }, []);

  const persistSettings = useCallback((next: FocusSettings) => {
    setSettings(next);
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      // continua solo in memoria
    }
  }, []);

  const persistSessions = useCallback((updater: (prev: FocusSession[]) => FocusSession[]) => {
    setSessions((prev) => {
      const next = capArray(updater(prev), MAX_SESSIONS);
      try {
        window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
      } catch {
        // continua solo in memoria
      }
      return next;
    });
  }, []);

  const persistRun = useCallback((run: ActiveFocusRun | null) => {
    setActiveRun(run);
    try {
      if (run) window.localStorage.setItem(ACTIVE_RUN_KEY, JSON.stringify(run));
      else window.localStorage.removeItem(ACTIVE_RUN_KEY);
    } catch {
      // continua solo in memoria
    }
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<FocusSettings>) => persistSettings({ ...settingsRef.current, ...patch }),
    [persistSettings]
  );

  const startRun = useCallback(
    (link: FocusLink, label?: string) => {
      persistRun({
        phase: "lavoro",
        phaseStartedAt: new Date().toISOString(),
        phaseDurationMinutes: settingsRef.current.workMinutes,
        paused: false,
        pausedElapsedMs: 0,
        completedWorkCycles: 0,
        link,
        label,
      });
    },
    [persistRun]
  );

  const togglePause = useCallback(() => {
    setActiveRun((prev) => {
      if (!prev) return prev;
      const next: ActiveFocusRun = prev.paused
        ? { ...prev, paused: false, phaseStartedAt: new Date().toISOString() }
        : { ...prev, paused: true, pausedElapsedMs: elapsedMsInPhase(prev) };
      try {
        window.localStorage.setItem(ACTIVE_RUN_KEY, JSON.stringify(next));
      } catch {
        // continua solo in memoria
      }
      return next;
    });
  }, []);

  /** Registra in cronologia i minuti di lavoro appena completati — e se il collegamento è a
   * un blocco Metrica, li versa anche lì come nuova voce (stesso principio del cronometro
   * dentro il blocco stesso, vedi MetricTimer.tsx, solo innescato da un ciclo Pomodoro
   * invece che da un cronometro isolato: la metrica non deve sapere da dove arriva il
   * tempo). */
  const recordWorkPhase = useCallback(
    (run: ActiveFocusRun, workMs: number, completed: boolean) => {
      const workMinutes = Math.round((workMs / 60000) * 100) / 100;
      if (workMinutes <= 0) return;
      const now = new Date().toISOString();
      persistSessions((prev) => [
        ...prev,
        { id: newId(), startedAt: run.phaseStartedAt, endedAt: now, workMinutes, link: run.link, label: run.label, completed },
      ]);
      if (run.link.kind === "metrica" && run.link.hobbyId && run.link.blockId) {
        addMetricEntry(run.link.hobbyId, run.link.blockId, {
          date: now.slice(0, 10),
          value: workMinutes,
          note: "Sessione Focus",
        });
      }
    },
    [persistSessions, addMetricEntry]
  );

  const advancePhase = useCallback(() => {
    setActiveRun((prev) => {
      if (!prev) return prev;
      const s = settingsRef.current;
      const elapsedMs = elapsedMsInPhase(prev);

      if (prev.phase === "lavoro") {
        recordWorkPhase(prev, elapsedMs, true);
        const completedCycles = prev.completedWorkCycles + 1;
        const isLongBreak = completedCycles % s.longBreakEvery === 0;
        const nextPhase: FocusPhase = isLongBreak ? "pausa-lunga" : "pausa";
        const next: ActiveFocusRun = {
          ...prev,
          phase: nextPhase,
          phaseStartedAt: new Date().toISOString(),
          phaseDurationMinutes: isLongBreak ? s.longBreakMinutes : s.breakMinutes,
          paused: !s.autoStartNext,
          pausedElapsedMs: 0,
          completedWorkCycles: completedCycles,
        };
        try {
          window.localStorage.setItem(ACTIVE_RUN_KEY, JSON.stringify(next));
        } catch {
          // continua solo in memoria
        }
        return next;
      }

      const next: ActiveFocusRun = {
        ...prev,
        phase: "lavoro",
        phaseStartedAt: new Date().toISOString(),
        phaseDurationMinutes: s.workMinutes,
        paused: !s.autoStartNext,
        pausedElapsedMs: 0,
      };
      try {
        window.localStorage.setItem(ACTIVE_RUN_KEY, JSON.stringify(next));
      } catch {
        // continua solo in memoria
      }
      return next;
    });
  }, [recordWorkPhase]);

  const stopRun = useCallback(() => {
    setActiveRun((prev) => {
      if (prev && prev.phase === "lavoro") {
        recordWorkPhase(prev, elapsedMsInPhase(prev), false);
      }
      try {
        window.localStorage.removeItem(ACTIVE_RUN_KEY);
      } catch {
        // continua solo in memoria
      }
      return null;
    });
  }, [recordWorkPhase]);

  const removeSession = useCallback(
    (id: string) => persistSessions((prev) => prev.filter((s) => s.id !== id)),
    [persistSessions]
  );

  // Avanzamento automatico di fase quando il tempo scade — controllato ogni secondo mentre
  // l'app è aperta; se l'app resta chiusa più a lungo della fase, alla riapertura il primo
  // giro di questo intervallo la fa comunque avanzare (il calcolo è sempre su `phaseStartedAt`
  // reale, mai su un contatore che si sarebbe fermato da solo).
  useEffect(() => {
    if (!activeRun || activeRun.paused) return;
    const id = setInterval(() => {
      setActiveRun((prev) => {
        if (!prev || prev.paused) return prev;
        const elapsed = elapsedMsInPhase(prev);
        const durationMs = prev.phaseDurationMinutes * 60000;
        if (elapsed >= durationMs) {
          // advancePhase legge/scrive lo stato per conto proprio: qui basta invocarlo,
          // non serve calcolare il prossimo stato due volte.
          setTimeout(() => advancePhase(), 0);
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [activeRun, advancePhase]);

  const value = useMemo(
    () => ({ hydrated, settings, updateSettings, sessions, activeRun, startRun, togglePause, advancePhase, stopRun, removeSession }),
    [hydrated, settings, updateSettings, sessions, activeRun, startRun, togglePause, advancePhase, stopRun, removeSession]
  );

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoro deve essere usato dentro PomodoroProvider");
  return ctx;
}
