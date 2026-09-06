"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Flame } from "lucide-react";
import { useHealth } from "@/lib/health-context";
import { Workout } from "@/lib/types";
import { categoryOf, activityLabel } from "@/lib/activity-catalog";
import { formatDateShort, todayIso } from "@/lib/date-format";
import { GlassCard } from "@/components/ui/GlassCard";
import { WorkoutDetail } from "@/components/health/WorkoutDetail";

/** Raggruppa le attività per data (yyyy-mm-dd), ciascun gruppo ordinato dalla più recente
 * alla meno recente al proprio interno (per orario reale di registrazione), e i gruppi
 * stessi in ordine di data decrescente — la stessa lettura "più recente in alto" del campo
 * energetico, solo senza il limite delle 24 ore. */
function groupByDate(workouts: Workout[]): { date: string; items: Workout[] }[] {
  const byDate = new Map<string, Workout[]>();
  for (const w of workouts) {
    const list = byDate.get(w.date) ?? [];
    list.push(w);
    byDate.set(w.date, list);
  }
  return [...byDate.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({
      date,
      items: [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }));
}

/**
 * Elenco completo di tutte le attività registrate, senza il limite delle 24 ore del "campo
 * energetico" in app/attivita-peso/page.tsx — quando un'attività esce dal campo perché sono
 * passate 24 ore da quando è stata registrata, resta comunque raggiungibile qui: i dati non
 * vengono mai persi, solo la vista a sfere ne mostra soltanto una finestra recente.
 */
export default function CronologiaAttivitaPage() {
  const router = useRouter();
  const { hydrated, workouts } = useHealth();
  const [openWorkoutId, setOpenWorkoutId] = useState<string | null>(null);

  const groups = useMemo(() => groupByDate(workouts), [workouts]);
  const openWorkout = workouts.find((w) => w.id === openWorkoutId);

  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <button
        onClick={() => router.back()}
        className="focus-ring flex items-center gap-1.5 text-xs text-ink-600 hover:text-ink-200"
      >
        <ArrowLeft size={14} /> Indietro
      </button>

      <p className="mt-4 font-display text-xs uppercase tracking-[0.28em] text-ink-600">Attività e peso</p>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Cronologia attività</h1>
      <p className="mt-1 text-sm text-ink-600">
        {workouts.length === 0
          ? "Non hai ancora registrato nessuna attività."
          : `${workouts.length} ${workouts.length === 1 ? "attività registrata" : "attività registrate"} in totale`}
      </p>

      <div className="mt-6 space-y-6">
        {groups.map((group) => (
          <div key={group.date}>
            <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-ink-600">
              {group.date === todayIso() ? "Oggi" : formatDateShort(group.date)}
            </p>
            <div className="space-y-1.5">
              {group.items.map((w) => {
                const cat = categoryOf(w.activityId);
                const Icon = cat.icon;
                return (
                  <button
                    key={w.id}
                    onClick={() => setOpenWorkoutId(w.id)}
                    className="focus-ring flex w-full items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.015] px-4 py-3 text-left transition hover:border-white/20"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{ background: `${cat.color}22` }}
                    >
                      <Icon size={16} style={{ color: cat.color }} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink-100">{activityLabel(w.activityId)}</span>
                      <span className="mt-0.5 flex items-center gap-3 text-xs text-ink-600">
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {w.minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame size={11} /> {w.calories} kcal
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {openWorkout && <WorkoutDetail workout={openWorkout} onClose={() => setOpenWorkoutId(null)} />}
    </div>
  );
}
