"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Search, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useFood } from "@/lib/food-context";
import { Ingredient, FoodEntry, MealSlot, MEAL_SLOT_LABELS, baseQuantity, scaleFactor } from "@/lib/food-types";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { AddIngredientModal } from "./AddIngredientModal";

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function quantityLabel(ingredient: Ingredient): string {
  if (ingredient.unit === "g") return "Quantità (g)";
  if (ingredient.unit === "ml") return "Quantità (ml)";
  return `Quantità (${ingredient.unitLabel || "unità"})`;
}

/** "125 kcal /100g" per g/ml; per "altro" mostra anche il peso di 1 unità, dato che i macro
 * restano sempre legati al peso vero, non all'unità di comodo. */
function ingredientSummary(ing: Ingredient): string {
  const base = ing.unit === "ml" ? "100 ml" : "100 g";
  if (ing.unit === "altro") {
    return `${ing.kcal} kcal/${base} · 1 ${ing.unitLabel} = ${ing.gramsPerUnit} g`;
  }
  return `${ing.kcal} kcal / ${base}`;
}

export function EntryModal({
  date,
  slot,
  entry,
  onClose,
}: {
  date: string;
  slot: MealSlot;
  entry?: FoodEntry;
  onClose: () => void;
}) {
  const { ingredients, addEntry, updateEntry, removeEntry } = useFood();
  const initialIngredient = entry ? ingredients.find((i) => i.id === entry.ingredientId) ?? null : null;

  const [selected, setSelected] = useState<Ingredient | null>(initialIngredient);
  const [query, setQuery] = useState("");
  const [quantity, setQuantity] = useState(entry ? String(entry.quantity) : "");
  const [time, setTime] = useState(entry?.time ?? nowHHMM());
  const [creatingIngredient, setCreatingIngredient] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return ingredients.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 12);
  }, [ingredients, query]);

  const previewKcal = useMemo(() => {
    if (!selected) return 0;
    const q = parseFloat(quantity.replace(",", ".")) || 0;
    return Math.round(selected.kcal * scaleFactor(selected, q));
  }, [selected, quantity]);

  const gramsEquivalent = useMemo(() => {
    if (!selected || selected.unit !== "altro") return null;
    const q = parseFloat(quantity.replace(",", ".")) || 0;
    return baseQuantity(selected, q);
  }, [selected, quantity]);

  const canSave = Boolean(selected) && parseFloat(quantity.replace(",", ".")) > 0 && time;

  const submit = () => {
    if (!selected || !canSave) return;
    const payload = { date, slot, ingredientId: selected.id, quantity: parseFloat(quantity.replace(",", ".")), time };
    if (entry) updateEntry(entry.id, payload);
    else addEntry(payload);
    onClose();
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <div>
            <p className="font-display text-lg text-ink-100">{entry ? "Modifica voce" : "Aggiungi al menu"}</p>
            <p className="text-xs text-ink-600">{MEAL_SLOT_LABELS[slot]}</p>
          </div>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {!selected ? (
            <>
              <div className="relative">
                <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-800" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cerca un ingrediente già salvato..."
                  className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-4 text-sm text-ink-100 placeholder:text-ink-800"
                />
              </div>

              <div className="space-y-1.5">
                {results.map((ing) => (
                  <button
                    key={ing.id}
                    onClick={() => setSelected(ing)}
                    className="focus-ring flex w-full items-center justify-between rounded-xl2 border border-white/10 bg-white/[0.02] px-4 py-2.5 text-left transition hover:border-aura-emerald/50"
                  >
                    <span className="text-sm text-ink-100">{ing.name}</span>
                    <span className="text-xs text-ink-600">{ingredientSummary(ing)}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCreatingIngredient(true)}
                className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-3 text-sm text-ink-400 transition hover:border-aura-emerald/50 hover:text-ink-100"
              >
                <Plus size={15} /> {query.trim() ? `Crea "${query.trim()}" come nuovo ingrediente` : "Crea nuovo ingrediente"}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3">
                <div>
                  <p className="text-sm text-ink-100">{selected.name}</p>
                  <p className="text-xs text-ink-600">{ingredientSummary(selected)}</p>
                </div>
                {!entry && (
                  <button onClick={() => setSelected(null)} className="focus-ring text-xs text-ink-600 hover:text-ink-200">
                    Cambia
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <TextField
                    label={quantityLabel(selected)}
                    type="number"
                    inputMode="decimal"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    autoFocus
                  />
                  {gramsEquivalent !== null && gramsEquivalent > 0 && (
                    <p className="mt-1.5 text-[11px] text-ink-800">≈ {Math.round(gramsEquivalent)} g</p>
                  )}
                </div>
                <TextField label="Orario" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>

              <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink-600">Calorie di questa porzione</p>
                <p className="font-display text-xl text-ink-100">{previewKcal} kcal</p>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <div className="flex gap-2">
            {entry && (
              <Button
                variant="danger"
                onClick={() => {
                  removeEntry(entry.id);
                  onClose();
                }}
                aria-label="Elimina voce"
              >
                <Trash2 size={16} />
              </Button>
            )}
            <Button className="flex-1 justify-center" onClick={submit} disabled={!canSave}>
              {entry ? "Salva modifiche" : "Aggiungi"}
            </Button>
          </div>
        </div>
      </motion.div>

      {creatingIngredient && (
        <AddIngredientModal
          initialName={query.trim()}
          onClose={() => setCreatingIngredient(false)}
          onSaved={(created) => setSelected(created)}
        />
      )}
    </div>,
    document.body
  );
}
