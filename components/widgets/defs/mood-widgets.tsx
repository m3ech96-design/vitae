"use client";
import { Smile } from "lucide-react";
import { useMood } from "@/lib/mood-context";
import { WidgetSize } from "@/lib/widgets/types";

export function QuickMoodPickerWidget({ size }: { size: WidgetSize }) {
  const { allMoods, activeMood, setMoodManually } = useMood();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <p className="flex items-center gap-1 text-[11px] text-ink-600">
        <Smile size={12} /> Come ti senti?
      </p>
      <div className="flex flex-wrap justify-center gap-1.5 px-2">
        {allMoods.slice(0, 6).map((m) => (
          <button
            key={m.id}
            onClick={() => setMoodManually(m.id)}
            className="h-5 w-5 rounded-full border transition"
            style={{
              background: activeMood?.moodId === m.id ? m.color : `${m.color}33`,
              borderColor: `${m.color}88`,
            }}
            title={m.label}
            aria-label={m.label}
          />
        ))}
      </div>
    </div>
  );
}
