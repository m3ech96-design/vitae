"use client";
import { useMemo, useState } from "react";
import { History, Flame, Clock, X } from "lucide-react";
import { usePomodoro } from "@/lib/pomodoro-context";
import { useTasks } from "@/lib/tasks-context";
import { useHobby } from "@/lib/hobby-context";
import { formatDateShort, todayIso } from "@/lib/date-format";
import { HeatmapGrid } from "../hobby/HeatmapGrid";
import { MiniLineChart } from "../medical/MiniLineChart";
import { ConfirmDialog } from "../ui/ConfirmDialog";

/** Giorni consecutivi (fino a oggi) con almeno una sessione di lavoro completata — stesso
 * principio dello streak già usato per le Task quotidiane (vedi lib/task-status.ts), qui
 * applicato alle date distinte delle sessioni Focus invece che ai completamenti di una Task. */
function computeStreak(dates: string[]): number {
  const uniqueDates = new Set(dates);
  let streak = 0;
  const cursor = new Date();
  // Se oggi non ha ancora nessuna sessione, lo streak parte comunque da ieri: non è ancora
  // "rotto", semplicemente la giornata è in corso.
  if (!uniqueDates.has(todayIso())) cursor.setDate(cursor.getDate() - 1);
  while (uniqueDates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function FocusHistorySection() {
  const { sessions, removeSession } = usePomodoro();
  const { tasks } = useTasks();
  const { hobbies } = useHobby();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const completedSessions = useMemo(() => sessions.filter((s) => s.completed), [sessions]);
  const sessionDates = useMemo(() => completedSessions.map((s) => s.startedAt.slice(0, 10)), [completedSessions]);
  const streak = useMemo(() => computeStreak(sessionDates), [sessionDates]);

  const todayMinutes = useMemo(
    () => completedSessions.filter((s) => s.startedAt.slice(0, 10) === todayIso()).reduce((sum, s) => sum + s.workMinutes, 0),
    [completedSessions]
  );

  const dailyMinutes = useMemo(() => {
    const byDate = new Map<string, number>();
    completedSessions.forEach((s) => {
      const d = s.startedAt.slice(0, 10);
      byDate.set(d, (byDate.get(d) ?? 0) + s.workMinutes);
    });
    return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-30).map(([date, value]) => ({ date, value }));
  }, [completedSessions]);

  const recent = useMemo(() => [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 15), [sessions]);

  const linkLabelFor = (s: (typeof sessions)[number]) => {
    if (s.link.kind === "task") return tasks.find((t) => t.id === s.link.taskId)?.title ?? "Task eliminata";
    if (s.link.kind === "metrica") {
      const h = hobbies.find((x) => x.id === s.link.hobbyId);
      const b = h?.blocks.find((x) => x.id === s.link.blockId);
      return h && b ? `${h.name} · ${b.title}` : "Blocco eliminato";
    }
    return s.label ?? "Libera";
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-3.5 py-3">
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] text-ink-600">
            <Flame size={11} /> Streak
          </p>
          <p className="mt-0.5 text-lg text-ink-100">{streak} {streak === 1 ? "giorno" : "giorni"}</p>
        </div>
        <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-3.5 py-3">
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] text-ink-600">
            <Clock size={11} /> Oggi
          </p>
          <p className="mt-0.5 text-lg text-ink-100">{Math.round(todayMinutes)} min</p>
        </div>
      </div>

      {dailyMinutes.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] text-ink-600">Minuti di focus per giorno</p>
          <MiniLineChart points={dailyMinutes} unit="min" />
        </div>
      )}

      <div>
        <p className="mb-1.5 text-[11px] text-ink-600">Costanza</p>
        <HeatmapGrid dates={sessionDates} color="#7C5CFF" />
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 font-display text-sm text-ink-100">
          <History size={14} className="text-ink-600" /> Sessioni recenti
        </p>
        {recent.length === 0 ? (
          <p className="text-xs text-ink-800">Ancora nessuna sessione registrata.</p>
        ) : (
          <div className="space-y-1.5">
            {recent.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.015] px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-100">{linkLabelFor(s)}</p>
                  <p className="text-[11px] text-ink-800">
                    {formatDateShort(s.startedAt.slice(0, 10))} · {Math.round(s.workMinutes)} min
                    {!s.completed && <span className="text-aura-amber"> · interrotta</span>}
                  </p>
                </div>
                <button onClick={() => setPendingDelete(s.id)} className="focus-ring shrink-0 text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminare questa sessione?"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            removeSession(pendingDelete);
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}
