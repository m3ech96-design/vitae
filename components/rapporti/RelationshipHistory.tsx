"use client";
import { RelationshipEvent } from "@/lib/types";
import { EditableInteractionRow } from "./EditableInteractionRow";

/** La Cronologia mostra solo le interazioni già depositate (oltre le 24 ore) — quelle più
 * recenti sono in RecentInteractions.tsx, non qui: RelationshipDetailPage passa a questo
 * componente solo gli eventi già "vecchi", filtrati con lib/relationship.ts. Modificabile
 * come RecentInteractions, stesso motivo: un'interazione nata senza testo dal widget
 * Interazione Rapida può restare da raccontare anche oltre il primo giorno. */
export function RelationshipHistory({
  events,
  onEditLabel,
}: {
  events: RelationshipEvent[];
  onEditLabel: (eventId: string, newLabel: string) => void;
}) {
  if (events.length === 0) return null;
  const recent = [...events].reverse().slice(0, 12);

  return (
    <div>
      <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Cronologia</p>
      <div className="space-y-2">
        {recent.map((e) => (
          <EditableInteractionRow key={e.id} event={e} onSave={(newLabel) => onEditLabel(e.id, newLabel)} />
        ))}
      </div>
    </div>
  );
}
