"use client";
import { Flame, Target } from "lucide-react";
import { MacroTotals, carbsForDisplay } from "@/lib/food-stats";
import { FoodGoals, macroGramGoals } from "@/lib/food-types";
import { GlassCard } from "../ui/GlassCard";

function barColor(kcal: number, min: number | null, max: number | null): string {
  if (max !== null && kcal > max) return "#FF6B9D"; // aura-pink: sopra il massimo
  if (min !== null && kcal < min) return "#FFB454"; // aura-amber: sotto il minimo
  return "#34D399"; // aura-emerald: nel range, o nessun limite superato
}

/** Etichetta e valore in rosso quando questo macronutriente ha superato il proprio
 * grammi-obiettivo (vedi `macroGramGoals`) — solo quando la suddivisione percentuale è
 * attiva: senza un obiettivo per singolo macro, "superato" non avrebbe senso rispetto a
 * cosa. `over` è già la decisione fatta a monte, non ricalcolata qui. */
function MacroRow({ label, value, unit = "g", over = false }: { label: string; value: number; unit?: string; over?: boolean }) {
  return (
    <div className="min-w-0">
      <p className={`truncate text-[11px] ${over ? "text-aura-pink" : "text-ink-600"}`}>{label}</p>
      <p className={`font-display text-sm ${over ? "text-aura-pink" : "text-ink-100"}`}>
        {Math.round(value * 10) / 10} <span className={`text-[10px] font-sans ${over ? "text-aura-pink/70" : "text-ink-600"}`}>{unit}</span>
      </p>
    </div>
  );
}

export function DailyTotalsCard({
  totals,
  goals,
  onEditGoals,
  onOpen,
}: {
  totals: MacroTotals;
  goals: FoodGoals;
  onEditGoals: () => void;
  onOpen?: () => void;
}) {
  const kcal = Math.round(totals.kcal);
  const { dailyKcalMin, dailyKcalMax } = goals;
  const hasGoal = dailyKcalMin !== null || dailyKcalMax !== null;
  const denom = dailyKcalMax ?? dailyKcalMin ?? 0;
  const pct = hasGoal && denom > 0 ? Math.min(100, Math.round((kcal / denom) * 100)) : 0;

  const carbsShown = carbsForDisplay(totals, goals.netCarbsEnabled);
  const gramGoals = macroGramGoals(goals);
  const overCarbs = gramGoals !== null && carbsShown > gramGoals.carbs;
  const overProtein = gramGoals !== null && totals.protein > gramGoals.protein;
  const overFat = gramGoals !== null && totals.fat > gramGoals.fat;

  return (
    <GlassCard
      className={`p-4 ${onOpen ? "cursor-pointer transition hover:border-white/20" : ""}`}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={onOpen ? (e) => (e.key === "Enter" || e.key === " ") && onOpen() : undefined}
    >
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 font-display text-sm text-ink-100">
          <Flame size={14} className="text-aura-amber" /> Calorie di oggi
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditGoals();
          }}
          className="focus-ring flex items-center gap-1 text-[11px] text-ink-600 hover:text-ink-200"
        >
          <Target size={11} /> Obiettivi
        </button>
      </div>

      <p className="mt-2 font-display text-2xl text-ink-100">{kcal} kcal</p>

      {hasGoal ? (
        <>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: barColor(kcal, dailyKcalMin, dailyKcalMax) }}
            />
          </div>
          <p className="mt-2 text-xs text-ink-600">
            Obiettivo: {dailyKcalMin ?? "—"} – {dailyKcalMax ?? "—"} kcal
          </p>
        </>
      ) : (
        <p className="mt-2 text-xs text-ink-800">Nessun obiettivo impostato.</p>
      )}

      {/* Bug corretto: "Grassi"/"Di cui saturi" ecc. affiancati al numero sulla stessa riga,
         dentro una colonna stretta (grid a 2 colonne), si sovrapponevano su schermi piccoli
         — soprattutto le etichette più lunghe ("Di cui zuccheri"). Etichetta sopra e valore
         sotto, impilati: ogni colonna ha tutta la sua larghezza a disposizione, non deve più
         starci affiancata a un numero sulla stessa riga. */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/[0.06] pt-3">
        <MacroRow label="Grassi" value={totals.fat} over={overFat} />
        <MacroRow label="Di cui saturi" value={totals.saturatedFat} />
        <MacroRow label={goals.netCarbsEnabled ? "Carboidrati netti" : "Carboidrati"} value={carbsShown} over={overCarbs} />
        <MacroRow label="Di cui zuccheri" value={totals.sugars} />
        <MacroRow label="Fibre" value={totals.fiber} />
        <MacroRow label="Proteine" value={totals.protein} over={overProtein} />
        <MacroRow label="Sale" value={totals.salt} />
      </div>
      {gramGoals && (
        <p className="mt-3 text-[11px] text-ink-800">
          Obiettivo macro: {Math.round(gramGoals.carbs)}g {goals.netCarbsEnabled ? "carb. netti" : "carb."} · {Math.round(gramGoals.protein)}g
          proteine · {Math.round(gramGoals.fat)}g grassi
        </p>
      )}
    </GlassCard>
  );
}
