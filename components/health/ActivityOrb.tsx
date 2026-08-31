"use client";
import { Workout } from "@/lib/types";
import { categoryOf } from "@/lib/activity-catalog";
import { hashToUnit } from "@/lib/hash";

export function ActivityOrb({ workout, onOpen }: { workout: Workout; onOpen: () => void }) {
  const cat = categoryOf(workout.activityId);
  const Icon = cat.icon;
  const size = Math.round(Math.min(78, Math.max(42, 32 + Math.sqrt(Math.max(workout.calories, 1)) * 3.2)));
  const jitter = hashToUnit(workout.id);
  const offsetY = (jitter - 0.5) * 22;
  const delay = -(jitter * 4.5);

  return (
    <button
      onClick={onOpen}
      className="focus-ring relative shrink-0"
      style={{ marginTop: offsetY, marginBottom: -offsetY }}
    >
      <span
        className="absolute inset-[-9px] animate-pulseSoft rounded-full blur-md"
        style={{ background: cat.color, opacity: 0.4, animationDelay: `${delay}s` }}
      />
      <span
        className="relative flex animate-float items-center justify-center rounded-full border border-white/30"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 32% 28%, ${cat.color}ee, ${cat.color}99)`,
          boxShadow: `0 0 20px ${cat.color}aa, inset 0 1px 3px rgba(255,255,255,0.4)`,
          animationDelay: `${delay}s`,
        }}
      >
        <Icon size={Math.round(size * 0.36)} className="text-void-950/75" strokeWidth={2.2} />
      </span>
    </button>
  );
}
