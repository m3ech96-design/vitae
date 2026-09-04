"use client";
import { CalendarRange } from "lucide-react";
import { MacroTotals, carbsForDisplay } from "@/lib/food-stats";
import { FoodGoals, macroGramGoals } from "@/lib/food-types";
import { GlassCard } from "../ui/GlassCard";

function barColor(kcal: number, min: number | null, max: number | null): string {
  if (max !== null && kcal > max) return "#FF6B9D";
  if (min !== null && kcal < min) return "#FFB454";
  return "#00E5C7";
}

export function WeeklyCaloriesCard({ totals, goals, onOpen }: { totals: MacroTotals; goals: FoodGoals; onOpen?: () => void }) {
  const kcal = Math.round(totals.kcal);
  const { weeklyKcalMin, weeklyKcalMax } = goals;
  const hasGoal = weeklyKcalMin !== null || weeklyKcalMax !== null;
  const denom = weeklyKcalMax ?? weeklyKcalMin ?? 0;
  const pct = hasGoal && denom > 0 ? Math.min(100, Math.round((kcal / denom) * 100)) : 0;

  // La suddivisione macro (vedi FoodGoals) è pensata per giorno, non per settimana — qui
  // moltiplichiamo per 7 il grammi-obiettivo giornaliero solo per dare un riferimento di
  // massima nella stessa card, non un secondo obiettivo indipendente da impostare a parte.
  const dailyGramGoals = macroGramGoals(goals);
  const carbsShown = carbsForDisplay(totals, goals.netCarbsEnabled);
  const overAnyMacro =
    dailyGramGoals !== null &&
    (carbsShown > dailyGramGoals.carbs * 7 || totals.protein > dailyGramGoals.protein * 7 || totals.fat > dailyGramGoals.fat * 7);

  return (
    <GlassCard
      className={`p-4 ${onOpen ? "cursor-pointer transition hover:border-white/20" : ""}`}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={onOpen ? (e) => (e.key === "Enter" || e.key === " ") && onOpen() : undefined}
    >
      <p className="flex items-center gap-1.5 font-display text-sm text-ink-100">
        <CalendarRange size={14} className="text-aura-cyan" /> Ultimi 7 giorni
      </p>
      <p className="mt-2 font-display text-xl text-ink-100">{kcal} kcal</p>
      {hasGoal ? (
        <>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor(kcal, weeklyKcalMin, weeklyKcalMax) }} />
          </div>
          <p className="mt-2 text-xs text-ink-600">
            Obiettivo: {weeklyKcalMin ?? "—"} – {weeklyKcalMax ?? "—"} kcal
          </p>
        </>
      ) : (
        <p className="mt-2 text-xs text-ink-800">Nessun obiettivo settimanale impostato.</p>
      )}
      {overAnyMacro && <p className="mt-2 text-[11px] text-aura-pink">Uno o più macronutrienti hanno superato l&apos;obiettivo medio.</p>}
    </GlassCard>
  );
}
