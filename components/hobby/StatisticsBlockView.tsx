"use client";
import { useState } from "react";
import { Plus, Minus, TrendingUp, TrendingDown, LayoutGrid, Radar as RadarIcon } from "lucide-react";
import { useHobby } from "@/lib/hobby-context";
import { StatisticsBlock, StatEntry } from "@/lib/hobby-types";
import { HobbyBlockCard } from "./HobbyBlockCard";
import { StatEntryModal } from "./StatEntryModal";

/** Tavolozza a rotazione — mai lo stesso colore fisso indipendentemente dal contenuto (vedi
 * il commento su StatEntry.color in hobby-types.ts). Toni distinguibili anche in sequenza
 * ravvicinata (una scheda personaggio con 10+ abilità è il caso comune di riferimento, non
 * l'eccezione), scelti dalla stessa famiglia aura-* già in uso nel resto dell'app. */
const STAT_PALETTE = ["#7C5CFF", "#00E5C7", "#FFB454", "#FF6B9D", "#34D399", "#5CA6FF", "#F2C94C", "#B98CFF", "#FF8A5C", "#5CE1E6"];

function colorFor(entry: StatEntry, index: number): string {
  return entry.color ?? STAT_PALETTE[index % STAT_PALETTE.length];
}

/** La scala condivisa da entrambi i grafici — il punto più alto possibile tra tutte le voci,
 * usando il tetto di ciascuna quando c'è (altrimenti il suo valore attuale). Robusta ai dati
 * parziali: non tutte le voci avranno un massimo impostato (l'oro di una partita non ne ha
 * uno naturale), quindi la scala non può dipendere dal presupporre che ce l'abbiano tutte. */
function sharedScale(entries: StatEntry[]): number {
  return Math.max(1, ...entries.map((e) => e.max ?? e.value));
}

