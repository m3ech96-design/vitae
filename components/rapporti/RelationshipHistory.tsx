"use client";
import { RelationshipEvent } from "@/lib/types";

/** La Cronologia mostra solo le interazioni già depositate (oltre le 24 ore) — quelle più
 * recenti sono in RecentInteractions.tsx, non qui: RelationshipDetailPage passa a questo
 * componente solo gli eventi già "vecchi", filtrati con lib/relationship.ts. */
export function RelationshipHistory({ events }: { events: RelationshipEvent[] }) {
  if (events.length === 0) return null;
  const recent = [...events].reverse().slice(0, 12);

  return (
    <div>
      <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Cronologia</p>
      <div className="space-y-2">
        {recent.map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5"
          >
            <span className="text-xs text-ink-300">{e.label}</span>
            <span
              className={`shrink-0 font-display text-xs ${e.delta >= 0 ? "text-aura-cyan" : "text-aura-pink"}`}
            >
              {e.delta >= 0 ? "+" : ""}
              {e.delta.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
