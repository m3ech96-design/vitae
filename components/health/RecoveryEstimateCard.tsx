"use client";
import { Moon } from "lucide-react";
import { Workout } from "@/lib/types";
import { recoveryEstimate } from "@/lib/recovery-estimate";
import { activityLabel } from "@/lib/activity-catalog";
import { addDaysIso, todayIso } from "@/lib/date-format";

/**
 * "Il campo energetico" qui sopra guarda solo le ultime 24 ore (vedi il commento su
 * energyFieldWorkouts in app/attivita-peso/page.tsx) — il recupero guarda una finestra più
 * larga (48 ore) perché una sessione pesante di ieri sera può avere ancora ore di recupero
 * residue stamattina, ben oltre la finestra in cui l'attività stessa resta visibile come
 * sfera. Le due viste rispondono a domande diverse (cosa hai fatto di recente / quanto ti
 * sta ancora pesando addosso) e per questo hanno finestre temporali diverse per scelta, non
 * per svista.
 */
export function RecoveryEstimateCard({ workouts }: { workouts: Workout[] }) {
  const cutoff = addDaysIso(todayIso(), -2);
  const recent = workouts.filter((w) => w.date >= cutoff);
  const { hoursRemaining, dominantWorkout } = recoveryEstimate(recent);

  if (hoursRemaining <= 0 || !dominantWorkout) return null;

  const wholeHours = Math.floor(hoursRemaining);
  const label = wholeHours >= 1 ? `~${wholeHours}h di recupero` : "meno di un'ora di recupero";

  return (
    <div className="mb-3 flex items-center gap-2 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
      <Moon size={14} className="shrink-0 text-aura-violet" />
      <p className="text-xs text-ink-300">
        <span className="text-ink-100">{label}</span> stimato · soprattutto per {activityLabel(dominantWorkout.activityId)}
      </p>
    </div>
  );
}
