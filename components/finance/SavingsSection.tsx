"use client";
import { useState } from "react";
import { PiggyBank, Target } from "lucide-react";
import { capitalizeWords } from "@/lib/text";
import { useFinance } from "@/lib/finance-context";
import { TextField } from "../ui/TextField";
import { InlineAddPanel } from "../ui/InlineAddPanel";
import { SavingsVessel } from "./SavingsVessel";

export function SavingsSection() {
  const { savingsGoals, addSavingsGoal, contributeSavingsGoal, removeSavingsGoal, savingsEntries, addSavingsEntry } = useFinance();
  const [goalLabel, setGoalLabel] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMode, setDepositMode] = useState<"deposita" | "preleva">("deposita");
  const [depositing, setDepositing] = useState(false);

  const balance = savingsEntries.reduce((s, e) => s + e.amount, 0);

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
