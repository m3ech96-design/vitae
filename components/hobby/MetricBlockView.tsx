"use client";
import { useEffect, useState } from "react";
import { Plus, Settings, Trophy, TrendingUp, TrendingDown, Timer } from "lucide-react";
import { useHobby } from "@/lib/hobby-context";
import { useHobbyTimer } from "@/lib/hobby-timer-context";
import { MetricBlock } from "@/lib/hobby-types";
import { metricCurrentValue, metricPersonalRecord, metricPeriodComparison } from "@/lib/hobby-stats";
import { formatDateShort, formatMinutesDuration, todayIso } from "@/lib/date-format";
import { MiniLineChart } from "../medical/MiniLineChart";
import { HobbyBlockCard } from "./HobbyBlockCard";
import { HeatmapGrid } from "./HeatmapGrid";
import { MetricEntryModal } from "./MetricEntryModal";
import { MetricEntryDetail } from "./MetricEntryDetail";
import { MetricConfigModal } from "./MetricConfigModal";
import { MetricTimer } from "./MetricTimer";

export function MetricBlockView({ hobbyId, hobbyName, block, index, total }: { hobbyId: string; hobbyName: string; block: MetricBlock; index: number; total: number }) {
  const { addMetricEntry } = useHobby();
  const { active } = useHobbyTimer();
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);

  // Se questo blocco ha già un cronometro attivo (avviato qui, poi lasciato girare mentre si
  // consultava un'altra scheda tramite la pillola flottante), riapparire qui deve mostrarlo
  // subito — senza, l'utente dovrebbe ritoccare l'icona del cronometro per ritrovarlo, anche
  // se non l'ha mai davvero fermato.
  useEffect(() => {
    if (active?.blockId === block.id) setTimerOpen(true);
  }, [active?.blockId, block.id]);

  const current = metricCurrentValue(block);
  const record = metricPersonalRecord(block);
  const comparison = metricPeriodComparison(block, 7);
  const detailEntry = block.entries.find((e) => e.id === detailId);
  const goalPct = block.goalValue ? Math.min(100, Math.round((current / block.goalValue) * 100)) : null;

  /** Somma di tutti i cronometraggi registrati in questo blocco (in minuti, come li salva
   * MetricTimer) — indipendente dal tipo di aggregazione scelto per l'obiettivo (cumulativa
   * o puntuale): qui vogliamo sempre il totale del tempo dedicato, non l'ultimo valore. */
  const totalTrackedMinutes = block.entries.reduce((sum, e) => sum + e.value, 0);
  const lastEntry = block.isTimeBased && block.entries.length > 0
    ? [...block.entries].sort((a, b) => b.date.localeCompare(a.date))[0]
    : null;

  return (
    <>
      <HobbyBlockCard
        hobbyId={hobbyId}
        blockId={block.id}
        collapsed={block.collapsed}
        index={index}
        total={total}
        title={block.title}
        subtitle={`${block.aggregation === "cumulativa" ? "Totale" : "Ultimo valore"} · ${block.entries.length} voci`}
        extra={
          <>
            {block.isTimeBased && (
              <button
                onClick={() => setTimerOpen(true)}
                className="focus-ring text-ink-800 hover:text-ink-200"
                aria-label="Cronometra questa metrica"
              >
                <Timer size={13} />
              </button>
            )}
            <button onClick={() => setConfigOpen(true)} className="focus-ring text-ink-800 hover:text-ink-200" aria-label="Impostazioni metrica">
              <Settings size={13} />
            </button>
            <button onClick={() => setAddOpen(true)} className="focus-ring flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1.5 text-[11px] text-ink-300 hover:border-aura-violet/50">
              <Plus size={12} /> Voce
            </button>
          </>
        }
      >
        {timerOpen && block.isTimeBased && (
          <div className="mb-3">
            <MetricTimer
              hobbyId={hobbyId}
              hobbyName={hobbyName}
              blockId={block.id}
              blockTitle={block.title}
              onFinish={(minutes) => {
                addMetricEntry(hobbyId, block.id, { date: todayIso(), value: minutes });
                setTimerOpen(false);
              }}
            />
          </div>
        )}

        {block.entries.length === 0 ? (
          <p className="text-xs text-ink-800">Ancora nessuna voce registrata.</p>
        ) : (
          <>
            <MiniLineChart
              points={block.entries.map((e) => ({ date: e.date, value: e.value }))}
              unit={block.unit}
              hideCurrentValue={block.isTimeBased}
            />

            {block.isTimeBased && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-ink-600">Totale cronometrato</p>
                  <p className="mt-0.5 text-sm text-ink-100">{formatMinutesDuration(totalTrackedMinutes)}</p>
                </div>
                {lastEntry && (
                  <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-ink-600">Ultimo cronometraggio</p>
                    <p className="mt-0.5 text-sm text-ink-100">{formatMinutesDuration(lastEntry.value)}</p>
                  </div>
                )}
              </div>
            )}

            {block.goalValue !== null && block.goalValue !== undefined && goalPct !== null && (
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-aura-gradient transition-all" style={{ width: `${goalPct}%` }} />
                </div>
                <p className="mt-1.5 text-[11px] text-ink-600">
                  Obiettivo: {block.isTimeBased ? formatMinutesDuration(block.goalValue) : `${block.goalValue} ${block.unit}`}{" "}
                  {block.goalDeadline ? `entro il ${formatDateShort(block.goalDeadline)}` : ""} · {goalPct}%
                </p>
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              {record && (
                <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-3 py-2">
                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] text-ink-600"><Trophy size={11} /> Record</p>
                  <p className="mt-0.5 text-sm text-ink-100">
                    {block.isTimeBased ? formatMinutesDuration(record.value) : `${record.value} ${block.unit}`}
                  </p>
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
                    onClick={() => setDetailId(e.id)}
                    className="focus-ring rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-ink-400 transition hover:border-aura-violet/50 hover:text-ink-100"
                  >
                    {block.isTimeBased ? formatMinutesDuration(e.value) : `${e.value} ${block.unit}`} · {formatDateShort(e.date)}
                  </button>
                ))}
            </div>
          </>
        )}
      </HobbyBlockCard>

      {addOpen && <MetricEntryModal hobbyId={hobbyId} hobbyName={hobbyName} block={block} onClose={() => setAddOpen(false)} />}
      {detailEntry && (
        <MetricEntryDetail
          hobbyId={hobbyId}
          hobbyName={hobbyName}
          block={block}
          entry={detailEntry}
          onClose={() => setDetailId(null)}
        />
      )}
      {configOpen && <MetricConfigModal hobbyId={hobbyId} block={block} onClose={() => setConfigOpen(false)} />}
    </>
  );
}
