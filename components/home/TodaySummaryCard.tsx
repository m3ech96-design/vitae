"use client";
import { CheckCircle2, MapPin, Users, Wallet, Flame } from "lucide-react";
import { useTasks } from "@/lib/tasks-context";
import { usePlaces } from "@/lib/places-context";
import { useFinance } from "@/lib/finance-context";
import { useHealth } from "@/lib/health-context";
import { useHousehold } from "@/lib/household-context";
import { todaySummary, isTodayEmpty } from "@/lib/today-summary";
import { useCountUp } from "@/lib/use-count-up";
import { personColor } from "@/lib/person-color";
import { auraIntensity } from "@/lib/aura-intensity";
import { AuraAvatar } from "../ui/AuraAvatar";
import { GlassCard } from "../ui/GlassCard";

/**
 * Il nodo di convergenza: quattro moduli che di solito non si parlano mai (Task, Luoghi,
 * Finanze, Salute) raccolti in un'unica vista, viva per tutta la giornata — non un report
 * fisso di fine giornata, cresce mano a mano che fai cose altrove nell'app. Sparisce del
 * tutto finché oggi non è ancora successo nulla: una card sempre vuota sarebbe peggio di
 * nessuna card.
 */
export function TodaySummaryCard() {
  const { tasks } = useTasks();
  const { places } = usePlaces();
  const { singleExpenses } = useFinance();
  const { workouts } = useHealth();
  const { people } = useHousehold();

  const summary = todaySummary(tasks, places, singleExpenses, workouts);

  // Chiamati sempre, prima di un eventuale return anticipato — i numeri crescono sotto gli
  // occhi invece di scattare al valore finale di colpo, la card sembra viva perché lo è.
  const tasksAnimated = useCountUp(summary.tasksCompleted);
  const placesAnimated = useCountUp(summary.placesVisited.length);
  const spentAnimated = useCountUp(Math.round(summary.spent));
  const minutesAnimated = useCountUp(summary.activityMinutes);

  if (isTodayEmpty(summary)) return null;

  const peopleSeen = summary.peopleSeenIds.map((id) => people.find((p) => p.id === id)).filter(Boolean) as typeof people;

  const stats: { icon: typeof CheckCircle2; value: string; label: string; color: string }[] = [];
  if (summary.tasksCompleted > 0) {
    stats.push({
      icon: CheckCircle2,
      value: String(tasksAnimated),
      label: "Task",
      color: "#00E5C7",
    });
  }
  if (summary.placesVisited.length > 0) {
    stats.push({
      icon: MapPin,
      value: String(placesAnimated),
      label: summary.placesVisited.length === 1 ? "Luogo" : "Luoghi",
      color: "#5EC8FF",
    });
  }
  if (summary.spent > 0) {
    stats.push({
      icon: Wallet,
      value: `${spentAnimated}€`,
      label: "Speso",
      color: "#FFB454",
    });
  }
  if (summary.activityMinutes > 0) {
    stats.push({
      icon: Flame,
      value: String(minutesAnimated),
      label: "Minuti",
      color: "#FF6B9D",
    });
  }

  return (
    <GlassCard glow="violet" className="p-4">
      <p className="mb-3 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Oggi</p>

      {stats.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {stats.map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: `${color}22`, color }}
              >
                <Icon size={14} />
              </span>
              <div>
                <p className="font-display text-sm text-ink-100">{value}</p>
                <p className="text-[10px] text-ink-800">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {peopleSeen.length > 0 && (
        <div className="mt-3.5 border-t border-white/[0.06] pt-3.5">
          <div className="flex items-center gap-2">
            <Users size={13} className="text-ink-600" />
            <div className="flex -space-x-2.5">
              {peopleSeen.slice(0, 6).map((p) => (
                <AuraAvatar
                  key={p.id}
                  imageUrl={p.avatarUrl}
                  firstName={p.firstName}
                  lastName={p.lastName}
                  size={26}
                  ring="idle"
                  glowColor={personColor(p.id)}
                  glowIntensity={auraIntensity(p, tasks, places)}
                  deceased={p.deceased}
                  innerClassName="ring-2 ring-void-900"
                />
              ))}
            </div>
            <span className="text-[11px] text-ink-800">
              {peopleSeen.length === 1 ? peopleSeen[0].firstName : `Con ${peopleSeen.length} Persone Oggi`}
            </span>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
