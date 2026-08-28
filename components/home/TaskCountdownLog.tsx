"use client";
import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { useTasks } from "@/lib/tasks-context";
import { tasksInReminderWindow, taskAnchorDateTime } from "@/lib/task-status";
import { Task } from "@/lib/types";
import { TaskWindow } from "@/components/task/TaskWindow";

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}g ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/** Le task il cui avviso anticipato è scattato compaiono qui con un countdown live fino
 * all'inizio (o alla scadenza) — la stessa durata scelta come avviso, che scorre a ritroso.
 * Ogni riga è toccabile e apre subito quella task in modifica, non è più solo un'etichetta. */
export function TaskCountdownLog() {
  const { tasks } = useTasks();
  const [now, setNow] = useState(() => new Date());
  const [openTask, setOpenTask] = useState<Task | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const active = tasksInReminderWindow(tasks, now);
  if (active.length === 0) return null;

  return (
    <div>
      <p className="mb-3 font-display text-xs uppercase tracking-[0.14em] text-ink-600">In Arrivo</p>
      <div className="space-y-2">
        {active.map((t) => {
          const anchor = taskAnchorDateTime(t);
          const remainingMs = anchor ? anchor.getTime() - now.getTime() : 0;
          return (
            <button
              key={t.id}
              onClick={() => setOpenTask(t)}
              className="focus-ring flex w-full items-center gap-3 rounded-xl2 border border-aura-cyan/25 bg-aura-cyan/[0.06] px-3.5 py-2.5 text-left transition hover:border-aura-cyan/45"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aura-cyan/15 text-aura-cyan">
                <Timer size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink-100">{t.title}</p>
                <p className="text-[11px] text-ink-600">Tra {formatCountdown(remainingMs)}</p>
              </div>
              <span className="shrink-0 font-display text-sm text-aura-cyan">{formatCountdown(remainingMs)}</span>
            </button>
          );
        })}
      </div>

      {openTask && <TaskWindow task={openTask} onClose={() => setOpenTask(null)} />}
    </div>
  );
}
