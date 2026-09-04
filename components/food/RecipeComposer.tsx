"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, ChefHat } from "lucide-react";
import { motion } from "framer-motion";
import { useFood } from "@/lib/food-context";
import { Ingredient, RecipeIngredientLine, FoodUnit, baseQuantity } from "@/lib/food-types";
import { recipeMacrosPer100 } from "@/lib/food-stats";
import { newId } from "@/lib/id";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { AddIngredientModal } from "./AddIngredientModal";

/** Una riga della composizione — ingrediente scelto da un elenco a tendina (tra quelli
 * esistenti, sempre aggiornato appena ne crei uno nuovo al volo) più la quantità nella sua
 * unità propria, esattamente come si registra una voce di pasto. */
function LineRow({
  line,
  ingredients,
  onChange,
  onRemove,
}: {
  line: RecipeIngredientLine;
  ingredients: Ingredient[];
  onChange: (patch: Partial<RecipeIngredientLine>) => void;
  onRemove: () => void;
}) {
  const ing = ingredients.find((i) => i.id === line.ingredientId);
  const unitLabel = ing ? (ing.unit === "altro" ? ing.unitLabel || "unità" : ing.unit) : "";
  const grams = ing ? baseQuantity(ing, line.quantity) : 0;

  return (
    <div className="rounded-xl2 border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-center gap-2">
        <select
          value={line.ingredientId}
          onChange={(e) => onChange({ ingredientId: e.target.value })}
          className="focus-ring w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-sm text-ink-100"
        >
          <option value="" disabled>
            Scegli un ingrediente…
          </option>
          {ingredients.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
        <button onClick={onRemove} className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-ink-600 hover:border-aura-pink/50 hover:text-aura-pink" aria-label="Rimuovi ingrediente">
          <Trash2 size={14} />
        </button>
      </div>
      {line.ingredientId && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={line.quantity || ""}
            onChange={(e) => onChange({ quantity: Math.max(0, parseFloat(e.target.value.replace(",", ".")) || 0) })}
            placeholder="Quantità"
            className="focus-ring w-24 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-sm text-ink-100 placeholder:text-ink-800"
          />
          <span className="text-xs text-ink-600">{unitLabel}</span>
          {grams > 0 && ing?.unit === "altro" && <span className="text-[11px] text-ink-800">≈ {Math.round(grams)} g</span>}
        </div>
      )}
    </div>
  );
}

/**
 * "Ricetta" — un ingrediente come qualunque altro (stesso `Ingredient`, stessi macro "per
 * 100 g/ml", registrabile in un pasto senza che il resto dell'app sappia che dietro c'è una
 * lista di componenti), ma composto scegliendo ingredienti esistenti o creandone di nuovi
 * al momento, invece di inserire i valori nutrizionali a mano. I macro totali per 100 g/ml
 * (vedi `recipeMacrosPer100`) si aggiornano in tempo reale man mano che la composizione
 * cambia. Aperta dalla stessa schermata di creazione ingrediente (vedi AddIngredientModal),
 * non una scheda separata da cercare altrove.
 */
