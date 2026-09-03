"use client";
import { Star } from "lucide-react";

export function StarRating({
  value,
  onChange,
  label,
  size = 18,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  label?: string;
  size?: number;
}) {
  return (
    <div>
      {label && <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">{label}</span>}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? undefined : n)}
            className="focus-ring text-aura-amber transition active:scale-90"
            aria-label={`${n} stelle`}
          >
            <Star size={size} fill={value && n <= value ? "currentColor" : "none"} strokeWidth={1.5} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function StarDisplay({ value, size = 12 }: { value: number | undefined; size?: number }) {
  if (!value) return null;
  return (
    <span className="flex items-center gap-0.5 text-aura-amber">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} fill={n <= value ? "currentColor" : "none"} strokeWidth={1.5} />
      ))}
    </span>
  );
}
