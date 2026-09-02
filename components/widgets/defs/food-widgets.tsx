"use client";
import { useFood } from "@/lib/food-context";
import { entriesForDate, macroTotals, weeklyTotals, longestFast, mostAndLeastEaten, sameSlotLastWeek } from "@/lib/food-stats";
import { todayIso } from "@/lib/date-format";
import { Flame, Timer, Sparkles, Feather, History } from "lucide-react";
import { BASE_SLOTS, MEAL_SLOT_LABELS } from "@/lib/food-types";
import { WidgetRing, WidgetStat, WidgetEmpty, WidgetList } from "../primitives";
import { WidgetSize } from "@/lib/widgets/types";

export function CaloriesTodayWidget({ size }: { size: WidgetSize }) {
  const { entries, ingredients, goals } = useFood();
  const today = todayIso();
  const kcal = Math.round(macroTotals(entriesForDate(entries, today), ingredients).kcal);
  const max = goals.dailyKcalMax ?? goals.dailyKcalMin ?? 0;
  const pct = max > 0 ? kcal / max : 0;
  return <WidgetRing pct={pct} color="#FFB454" label="Calorie di oggi" centerValue={`${kcal}`} />;
}

export function WaterTodayWidget({ size }: { size: WidgetSize }) {
  const { waterLog, goals } = useFood();
  const today = todayIso();
  const liters = waterLog[today] ?? 0;
  const goal = goals.waterGoalLiters ?? 0;
  const pct = goal > 0 ? liters / goal : 0;
  return <WidgetRing pct={pct} color="#5EC8FF" label="Acqua bevuta" centerValue={`${liters.toFixed(1)}L`} />;
}

export function WeeklyCaloriesGoalWidget({ size }: { size: WidgetSize }) {
  const { entries, ingredients, goals } = useFood();
  const today = todayIso();
  const kcal = Math.round(weeklyTotals(entries, ingredients, today).kcal);
  const max = goals.weeklyKcalMax ?? goals.weeklyKcalMin ?? 0;
  if (!max) return <WidgetStat icon={Flame} value={`${kcal}`} label="Calorie (7gg)" color="#FFB454" />;
  const pct = kcal / max;
  return <WidgetRing pct={pct} color={pct > 1 ? "#FF4D6D" : "#FFB454"} label="Calorie settimana" centerValue={`${kcal}`} />;
}

export function LongestFastWidget({ size }: { size: WidgetSize }) {
  const { entries } = useFood();
  const fast = longestFast(entries, MEAL_SLOT_LABELS);
  if (!fast) return <WidgetEmpty icon={Timer} label="Ancora nessun digiuno registrato" />;
  return <WidgetStat icon={Timer} value={`${Math.floor(fast.hours)}h`} label="Digiuno più lungo" color="#7C5CFF" />;
}

export function MostEatenFoodWidget({ size }: { size: WidgetSize }) {
  const { entries, ingredients } = useFood();
  const { most } = mostAndLeastEaten(entries, ingredients);
  if (!most) return <WidgetEmpty icon={Sparkles} label="Ancora poche voci registrate" />;
  return <WidgetStat icon={Sparkles} value={most.ingredient.name} label={`Mangiato ${most.count}×`} color="#FFB454" />;
}

export function LeastEatenFoodWidget({ size }: { size: WidgetSize }) {
  const { entries, ingredients } = useFood();
  const { least } = mostAndLeastEaten(entries, ingredients);
  if (!least) return <WidgetEmpty icon={Feather} label="Ancora poche voci registrate" />;
  return <WidgetStat icon={Feather} value={least.ingredient.name} label={`Mangiato ${least.count}×`} color="#34D399" />;
}

export function RecentMealsWidget({ size }: { size: WidgetSize }) {
  const { entries, ingredients } = useFood();
  const today = todayIso();
  const todays = entriesForDate(entries, today);
  const items = [...todays]
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 4)
    .map((e) => {
      const ing = ingredients.find((i) => i.id === e.ingredientId);
      return { id: e.id, label: ing?.name ?? "?", meta: MEAL_SLOT_LABELS[e.slot].split(" · ")[0] };
    });
  return <WidgetList title="Ultimi pasti di oggi" icon={Flame} items={items} emptyLabel="Ancora nulla registrato oggi" />;
}

export function MealSuggestionWidget({ size }: { size: WidgetSize }) {
  const { entries, ingredients } = useFood();
  const today = todayIso();
  const dayEntries = entriesForDate(entries, today);
  const emptySlot = BASE_SLOTS.find((slot) => !dayEntries.some((e) => e.slot === slot));
  if (!emptySlot) return <WidgetEmpty icon={History} label="Hai già registrato tutti i pasti base" />;
  const suggestion = sameSlotLastWeek(entries, today, emptySlot, ingredients);
  if (suggestion.length === 0) return <WidgetEmpty icon={History} label={`Ancora niente per ${MEAL_SLOT_LABELS[emptySlot].split(" · ")[0]}`} />;
  return <WidgetStat icon={History} value={suggestion.map((i) => i.name).join(", ")} label={`Una settimana fa a ${MEAL_SLOT_LABELS[emptySlot].split(" · ")[0]}`} color="#7C5CFF" />;
}