export function RecipeComposer({ onClose, onSaved }: { onClose: () => void; onSaved?: (ingredient: Ingredient) => void }) {
  const { ingredients, addIngredient } = useFood();
  const [name, setName] = useState("");
  // Come per un ingrediente qualunque (vedi AddIngredientModal): i macro si esprimono per
  // 100 g o per 100 ml a seconda della natura della ricetta — un frullato o una zuppa sono
  // liquidi, non ha senso chiederne il valore "per 100 g" come per un piatto solido.
  const [unit, setUnit] = useState<Extract<FoodUnit, "g" | "ml">>("g");
  const [lines, setLines] = useState<RecipeIngredientLine[]>([]);
  const [servingSize, setServingSize] = useState("");
  const [servingLabel, setServingLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [creatingIngredient, setCreatingIngredient] = useState(false);

  const addLine = () => setLines((prev) => [...prev, { id: newId(), ingredientId: "", quantity: 0 }]);
  const updateLine = (id: string, patch: Partial<RecipeIngredientLine>) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.id !== id));

  const validLines = useMemo(() => lines.filter((l) => l.ingredientId && l.quantity > 0), [lines]);
  const computed = useMemo(() => recipeMacrosPer100(validLines, ingredients), [validLines, ingredients]);

  const canSave = name.trim().length > 0 && computed !== null;

  const submit = () => {
    if (!canSave || !computed) return;
    const created = addIngredient({
      name: name.trim(),
      unit,
      fat: computed.fat,
      saturatedFat: computed.saturatedFat,
      carbs: computed.carbs,
      sugars: computed.sugars,
      fiber: computed.fiber,
      protein: computed.protein,
      salt: computed.salt,
      recipe: {
        lines: validLines,
        servingSizeGrams: servingSize.trim() ? Math.max(0, parseFloat(servingSize.replace(",", "."))) : undefined,
        servingLabel: servingLabel.trim() || undefined,
        notes: notes.trim() || undefined,
      },
    });
    onSaved?.(created);
    onClose();
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="flex items-center gap-2 font-display text-lg text-ink-100">
            <ChefHat size={17} className="text-aura-emerald" /> Nuova ricetta
          </p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <TextField label="Nome della ricetta" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Parmigiana di melanzane" />

          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Dimensione di servizio</p>
            <div className="flex gap-2">
              <Chip label="Grammi" selected={unit === "g"} onClick={() => setUnit("g")} />
              <Chip label="Millilitri" selected={unit === "ml"} onClick={() => setUnit("ml")} />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-800">
              Scegli Millilitri per una ricetta liquida (zuppe, frullati, salse) — i valori nutrizionali sotto verranno espressi
              per 100 {unit} invece che a peso.
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-xs uppercase tracking-[0.14em] text-ink-600">Ingredienti</p>
              <button
                onClick={() => setCreatingIngredient(true)}
                className="focus-ring flex items-center gap-1 text-[11px] text-aura-emerald hover:text-aura-emerald/80"
              >
                <Plus size={12} /> Crea al volo
              </button>
            </div>
            <div className="space-y-2">
              {lines.map((line) => (
                <LineRow key={line.id} line={line} ingredients={ingredients} onChange={(patch) => updateLine(line.id, patch)} onRemove={() => removeLine(line.id)} />
              ))}
            </div>
            <button
              onClick={addLine}
              className="focus-ring mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-ink-600 transition hover:border-aura-emerald/50 hover:text-ink-200"
            >
              <Plus size={13} /> Aggiungi ingrediente
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Porzione (g)" type="number" inputMode="decimal" value={servingSize} onChange={(e) => setServingSize(e.target.value)} placeholder="Es. 250" />
            <TextField label="Nome porzione" value={servingLabel} onChange={(e) => setServingLabel(e.target.value)} placeholder="Es. 1 fetta" />
          </div>

          <TextField label="Note" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Preparazione, varianti…" />

          <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-600">Valori nutrizionali per 100 {unit}</p>
            {computed ? (
              <>
                <p className="mt-1 font-display text-xl text-ink-100">{Math.round(computed.kcal)} kcal</p>
                <p className="mt-1 text-xs text-ink-600">
                  Grassi {Math.round(computed.fat * 10) / 10} g · Carboidrati {Math.round(computed.carbs * 10) / 10} g · Proteine{" "}
                  {Math.round(computed.protein * 10) / 10} g
                </p>
                <p className="mt-1 text-[11px] text-ink-800">Peso totale della ricetta: {Math.round(computed.totalGrams)} g</p>
              </>
            ) : (
              <p className="mt-1 text-xs text-ink-800">Aggiungi almeno un ingrediente con una quantità per vedere i valori.</p>
            )}
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <Button className="w-full justify-center" onClick={submit} disabled={!canSave}>
            Salva ricetta
          </Button>
        </div>
      </motion.div>

      {creatingIngredient && (
        <AddIngredientModal
          onClose={() => setCreatingIngredient(false)}
          onSaved={(created) => {
            setLines((prev) => [...prev, { id: newId(), ingredientId: created.id, quantity: 0 }]);
          }}
        />
      )}
    </div>,
    document.body
  );
}
