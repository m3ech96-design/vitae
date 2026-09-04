"use client";
import { RelationshipEvent } from "@/lib/types";
import { EditableInteractionRow } from "./EditableInteractionRow";

/** Le interazioni scritte nelle ultime 24 ore — restano qui, non ancora in Cronologia, come
 * richiesto ("rimangono nella lista per 1 giorno, poi si depositano nella cronologia").
 * Nessuno stato da gestire: RelationshipDetailPage le filtra da relationshipHistory in base
 * alla data, lo stesso array di sempre. Ogni riga è ora modificabile (vedi
 * EditableInteractionRow) — soprattutto per le interazioni nate dal widget Interazione
 * Rapida in Home, che arrivano qui senza testo apposta, da raccontare con calma dopo. */
export function RecentInteractions({
  events,
  onEditLabel,
}: {
  events: RelationshipEvent[];
  onEditLabel: (eventId: string, newLabel: string) => void;
}) {
  if (events.length === 0) return null;
  const recent = [...events].reverse();

  return (
    <div>
      <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Interazioni recenti</p>
      <div className="space-y-2">
        {recent.map((e) => (
          <EditableInteractionRow key={e.id} event={e} onSave={(newLabel) => onEditLabel(e.id, newLabel)} />
        ))}
      </div>
    </div>
  );
}
