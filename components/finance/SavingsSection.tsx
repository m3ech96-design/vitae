"use client";
import { useState } from "react";
import { PiggyBank, Target, History } from "lucide-react";
import { capitalizeWords } from "@/lib/text";
import { formatDateShort } from "@/lib/date-format";
import { useFinance } from "@/lib/finance-context";
import { TextField } from "../ui/TextField";
import { InlineAddPanel } from "../ui/InlineAddPanel";
import { SavingsVessel } from "./SavingsVessel";

const HISTORY_PAGE_SIZE = 10;

export function SavingsSection() {
  const { savingsGoals, addSavingsGoal, contributeSavingsGoal, removeSavingsGoal, savingsEntries, addSavingsEntry } = useFinance();
  const [goalLabel, setGoalLabel] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMode, setDepositMode] = useState<"deposita" | "preleva">("deposita");
  const [depositing, setDepositing] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(HISTORY_PAGE_SIZE);

  const balance = savingsEntries.reduce((s, e) => s + e.amount, 0);
  const recentEntries = [...savingsEntries].sort((a, b) => b.date.localeCompare(a.date));

  const submitGoal = () => {
    const n = parseFloat(goalTarget.replace(",", "."));
    if (!goalLabel.trim() || Number.isNaN(n)) return;
    addSavingsGoal(capitalizeWords(goalLabel.trim()), n);
    setGoalLabel("");
    setGoalTarget("");
  };

  const submitDeposit = () => {
    const n = parseFloat(depositAmount.replace(",", "."));
    if (Number.isNaN(n) || n <= 0) return;
    addSavingsEntry(depositMode === "deposita" ? n : -n);
    setDepositAmount("");
    setDepositing(false);
  };

  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 font-display text-sm text-ink-100">
        <PiggyBank size={14} className="text-aura-emerald" /> Risparmi
      </p>

      <div className="mb-6 rounded-xl2 border border-aura-emerald/20 bg-aura-emerald/[0.05] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-2xl text-ink-100">{balance.toLocaleString("it-IT")}€</p>
            <p className="text-xs text-ink-600">Nel salvadanaio</p>
          </div>
          {!depositing && (
            <button
              onClick={() => setDepositing(true)}
              className="focus-ring rounded-full border border-aura-emerald/30 px-3.5 py-2 text-xs text-ink-200 hover:border-aura-emerald/60"
            >
              Deposita o preleva
            </button>
          )}
        </div>

        {depositing && (
          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setDepositMode("deposita")}
                className={`focus-ring flex-1 rounded-full border py-2 text-xs transition ${
                  depositMode === "deposita" ? "border-aura-emerald/60 bg-aura-emerald/15 text-ink-100" : "border-white/10 text-ink-600"
                }`}
              >
                Deposita
              </button>
              <button
                onClick={() => setDepositMode("preleva")}
                className={`focus-ring flex-1 rounded-full border py-2 text-xs transition ${
                  depositMode === "preleva" ? "border-aura-pink/60 bg-aura-pink/15 text-ink-100" : "border-white/10 text-ink-600"
                }`}
              >
                Preleva
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                autoFocus
                inputMode="decimal"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitDeposit()}
                placeholder="Importo €"
                className="focus-ring flex-1 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-ink-100"
              />
              <button
                onClick={() => setDepositing(false)}
                className="focus-ring rounded-full px-3 py-2 text-xs text-ink-600 hover:text-ink-200"
              >
                Annulla
              </button>
              <button onClick={submitDeposit} className="focus-ring rounded-full bg-aura-gradient px-4 py-2 text-xs text-void-950">
                Conferma
              </button>
            </div>
          </div>
        )}
      </div>

      {recentEntries.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 flex items-center gap-1.5 text-xs text-ink-600">
            <History size={12} /> Cronologia versamenti
          </p>
          <div className="space-y-1.5">
            {recentEntries.slice(0, historyVisible).map((entry) => (
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
          {historyVisible < recentEntries.length && (
            <button
              onClick={() => setHistoryVisible((v) => v + HISTORY_PAGE_SIZE)}
              className="focus-ring mt-2 w-full rounded-xl2 border border-white/10 py-2 text-xs text-ink-400 hover:border-white/20 hover:text-ink-100"
            >
              Carica altri ({recentEntries.length - historyVisible} rimasti)
            </button>
          )}
        </div>
      )}

      <p className="mb-3 flex items-center gap-1.5 text-xs text-ink-600">
        <Target size={12} /> Obiettivi di risparmio
      </p>
      <div className="flex flex-wrap gap-4">
        {savingsGoals.map((g) => (
          <SavingsVessel
            key={g.id}
            goal={g}
            onContribute={(amount) => contributeSavingsGoal(g.id, amount)}
            onRemove={() => removeSavingsGoal(g.id)}
          />
        ))}
      </div>

      <div className="mt-4">
        <InlineAddPanel label="Nuovo obiettivo" canConfirm={Boolean(goalLabel.trim() && goalTarget)} onConfirm={submitGoal}>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Nome" placeholder="Es. Viaggio In Giappone" value={goalLabel} onChange={(e) => setGoalLabel(e.target.value)} />
            <TextField label="Obiettivo (€)" inputMode="decimal" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} />
          </div>
        </InlineAddPanel>
      </div>
    </div>
  );
}
