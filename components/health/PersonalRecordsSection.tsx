"use client";
import { Trophy, Clock, Flame } from "lucide-react";
import { personalRecords, activityLabelOf } from "@/lib/activity-stats";
import { Workout } from "@/lib/types";
import { formatDateShort } from "@/lib/date-format";

export function PersonalRecordsSection({ workouts }: { workouts: Workout[] }) {
  const records = personalRecords(workouts);

  if (records.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-ink-800">
        Ripeti un'attività almeno due volte per iniziare a vedere qui i tuoi record.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((r) => (
        <div key={r.activityId} className="rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-sm text-ink-100">
            <Trophy size={13} className="text-aura-amber" /> {activityLabelOf(r.activityId)}
            <span className="text-[11px] text-ink-800">· {r.timesPracticed} volte</span>
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3 text-[11px] text-ink-600">
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-aura-cyan" />
              <span>
                {r.longestMinutes.minutes} min · {formatDateShort(r.longestMinutes.date)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame size={12} className="text-aura-amber" />
              <span>
                {r.mostCalories.calories} kcal · {formatDateShort(r.mostCalories.date)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
