"use client";
import { useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { ExpenseCategory, ExpenseRecurrence, EXPENSE_RECURRENCE_LABEL } from "@/lib/types";
import { EXPENSE_CATEGORY_META } from "@/lib/finance-meta";
import { capitalizeSentence } from "@/lib/text";
import { useFinance } from "@/lib/finance-context";
import { TextField } from "../ui/TextField";
import { InlineAddPanel } from "../ui/InlineAddPanel";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { CategoryPicker } from "./CategoryPicker";

const RECURRENCES: ExpenseRecurrence[] = ["settimanale", "mensile", "annuale"];

export function RecurringExpensesSection() {
  const { recurringExpenses, addRecurringExpense, toggleRecurringExpense, removeRecurringExpense } = useFinance();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("abbonamenti");
  const [recurrence, setRecurrence] = useState<ExpenseRecurrence>("mensile");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const submit = () => {
    const n = parseFloat(amount.replace(",", "."));
    if (!label.trim() || Number.isNaN(n)) return;
    addRecurringExpense(capitalizeSentence(label.trim()), n, category, recurrence);
    setLabel("");
    setAmount("");
  };

  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 font-display text-sm text-ink-100">
        <RefreshCw size={14} className="text-aura-amber" /> Spese In Loop
      </p>
      <div className="space-y-2">
        {recurringExpenses.map((e) => {
          const meta = EXPENSE_CATEGORY_META[e.category];
          return (
            <div
              key={e.id}
              className={`flex items-center gap-3 rounded-xl2 border px-3.5 py-2.5 transition ${
                e.active ? "border-white/[0.08] bg-white/[0.02]" : "border-white/[0.04] opacity-40"
              }`}
            >
              <button
                onClick={() => toggleRecurringExpense(e.id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ background: `${meta.color}22` }}
                aria-label="Attiva/Disattiva"
              >
                <meta.icon size={13} style={{ color: meta.color }} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink-100">{e.label}</p>
                <p className="text-[11px] text-ink-800">{EXPENSE_RECURRENCE_LABEL[e.recurrence]}</p>
              </div>
              <span className="shrink-0 text-sm text-ink-200">{e.amount.toLocaleString("it-IT")}€</span>
              <button onClick={() => setPendingDelete(e.id)} className="focus-ring shrink-0 text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-2">
        <InlineAddPanel label="Aggiungi Spesa In Loop" canConfirm={Boolean(label.trim() && amount)} onConfirm={submit}>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Nome" placeholder="Es. Palestra" value={label} onChange={(e) => setLabel(e.target.value)} />
            <TextField label="Importo (€)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <CategoryPicker value={category} onChange={setCategory} />
          <div className="flex gap-2">
            {RECURRENCES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRecurrence(r)}
                className={`focus-ring rounded-full border px-3 py-1.5 text-xs transition ${
                  recurrence === r ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-600"
                }`}
              >
                {EXPENSE_RECURRENCE_LABEL[r]}
              </button>
            ))}
          </div>
        </InlineAddPanel>
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminare Questa Spesa In Loop?"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            removeRecurringExpense(pendingDelete);
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}