function BarChart({ entries }: { entries: StatEntry[] }) {
  const scale = sharedScale(entries);
  const sorted = [...entries].sort((a, b) => b.value - a.value);
  const highestId = sorted[0]?.id;
  const lowestId = sorted[sorted.length - 1]?.id;

  return (
    <div className="space-y-2.5">
      {sorted.map((entry) => {
        const pct = Math.max(2, (entry.value / scale) * 100);
        const capPct = entry.max ? Math.min(100, (entry.max / scale) * 100) : null;
        const isHighest = entry.id === highestId && sorted.length > 1;
        const isLowest = entry.id === lowestId && sorted.length > 1;
        const idx = entries.findIndex((e) => e.id === entry.id);
        return (
          <div key={entry.id}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-ink-200">
                {isHighest && <TrendingUp size={11} className="text-aura-emerald" />}
                {isLowest && <TrendingDown size={11} className="text-aura-pink" />}
                {entry.name}
              </span>
              <span className="tabular-nums text-ink-600">
                {entry.value}
                {entry.max ? ` / ${entry.max}` : ""}
              </span>
            </div>
            <div className="relative h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
              {capPct !== null && capPct < 100 && (
                <span className="absolute inset-y-0 border-r border-dashed border-white/25" style={{ left: `${capPct}%` }} />
              )}
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: colorFor(entry, idx), opacity: isLowest ? 0.6 : 1 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RadarChart({ entries }: { entries: StatEntry[] }) {
  const scale = sharedScale(entries);
  const size = 220;
  const center = size / 2;
  const radius = size / 2 - 34;
  const n = entries.length;

  const pointAt = (i: number, fraction: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: center + Math.cos(angle) * radius * fraction, y: center + Math.sin(angle) * radius * fraction };
  };

  const valuePolygon = entries.map((e, i) => pointAt(i, Math.max(0.03, e.value / scale)));
  const polygonPath = valuePolygon.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";

  return (
    <div className="flex justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[260px]">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon
            key={f}
            points={entries.map((_, i) => pointAt(i, f)).map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
          />
        ))}
        {entries.map((_, i) => {
          const p = pointAt(i, 1);
          return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.08)" />;
        })}
        <path d={polygonPath} fill="#7C5CFF33" stroke="#7C5CFF" strokeWidth={1.5} strokeLinejoin="round" />
        {valuePolygon.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={colorFor(entries[i], i)} />
        ))}
        {entries.map((e, i) => {
          const p = pointAt(i, 1.18);
          return (
            <text
              key={e.id}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9.5}
              fill="rgba(230,230,240,0.75)"
            >
              {e.name.length > 10 ? `${e.name.slice(0, 9)}…` : e.name}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export function StatisticsBlockView({ hobbyId, block, index, total }: { hobbyId: string; block: StatisticsBlock; index: number; total: number }) {
  const { updateStatEntry, setStatChartView } = useHobby();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const editEntry = block.entries.find((e) => e.id === editId);

  // Il radar perde leggibilità sotto le 3 voci (un triangolo degenere) e oltre le 10 (assi
  // troppo fitti per leggere le etichette) — fuori da questo intervallo resta disponibile
  // solo la vista a barre, che scala bene a qualunque numero di voci.
  const radarEligible = block.entries.length >= 3 && block.entries.length <= 10;
  const view = radarEligible ? block.chartView : "barre";

  const adjust = (entry: StatEntry, delta: number) => updateStatEntry(hobbyId, block.id, entry.id, { value: entry.value + delta });

  return (
    <>
      <HobbyBlockCard
        hobbyId={hobbyId}
        blockId={block.id}
        collapsed={block.collapsed}
        index={index}
        total={total}
        title={block.title}
        subtitle={block.entries.length > 0 ? `${block.entries.length} voci` : undefined}
        extra={
          <>
            {radarEligible && (
              <button
                onClick={() => setStatChartView(hobbyId, block.id, view === "barre" ? "radar" : "barre")}
                className="focus-ring text-ink-800 hover:text-ink-200"
                aria-label={view === "barre" ? "Vista radar" : "Vista a barre"}
              >
                {view === "barre" ? <RadarIcon size={14} /> : <LayoutGrid size={14} />}
              </button>
            )}
            <button onClick={() => setAddOpen(true)} className="focus-ring flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1.5 text-[11px] text-ink-300 hover:border-aura-violet/50">
              <Plus size={12} /> Voce
            </button>
          </>
        }
      >
        {block.entries.length === 0 ? (
          <p className="text-xs text-ink-800">Ancora nessuna statistica. Aggiungine una per iniziare a confrontarle.</p>
        ) : (
          <>
            <div className="space-y-1.5">
              {block.entries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2 rounded-xl2 border border-white/[0.06] bg-white/[0.015] px-3 py-2">
                  <button onClick={() => setEditId(entry.id)} className="focus-ring min-w-0 flex-1 text-left">
                    <p className="truncate text-sm text-ink-100">{entry.name}</p>
                  </button>
                  <button
                    onClick={() => adjust(entry, -entry.step)}
                    disabled={entry.value <= entry.min}
                    className="focus-ring flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-ink-400 disabled:opacity-30 hover:border-aura-pink/50 hover:text-aura-pink"
                    aria-label={`Diminuisci ${entry.name}`}
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-10 text-center text-sm tabular-nums text-ink-100">{entry.value}</span>
                  <button
                    onClick={() => adjust(entry, entry.step)}
                    disabled={entry.max !== undefined && entry.value >= entry.max}
                    className="focus-ring flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-ink-400 disabled:opacity-30 hover:border-aura-emerald/50 hover:text-aura-emerald"
                    aria-label={`Aumenta ${entry.name}`}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-white/[0.06] pt-4">
              {view === "radar" ? <RadarChart entries={block.entries} /> : <BarChart entries={block.entries} />}
            </div>
          </>
        )}
      </HobbyBlockCard>

      {addOpen && <StatEntryModal hobbyId={hobbyId} blockId={block.id} onClose={() => setAddOpen(false)} />}
      {editEntry && <StatEntryModal hobbyId={hobbyId} blockId={block.id} entry={editEntry} onClose={() => setEditId(null)} />}
    </>
  );
}
