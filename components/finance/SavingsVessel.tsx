"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Check, Plus } from "lucide-react";
import { SavingsGoal } from "@/lib/types";
import { ConfirmDialog } from "../ui/ConfirmDialog";

export function SavingsVessel({
  goal,
  onContribute,
  onRemove,
}: {
  goal: SavingsGoal;
  onContribute: (amount: number) => void;
  onRemove: () => void;
}) {
  const pct = goal.targetAmount > 0 ? Math.min(1, goal.currentAmount / goal.targetAmount) : 0;
  const complete = pct >= 1;
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const confirm = () => {
    const n = parseFloat(draft.replace(",", "."));
    if (!Number.isNaN(n) && n > 0) onContribute(n);
    setDraft("");
    setAdding(false);
  };

  return (
    <div className="group relative flex shrink-0 flex-col items-center gap-2">
      <button
        onClick={() => setConfirmDelete(true)}
        className="focus-ring absolute -top-1 right-0 z-10 text-ink-800 opacity-0 transition hover:text-aura-pink group-hover:opacity-100"
        aria-label="Rimuovi obiettivo"
      >
        <X size={13} />
      </button>
      <div className="relative h-28 w-14 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.02]">
        <motion.div
          className="absolute inset-x-0 bottom-0"
          style={{
            background: complete
              ? "linear-gradient(180deg, #FFD86B, #FFB454)"
              : "linear-gradient(180deg, #00E5C7, #7C5CFF)",
            boxShadow: `0 0 16px ${complete ? "#FFD86Baa" : "#00E5C7aa"}`,
          }}
          animate={{ height: `${pct * 100}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        />
        <span className="absolute inset-x-0 top-1.5 text-center text-[10px] text-ink-400">{Math.round(pct * 100)}%</span>
      </div>
      <p className="max-w-[70px] truncate text-center text-[11px] text-ink-200">{goal.label}</p>
      <p className="text-[10px] text-ink-800">
        {Math.round(goal.currentAmount)}€ / {Math.round(goal.targetAmount)}€
      </p>

      {adding ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirm()}
            placeholder="€"
            className="focus-ring w-14 rounded-lg border border-aura-cyan/40 bg-white/[0.05] px-1.5 py-1 text-center text-xs text-ink-100"
          />
          <button onClick={confirm} className="focus-ring text-aura-cyan" aria-label="Conferma">
            <Check size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="focus-ring flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[10px] text-ink-600 hover:text-ink-200"
        >
          <Plus size={10} /> Aggiungi
        </button>
      )}
      {confirmDelete && (
        <ConfirmDialog
          title={`Eliminare "${goal.label}"?`}
          description={`Perderai il progresso di ${Math.round(goal.currentAmount)}€ già accumulato.`}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            onRemove();
            setConfirmDelete(false);
          }}
        />
      )}
    </div>
  );
}
