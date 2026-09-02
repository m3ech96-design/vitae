"use client";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useNeeds } from "@/lib/needs-context";
import { useMood } from "@/lib/mood-context";
import { NEED_DURATION_DAYS } from "@/lib/needs-catalog";
import { NeedFulfillmentCelebration } from "../needs/NeedFulfillmentCelebration";
import { GlassCard } from "../ui/GlassCard";

function daysLeft(startedAt: string): number {
  const elapsed = Date.now() - new Date(startedAt).getTime();
  return Math.max(0, NEED_DURATION_DAYS - Math.floor(elapsed / 86400000));
}

/** I bisogni che ti sei scelto restano qui per una settimana — nessun avviso se scadono, il
 * momento davvero grosso è quando li esaudisci. */
export function WeeklyNeedsCard() {
  const { needs, fulfillNeed } = useNeeds();
  const { fireTrigger } = useMood();
  const [celebrating, setCelebrating] = useState<string | null>(null);

  if (needs.length === 0) return null;

  const fulfill = (id: string, label: string) => {
    if (fulfillNeed(id)) {
      setCelebrating(label);
      fireTrigger("bisogni:esaudito");
      // Resta visibile il tempo di vedersela tutta (gli anelli impiegano circa 2.5s a
      // sfumare del tutto), poi si chiude da sola — nessuna azione richiesta per proseguire.
      setTimeout(() => setCelebrating(null), 3200);
    }
  };

  return (
    <>
      <GlassCard className="p-4">
        <p className="mb-3 font-display text-xs uppercase tracking-[0.14em] text-ink-600">
          {needs.length === 1 ? "Il tuo bisogno" : "I tuoi bisogni"} di questa settimana
        </p>
        <div className="space-y-2">
          {needs.map((n) => (
            <div
              key={n.id}
              className="flex items-center justify-between gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-ink-100">{n.label}</p>
                <p className="text-[10px] text-ink-800">
                  {daysLeft(n.startedAt) === 0 ? "Ultimo giorno" : `Ancora ${daysLeft(n.startedAt)} giorni`}
                </p>
              </div>
              <button
                onClick={() => fulfill(n.id, n.label)}
                className="focus-ring flex shrink-0 items-center gap-1.5 rounded-full bg-aura-gradient px-3.5 py-1.5 text-xs font-display text-void-950"
              >
                <Heart size={12} /> Fatto
              </button>
            </div>
          ))}
        </div>
      </GlassCard>

      <NeedFulfillmentCelebration label={celebrating} onDone={() => setCelebrating(null)} />
    </>
  );
}
