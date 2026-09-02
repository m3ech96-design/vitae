"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useFood } from "@/lib/food-context";
import { BASE_SLOTS, SNACK_SLOTS, MEAL_SLOT_LABELS, MealSlot } from "@/lib/food-types";
import { entriesForDate, macroTotals, weeklyTotals, slotsWithEntries } from "@/lib/food-stats";
import { todayIso, addDaysIso, weekdayShort } from "@/lib/date-format";
import { DayStrip } from "@/components/task/DayStrip";
import { MealSlotSection } from "@/components/food/MealSlotSection";
import { DailyTotalsCard } from "@/components/food/DailyTotalsCard";
import { WeeklyCaloriesCard } from "@/components/food/WeeklyCaloriesCard";
import { WaterTracker } from "@/components/food/WaterTracker";
import { FoodGoalsModal } from "@/components/food/FoodGoalsModal";
import { FoodFunStats } from "@/components/food/FoodFunStats";

export default function AlimentazionePage() {
  const { hydrated, entries, ingredients, goals } = useFood();
  const [date, setDate] = useState(todayIso());
  const [extraSnacks, setExtraSnacks] = useState<MealSlot[]>([]);
  const [goalsOpen, setGoalsOpen] = useState(false);

  const dayEntries = useMemo(() => entriesForDate(entries, date), [entries, date]);
  const dailyTotals = useMemo(() => macroTotals(dayEntries, ingredients), [dayEntries, ingredients]);
  const weekTotals = useMemo(() => weeklyTotals(entries, ingredients, date), [entries, ingredients, date]);
  const activeSlots = slotsWithEntries(dayEntries);

  const changeDate = (iso: string) => {
    setDate(iso);
    setExtraSnacks([]);
  };

  const visibleSnackSlots = SNACK_SLOTS.filter((s) => activeSlots.has(s) || extraSnacks.includes(s));
  const addableSnackSlots = SNACK_SLOTS.filter((s) => !visibleSnackSlots.includes(s));

  const isToday = date === todayIso();

  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Alimentazione</p>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Cosa hai mangiato oggi</h1>

      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={() => changeDate(addDaysIso(date, -1))}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 transition hover:border-aura-emerald/50"
          aria-label="Giorno precedente"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="font-display text-sm text-ink-100">
            {isToday ? "Oggi" : `${weekdayShort(date)} ${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`}
          </p>
          {!isToday && (
            <button onClick={() => changeDate(todayIso())} className="focus-ring text-[11px] text-aura-emerald">
              Torna a oggi
            </button>
          )}
        </div>
        <button
          onClick={() => changeDate(addDaysIso(date, 1))}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 transition hover:border-aura-emerald/50"
          aria-label="Giorno successivo"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mt-3">
        <DayStrip selected={date} onSelect={changeDate} hasTasks={(iso) => entriesForDate(entries, iso).length > 0} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <DailyTotalsCard totals={dailyTotals} goals={goals} onEditGoals={() => setGoalsOpen(true)} />
        <div className="space-y-3">
          <WeeklyCaloriesCard totals={weekTotals} goals={goals} />
          <WaterTracker date={date} />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {BASE_SLOTS.map((slot) => (
          <MealSlotSection key={slot} date={date} slot={slot} dayEntries={dayEntries} />
        ))}
        {visibleSnackSlots.map((slot) => (
          <MealSlotSection key={slot} date={date} slot={slot} dayEntries={dayEntries} />
        ))}
      </div>

      {addableSnackSlots.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {addableSnackSlots.map((slot) => (
            <button
              key={slot}
              onClick={() => setExtraSnacks((prev) => [...prev, slot])}
              className="focus-ring flex items-center gap-1.5 rounded-full border border-dashed border-white/15 px-3.5 py-2 text-xs text-ink-600 transition hover:border-aura-emerald/50 hover:text-ink-100"
            >
              <Plus size={12} /> {MEAL_SLOT_LABELS[slot]}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        <p className="mb-3 font-display text-sm text-ink-100">Curiosità</p>
        <FoodFunStats />
      </div>

      {goalsOpen && <FoodGoalsModal onClose={() => setGoalsOpen(false)} />}
    </div>
  );
}
