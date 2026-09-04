"use client";
import { useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CalendarRange, Trophy, TrendingDown } from "lucide-react";
import { useFood } from "@/lib/food-context";
import { macroGramGoals } from "@/lib/food-types";
import { dailyTotalsForLastWeek, weeklyTotals, carbsForDisplay } from "@/lib/food-stats";
import { weekdayShort } from "@/lib/date-format";
import { GlassCard } from "@/components/ui/GlassCard";

/**
 * "Ultimi 7 giorni" espansa — toccare la card in Alimentazione porta qui: lo stesso totale
 * settimanale, ma spezzato giorno per giorno (vedi `dailyTotalsForLastWeek`) con un grafico
 * a barre per individuare i picchi a colpo d'occhio, quanti giorni hanno rispettato
 * l'obiettivo calorico giornaliero, e il giorno migliore/peggiore della settimana per
 * aderenza all'obiettivo — non solo il cumulo dei sette giorni insieme, come nella card
 * compatta.
 */
export default function WeeklyDetailPage() {
  const router = useRouter();
  const params = useParams<{ date: string }>();
  const date = params.date;
  const { hydrated, entries, ingredients, goals } = useFood();

  const days = useMemo(() => dailyTotalsForLastWeek(entries, ingredients, date), [entries, ingredients, date]);
  const weekTotal = useMemo(() => weeklyTotals(entries, ingredients, date), [entries, ingredients, date]);
  const gramGoals = macroGramGoals(goals);
  const { dailyKcalMin, dailyKcalMax } = goals;
  const hasDailyGoal = dailyKcalMin !== null || dailyKcalMax !== null;

  const maxKcal = Math.max(1, ...days.map((d) => d.totals.kcal), dailyKcalMax ?? 0);

  const dayStatus = (kcal: number): "sopra" | "sotto" | "ok" | "nessuno" => {
    if (!hasDailyGoal) return "nessuno";
    if (dailyKcalMax !== null && kcal > dailyKcalMax) return "sopra";
    if (dailyKcalMin !== null && kcal < dailyKcalMin) return "sotto";
    return "ok";
  };

  const daysWithEntries = days.filter((d) => d.totals.kcal > 0);
  const okCount = daysWithEntries.filter((d) => dayStatus(d.totals.kcal) === "ok").length;

  const best =
    daysWithEntries.length > 0
      ? daysWithEntries.reduce((a, b) => (dayStatus(a.totals.kcal) === "ok" && dayStatus(b.totals.kcal) !== "ok" ? a : b))
      : null;
  const worst =
    daysWithEntries.length > 0
      ? daysWithEntries.reduce((a, b) => {
          const da = dailyKcalMax !== null ? Math.abs(a.totals.kcal - dailyKcalMax) : 0;
          const db = dailyKcalMax !== null ? Math.abs(b.totals.kcal - dailyKcalMax) : 0;
          return dayStatus(a.totals.kcal) !== "ok" && da >= db ? a : b;
        })
      : null;

  const avgCarbs = daysWithEntries.length > 0 ? weekTotal.carbs / daysWithEntries.length : 0;
  const avgProtein = daysWithEntries.length > 0 ? weekTotal.protein / daysWithEntries.length : 0;
  const avgFat = daysWithEntries.length > 0 ? weekTotal.fat / daysWithEntries.length : 0;
  const avgCarbsShown = carbsForDisplay({ carbs: avgCarbs, fiber: daysWithEntries.length > 0 ? weekTotal.fiber / daysWithEntries.length : 0 }, goals.netCarbsEnabled);

  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <button onClick={() => router.back()} className="focus-ring flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-200">
        <ArrowLeft size={15} /> Indietro
      </button>

      <div className="mt-4 flex items-center gap-2">
        <CalendarRange size={16} className="text-aura-cyan" />
        <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Ultimi 7 giorni</p>
      </div>
      <h1 className="mt-1 font-display text-2xl text-ink-100">{Math.round(weekTotal.kcal)} kcal totali</h1>
      {hasDailyGoal && (
        <p className="mt-1 text-xs text-ink-600">
          {okCount} di {daysWithEntries.length || 0} giorni registrati nell&apos;obiettivo giornaliero
        </p>
      )}

      <GlassCard className="mt-6 p-4">
        <p className="mb-3 font-display text-sm text-ink-100">Calorie giorno per giorno</p>
        <div className="flex items-end gap-2" style={{ height: 120 }}>
          {days.map((d) => {
            const kcal = Math.round(d.totals.kcal);
            const status = dayStatus(kcal);
            const color = status === "sopra" ? "#FF6B9D" : status === "sotto" ? "#FFB454" : status === "ok" ? "#34D399" : "#00E5C7";
            const heightPct = Math.max(2, (kcal / maxKcal) * 100);
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t-md transition-all" style={{ height: `${heightPct}%`, background: color }} />
                </div>
                <span className="text-[9px] text-ink-800">{weekdayShort(d.date).slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
        {dailyKcalMax !== null && (
          <p className="mt-3 text-[11px] text-ink-800">Linea obiettivo: {dailyKcalMin ?? "—"} – {dailyKcalMax} kcal/giorno</p>
        )}
      </GlassCard>

      {daysWithEntries.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {best && (
            <GlassCard className="p-4">
              <p className="flex items-center gap-1.5 text-xs text-ink-600">
                <Trophy size={12} className="text-aura-emerald" /> Giorno migliore
              </p>
              <p className="mt-1 font-display text-sm text-ink-100">{weekdayShort(best.date)}</p>
              <p className="text-xs text-ink-600">{Math.round(best.totals.kcal)} kcal</p>
            </GlassCard>
          )}
          {worst && worst.date !== best?.date && (
            <GlassCard className="p-4">
              <p className="flex items-center gap-1.5 text-xs text-ink-600">
                <TrendingDown size={12} className="text-aura-pink" /> Da tenere d&apos;occhio
              </p>
              <p className="mt-1 font-display text-sm text-ink-100">{weekdayShort(worst.date)}</p>
              <p className="text-xs text-ink-600">{Math.round(worst.totals.kcal)} kcal</p>
            </GlassCard>
          )}
        </div>
      )}

      <GlassCard className="mt-4 p-4">
        <p className="mb-3 font-display text-sm text-ink-100">Media giornaliera macronutrienti</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="font-display text-lg text-ink-100">{Math.round(avgCarbsShown * 10) / 10}</p>
            <p className="text-[10px] text-ink-600">{goals.netCarbsEnabled ? "g carb. netti" : "g carboidrati"}</p>
            {gramGoals && <p className="text-[9px] text-ink-800">obiettivo {Math.round(gramGoals.carbs)}g</p>}
          </div>
          <div>
            <p className="font-display text-lg text-ink-100">{Math.round(avgProtein * 10) / 10}</p>
            <p className="text-[10px] text-ink-600">g proteine</p>
            {gramGoals && <p className="text-[9px] text-ink-800">obiettivo {Math.round(gramGoals.protein)}g</p>}
          </div>
          <div>
            <p className="font-display text-lg text-ink-100">{Math.round(avgFat * 10) / 10}</p>
            <p className="text-[10px] text-ink-600">g grassi</p>
            {gramGoals && <p className="text-[9px] text-ink-800">obiettivo {Math.round(gramGoals.fat)}g</p>}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
