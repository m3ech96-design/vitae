"use client";
import { Scale, Flame, TrendingDown, TrendingUp, Pill, Stethoscope } from "lucide-react";
import { useHealth } from "@/lib/health-context";
import { useMedical } from "@/lib/medical-context";
import { todayIso } from "@/lib/date-format";
import { MiniLineChart } from "@/components/medical/MiniLineChart";
import { WidgetStat, WidgetEmpty } from "../primitives";
import { WidgetSize } from "@/lib/widgets/types";

export function CurrentWeightWidget({ size }: { size: WidgetSize }) {
  const { weightEntries } = useHealth();
  if (weightEntries.length === 0) return <WidgetEmpty icon={Scale} label="Nessuna pesata registrata" />;
  const sorted = [...weightEntries].sort((a, b) => b.date.localeCompare(a.date));
  const current = sorted[0];
  const previous = sorted[1];
  const delta = previous ? current.value - previous.value : 0;
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Scale;
  return (
    <WidgetStat
      icon={Icon}
      value={`${current.value}kg`}
      label="Peso attuale"
      color={delta > 0 ? "#FF6B9D" : delta < 0 ? "#34D399" : "#8B90A8"}
      sub={previous ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)}kg` : undefined}
    />
  );
}

export function WorkoutStreakWidget({ size }: { size: WidgetSize }) {
  const { workouts } = useHealth();
  const dates = new Set(workouts.map((w) => w.date));
  let streak = 0;
  const cursor = new Date();
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return <WidgetStat icon={Flame} value={streak} label={streak === 1 ? "Giorno di allenamento" : "Giorni di allenamento"} color="#FFB454" />;
}

export function WeeklyActiveMinutesWidget({ size }: { size: WidgetSize }) {
  const { workouts } = useHealth();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoIso = weekAgo.toISOString().slice(0, 10);
  const minutes = workouts.filter((w) => w.date >= weekAgoIso).reduce((s, w) => s + w.minutes, 0);
  return <WidgetStat icon={Flame} value={minutes} label="Minuti attivi (7gg)" color="#00E5C7" />;
}

export function WeightChart30dWidget({ size }: { size: WidgetSize }) {
  const { weightEntries } = useHealth();
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthAgoIso = monthAgo.toISOString().slice(0, 10);
  const points = weightEntries.filter((e) => e.date >= monthAgoIso).map((e) => ({ date: e.date, value: e.value }));
  if (points.length < 2) return <WidgetEmpty icon={Scale} label="Servono almeno due pesate" />;
  return (
    <div className="flex h-full flex-col">
      <p className="mb-1 text-[11px] text-ink-600">Peso — ultimi 30 giorni</p>
      <div className="flex-1">
        <MiniLineChart points={points} unit="kg" color="#00E5C7" />
      </div>
    </div>
  );
}

export function WeightVsGoalWidget({ size }: { size: WidgetSize }) {
  const { weightEntries, weightGoal } = useHealth();
  if (weightEntries.length === 0 || !weightGoal) return <WidgetEmpty icon={Scale} label="Serve una pesata e un obiettivo" />;
  const current = [...weightEntries].sort((a, b) => b.date.localeCompare(a.date))[0].value;
  const delta = current - weightGoal;
  return (
    <WidgetStat
      icon={Scale}
      value={`${Math.abs(delta).toFixed(1)}kg`}
      label={delta > 0 ? "Sopra l'obiettivo" : delta < 0 ? "Sotto l'obiettivo" : "Obiettivo raggiunto"}
      color={Math.abs(delta) < 0.5 ? "#34D399" : "#FFB454"}
    />
  );
}

export function NextMedicationWidget({ size }: { size: WidgetSize }) {
  const { medications } = useMedical();
  const today = todayIso();
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const ongoing = medications.filter((m) => !m.endDate || m.endDate >= today);
  const next = ongoing
    .flatMap((m) => m.times.map((t) => ({ med: m, time: t })))
    .filter((x) => x.time >= hhmm)
    .sort((a, b) => a.time.localeCompare(b.time))[0];
  if (!next) return <WidgetEmpty icon={Pill} label="Nessun farmaco in programma oggi" />;
  return <WidgetStat icon={Pill} value={next.time} label={next.med.name} color="#7C5CFF" />;
}

export function NextMedicalAppointmentWidget({ size }: { size: WidgetSize }) {
  const { appointments } = useMedical();
  const nowIso = new Date().toISOString();
  const next = [...appointments].filter((a) => !a.completed && a.date >= nowIso).sort((a, b) => a.date.localeCompare(b.date))[0];
  if (!next) return <WidgetEmpty icon={Stethoscope} label="Nessun appuntamento in programma" />;
  return <WidgetStat icon={Stethoscope} value={next.title} label={new Date(next.date).toLocaleDateString("it-IT", { day: "numeric", month: "short" })} color="#5EC8FF" />;
}

export function TodayActiveMinutesWidget({ size }: { size: WidgetSize }) {
  const { workouts } = useHealth();
  const today = todayIso();
  const minutes = workouts.filter((w) => w.date === today).reduce((s, w) => s + w.minutes, 0);
  return <WidgetStat icon={Flame} value={minutes} label="Minuti attivi oggi" color={minutes > 0 ? "#00E5C7" : "#8B90A8"} />;
}
