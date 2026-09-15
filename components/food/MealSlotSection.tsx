"use client";
import { useState } from "react";
import { Plus, AlertTriangle, Copy, ClipboardPaste } from "lucide-react";
import { useFood } from "@/lib/food-context";
import { FoodEntry, MealSlot, MEAL_SLOT_LABELS } from "@/lib/food-types";
import { entriesBySlot, kcalForEntry, sameSlotLastWeek } from "@/lib/food-stats";
import { weekdayShort } from "@/lib/date-format";
import { GlassCard } from "../ui/GlassCard";
import { EntryModal } from "./EntryModal";

export function MealSlotSection({
  date,
  slot,
  dayEntries,
  overMacroLabels,
}: {
  date: string;
  slot: MealSlot;
  dayEntries: FoodEntry[];
  /** Etichette dei macronutrienti già sopra il proprio obiettivo giornaliero (vedi
   * macroGramGoals in app/alimentazione/page.tsx) — mostrate qui, vicino al menù dei
   * pasti stesso, non solo nella card "Calorie di oggi" più in alto: lo stesso segnale
   * rosso richiesto "nel menù", raggiungibile senza dover risalire la pagina. Assente o
   * vuoto quando nessun macro è sforato, o la suddivisione non è attiva. */
  overMacroLabels?: string[];
}) {
  const { ingredients, entries, copiedMenu, copyMeal, pasteMeal, clearCopiedMenu } = useFood();
  const [addOpen, setAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<FoodEntry | null>(null);

  const slotEntries = entriesBySlot(dayEntries, slot);
  const subtotal = Math.round(slotEntries.reduce((s, e) => s + kcalForEntry(e, ingredients), 0));
  const suggestion = slotEntries.length === 0 ? sameSlotLastWeek(entries, date, slot, ingredients) : [];

  // Il "porta appunti" del menù è per un SOLO pasto alla volta (vedi food-context.tsx): un
  // pulsante Incolla su questa sezione compare solo se il pasto copiato è proprio questo
  // stesso slot — incollare la colazione copiata dentro la sezione Cena non avrebbe senso.
  const canPasteHere = copiedMenu !== null && copiedMenu.slot === slot;

  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-sm text-ink-100">{MEAL_SLOT_LABELS[slot]}</p>
        <div className="flex items-center gap-1.5">
          {slotEntries.length > 0 && <span className="mr-0.5 text-xs text-ink-600">{subtotal} kcal</span>}
          {slotEntries.length > 0 && (
            <button
              onClick={() => copyMeal(date, slot)}
              className="focus-ring flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-ink-600 transition hover:border-aura-emerald/50 hover:text-ink-200"
              aria-label={`Copia ${MEAL_SLOT_LABELS[slot].toLowerCase()}`}
            >
              <Copy size={12} />
            </button>
          )}
          {canPasteHere && (
            <button
              onClick={() => pasteMeal(date)}
              className="focus-ring flex h-7 w-7 items-center justify-center rounded-full border border-aura-emerald/40 text-aura-emerald transition hover:border-aura-emerald/70"
              aria-label={`Incolla ${MEAL_SLOT_LABELS[slot].toLowerCase()}`}
            >
              <ClipboardPaste size={12} />
            </button>
          )}
          <button
            onClick={() => setAddOpen(true)}
            className="focus-ring flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1.5 text-[11px] text-ink-300 transition hover:border-aura-emerald/50"
          >
            <Plus size={12} /> Aggiungi
          </button>
        </div>
      </div>

      {canPasteHere && (
        <p className="mb-3 text-[11px] text-ink-600">
          {MEAL_SLOT_LABELS[slot]} copiata dal{" "}
          {copiedMenu.sourceDate === date ? "giorno mostrato" : `${weekdayShort(copiedMenu.sourceDate)} ${copiedMenu.sourceDate.slice(8, 10)}/${copiedMenu.sourceDate.slice(5, 7)}`}{" "}
          · {copiedMenu.entries.length} {copiedMenu.entries.length === 1 ? "voce" : "voci"} pronte per essere incollate —{" "}
          <button onClick={clearCopiedMenu} className="focus-ring text-aura-emerald underline-offset-2 hover:underline">
            annulla
          </button>
        </p>
      )}

      {overMacroLabels && overMacroLabels.length > 0 && (
        <p className="mb-3 flex items-center gap-1.5 text-[11px] text-aura-pink">
          <AlertTriangle size={11} /> {overMacroLabels.join(", ")} {overMacroLabels.length === 1 ? "superato" : "superati"} oggi
        </p>
      )}

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
