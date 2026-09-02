"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { useFood } from "@/lib/food-context";
import { Ingredient, FoodUnit, computeKcal, scaleFactor } from "@/lib/food-types";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";

const UNIT_OPTIONS: { id: FoodUnit; label: string }[] = [
  { id: "g", label: "Grammi" },
  { id: "ml", label: "Millilitri" },
  { id: "altro", label: "Altro" },
];

function macroBaseLabel(unit: FoodUnit): string {
  return unit === "ml" ? "per 100 ml" : "per 100 g";
}

export function AddIngredientModal({
  initial,
  initialName,
  onClose,
  onSaved,
}: {
  initial?: Ingredient;
  initialName?: string;
  onClose: () => void;
  onSaved?: (ingredient: Ingredient) => void;
}) {
  const { addIngredient, updateIngredient } = useFood();
  const [name, setName] = useState(initial?.name ?? initialName ?? "");
  const [unit, setUnit] = useState<FoodUnit>(initial?.unit ?? "g");
  const [unitLabel, setUnitLabel] = useState(initial?.unitLabel ?? "");
  const [gramsPerUnit, setGramsPerUnit] = useState(initial?.gramsPerUnit ? String(initial.gramsPerUnit) : "");
  const [fat, setFat] = useState(String(initial?.fat ?? ""));
  const [saturatedFat, setSaturatedFat] = useState(String(initial?.saturatedFat ?? ""));
  const [carbs, setCarbs] = useState(String(initial?.carbs ?? ""));
  const [sugars, setSugars] = useState(String(initial?.sugars ?? ""));
  const [fiber, setFiber] = useState(String(initial?.fiber ?? ""));
  const [protein, setProtein] = useState(String(initial?.protein ?? ""));
  const [salt, setSalt] = useState(String(initial?.salt ?? ""));

  const num = (v: string) => Math.max(0, parseFloat(v.replace(",", ".")) || 0);

  const macros = {
    fat: num(fat),
    saturatedFat: num(saturatedFat),
    carbs: num(carbs),
    sugars: num(sugars),
    fiber: num(fiber),
    protein: num(protein),
    salt: num(salt),
  };
  const previewKcal = useMemo(() => computeKcal(macros.fat, macros.carbs, macros.protein), [macros.fat, macros.carbs, macros.protein]);

  const unitWeight = num(gramsPerUnit);
  const hasUnitWeight = unit === "altro" && unitWeight > 0;

  // Anteprima derivata per 1 unità — non chiesta a mano, calcolata dal peso reale dichiarato:
  // stessa scala usata poi ovunque nell'app per registrare un pasto (scaleFactor).
  const perUnitFactor = hasUnitWeight ? scaleFactor({ unit, gramsPerUnit: unitWeight }, 1) : 0;
  const perUnit = {
    kcal: Math.round(previewKcal * perUnitFactor),
    fat: macros.fat * perUnitFactor,
    carbs: macros.carbs * perUnitFactor,
    protein: macros.protein * perUnitFactor,
  };

  const canSave = name.trim().length > 0 && (unit !== "altro" || (unitLabel.trim().length > 0 && unitWeight > 0));
  const baseLabel = macroBaseLabel(unit);

  const submit = () => {
    if (!canSave) return;
    const payload = {
      name: name.trim(),
      unit,
      unitLabel: unit === "altro" ? unitLabel.trim() : undefined,
      gramsPerUnit: unit === "altro" ? unitWeight : undefined,
      ...macros,
    };
    if (initial) {
      updateIngredient(initial.id, payload);
      onSaved?.({ ...initial, ...payload, kcal: previewKcal });
    } else {
      const created = addIngredient(payload);
      onSaved?.(created);
    }
    onClose();
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">{initial ? "Modifica ingrediente" : "Nuovo ingrediente"}</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Petto di pollo" />

          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Dimensione di servizio</p>
            <div className="flex flex-wrap gap-2">
              {UNIT_OPTIONS.map((o) => (
                <Chip key={o.id} label={o.label} selected={unit === o.id} onClick={() => setUnit(o.id)} />
              ))}
            </div>
            {unit === "altro" && (
              <p className="mt-2 text-[11px] leading-relaxed text-ink-800">
                Serve solo a registrare i pasti in un'unità comoda (es. "2 uova"). I valori
                nutrizionali restano legati al peso vero, non a quest'unità — per questo li
                chiediamo comunque per 100 g qui sotto.
              </p>
            )}
          </div>

          {unit === "altro" && (
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Nome dell'unità"
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
                placeholder="Es. uovo, fetta"
              />
              <TextField
                label="Peso di 1 unità (g)"
                type="number"
                inputMode="decimal"
                value={gramsPerUnit}
                onChange={(e) => setGramsPerUnit(e.target.value)}
                placeholder="Es. 50"
                hint={unitLabel.trim() ? `Quanto pesa 1 ${unitLabel.trim()}` : undefined}
              />
            </div>
          )}

          <div>
            <p className="mb-3 font-display text-xs uppercase tracking-[0.14em] text-ink-600">
              Valori nutrizionali {baseLabel}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Grassi (g)" type="number" inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} />
              <TextField label="Di cui saturi (g)" type="number" inputMode="decimal" value={saturatedFat} onChange={(e) => setSaturatedFat(e.target.value)} />
              <TextField label="Carboidrati (g)" type="number" inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
              <TextField label="Di cui zuccheri (g)" type="number" inputMode="decimal" value={sugars} onChange={(e) => setSugars(e.target.value)} />
              <TextField label="Fibre (g)" type="number" inputMode="decimal" value={fiber} onChange={(e) => setFiber(e.target.value)} />
              <TextField label="Proteine (g)" type="number" inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} />
              <TextField label="Sale (g)" type="number" inputMode="decimal" value={salt} onChange={(e) => setSalt(e.target.value)} />
            </div>
          </div>

          <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-600">Calorie calcolate</p>
            <p className="font-display text-xl text-ink-100">{previewKcal} kcal {baseLabel}</p>
          </div>

          {unit === "altro" && (
            <div className="rounded-xl2 border border-aura-emerald/30 bg-aura-emerald/[0.06] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-ink-600">
                Derivato per 1 {unitLabel.trim() || "unità"}
              </p>
              {hasUnitWeight ? (
                <>
                  <p className="mt-1 font-display text-lg text-ink-100">
                    {perUnit.kcal} kcal <span className="text-sm text-ink-600">({unitWeight} g)</span>
                  </p>
                  <p className="mt-1 text-xs text-ink-600">
                    Grassi {Math.round(perUnit.fat * 10) / 10} g · Carboidrati {Math.round(perUnit.carbs * 10) / 10} g · Proteine{" "}
                    {Math.round(perUnit.protein * 10) / 10} g
                  </p>
                </>
              ) : (
                <p className="mt-1 text-xs text-ink-800">Inserisci il peso di 1 unità per vederlo calcolato qui.</p>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <Button className="w-full justify-center" onClick={submit} disabled={!canSave}>
            Salva ingrediente
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
