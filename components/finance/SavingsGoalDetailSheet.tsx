"use client";
import { TrendingUp, Target } from "lucide-react";
import { SavingsGoal, SavingsGoalContribution } from "@/lib/types";
import { goalProjection } from "@/lib/goal-projection";
import { formatDateShort } from "@/lib/date-format";
import { PersonalCardSheet } from "@/components/home/PersonalCardSheet";

function formatDaysAhead(days: number): string {
  if (days <= 1) return "domani";
  if (days < 14) return `tra ${days} giorni`;
  if (days < 60) return `tra ${Math.round(days / 7)} settimane`;
  return `tra ${Math.round(days / 30)} mesi`;
}

export function SavingsGoalDetailSheet({
  goal,
  contributions,
  onClose,
}: {
  goal: SavingsGoal;
  contributions: SavingsGoalContribution[];
  onClose: () => void;
}) {
  const projection = goalProjection(goal, contributions);
  const pct = goal.targetAmount > 0 ? Math.min(1, goal.currentAmount / goal.targetAmount) : 0;
  const ownContributions = [...contributions].filter((c) => c.goalId === goal.id).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <PersonalCardSheet title={goal.label} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3.5">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-600">
            <Target size={12} /> Progresso
          </p>
          <p className="mt-1 font-display text-xl text-ink-100">
            {Math.round(goal.currentAmount)}€ <span className="text-sm text-ink-600">/ {Math.round(goal.targetAmount)}€</span>
          </p>
          <p className="mt-0.5 text-xs text-ink-600">{Math.round(pct * 100)}% raggiunto</p>
        </div>

        <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3.5">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-600">
            <TrendingUp size={12} /> Proiezione
          </p>
          {projection.remaining === 0 ? (
            <p className="mt-1.5 text-sm text-aura-emerald">Obiettivo già raggiunto.</p>
          ) : projection.estimatedDays === null ? (
            <p className="mt-1.5 text-sm text-ink-300">
              {projection.observedContributions < 2
                ? "Servono almeno un paio di versamenti recenti per stimare un ritmo."
                : "Al ritmo recente non ti stai avvicinando all'obiettivo."}
            </p>
          ) : (
            <p className="mt-1.5 text-sm text-ink-100">
              Ci arrivi <span className="text-aura-cyan">{formatDaysAhead(projection.estimatedDays)}</span>
              <span className="text-ink-600"> · a questo ritmo ~{projection.dailyRate.toFixed(1)}€/giorno</span>
            </p>
          )}
        </div>

        {ownContributions.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-ink-600">Ultimi movimenti</p>
            <div className="space-y-1.5">
              {ownContributions.slice(0, 6).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs">
                  <span className={c.amount >= 0 ? "text-aura-emerald" : "text-aura-pink"}>
                    {c.amount >= 0 ? "+" : ""}
                    {c.amount.toFixed(2)}€
                  </span>
                  <span className="text-ink-800">{formatDateShort(c.date.slice(0, 10))}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PersonalCardSheet>
  );
}
