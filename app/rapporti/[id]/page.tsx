"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useHousehold } from "@/lib/household-context";
import { useProfile } from "@/lib/profile-context";
import { useTasks } from "@/lib/tasks-context";
import { usePlaces } from "@/lib/places-context";
import { ANIMAL_KINDS, Person } from "@/lib/types";
import { capArray } from "@/lib/cap-array";
import { outingsPerMonth } from "@/lib/frequency";
import { applyInteraction, editRelationshipEventLabel, isRecentInteraction, relationshipLabel } from "@/lib/relationship";
import { AuraAvatar } from "@/components/ui/AuraAvatar";
import { RelationshipGauge, LoveGauge } from "@/components/rapporti/RelationshipGauge";
import { InteractionComposer } from "@/components/rapporti/InteractionComposer";
import { RecentInteractions } from "@/components/rapporti/RecentInteractions";
import { RelationshipHistory } from "@/components/rapporti/RelationshipHistory";
import { RelationshipChart } from "@/components/rapporti/RelationshipChart";
import { FrequencyChart } from "@/components/rapporti/FrequencyChart";
import { FloatingDeltaLayer, DeltaPulse } from "@/components/rapporti/FloatingDelta";
import { useMood } from "@/lib/mood-context";

/** Quanto è cambiato il punteggio, in valore assoluto — qualunque asse abbia toccato la
 * patch (base, vera amicizia, o profonda inimicizia). Il segno da mostrare nel "+N" non
 * dipende dalla direzione grezza del campo (guarire un'inimicizia la fa SCENDERE, eppure è
 * un bene), ma se l'interazione applicata era positiva o negativa — quello lo sa solo chi
 * ha chiamato l'interazione, non la patch risultante. */
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

export default function RelationshipDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { hydrated: householdHydrated, people, updatePerson } = useHousehold();
  const { hydrated: profileHydrated, profile } = useProfile();
  const { tasks } = useTasks();
  const { places } = usePlaces();
  const [pulses, setPulses] = useState<DeltaPulse[]>([]);
  const { fireTrigger } = useMood();

  // Stesso pattern di app/animali/[id]/page.tsx: tutti gli hook chiamati incondizionatamente
  // prima di qualunque return anticipato — altrimenti se la persona viene cancellata mentre
  // si è su questa pagina, il render successivo chiamerebbe meno hook di quello precedente
  // (bug reale corretto: "Rendered fewer hooks than expected").
  if (!householdHydrated || !profileHydrated) return null;

  const person = people.find((p) => p.id === params.id);
  if (!person) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-ink-600">Questa persona non esiste più.</p>
        <button onClick={() => router.push("/rapporti")} className="focus-ring mt-4 text-sm text-aura-cyan">
          Torna ai rapporti
        </button>
      </div>
    );
  }

  const isAnimal = ANIMAL_KINDS.includes(person.kind);
  const isPartner = profile.partnerPersonId === person.id;

  const handlePick = (label: string, positive: boolean) => {
    const { patch, event } = applyInteraction(person, label, positive, isPartner);
    const magnitude = scoreMagnitude(person, patch);
    updatePerson(person.id, { ...patch, relationshipHistory: capArray([...person.relationshipHistory, event], 300) });
    if (magnitude > 0) {
      const id = Date.now() + Math.random();
      setPulses((p) => [...p, { id, value: positive ? magnitude : -magnitude }]);
      setTimeout(() => setPulses((p) => p.filter((x) => x.id !== id)), 1200);
    }

    if (isAnimal) {
      fireTrigger(positive ? "animali:interazione-positiva" : "animali:interazione-negativa");
    } else {
      fireTrigger(positive ? "rapporti:positiva" : "rapporti:negativa");
    }
    if (patch.trueFriendshipScore !== undefined && person.trueFriendshipScore <= 0 && patch.trueFriendshipScore > 0) {
      fireTrigger("rapporti:vera-amicizia");
    }
    if (isPartner && patch.loveScore !== undefined && patch.loveScore > person.loveScore) {
      fireTrigger("rapporti:amore");
    }
  };

  // Cambia solo il testo di un'interazione già registrata — usata dalle righe modificabili
  // di Recenti e Cronologia (vedi EditableInteractionRow), soprattutto per raccontare con
  // calma le interazioni nate senza testo dal widget Interazione Rapida in Home. Punteggi e
  // data restano quelli originali, per costruzione (vedi editRelationshipEventLabel).
  const handleEditLabel = (eventId: string, newLabel: string) => {
    updatePerson(person.id, { relationshipHistory: editRelationshipEventLabel(person.relationshipHistory, eventId, newLabel) });
  };

  // Le interazioni scritte nell'ultimo giorno restano nella lista "recenti"; dopo un giorno
  // esatto si depositano da sole in cronologia (stesso array, solo filtrato per data — vedi
  // lib/relationship.ts).
  const recentEvents = person.relationshipHistory.filter((e) => isRecentInteraction(e));
  const historyEvents = person.relationshipHistory.filter((e) => !isRecentInteraction(e));

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2rem)] sm:px-6">
      <button
        onClick={() => router.push("/rapporti")}
        className="focus-ring flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-200"
      >
        <ArrowLeft size={16} /> Rapporti
      </button>

      <div className="relative mt-6 flex flex-col items-center">
        <FloatingDeltaLayer pulses={pulses} />
        <AuraAvatar
          imageUrl={person.avatarUrl}
          firstName={person.firstName}
          lastName={person.lastName}
          size={80}
          ring="none"
        />
        <p className="mt-3 font-display text-xl text-ink-100">
          {person.firstName} {person.lastName}
        </p>
        <p className="text-sm text-ink-600">{relationshipLabel(person)}</p>
      </div>

      <div className="mt-10">
        <RelationshipGauge person={person} />
      </div>

      {isPartner && (
        <div className="mt-6">
          <LoveGauge value={person.loveScore} />
        </div>
      )}

      <div className="mt-8">
        <p className="mb-3 font-display text-sm text-ink-100">Nuova interazione</p>
        <InteractionComposer onSubmit={handlePick} />
      </div>

      {recentEvents.length > 0 && (
        <div className="mt-8">
          <RecentInteractions events={recentEvents} onEditLabel={handleEditLabel} />
        </div>
      )}

      <div className="mt-8 space-y-6">
        <FrequencyChart points={outingsPerMonth(person.id, tasks, places)} />
        <RelationshipChart events={person.relationshipHistory} />
        <RelationshipHistory events={historyEvents} onEditLabel={handleEditLabel} />
      </div>
    </div>
  );
}
