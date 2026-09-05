"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, ListChecks, Copy, ClipboardPaste } from "lucide-react";
import { useFood } from "@/lib/food-context";
import { BASE_SLOTS, SNACK_SLOTS, MEAL_SLOT_LABELS, MealSlot, macroGramGoals } from "@/lib/food-types";
import { entriesForDate, macroTotals, weeklyTotals, slotsWithEntries, carbsForDisplay } from "@/lib/food-stats";
import { todayIso, addDaysIso, weekdayShort } from "@/lib/date-format";
import { DayStrip } from "@/components/task/DayStrip";
import { MealSlotSection } from "@/components/food/MealSlotSection";
import { DailyTotalsCard } from "@/components/food/DailyTotalsCard";
import { WeeklyCaloriesCard } from "@/components/food/WeeklyCaloriesCard";
import { WaterTracker } from "@/components/food/WaterTracker";
import { FoodGoalsModal } from "@/components/food/FoodGoalsModal";
import { FoodFunStats } from "@/components/food/FoodFunStats";

export default function AlimentazionePage() {
  const router = useRouter();
  const { hydrated, entries, ingredients, goals, copiedMenu, copyMenu, pasteMenu, clearCopiedMenu } = useFood();
  const [date, setDate] = useState(todayIso());
  const [extraSnacks, setExtraSnacks] = useState<MealSlot[]>([]);
  const [goalsOpen, setGoalsOpen] = useState(false);

  const dayEntries = useMemo(() => entriesForDate(entries, date), [entries, date]);
  const dailyTotals = useMemo(() => macroTotals(dayEntries, ingredients), [dayEntries, ingredients]);
  const weekTotals = useMemo(() => weeklyTotals(entries, ingredients, date), [entries, ingredients, date]);
  const activeSlots = slotsWithEntries(dayEntries);

  // Stesso confronto già fatto in DailyTotalsCard, qui riusato per segnalare lo sforamento
  // anche vicino al menù dei pasti (vedi MealSlotSection) — "nel menù", non solo scrollando
  // fino alla card riassuntiva più in alto.
  const gramGoals = macroGramGoals(goals);
  const carbsShown = carbsForDisplay(dailyTotals, goals.netCarbsEnabled);
  const overMacroLabels = gramGoals
    ? [
        carbsShown > gramGoals.carbs ? (goals.netCarbsEnabled ? "Carboidrati netti" : "Carboidrati") : null,
        dailyTotals.protein > gramGoals.protein ? "Proteine" : null,
        dailyTotals.fat > gramGoals.fat ? "Grassi" : null,
      ].filter((l): l is string => Boolean(l))
    : [];

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
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Alimentazione</p>
          <h1 className="mt-1 font-display text-2xl text-ink-100">Cosa hai mangiato oggi</h1>
        </div>
        <button
          onClick={() => router.push("/alimentazione/ingredienti")}
          className="focus-ring mt-1 flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-[11px] text-ink-300 transition hover:border-aura-emerald/50"
        >
          <ListChecks size={13} /> Ingredienti e ricette
        </button>
      </div>

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
        <DailyTotalsCard totals={dailyTotals} goals={goals} onEditGoals={() => setGoalsOpen(true)} onOpen={() => router.push(`/alimentazione/oggi/${date}`)} />
        <div className="space-y-3">
          <WeeklyCaloriesCard totals={weekTotals} goals={goals} onOpen={() => router.push(`/alimentazione/settimana/${date}`)} />
          <WaterTracker date={date} />
        </div>
      </div>

      {/* Copia/incolla dell'intero menù di una giornata su un'altra: "copia" prende una
         fotografia delle voci del giorno mostrato in questo momento, "incolla" le aggiunge
         al giorno mostrato quando si preme — così per spostare un menù da un giorno A a un
         giorno B basta aprire A, Copia, spostarsi su B, Incolla, senza dover ricreare ogni
         voce a mano. Il menù copiato resta pronto finché non se ne copia un altro o non si
         chiude esplicitamente, anche cambiando giorno nel frattempo. */}
      <div className="mt-6 flex items-center gap-2">
        <button
          onClick={() => copyMenu(date)}
          disabled={dayEntries.length === 0}
          className="focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs text-ink-300 transition hover:border-aura-emerald/50 disabled:opacity-40 disabled:pointer-events-none"
        >
          <Copy size={13} /> Copia questo menù
        </button>
        <button
          onClick={() => pasteMenu(date)}
          disabled={!copiedMenu}
          className="focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs text-ink-300 transition hover:border-aura-emerald/50 disabled:opacity-40 disabled:pointer-events-none"
        >
          <ClipboardPaste size={13} /> Incolla qui
        </button>
      </div>
      {copiedMenu && (
        <p className="mt-2 text-center text-[11px] text-ink-600">
          Menù copiato dal{" "}
          {copiedMenu.sourceDate === date
            ? " giorno mostrato"
            : ` ${weekdayShort(copiedMenu.sourceDate)} ${copiedMenu.sourceDate.slice(8, 10)}/${copiedMenu.sourceDate.slice(5, 7)}`}{" "}
          · {copiedMenu.entries.length} {copiedMenu.entries.length === 1 ? "voce" : "voci"} pronte per essere incollate altrove —{" "}
          <button onClick={clearCopiedMenu} className="focus-ring text-aura-emerald underline-offset-2 hover:underline">
            annulla
          </button>
        </p>
      )}

      <div className="mt-6 space-y-3">
        {[...BASE_SLOTS, ...visibleSnackSlots].map((slot, i) => {
          // Il segnale rosso compare una sola volta, sulla prima sezione del giorno che ha
          // già delle voci — non ripetuto identico su ogni card del menù, che sarebbe
          // rumoroso senza aggiungere informazione.
          const isFirstWithEntries = activeSlots.has(slot) && [...BASE_SLOTS, ...visibleSnackSlots].slice(0, i).every((s) => !activeSlots.has(s));
          return (
            <MealSlotSection
              key={slot}
              date={date}
              slot={slot}
              dayEntries={dayEntries}
              overMacroLabels={isFirstWithEntries ? overMacroLabels : undefined}
            />
          );
        })}
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
