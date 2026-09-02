"use client";
import { useState } from "react";
import { Droplet, Minus, Plus } from "lucide-react";
import { useFood } from "@/lib/food-context";
import { GlassCard } from "../ui/GlassCard";
import { LiquidFill } from "../vitaecom/LiquidFill";

const STEP = 0.25;
const AURA_SKY = "#5EC8FF";

/** Corretto secondo le istruzioni: non più una barra orizzontale sottile, ma una barra
 * verticale e più larga — abbastanza da ospitare la vera animazione del liquido (bollicine,
 * onda in superficie, gradiente che si mescola) invece di un semplice riempimento a colore
 * piatto. Stessa identica animazione del riquadro profilo di Vitaecom (vedi LiquidFill.tsx),
 * qui semplicemente dentro un contenitore verticale invece che nella barra in alto. */
export function WaterTracker({ date }: { date: string }) {
  const { waterLog, setWater, goals } = useFood();
  const liters = waterLog[date] ?? 0;
  const goal = goals.waterGoalLiters;
  const pct = goal ? Math.min(100, Math.round((liters / goal) * 100)) : Math.min(100, Math.round((liters / 2) * 100));
  const [pulsing, setPulsing] = useState(false);

  const nudge = (delta: number) => {
    setWater(date, Math.max(0, liters + delta));
    setPulsing(true);
    setTimeout(() => setPulsing(false), 700);
  };

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

      <div className="mt-3 flex items-center gap-5">
        <div className="relative h-36 w-16 shrink-0 overflow-hidden rounded-xl2 border border-white/10 bg-white/[0.03]">
          <LiquidFill heightPct={pct} moodColor={AURA_SKY} pulsing={pulsing} />
        </div>

        <div className="flex flex-1 flex-col items-center gap-3">
          <button
            onClick={() => nudge(STEP)}
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-full border border-aura-sky/40 text-aura-sky transition hover:bg-aura-sky/10"
            aria-label="Aggiungi acqua"
          >
            <Plus size={17} />
          </button>
          <span className="font-display text-sm text-ink-100">{STEP} L</span>
          <button
            onClick={() => nudge(-STEP)}
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-ink-300 transition hover:border-aura-sky/50"
            aria-label="Togli acqua"
          >
            <Minus size={17} />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
