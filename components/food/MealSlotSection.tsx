"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useFood } from "@/lib/food-context";
import { FoodEntry, MealSlot, MEAL_SLOT_LABELS } from "@/lib/food-types";
import { entriesBySlot, kcalForEntry, sameSlotLastWeek } from "@/lib/food-stats";
import { GlassCard } from "../ui/GlassCard";
import { EntryModal } from "./EntryModal";

export function MealSlotSection({ date, slot, dayEntries }: { date: string; slot: MealSlot; dayEntries: FoodEntry[] }) {
  const { ingredients, entries } = useFood();
  const [addOpen, setAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<FoodEntry | null>(null);

  const slotEntries = entriesBySlot(dayEntries, slot);
  const subtotal = Math.round(slotEntries.reduce((s, e) => s + kcalForEntry(e, ingredients), 0));
  const suggestion = slotEntries.length === 0 ? sameSlotLastWeek(entries, date, slot, ingredients) : [];

  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-sm text-ink-100">{MEAL_SLOT_LABELS[slot]}</p>
        <div className="flex items-center gap-2">
          {slotEntries.length > 0 && <span className="text-xs text-ink-600">{subtotal} kcal</span>}
          <button
            onClick={() => setAddOpen(true)}
            className="focus-ring flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1.5 text-[11px] text-ink-300 transition hover:border-aura-emerald/50"
          >
            <Plus size={12} /> Aggiungi
          </button>
        </div>
      </div>

      {slotEntries.length === 0 ? (
        <div>
          <p className="text-xs text-ink-800">Ancora niente qui.</p>
          {suggestion.length > 0 && (
            <p className="mt-2 text-[11px] text-ink-600">
              La settimana scorsa qui avevi mangiato: {suggestion.map((i) => i.name).join(", ")}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {slotEntries.map((entry) => {
            const ing = ingredients.find((i) => i.id === entry.ingredientId);
            if (!ing) return null;
            return (
              <button
                key={entry.id}
                onClick={() => setEditEntry(entry)}
                className="focus-ring flex w-full items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.015] px-3.5 py-2 text-left transition hover:border-white/20"
              >
                <span className="text-sm text-ink-200">
                  {ing.name} <span className="text-ink-800">· {entry.quantity}{ing.unit === "altro" ? ` ${ing.unitLabel}` : ing.unit}</span>
                </span>
                <span className="text-xs text-ink-600">{Math.round(kcalForEntry(entry, ingredients))} kcal</span>
              </button>
            );
          })}
        </div>
      )}

      {addOpen && <EntryModal date={date} slot={slot} onClose={() => setAddOpen(false)} />}
      {editEntry && <EntryModal date={date} slot={slot} entry={editEntry} onClose={() => setEditEntry(null)} />}
    </GlassCard>
  );
}
