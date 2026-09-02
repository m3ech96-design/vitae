"use client";
import { useMemo, useState } from "react";
import { Sparkles, Feather, PartyPopper, Moon } from "lucide-react";
import { useFood } from "@/lib/food-context";
import { mostAndLeastEaten, bestBinge, longestFast, entriesBySlot } from "@/lib/food-stats";
import { BASE_SLOTS, SNACK_SLOTS, MEAL_SLOT_LABELS } from "@/lib/food-types";
import { GlassCard } from "../ui/GlassCard";
import { PersonalCardSheet } from "../home/PersonalCardSheet";

export function FoodFunStats() {
  const { entries, ingredients } = useFood();
  const [bingeOpen, setBingeOpen] = useState(false);

  const { most, least } = useMemo(() => mostAndLeastEaten(entries, ingredients), [entries, ingredients]);
  const binge = useMemo(() => bestBinge(entries, ingredients), [entries, ingredients]);
  const fast = useMemo(() => longestFast(entries, MEAL_SLOT_LABELS), [entries]);

  if (entries.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-3.5">
          <Sparkles size={16} className="text-aura-amber" />
          <p className="mt-2 text-[11px] text-ink-600">Il cibo che mangi di più</p>
          {most ? (
            <p className="mt-0.5 font-display text-sm text-ink-100">
              {most.ingredient.name} <span className="text-ink-600">· {most.count}×</span>
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-ink-800">—</p>
          )}
        </GlassCard>

        <GlassCard className="p-3.5">
          <Feather size={16} className="text-aura-emerald" />
          <p className="mt-2 text-[11px] text-ink-600">Il cibo che mangi di meno</p>
          {least ? (
            <p className="mt-0.5 font-display text-sm text-ink-100">
              {least.ingredient.name} <span className="text-ink-600">· {least.count}×</span>
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-ink-800">—</p>
          )}
        </GlassCard>

        <button onClick={() => binge && setBingeOpen(true)} className="text-left">
          <GlassCard className="p-3.5 transition hover:border-white/20">
            <PartyPopper size={16} className="text-aura-pink" />
            <p className="mt-2 text-[11px] text-ink-600">Migliore abbuffata</p>
            {binge ? (
              <p className="mt-0.5 font-display text-sm text-ink-100">
                {Math.round(binge.kcal)} kcal <span className="text-ink-600">· {binge.date.slice(8, 10)}/{binge.date.slice(5, 7)}</span>
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-ink-800">—</p>
            )}
          </GlassCard>
        </button>

        <GlassCard className="p-3.5">
          <Moon size={16} className="text-aura-violet" />
          <p className="mt-2 text-[11px] text-ink-600">Digiuno più lungo</p>
          {fast ? (
            <p className="mt-0.5 font-display text-sm text-ink-100">
              {Math.floor(fast.hours)}h {Math.round((fast.hours % 1) * 60)}m
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-ink-800">—</p>
          )}
        </GlassCard>
      </div>

      {fast && (
        <p className="mt-2 text-[11px] text-ink-800">
          Tra {fast.fromLabel} e {fast.toLabel}.
        </p>
      )}

      {bingeOpen && binge && (
        <PersonalCardSheet title={`Menu del ${binge.date.slice(8, 10)}/${binge.date.slice(5, 7)}/${binge.date.slice(0, 4)}`} onClose={() => setBingeOpen(false)}>
          <p className="mb-4 text-sm text-ink-600">{Math.round(binge.kcal)} kcal in totale — il record.</p>
          <div className="space-y-4">
            {[...BASE_SLOTS, ...SNACK_SLOTS].map((slot) => {
              const slotEntries = entriesBySlot(binge.entries, slot);
              if (slotEntries.length === 0) return null;
              return (
                <div key={slot}>
                  <p className="mb-1.5 font-display text-xs text-ink-100">{MEAL_SLOT_LABELS[slot]}</p>
                  <div className="space-y-1">
                    {slotEntries.map((e) => {
                      const ing = ingredients.find((i) => i.id === e.ingredientId);
                      if (!ing) return null;
                      return (
                        <p key={e.id} className="text-xs text-ink-600">
                          {ing.name} · {e.quantity}{ing.unit === "altro" ? ` ${ing.unitLabel}` : ing.unit}
                        </p>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </PersonalCardSheet>
      )}
    </>
  );
}
