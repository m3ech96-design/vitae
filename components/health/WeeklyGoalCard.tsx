"use client";
import { useState } from "react";
import { Target } from "lucide-react";
import { useHealth, WeeklyGoalType } from "@/lib/health-context";
import { addDaysIso, todayIso } from "@/lib/date-format";
import { GlassCard } from "../ui/GlassCard";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";

const GOAL_UNIT: Record<WeeklyGoalType, string> = { minuti: "minuti", sessioni: "sessioni", calorie: "kcal" };

export function WeeklyGoalCard() {
  const { weeklyGoal, setWeeklyGoal, workouts } = useHealth();
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState<WeeklyGoalType>(weeklyGoal?.type ?? "minuti");
  const [target, setTarget] = useState(weeklyGoal ? String(weeklyGoal.target) : "150");

  const weekAgo = addDaysIso(todayIso(), -6);
  const weekWorkouts = workouts.filter((w) => w.date >= weekAgo);
  const progress = weeklyGoal
    ? weeklyGoal.type === "minuti"
      ? weekWorkouts.reduce((s, w) => s + w.minutes, 0)
      : weeklyGoal.type === "calorie"
        ? weekWorkouts.reduce((s, w) => s + w.calories, 0)
        : weekWorkouts.length
    : 0;
  const pct = weeklyGoal ? Math.min(100, Math.round((progress / weeklyGoal.target) * 100)) : 0;

  const submit = () => {
    const n = parseInt(target, 10);
    if (!n || n <= 0) return;
    setWeeklyGoal({ type, target: n });
    setEditing(false);
  };

  if (!weeklyGoal && !editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-3.5 text-xs text-ink-600 hover:border-aura-cyan/50 hover:text-ink-200"
      >
        <Target size={14} /> Imposta un obiettivo settimanale
      </button>
    );
  }

  if (editing) {
    return (
      <GlassCard className="space-y-2.5 p-4">
        <div className="flex gap-1.5">
          {(Object.keys(GOAL_UNIT) as WeeklyGoalType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`focus-ring rounded-full border px-3 py-1.5 text-xs capitalize transition ${
                type === t ? "border-aura-cyan/60 bg-aura-cyan/15 text-ink-100" : "border-white/10 text-ink-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <TextField label={`Obiettivo settimanale (${GOAL_UNIT[type]})`} type="number" value={target} onChange={(e) => setTarget(e.target.value)} autoFocus />
        <div className="flex justify-end gap-2">
          {weeklyGoal && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setWeeklyGoal(null);
                setEditing(false);
              }}
            >
              Rimuovi
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Annulla
          </Button>
          <Button size="sm" onClick={submit}>
            Salva
          </Button>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm text-ink-100">
          <Target size={14} className="text-aura-cyan" /> Obiettivo della settimana
        </p>
        <button onClick={() => setEditing(true)} className="focus-ring text-[11px] text-ink-600 hover:text-ink-200">
          Modifica
        </button>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-aura-gradient transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-ink-600">
        {progress} / {weeklyGoal!.target} {GOAL_UNIT[weeklyGoal!.type]} · {pct}%
      </p>
    </GlassCard>
  );
}
