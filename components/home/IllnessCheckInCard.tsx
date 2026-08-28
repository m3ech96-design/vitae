"use client";
import { HeartHandshake } from "lucide-react";
import { useIllness } from "@/lib/illness-context";
import { GlassCard } from "../ui/GlassCard";

/**
 * L'unica eccezione a "mai richieste automatiche": scatta una volta sola, e solo perché
 * legata a un'informazione che hai dato tu stesso (la stima dei giorni) — non a un
 * intervallo imposto dall'app. Dopo questa, silenzio finché non cambi tu qualcosa.
 */
export function IllnessCheckInCard() {
  const { illness, shouldAskHowAreYou, clearIllness, markReminded } = useIllness();
  if (!shouldAskHowAreYou || !illness) return null;

  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-ink-400">
          <HeartHandshake size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink-100">Ti Eri Segnato &quot;{illness.label}&quot;. Come Va?</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={clearIllness}
          className="focus-ring flex-1 rounded-full bg-aura-gradient px-4 py-2 text-xs font-display text-void-950"
        >
          Sto Meglio
        </button>
        <button
          onClick={markReminded}
          className="focus-ring rounded-full border border-white/10 px-4 py-2 text-xs text-ink-600 hover:text-ink-200"
        >
          Ancora Un Po&apos;
        </button>
      </div>
    </GlassCard>
  );
}
