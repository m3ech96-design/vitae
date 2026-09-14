"use client";
import { useState } from "react";
import { Gauge, ChevronDown } from "lucide-react";
import { Task } from "@/lib/types";
import { completionBreakdown } from "@/lib/completion-rate";

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

/**
 * Non un singolo numero senza contesto — la scomposizione (aderenza quotidiane / scadenze
 * rispettate) è sempre a un tap di distanza, perché un "72%" da solo non dice se a pesare
 * di più sono le abitudini quotidiane o gli impegni con scadenza, e le due cose si
 * migliorano in modi completamente diversi.
 */
export function CompletionRateCard({ tasks }: { tasks: Task[] }) {
  const [expanded, setExpanded] = useState(false);
  const { dailyAdherence, deadlineRate, overall } = completionBreakdown(tasks, 30);

  if (overall === null) return null;

  return (
    <div className="rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
      <button onClick={() => setExpanded((v) => !v)} className="focus-ring flex w-full items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-ink-100">
          <Gauge size={15} className="text-aura-cyan" /> Completamento · ultimi 30gg
        </span>
        <span className="flex items-center gap-1.5">
          <span className="font-display text-base text-ink-100">{pct(overall)}</span>
          <ChevronDown size={14} className={`text-ink-800 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </span>
      </button>
      {expanded && (
        <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
          {dailyAdherence !== null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-600">Attività quotidiane rispettate</span>
              <span className="text-ink-200">{pct(dailyAdherence)}</span>
            </div>
          )}
          {deadlineRate !== null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-600">Scadenze rispettate</span>
              <span className="text-ink-200">{pct(deadlineRate)}</span>
            </div>
          )}
          {dailyAdherence === null && (
            <p className="text-[11px] text-ink-800">Nessuna attività quotidiana con storico in questa finestra.</p>
          )}
          {deadlineRate === null && (
            <p className="text-[11px] text-ink-800">Nessuna scadenza ancora raggiunta in questa finestra.</p>
          )}
        </div>
      )}
    </div>
  );
}
