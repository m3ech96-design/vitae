"use client";
import { todayIso, addDaysIso, weekdayShort } from "@/lib/date-format";

export function DayStrip({
  selected,
  onSelect,
  hasTasks,
}: {
  selected: string;
  onSelect: (iso: string) => void;
  hasTasks: (iso: string) => boolean;
}) {
  const today = todayIso();
  const days = Array.from({ length: 21 }, (_, i) => addDaysIso(today, i - 4));

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {days.map((iso) => {
        const isToday = iso === today;
        const isSelected = iso === selected;
        const dayNum = iso.slice(8, 10);
        return (
          <button
            key={iso}
            onClick={() => onSelect(iso)}
            className="relative flex shrink-0 flex-col items-center gap-1.5 focus-ring"
          >
            {isSelected && (
              <span
                className="absolute inset-0 -m-1 rounded-2xl bg-aura-gradient opacity-20 blur-md"
                aria-hidden
              />
            )}
            <span
              className={`relative flex h-12 w-11 flex-col items-center justify-center rounded-2xl border text-xs transition-all ${
                isSelected
                  ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100 shadow-glow-sm"
                  : isToday
                  ? "border-aura-cyan/40 text-ink-200"
                  : "border-white/[0.07] text-ink-600"
              }`}
            >
              <span className="text-[9px] uppercase tracking-wide opacity-70">{weekdayShort(iso)}</span>
              <span className="font-display text-sm">{dayNum}</span>
            </span>
            {hasTasks(iso) && (
              <span
                className={`h-1 w-1 rounded-full ${isSelected ? "bg-aura-cyan" : "bg-ink-800"}`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
