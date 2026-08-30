"use client";
import { useMemo, useState } from "react";
import { Heart, RefreshCw, X } from "lucide-react";
import { useHousehold } from "@/lib/household-context";
import { useTasks } from "@/lib/tasks-context";
import { usePlaces } from "@/lib/places-context";
import { useProfile } from "@/lib/profile-context";
import { personNeedingAttention } from "@/lib/rapport-nudge";
import { applyInteraction } from "@/lib/relationship";
import { POSITIVE_INTERACTIONS, ANIMAL_POSITIVE_INTERACTIONS } from "@/lib/interactions";
import { ANIMAL_KINDS, Person } from "@/lib/types";
import { capArray } from "@/lib/cap-array";
import { personColor } from "@/lib/person-color";
import { auraIntensity } from "@/lib/aura-intensity";
import { FloatingDeltaLayer, DeltaPulse } from "../rapporti/FloatingDelta";
import { AuraAvatar } from "../ui/AuraAvatar";
import { GlassCard } from "../ui/GlassCard";
import { useMood } from "@/lib/mood-context";

function scoreMagnitude(before: Person, patch: Partial<Person>): number {
  const fields: (keyof Person)[] = ["relationshipScore", "trueFriendshipScore", "deepEnmityScore"];
  for (const f of fields) {
    if (f in patch) {
      const diff = Math.abs(Math.round((patch[f] as number) - (before[f] as number)));
      if (diff !== 0) return diff;
    }
  }
  return 0;
}

/** Pesca chi frequenti meno (lib/rapport-nudge.ts) e propone un'interazione positiva pronta
 * da un tocco — non un elenco da consultare, un promemoria che si applica da solo. */
export function RapportNudgeCard() {
  const { people, updatePerson } = useHousehold();
  const { tasks } = useTasks();
  const { places } = usePlaces();
  const { profile } = useProfile();
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [rerollTick, setRerollTick] = useState(0);
  const [justApplied, setJustApplied] = useState(false);
  const [pulses, setPulses] = useState<DeltaPulse[]>([]);
  const { fireTrigger } = useMood();

  const candidate = useMemo(() => personNeedingAttention(people, tasks, places), [people, tasks, places]);
  const pool = candidate
    ? ANIMAL_KINDS.includes(candidate.person.kind)
      ? ANIMAL_POSITIVE_INTERACTIONS
      : POSITIVE_INTERACTIONS
    : [];

  const suggestion = useMemo(() => {
    if (pool.length === 0) return "";
    return pool[Math.floor(Math.random() * pool.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate?.person.id, rerollTick]);

  if (!candidate || justApplied || candidate.person.id === dismissedId) return null;
  const { person, daysSince } = candidate;
  const isPartner = profile.partnerPersonId === person.id;

  const apply = () => {
    const { patch, event } = applyInteraction(person, suggestion, true, isPartner);
    const magnitude = scoreMagnitude(person, patch);
    updatePerson(person.id, { ...patch, relationshipHistory: capArray([...person.relationshipHistory, event], 300) });
    if (magnitude > 0) setPulses((p) => [...p, { id: Date.now(), value: magnitude }]);
    setTimeout(() => setJustApplied(true), 750);

    fireTrigger(ANIMAL_KINDS.includes(person.kind) ? "animali:interazione-positiva" : "rapporti:positiva");
    if (patch.trueFriendshipScore !== undefined && person.trueFriendshipScore <= 0 && patch.trueFriendshipScore > 0) {
      fireTrigger("rapporti:vera-amicizia");
    }
    if (isPartner && patch.loveScore !== undefined && patch.loveScore > person.loveScore) {
      fireTrigger("rapporti:amore");
    }
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <FloatingDeltaLayer pulses={pulses} />
          <AuraAvatar
            imageUrl={person.avatarUrl}
            firstName={person.firstName}
            lastName={person.lastName}
            size={44}
            ring="idle"
            glowColor={personColor(person.id)}
            glowIntensity={auraIntensity(person, tasks, places)}
            deceased={person.deceased}
            shape={ANIMAL_KINDS.includes(person.kind) ? "squircle" : "circle"}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink-100">
            {daysSince === null
              ? `Non Hai Ancora Interagito Con ${person.firstName}`
              : `Non Senti ${person.firstName} Da ${daysSince} Giorni`}
          </p>
          <p className="mt-1 text-xs text-ink-600">{suggestion}</p>
        </div>
        <button
          onClick={() => setDismissedId(person.id)}
          className="focus-ring shrink-0 text-ink-800 hover:text-ink-400"
          aria-label="Non ora"
        >
          <X size={14} />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={apply}
          className="focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-full bg-aura-gradient px-4 py-2 text-xs font-display text-void-950"
        >
          <Heart size={13} /> Fatto
        </button>
        <button
          onClick={() => setRerollTick((t) => t + 1)}
          className="focus-ring flex items-center justify-center rounded-full border border-white/10 px-3 py-2 text-ink-600 hover:text-ink-200"
          aria-label="Un'altra idea"
        >
          <RefreshCw size={13} />
        </button>
      </div>
    </GlassCard>
  );
}
