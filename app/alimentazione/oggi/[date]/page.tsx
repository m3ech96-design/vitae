"use client";
import { useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Flame } from "lucide-react";
import { useFood } from "@/lib/food-context";
import { MEAL_SLOT_LABELS, BASE_SLOTS, SNACK_SLOTS, macroGramGoals, netCarbs } from "@/lib/food-types";
import { entriesForDate, entriesBySlot, macroTotals, kcalForEntry, carbsForDisplay, longestFast } from "@/lib/food-stats";
import { findIngredient } from "@/lib/food-stats";
import { weekdayShort, todayIso } from "@/lib/date-format";
import { GlassCard } from "@/components/ui/GlassCard";

const ALL_SLOTS = [...BASE_SLOTS, ...SNACK_SLOTS];

function MacroBar({ label, value, goalValue, color }: { label: string; value: number; goalValue: number | null; color: string }) {
  const over = goalValue !== null && value > goalValue;
  const pct = goalValue && goalValue > 0 ? Math.min(100, Math.round((value / goalValue) * 100)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className={over ? "text-aura-pink" : "text-ink-200"}>{label}</span>
        <span className={over ? "text-aura-pink" : "text-ink-600"}>
          {Math.round(value * 10) / 10} g{goalValue !== null ? ` / ${Math.round(goalValue)} g` : ""}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full transition-all" style={{ width: `${goalValue !== null ? pct : 0}%`, background: over ? "#FF6B9D" : color }} />
      </div>
    </div>
  );
}

/**
 * "Calorie di oggi" espansa — toccare la card in Alimentazione porta qui: la stessa
 * giornata, ma con tutte le informazioni che la card compatta non ha spazio per mostrare —
 * l'andamento per pasto, il confronto in grammi (non solo in percentuale) tra ciascun
 * macronutriente e il proprio obiettivo (vedi `macroGramGoals`), l'intero menù con il
 * dettaglio macro per voce (non solo le kcal, come nel menù di app/alimentazione/page.tsx),
 * e il digiuno più lungo di giornata se rilevante.
 */
export default function CaloriesDetailPage() {
  const router = useRouter();
  const params = useParams<{ date: string }>();
  const date = params.date;
  const { hydrated, entries, ingredients, goals } = useFood();

  const dayEntries = useMemo(() => entriesForDate(entries, date), [entries, date]);
  const totals = useMemo(() => macroTotals(dayEntries, ingredients), [dayEntries, ingredients]);
  const gramGoals = macroGramGoals(goals);
  const carbsShown = carbsForDisplay(totals, goals.netCarbsEnabled);
  const fast = useMemo(() => longestFast(dayEntries, MEAL_SLOT_LABELS), [dayEntries]);

  const bySlot = ALL_SLOTS.map((slot) => ({
    slot,
    entries: entriesBySlot(dayEntries, slot),
    kcal: Math.round(entriesBySlot(dayEntries, slot).reduce((s, e) => s + kcalForEntry(e, ingredients), 0)),
  })).filter((s) => s.entries.length > 0);

  const maxSlotKcal = Math.max(1, ...bySlot.map((s) => s.kcal));
  const isToday = date === todayIso();

  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <button onClick={() => router.back()} className="focus-ring flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-200">
        <ArrowLeft size={15} /> Indietro
      </button>

      <div className="mt-4 flex items-center gap-2">
        <Flame size={16} className="text-aura-amber" />
        <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">
          {isToday ? "Oggi" : `${weekdayShort(date)} ${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`}
        </p>
      </div>
      <h1 className="mt-1 font-display text-2xl text-ink-100">{Math.round(totals.kcal)} kcal</h1>

      <GlassCard className="mt-6 p-4">
        <p className="mb-3 font-display text-sm text-ink-100">Macronutrienti rispetto all&apos;obiettivo</p>
        {gramGoals ? (
          <div className="space-y-3">
            <MacroBar label={goals.netCarbsEnabled ? "Carboidrati netti" : "Carboidrati"} value={carbsShown} goalValue={gramGoals.carbs} color="#00E5C7" />
            <MacroBar label="Proteine" value={totals.protein} goalValue={gramGoals.protein} color="#7C5CFF" />
            <MacroBar label="Grassi" value={totals.fat} goalValue={gramGoals.fat} color="#FFB454" />
          </div>
        ) : (
          <p className="text-xs text-ink-800">
            Attiva la suddivisione dei macronutrienti negli obiettivi per vedere qui il confronto in grammi.
          </p>
        )}
      </GlassCard>

      <GlassCard className="mt-4 p-4">
        <p className="mb-3 font-display text-sm text-ink-100">Calorie per pasto</p>
        {bySlot.length === 0 ? (
          <p className="text-xs text-ink-800">Nessun pasto registrato in questo giorno.</p>
        ) : (
          <div className="space-y-2.5">
            {bySlot.map(({ slot, kcal }) => (
              <div key={slot}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-200">{MEAL_SLOT_LABELS[slot]}</span>
                  <span className="text-ink-600">{kcal} kcal</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-aura-amber/70" style={{ width: `${(kcal / maxSlotKcal) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {fast && (
        <GlassCard className="mt-4 p-4">
          <p className="font-display text-sm text-ink-100">Digiuno più lungo di giornata</p>
          <p className="mt-1 font-display text-xl text-ink-100">{Math.round(fast.hours * 10) / 10} h</p>
          <p className="mt-1 text-xs text-ink-800">
            Da {fast.fromLabel} a {fast.toLabel}
          </p>
        </GlassCard>
      )}

      <div className="mt-6">
        <p className="mb-3 font-display text-sm text-ink-100">Tutto quello che hai mangiato</p>
        <div className="space-y-3">
          {ALL_SLOTS.map((slot) => {
            const slotEntries = entriesBySlot(dayEntries, slot);
            if (slotEntries.length === 0) return null;
            return (
              <GlassCard key={slot} className="p-4">
                <p className="mb-2.5 font-display text-xs uppercase tracking-[0.14em] text-ink-600">{MEAL_SLOT_LABELS[slot]}</p>
                <div className="space-y-2">
                  {slotEntries.map((entry) => {
                    const ing = findIngredient(ingredients, entry.ingredientId);
                    if (!ing) return null;
                    const factor = kcalForEntry(entry, ingredients) / (ing.kcal || 1);
                    return (
                      <div key={entry.id} className="rounded-xl2 border border-white/[0.06] bg-white/[0.015] px-3.5 py-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-ink-100">{ing.name}</span>
                          <span className="text-xs text-ink-600">{Math.round(kcalForEntry(entry, ingredients))} kcal</span>
                        </div>
                        <p className="mt-1 text-[11px] text-ink-800">
                          {entry.quantity}
                          {ing.unit === "altro" ? ` ${ing.unitLabel}` : ing.unit} · Grassi {Math.round(ing.fat * factor * 10) / 10}g ·{" "}
                          {goals.netCarbsEnabled ? "Carb. netti" : "Carb."}{" "}
                          {Math.round((goals.netCarbsEnabled ? netCarbs(ing.carbs, ing.fiber) : ing.carbs) * factor * 10) / 10}g · Prot.{" "}
                          {Math.round(ing.protein * factor * 10) / 10}g
                        </p>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
