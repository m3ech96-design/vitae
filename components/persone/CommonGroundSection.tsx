"use client";
import { Sparkles } from "lucide-react";
import { CommonGroup } from "@/lib/common-ground";

export function CommonGroundSection({ groups }: { groups: CommonGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 font-display text-sm text-ink-100">
        <Sparkles size={14} className="text-aura-cyan" /> In Comune
      </p>
      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.label}>
            <span className="mb-1.5 block text-[11px] text-ink-800">{g.label}</span>
            <div className="flex flex-wrap gap-1.5">
              {g.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-aura-cyan/25 bg-aura-cyan/[0.06] px-2.5 py-1 text-[11px] text-ink-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
