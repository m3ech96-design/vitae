"use client";
import { Droplet, Minus, Plus } from "lucide-react";
import { useFood } from "@/lib/food-context";
import { GlassCard } from "../ui/GlassCard";

const STEP = 0.25;

export function WaterTracker({ date }: { date: string }) {
  const { waterLog, setWater, goals } = useFood();
  const liters = waterLog[date] ?? 0;
  const goal = goals.waterGoalLiters;
  const pct = goal ? Math.min(100, Math.round((liters / goal) * 100)) : 0;

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 font-display text-sm text-ink-100">
          <Droplet size={14} className="text-aura-sky" /> Acqua
        </p>
        <span className="text-xs text-ink-600">
          {liters.toFixed(2)} {goal ? `/ ${goal} L` : "L"}
        </span>
      </div>

      {goal && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-aura-sky transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="mt-3 flex items-center justify-center gap-4">
        <button
          onClick={() => setWater(date, Math.max(0, liters - STEP))}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 transition hover:border-aura-sky/50"
          aria-label="Togli acqua"
        >
          <Minus size={15} />
        </button>
        <span className="font-display text-sm text-ink-100">+{STEP} L</span>
        <button
          onClick={() => setWater(date, liters + STEP)}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-aura-sky/40 text-aura-sky transition hover:bg-aura-sky/10"
          aria-label="Aggiungi acqua"
        >
          <Plus size={15} />
        </button>
      </div>
    </GlassCard>
  );
}
