"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import { useFinance } from "@/lib/finance-context";
import { formatDateShort } from "@/lib/date-format";

/**
 * Elenco completo dei versamenti/prelievi del salvadanaio (savingsEntries — il flusso
 * generale, non lo storico per obiettivo che si apre dal singolo obiettivo), senza il tetto
 * di 5 righe mostrato nella scheda Risparmi (vedi SavingsSection).
 */
export default function CronologiaVersamentiPage() {
  const router = useRouter();
  const { hydrated, savingsEntries } = useFinance();

  const entries = useMemo(
    () => [...savingsEntries].sort((a, b) => b.date.localeCompare(a.date)),
    [savingsEntries]
  );

  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <button
        onClick={() => router.back()}
        className="focus-ring flex items-center gap-1.5 text-xs text-ink-600 hover:text-ink-200"
      >
        <ArrowLeft size={14} /> Indietro
      </button>

      <p className="mt-4 flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.28em] text-ink-600">
        <History size={12} /> Risparmi
      </p>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Cronologia versamenti</h1>
      <p className="mt-1 text-sm text-ink-600">
        {entries.length === 0
          ? "Ancora nessun versamento registrato."
          : `${entries.length} ${entries.length === 1 ? "movimento" : "movimenti"} in totale`}
      </p>

      <div className="mt-6 space-y-1.5">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.015] px-3.5 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink-100">{entry.note || (entry.amount >= 0 ? "Versamento" : "Prelievo")}</p>
              <p className="text-[11px] text-ink-800">{formatDateShort(entry.date)}</p>
            </div>
            <span className={`shrink-0 text-sm ${entry.amount >= 0 ? "text-aura-emerald" : "text-aura-pink"}`}>
              {entry.amount >= 0 ? "+" : ""}
              {entry.amount.toLocaleString("it-IT")}€
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
