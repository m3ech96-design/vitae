"use client";
import { RelationshipEvent } from "@/lib/types";

/** Le interazioni scritte nelle ultime 24 ore — restano qui, non ancora in Cronologia, come
 * richiesto ("rimangono nella lista per 1 giorno, poi si depositano nella cronologia").
 * Nessuno stato da gestire: RelationshipDetailPage le filtra da relationshipHistory in base
 * alla data, lo stesso array di sempre. */
export function RecentInteractions({ events }: { events: RelationshipEvent[] }) {
  if (events.length === 0) return null;
  const recent = [...events].reverse();

  return (
    <div>
      <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Interazioni recenti</p>
      <div className="space-y-2">
        {recent.map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5"
          >
            <span className="text-xs text-ink-300">{e.label}</span>
            <span className={`shrink-0 font-display text-xs ${e.delta >= 0 ? "text-aura-cyan" : "text-aura-pink"}`}>
              {e.delta >= 0 ? "+" : ""}
              {e.delta.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
