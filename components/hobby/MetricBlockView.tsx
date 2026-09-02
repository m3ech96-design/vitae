"use client";
import { useState } from "react";
import { Plus, Settings, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { MetricBlock } from "@/lib/hobby-types";
import { metricCurrentValue, metricPersonalRecord, metricPeriodComparison } from "@/lib/hobby-stats";
import { formatDateShort } from "@/lib/date-format";
import { MiniLineChart } from "../medical/MiniLineChart";
import { GlassCard } from "../ui/GlassCard";
import { BlockHeader } from "./BlockHeader";
import { HeatmapGrid } from "./HeatmapGrid";
import { MetricEntryModal } from "./MetricEntryModal";
import { MetricConfigModal } from "./MetricConfigModal";

export function MetricBlockView({ hobbyId, block }: { hobbyId: string; block: MetricBlock }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);

  const current = metricCurrentValue(block);
  const record = metricPersonalRecord(block);
  const comparison = metricPeriodComparison(block, 7);
  const editEntry = block.entries.find((e) => e.id === editId);
  const goalPct = block.goalValue ? Math.min(100, Math.round((current / block.goalValue) * 100)) : null;

  return (
    <GlassCard className="p-4">
      <BlockHeader
        hobbyId={hobbyId}
        blockId={block.id}
        title={block.title}
        subtitle={`${block.aggregation === "cumulativa" ? "Totale" : "Ultimo valore"} · ${block.entries.length} voci`}
        extra={
          <>
            <button onClick={() => setConfigOpen(true)} className="focus-ring text-ink-800 hover:text-ink-200" aria-label="Impostazioni metrica">
              <Settings size={13} />
            </button>
            <button onClick={() => setAddOpen(true)} className="focus-ring flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1.5 text-[11px] text-ink-300 hover:border-aura-violet/50">
              <Plus size={12} /> Voce
            </button>
          </>
        }
      />

      {block.entries.length === 0 ? (
        <p className="text-xs text-ink-800">Ancora nessuna voce registrata.</p>
      ) : (
        <>
          <MiniLineChart points={block.entries.map((e) => ({ date: e.date, value: e.value }))} unit={block.unit} />

          {block.goalValue !== null && block.goalValue !== undefined && goalPct !== null && (
            <div className="mt-3">
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-aura-gradient transition-all" style={{ width: `${goalPct}%` }} />
              </div>
              <p className="mt-1.5 text-[11px] text-ink-600">
                Obiettivo: {block.goalValue} {block.unit} {block.goalDeadline ? `entro il ${formatDateShort(block.goalDeadline)}` : ""} · {goalPct}%
              </p>
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            {record && (
              <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-3 py-2">
                <p className="flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] text-ink-600"><Trophy size={11} /> Record</p>
                <p className="mt-0.5 text-sm text-ink-100">{record.value} {block.unit}</p>
              </div>
            )}
            {comparison.deltaPct !== null && (
              <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-3 py-2">
                <p className="flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] text-ink-600">
                  {comparison.deltaPct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />} 7gg vs 7gg
                </p>
                <p className="mt-0.5 text-sm" style={{ color: comparison.deltaPct >= 0 ? "#34D399" : "#FF6B9D" }}>
                  {comparison.deltaPct >= 0 ? "+" : ""}{Math.round(comparison.deltaPct)}%
                </p>
              </div>
            )}
          </div>

          <div className="mt-3">
            <p className="mb-1.5 text-[11px] text-ink-600">Costanza</p>
            <HeatmapGrid dates={block.entries.map((e) => e.date)} color="#7C5CFF" />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {[...block.entries]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 10)
              .map((e) => (
                <button
                  key={e.id}
                  onClick={() => setEditId(e.id)}
                  className="focus-ring rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-ink-400 transition hover:border-aura-violet/50 hover:text-ink-100"
                >
                  {e.value} {block.unit} · {formatDateShort(e.date)}
                </button>
              ))}
          </div>
        </>
      )}

      {addOpen && <MetricEntryModal hobbyId={hobbyId} block={block} onClose={() => setAddOpen(false)} />}
      {editEntry && <MetricEntryModal hobbyId={hobbyId} block={block} entry={editEntry} onClose={() => setEditId(null)} />}
      {configOpen && <MetricConfigModal hobbyId={hobbyId} block={block} onClose={() => setConfigOpen(false)} />}
    </GlassCard>
  );
}
