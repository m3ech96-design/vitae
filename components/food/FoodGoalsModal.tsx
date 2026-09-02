"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { useFood } from "@/lib/food-context";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";

function toNullableInt(v: string): number | null {
  if (!v.trim()) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function FoodGoalsModal({ onClose }: { onClose: () => void }) {
  const { goals, setGoals } = useFood();
  const [dailyMin, setDailyMin] = useState(goals.dailyKcalMin !== null ? String(goals.dailyKcalMin) : "");
  const [dailyMax, setDailyMax] = useState(goals.dailyKcalMax !== null ? String(goals.dailyKcalMax) : "");
  const [weeklyMin, setWeeklyMin] = useState(goals.weeklyKcalMin !== null ? String(goals.weeklyKcalMin) : "");
  const [weeklyMax, setWeeklyMax] = useState(goals.weeklyKcalMax !== null ? String(goals.weeklyKcalMax) : "");
  const [water, setWaterGoal] = useState(goals.waterGoalLiters !== null ? String(goals.waterGoalLiters) : "");

  const submit = () => {
    setGoals({
      dailyKcalMin: toNullableInt(dailyMin),
      dailyKcalMax: toNullableInt(dailyMax),
      weeklyKcalMin: toNullableInt(weeklyMin),
      weeklyKcalMax: toNullableInt(weeklyMax),
      waterGoalLiters: water.trim() ? Math.max(0, parseFloat(water.replace(",", "."))) : null,
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
        className="glass-strong flex max-h-[92vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
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
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <Button className="w-full justify-center" onClick={submit}>
            Salva obiettivi
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
