"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { useFood } from "@/lib/food-context";
import { macroGramGoals } from "@/lib/food-types";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { SwitchVisual } from "../ui/Switch";

function toNullableInt(v: string): number | null {
  if (!v.trim()) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Uno slider percentuale della suddivisione macro — muoversi qui cambia solo questo valore:
 * le altre due percentuali restano quelle che erano, ed è la somma delle tre (mostrata sotto
 * ai tre slider) a segnalare se si è arrivati a 100 oppure no, senza alcun ribilanciamento
 * automatico. `grams`, se presente (serve un obiettivo di Calorie giornaliere), mostra a
 * quanti grammi corrisponde la percentuale corrente accanto alla barra. */
function MacroPercentSlider({
  label,
  color,
  value,
  grams,
  onChange,
}: {
  label: string;
  color: string;
  value: number;
  grams: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-200">{label}</span>
        <span className="font-display text-ink-100">
          {value}% {grams !== null && <span className="text-ink-600">· {Math.round(grams)} g</span>}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full accent-current"
        style={{ color }}
      />
    </div>
  );
}

export function FoodGoalsModal({ onClose }: { onClose: () => void }) {
  const { goals, setGoals } = useFood();
  const [dailyMin, setDailyMin] = useState(goals.dailyKcalMin !== null ? String(goals.dailyKcalMin) : "");
  const [dailyMax, setDailyMax] = useState(goals.dailyKcalMax !== null ? String(goals.dailyKcalMax) : "");
  const [weeklyMin, setWeeklyMin] = useState(goals.weeklyKcalMin !== null ? String(goals.weeklyKcalMin) : "");
  const [weeklyMax, setWeeklyMax] = useState(goals.weeklyKcalMax !== null ? String(goals.weeklyKcalMax) : "");
  const [water, setWaterGoal] = useState(goals.waterGoalLiters !== null ? String(goals.waterGoalLiters) : "");
  const [macroSplitEnabled, setMacroSplitEnabled] = useState(goals.macroSplitEnabled);
  const [percents, setPercents] = useState({ carbs: goals.carbsPercent, protein: goals.proteinPercent, fat: goals.fatPercent });
  const [netCarbsEnabled, setNetCarbsEnabled] = useState(goals.netCarbsEnabled);

  const changePercent = (key: "carbs" | "protein" | "fat", value: number) => {
    // Cambia solo il valore toccato — le altre due percentuali non si muovono. Il totale
    // (mostrato sotto ai tre slider) segnala se serve ancora un aggiustamento manuale.
    setPercents((prev) => ({ ...prev, [key]: value }));
  };

  const hasDailyKcalGoal = toNullableInt(dailyMax) !== null || toNullableInt(dailyMin) !== null;
  const macroTotal = percents.carbs + percents.protein + percents.fat;
  const macroTotalOk = macroTotal === 100;

  // Grammi corrispondenti alle percentuali scritte ORA nel form (non ancora salvate),
  // così lo slider riflette subito "quanti grammi sono" mentre si scrive l'obiettivo
  // calorico — usa il Massimo se presente, altrimenti il Minimo, stessa logica di
  // `macroGramGoals` in lib/food-types.ts.
  const kcalGoalForGrams = toNullableInt(dailyMax) ?? toNullableInt(dailyMin);
  const macroGrams = kcalGoalForGrams
    ? macroGramGoals({
        ...goals,
        macroSplitEnabled: true,
        dailyKcalMax: kcalGoalForGrams,
        dailyKcalMin: null,
        carbsPercent: percents.carbs,
        proteinPercent: percents.protein,
        fatPercent: percents.fat,
      })
    : null;

  const submit = () => {
    setGoals({
      dailyKcalMin: toNullableInt(dailyMin),
      dailyKcalMax: toNullableInt(dailyMax),
      weeklyKcalMin: toNullableInt(weeklyMin),
      weeklyKcalMax: toNullableInt(weeklyMax),
      waterGoalLiters: water.trim() ? Math.max(0, parseFloat(water.replace(",", "."))) : null,
      macroSplitEnabled,
      carbsPercent: percents.carbs,
      proteinPercent: percents.protein,
      fatPercent: percents.fat,
      netCarbsEnabled,
    });
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
          <p className="font-display text-lg text-ink-100">Obiettivi</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Calorie giornaliere</p>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Minimo" type="number" value={dailyMin} onChange={(e) => setDailyMin(e.target.value)} />
              <TextField label="Massimo" type="number" value={dailyMax} onChange={(e) => setDailyMax(e.target.value)} />
            </div>
          </div>

          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Calorie settimanali</p>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Minimo" type="number" value={weeklyMin} onChange={(e) => setWeeklyMin(e.target.value)} />
              <TextField label="Massimo" type="number" value={weeklyMax} onChange={(e) => setWeeklyMax(e.target.value)} />
            </div>
          </div>

          <TextField label="Obiettivo acqua giornaliero (L)" type="number" inputMode="decimal" value={water} onChange={(e) => setWaterGoal(e.target.value)} />

          {/* Suddivisione macro — come nelle diete Low Carb, Keto, Low Fat, High Protein.
             Ogni slider cambia solo la propria percentuale (vedi MacroPercentSlider): il
             totale deve arrivare a 100 a mano, non c'è ribilanciamento automatico delle
             altre due, e finché non ci arriva "Salva obiettivi" resta disabilitato. Da qui
             derivano i grammi-obiettivo di Carboidrati/Proteine/Grassi (mostrati accanto a
             ogni barra quando c'è già un obiettivo di Calorie giornaliere) che, se superati
             nella giornata, vengono segnati in rosso nel menù (vedi DailyTotalsCard). */}
          <div className="border-t border-white/[0.06] pt-5">
            <button
              type="button"
              onClick={() => setMacroSplitEnabled((v) => !v)}
              className={`flex w-full items-center justify-between rounded-xl2 border px-4 py-3 text-sm transition ${
                macroSplitEnabled ? "border-aura-violet/50 bg-aura-violet/10 text-ink-100" : "border-white/10 text-ink-600"
              }`}
            >
              Suddividi i macronutrienti
              <SwitchVisual checked={macroSplitEnabled} />
            </button>

            {macroSplitEnabled && (
              <div className="mt-4 space-y-4">
                {!hasDailyKcalGoal && (
                  <p className="text-[11px] text-aura-amber">
                    Imposta anche un obiettivo di Calorie giornaliere qui sopra: senza un totale, le percentuali non hanno nulla da
                    suddividere.
                  </p>
                )}
                <MacroPercentSlider
                  label="Carboidrati"
                  color="#00E5C7"
                  value={percents.carbs}
                  grams={macroGrams?.carbs ?? null}
                  onChange={(v) => changePercent("carbs", v)}
                />
                <MacroPercentSlider
                  label="Proteine"
                  color="#7C5CFF"
                  value={percents.protein}
                  grams={macroGrams?.protein ?? null}
                  onChange={(v) => changePercent("protein", v)}
                />
                <MacroPercentSlider
                  label="Grassi"
                  color="#FFB454"
                  value={percents.fat}
                  grams={macroGrams?.fat ?? null}
                  onChange={(v) => changePercent("fat", v)}
                />
                <p className={`text-[11px] ${macroTotalOk ? "text-ink-800" : "text-aura-pink"}`}>
                  {percents.carbs}% + {percents.protein}% + {percents.fat}% = {macroTotal}%
                  {!macroTotalOk && " — deve fare 100%"}
                </p>
              </div>
            )}
          </div>

          {/* Carboidrati netti — vedi lib/food-types.ts, netCarbs, per la definizione e il
             limite dichiarato (i polioli non sono tracciati come categoria a parte). */}
          <div className="border-t border-white/[0.06] pt-5">
            <button
              type="button"
              onClick={() => setNetCarbsEnabled((v) => !v)}
              className={`flex w-full items-center justify-between rounded-xl2 border px-4 py-3 text-sm transition ${
                netCarbsEnabled ? "border-aura-cyan/50 bg-aura-cyan/10 text-ink-100" : "border-white/10 text-ink-600"
              }`}
            >
              Calcola i carboidrati netti
              <SwitchVisual checked={netCarbsEnabled} tone="ink" />
            </button>
            <p className="mt-2 text-[11px] text-ink-800">
              Carboidrati totali meno Fibre — la cifra che conta per una dieta Low Carb o Chetogenica. Quando attivo, sostituisce
              &quot;Carboidrati&quot; ovunque nel modulo Alimentazione.
            </p>
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <Button className="w-full justify-center" onClick={submit} disabled={macroSplitEnabled && !macroTotalOk}>
            Salva obiettivi
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
