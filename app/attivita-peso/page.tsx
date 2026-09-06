"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Clock, Flame, Zap, Scale, CalendarClock, Trophy, BarChart3, Ruler, Camera } from "lucide-react";
import { useHealth } from "@/lib/health-context";
import { Workout } from "@/lib/types";
import { addDaysIso, todayIso, formatDateShort } from "@/lib/date-format";
import { ActivityOrb } from "@/components/health/ActivityOrb";
import { AddWorkoutModal } from "@/components/health/AddWorkoutModal";
import { WorkoutDetail } from "@/components/health/WorkoutDetail";
import { WeightChart } from "@/components/health/WeightChart";
import { WeightModal } from "@/components/health/WeightModal";
import { WeeklyGoalCard } from "@/components/health/WeeklyGoalCard";
import { PersonalRecordsSection } from "@/components/health/PersonalRecordsSection";
import { ActivityHeatmap } from "@/components/health/ActivityHeatmap";
import { CategoryBreakdown } from "@/components/health/CategoryBreakdown";
import { PeriodComparisonCard } from "@/components/health/PeriodComparisonCard";
import { BodyMeasurementsSection } from "@/components/health/BodyMeasurementsSection";
import { ProgressPhotosSection } from "@/components/health/ProgressPhotosSection";
import { BmiBadge } from "@/components/health/BmiBadge";
import { ScheduleWorkoutModal } from "@/components/health/ScheduleWorkoutModal";
import { GlassCard } from "@/components/ui/GlassCard";
import { PersonalCardSheet } from "@/components/home/PersonalCardSheet";
import Link from "next/link";
import { History } from "lucide-react";

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

type SheetId = "record" | "andamento" | "misure" | "foto";

