"use client";
import { useState } from "react";
import { CalendarClock, Check, X } from "lucide-react";
import { ExpenseCategory } from "@/lib/types";
import { EXPENSE_CATEGORY_META } from "@/lib/finance-meta";
import { capitalizeSentence } from "@/lib/text";
import { formatDateShort, todayIso } from "@/lib/date-format";
import { useFinance } from "@/lib/finance-context";
import { TextField } from "../ui/TextField";
import { InlineAddPanel } from "../ui/InlineAddPanel";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { CategoryPicker } from "./CategoryPicker";

export function PlannedExpensesSection() {
  const { plannedExpenses, addPlannedExpense, markPlannedPaid, removePlannedExpense } = useFinance();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(todayIso());
  const [category, setCategory] = useState<ExpenseCategory>("casa");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const pending = plannedExpenses.filter((p) => !p.paid).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const submit = () => {
    const n = parseFloat(amount.replace(",", "."));
    if (!label.trim() || Number.isNaN(n)) return;
    addPlannedExpense(capitalizeSentence(label.trim()), n, dueDate, category);
    setLabel("");
    setAmount("");
  };

  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 font-display text-sm text-ink-100">
        <CalendarClock size={14} className="text-aura-sky" /> Spese Future
      </p>
      <div className="space-y-2">
        {pending.length === 0 && <p className="text-xs text-ink-800">Nessuna Spesa Futura In Programma.</p>}
        {pending.map((e) => {
          const meta = EXPENSE_CATEGORY_META[e.category];
          return (
            <div key={e.id} className="flex items-center gap-3 rounded-xl2 border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: `${meta.color}22` }}>
                <meta.icon size={13} style={{ color: meta.color }} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink-100">{e.label}</p>
                <p className="text-[11px] text-ink-800">Entro Il {formatDateShort(e.dueDate)}</p>
              </div>
              <span className="shrink-0 text-sm text-ink-200">{e.amount.toLocaleString("it-IT")}€</span>
              <button onClick={() => markPlannedPaid(e.id)} className="focus-ring shrink-0 text-ink-600 hover:text-aura-cyan" aria-label="Segna Come Pagata">
                <Check size={15} />
              </button>
              <button onClick={() => setPendingDelete(e.id)} className="focus-ring shrink-0 text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-2">
        <InlineAddPanel label="Aggiungi Spesa Futura" canConfirm={Boolean(label.trim() && amount)} onConfirm={submit}>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Nome" placeholder="Es. Bollo Auto" value={label} onChange={(e) => setLabel(e.target.value)} />
            <TextField label="Importo (€)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <TextField label="Entro Il" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <CategoryPicker value={category} onChange={setCategory} />
        </InlineAddPanel>
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminare Questa Spesa Futura?"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            removePlannedExpense(pendingDelete);
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}
