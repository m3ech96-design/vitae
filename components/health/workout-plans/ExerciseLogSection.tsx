"use client";
import { useState } from "react";
import { Trophy, TrendingUp, Weight, X, Plus } from "lucide-react";
import { ExerciseLogEntry } from "@/lib/types";
import { exerciseLogStats } from "@/lib/exercise-log-stats";
import { formatDateShort } from "@/lib/date-format";
import { Button } from "@/components/ui/Button";

export function ExerciseLogSection({
  log,
  onAdd,
  onRemove,
}: {
  log: ExerciseLogEntry[];
  onAdd: () => void;
  onRemove: (entryId: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const stats = exerciseLogStats(log);
  const sorted = [...log].sort((a, b) => b.date.localeCompare(a.date));
  const visible = showAll ? sorted : sorted.slice(0, 4);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.14em] text-ink-600">Storico e record</p>
        <button
          onClick={onAdd}
          className="focus-ring flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-aura-cyan hover:border-aura-cyan/50"
        >
          <Plus size={12} /> Registra
        </button>
      </div>

      {stats.totalSessions === 0 ? (
        <p className="mt-2 text-xs text-ink-800">
          Registra una sessione (peso, ripetizioni, serie) per iniziare a vedere qui i tuoi progressi.
        </p>
      ) : (
        <>
          <div className="mt-2 grid grid-cols-2 gap-2.5">
            {stats.bestEstimatedOneRepMax && (
              <div className="rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] text-ink-600">
                  <Trophy size={12} className="text-aura-amber" /> Massimale stimato
                </p>
                <p className="mt-1 font-display text-sm text-ink-100">
                  {stats.bestEstimatedOneRepMax.value.toFixed(1)} kg
                </p>
                <p className="text-[10px] text-ink-800">{formatDateShort(stats.bestEstimatedOneRepMax.date)}</p>
              </div>
            )}
            {stats.bestWeight && (
              <div className="rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] text-ink-600">
                  <Weight size={12} className="text-aura-violet" /> Peso più alto
                </p>
                <p className="mt-1 font-display text-sm text-ink-100">
                  {stats.bestWeight.weightKg} kg × {stats.bestWeight.reps}
                </p>
                <p className="text-[10px] text-ink-800">{formatDateShort(stats.bestWeight.date)}</p>
              </div>
            )}
            {stats.bestSessionVolume && (
              <div className="col-span-2 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] text-ink-600">
                  <TrendingUp size={12} className="text-aura-emerald" /> Miglior volume in una sessione
                </p>
                <p className="mt-1 font-display text-sm text-ink-100">{stats.bestSessionVolume.volume.toFixed(0)} kg totali</p>
                <p className="text-[10px] text-ink-800">{formatDateShort(stats.bestSessionVolume.date)}</p>
              </div>
            )}
          </div>

          <div className="mt-3 space-y-1.5">
            {visible.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs">
                <span className="text-ink-300">
                  {e.weightKg} kg × {e.reps}
                  {e.sets > 1 ? ` × ${e.sets} serie` : ""}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-ink-800">{formatDateShort(e.date)}</span>
                  <button onClick={() => onRemove(e.id)} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label="Rimuovi sessione">
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {sorted.length > 4 && (
            <button onClick={() => setShowAll((v) => !v)} className="focus-ring mt-2 text-[11px] text-aura-violet">
              {showAll ? "Mostra meno" : `Vedi tutte le ${sorted.length} sessioni`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