export default function AttivitaPesoPage() {
  const { hydrated, workouts, weightEntries, weightGoal } = useHealth();
  const [addWorkoutOpen, setAddWorkoutOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [addWeightOpen, setAddWeightOpen] = useState(false);
  const [openWorkoutId, setOpenWorkoutId] = useState<string | null>(null);
  const [editWeightId, setEditWeightId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetId | null>(null);

  const weekAgo = addDaysIso(todayIso(), -6);
  const weekWorkouts = useMemo(() => workouts.filter((w) => w.date >= weekAgo), [workouts, weekAgo]);
  const weekMinutes = weekWorkouts.reduce((s, w) => s + w.minutes, 0);
  const weekCalories = weekWorkouts.reduce((s, w) => s + w.calories, 0);
  const streak = useMemo(() => activeDayStreak(workouts.map((w) => w.date)), [workouts]);

  // "Il tuo campo energetico" mostra solo le attività registrate nelle ultime 24 ore da
  // ADESSO (finestra mobile su `createdAt`, il momento vero in cui l'attività è stata
  // salvata — non su `date`, che l'utente può impostare anche nel passato per un'attività
  // dimenticata: quella va comunque vista nel campo appena la si registra). Il tick al
  // minuto è necessario perché la finestra deve svuotarsi anche senza che l'utente tocchi
  // nulla, semplicemente perché passa il tempo — un useMemo dipendente solo da `workouts`
  // non si aggiornerebbe mai da solo.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const energyFieldWorkouts = useMemo(() => {
    const cutoff = now - 24 * 60 * 60 * 1000;
    return [...workouts]
      .filter((w) => new Date(w.createdAt).getTime() >= cutoff)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [workouts, now]);

  const openWorkout: Workout | undefined = workouts.find((w) => w.id === openWorkoutId);
  const editWeightEntry = weightEntries.find((w) => w.id === editWeightId);
  const recentWeightEntries = useMemo(
    () => [...weightEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [weightEntries]
  );
  const currentWeight = recentWeightEntries[0]?.value;

  const statCards: { id: SheetId; label: string; icon: typeof Trophy; color: string }[] = [
    { id: "record", label: "Record personali", icon: Trophy, color: "#FFB454" },
    { id: "andamento", label: "Andamento", icon: BarChart3, color: "#00E5C7" },
    { id: "misure", label: "Misure corporee", icon: Ruler, color: "#34D399" },
    { id: "foto", label: "Foto progressi", icon: Camera, color: "#7C5CFF" },
  ];

  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Attività e peso</p>
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

      <div className="mt-5">
        <WeeklyGoalCard />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-sm text-ink-100">Il tuo campo energetico</p>
          <div className="flex items-center gap-1.5">
            <Link
              href="/attivita-peso/cronologia"
              className="focus-ring flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-[11px] text-ink-300 transition hover:border-aura-violet/50"
              aria-label="Cronologia attività"
            >
              <History size={13} />
            </Link>
            <button
              onClick={() => setScheduleOpen(true)}
              className="focus-ring flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-[11px] text-ink-300 transition hover:border-aura-violet/50"
              aria-label="Pianifica un allenamento futuro"
            >
              <CalendarClock size={13} />
            </button>
            <button
              onClick={() => setAddWorkoutOpen(true)}
              className="focus-ring flex items-center gap-1.5 rounded-full bg-aura-gradient px-3.5 py-2 text-[11px] font-display text-void-950 shadow-glow"
            >
              <Plus size={13} /> Attività
            </button>
          </div>
        </div>
        {energyFieldWorkouts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl2 border border-dashed border-white/10 py-14 text-center">
            <Zap size={20} className="text-ink-800" />
            <p className="text-sm text-ink-600">
              {workouts.length === 0
                ? "Il Campo è ancora spento. Registra la prima attività."
                : "Nessuna attività nelle ultime 24 ore."}
            </p>
            {workouts.length > 0 && (
              <Link href="/attivita-peso/cronologia" className="focus-ring text-xs text-aura-violet">
                Vedi la cronologia completa
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4 rounded-xl3 border border-white/[0.06] bg-white/[0.015] px-5 py-8">
            {energyFieldWorkouts.map((w) => (
              <ActivityOrb key={w.id} workout={w} onOpen={() => setOpenWorkoutId(w.id)} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {statCards.map(({ id, label, icon: Icon, color }) => (
          <button key={id} onClick={() => setSheet(id)} className="text-left">
            <GlassCard className="p-3.5 transition hover:border-white/20">
              <Icon size={17} style={{ color }} />
              <p className="mt-2.5 font-display text-xs text-ink-100">{label}</p>
            </GlassCard>
          </button>
        ))}
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
          <BmiBadge weightKg={currentWeight} />
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
        La sincronizzazione automatica con Fitbit, Garmin e simili richiederà un servizio
        lato server per gestire le connessioni in sicurezza; Apple Salute, in più, è
        raggiungibile solo da un'app nativa, mai da un sito web — per ora registra tutto
        qui, a mano, in pochi tocchi.
      </p>

      {addWorkoutOpen && <AddWorkoutModal onClose={() => setAddWorkoutOpen(false)} />}
      {scheduleOpen && <ScheduleWorkoutModal onClose={() => setScheduleOpen(false)} />}
      {addWeightOpen && <WeightModal onClose={() => setAddWeightOpen(false)} />}
      {editWeightEntry && <WeightModal entry={editWeightEntry} onClose={() => setEditWeightId(null)} />}
      {openWorkout && <WorkoutDetail workout={openWorkout} onClose={() => setOpenWorkoutId(null)} />}

      {sheet === "record" && (
        <PersonalCardSheet title="Record personali" onClose={() => setSheet(null)}>
          <PersonalRecordsSection workouts={workouts} />
        </PersonalCardSheet>
      )}
      {sheet === "andamento" && (
        <PersonalCardSheet title="Andamento" onClose={() => setSheet(null)}>
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-xs text-ink-600">Ultime ~17 settimane</p>
              <ActivityHeatmap workouts={workouts} />
            </div>
            <div>
              <p className="mb-2 text-xs text-ink-600">Per categoria, ultimi 30 giorni</p>
              <CategoryBreakdown workouts={workouts} sinceDate={addDaysIso(todayIso(), -29)} />
            </div>
            <div>
              <p className="mb-2 text-xs text-ink-600">Confronto periodi</p>
              <PeriodComparisonCard workouts={workouts} />
            </div>
          </div>
        </PersonalCardSheet>
      )}
      {sheet === "misure" && (
        <PersonalCardSheet title="Misure corporee" onClose={() => setSheet(null)}>
          <BodyMeasurementsSection />
        </PersonalCardSheet>
      )}
      {sheet === "foto" && (
        <PersonalCardSheet title="Foto progressi" onClose={() => setSheet(null)}>
          <ProgressPhotosSection />
        </PersonalCardSheet>
      )}
    </div>
  );
}
