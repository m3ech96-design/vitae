"use client";
import { useMemo, useState } from "react";
import { Plus, Clock, Flame, Zap, Scale } from "lucide-react";
import { useHealth } from "@/lib/health-context";
import { Workout } from "@/lib/types";
import { addDaysIso, todayIso, formatDateShort } from "@/lib/date-format";
import { ActivityOrb } from "@/components/health/ActivityOrb";
import { AddWorkoutModal } from "@/components/health/AddWorkoutModal";
import { WorkoutDetail } from "@/components/health/WorkoutDetail";
import { WeightChart } from "@/components/health/WeightChart";
import { WeightModal } from "@/components/health/WeightModal";
import { GlassCard } from "@/components/ui/GlassCard";

function activeDayStreak(dates: string[]): number {
  const uniqueDays = [...new Set(dates.map((d) => d.slice(0, 10)))].sort();
  if (uniqueDays.length === 0) return 0;
  let streak = 0;
  let cursor = todayIso();
  const set = new Set(uniqueDays);
  while (set.has(cursor)) {
    streak++;
    cursor = addDaysIso(cursor, -1);
  }
  return streak;
}

export default function SalutePage() {
  const { hydrated, workouts, weightEntries, weightGoal } = useHealth();
  const [addWorkoutOpen, setAddWorkoutOpen] = useState(false);
  const [addWeightOpen, setAddWeightOpen] = useState(false);
  const [openWorkoutId, setOpenWorkoutId] = useState<string | null>(null);
  const [editWeightId, setEditWeightId] = useState<string | null>(null);

  const weekAgo = addDaysIso(todayIso(), -6);
  const weekWorkouts = useMemo(() => workouts.filter((w) => w.date >= weekAgo), [workouts, weekAgo]);
  const weekMinutes = weekWorkouts.reduce((s, w) => s + w.minutes, 0);
  const weekCalories = weekWorkouts.reduce((s, w) => s + w.calories, 0);
  const streak = useMemo(() => activeDayStreak(workouts.map((w) => w.date)), [workouts]);

  const recentWorkouts = useMemo(
    () => [...workouts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 18),
    [workouts]
  );

  const openWorkout: Workout | undefined = workouts.find((w) => w.id === openWorkoutId);
  const editWeightEntry = weightEntries.find((w) => w.id === editWeightId);
  const recentWeightEntries = useMemo(
    () => [...weightEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [weightEntries]
  );

  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Salute</p>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Energia, settimana dopo settimana</h1>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <GlassCard className="p-3.5 text-center">
          <Clock size={16} className="mx-auto text-aura-cyan" />
          <p className="mt-2 font-display text-lg text-ink-100">{weekMinutes}</p>
          <p className="text-[10px] text-ink-800">Minuti · 7 giorni</p>
        </GlassCard>
        <GlassCard className="p-3.5 text-center">
          <Flame size={16} className="mx-auto text-aura-amber" />
          <p className="mt-2 font-display text-lg text-ink-100">{weekCalories}</p>
          <p className="text-[10px] text-ink-800">Kcal · 7 giorni</p>
        </GlassCard>
        <GlassCard className="p-3.5 text-center">
          <Zap size={16} className="mx-auto text-aura-violet" />
          <p className="mt-2 font-display text-lg text-ink-100">{streak}</p>
          <p className="text-[10px] text-ink-800">Giorni di fila</p>
        </GlassCard>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-sm text-ink-100">Il tuo campo energetico</p>
          <button
            onClick={() => setAddWorkoutOpen(true)}
            className="focus-ring flex items-center gap-1.5 rounded-full bg-aura-gradient px-3.5 py-2 text-[11px] font-display text-void-950 shadow-glow"
          >
            <Plus size={13} /> Attività
          </button>
        </div>
        {recentWorkouts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl2 border border-dashed border-white/10 py-14 text-center">
            <Zap size={20} className="text-ink-800" />
            <p className="text-sm text-ink-600">Il Campo è ancora spento. Registra la prima attività.</p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4 rounded-xl3 border border-white/[0.06] bg-white/[0.015] px-5 py-8">
            {recentWorkouts.map((w) => (
              <ActivityOrb key={w.id} workout={w} onOpen={() => setOpenWorkoutId(w.id)} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 font-display text-sm text-ink-100">
            <Scale size={15} className="text-aura-emerald" /> Peso
          </p>
          <button
            onClick={() => setAddWeightOpen(true)}
            className="focus-ring flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-[11px] text-ink-300 transition hover:border-aura-emerald/50"
          >
            <Plus size={13} /> Pesata
          </button>
        </div>
        <GlassCard className="p-4">
          <WeightChart entries={weightEntries} goal={weightGoal} />
          {weightGoal !== null && (
            <p className="mt-2 text-xs text-ink-800">Obiettivo: {weightGoal} Kg</p>
          )}
        </GlassCard>
        {recentWeightEntries.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {recentWeightEntries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setEditWeightId(entry.id)}
                className="focus-ring rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-ink-400 transition hover:border-aura-emerald/50 hover:text-ink-100"
              >
                {entry.value} kg · {formatDateShort(entry.date)}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-[11px] leading-relaxed text-ink-800">
        La sincronizzazione automatica con Fitbit, Garmin, Apple Salute e simili richiederà un
        servizio lato server per gestire le connessioni in sicurezza — per ora registra tutto qui,
        a mano, in pochi tocchi.
      </p>

      {addWorkoutOpen && <AddWorkoutModal onClose={() => setAddWorkoutOpen(false)} />}
      {addWeightOpen && <WeightModal onClose={() => setAddWeightOpen(false)} />}
      {editWeightEntry && <WeightModal entry={editWeightEntry} onClose={() => setEditWeightId(null)} />}
      {openWorkout && <WorkoutDetail workout={openWorkout} onClose={() => setOpenWorkoutId(null)} />}
    </div>
  );
}
