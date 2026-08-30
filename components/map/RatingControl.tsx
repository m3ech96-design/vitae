"use client";
import { Minus, Plus } from "lucide-react";
import { ratingLabel, ratingStep, ratingColor } from "@/lib/rating";

export function RatingControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const color = ratingColor(value);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-display text-xs uppercase tracking-[0.14em] text-ink-600">
          Valutazione
        </span>
        <span className="text-sm font-medium" style={{ color }}>
          {ratingLabel(value)}
        </span>
      </div>
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${value}%`, background: color, boxShadow: `0 0 10px ${color}aa` }}
        />
      </div>
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - ratingStep()))}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-200 transition hover:border-aura-pink/50"
          aria-label="Peggiora valutazione"
        >
          <Minus size={15} />
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.min(100, value + ratingStep()))}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-200 transition hover:border-aura-cyan/50"
          aria-label="Migliora valutazione"
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}
