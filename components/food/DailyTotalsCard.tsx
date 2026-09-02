"use client";
import { Flame, Target } from "lucide-react";
import { MacroTotals } from "@/lib/food-stats";
import { FoodGoals } from "@/lib/food-types";
import { GlassCard } from "../ui/GlassCard";

function barColor(kcal: number, min: number | null, max: number | null): string {
  if (max !== null && kcal > max) return "#FF6B9D"; // aura-pink: sopra il massimo
  if (min !== null && kcal < min) return "#FFB454"; // aura-amber: sotto il minimo
  return "#34D399"; // aura-emerald: nel range, o nessun limite superato
}

function MacroRow({ label, value, unit = "g" }: { label: string; value: number; unit?: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-ink-600">{label}</span>
      <span className="text-ink-200">{Math.round(value * 10) / 10} {unit}</span>
    </div>
  );
}

export function DailyTotalsCard({
  totals,
  goals,
  onEditGoals,
}: {
  totals: MacroTotals;
  goals: FoodGoals;
  onEditGoals: () => void;
}) {
  const kcal = Math.round(totals.kcal);
  const { dailyKcalMin, dailyKcalMax } = goals;
  const hasGoal = dailyKcalMin !== null || dailyKcalMax !== null;
  const denom = dailyKcalMax ?? dailyKcalMin ?? 0;
  const pct = hasGoal && denom > 0 ? Math.min(100, Math.round((kcal / denom) * 100)) : 0;

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 font-display text-sm text-ink-100">
          <Flame size={14} className="text-aura-amber" /> Calorie di oggi
        </p>
        <button onClick={onEditGoals} className="focus-ring flex items-center gap-1 text-[11px] text-ink-600 hover:text-ink-200">
          <Target size={11} /> Obiettivi
        </button>
      </div>

      <p className="mt-2 font-display text-2xl text-ink-100">{kcal} kcal</p>

      {hasGoal ? (
        <>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: barColor(kcal, dailyKcalMin, dailyKcalMax) }}
            />
          </div>
          <p className="mt-2 text-xs text-ink-600">
            Obiettivo: {dailyKcalMin ?? "—"} – {dailyKcalMax ?? "—"} kcal
          </p>
        </>
      ) : (
        <p className="mt-2 text-xs text-ink-800">Nessun obiettivo impostato.</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-white/[0.06] pt-3">
        <MacroRow label="Grassi" value={totals.fat} />
        <MacroRow label="Di cui saturi" value={totals.saturatedFat} />
        <MacroRow label="Carboidrati" value={totals.carbs} />
        <MacroRow label="Di cui zuccheri" value={totals.sugars} />
        <MacroRow label="Fibre" value={totals.fiber} />
        <MacroRow label="Proteine" value={totals.protein} />
        <MacroRow label="Sale" value={totals.salt} />
      </div>
    </GlassCard>
  );
}
