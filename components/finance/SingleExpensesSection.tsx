"use client";
import { useState } from "react";
import { Receipt, X } from "lucide-react";
import { ExpenseCategory } from "@/lib/types";
import { EXPENSE_CATEGORY_META } from "@/lib/finance-meta";
import { capitalizeSentence } from "@/lib/text";
import { formatDateShort, todayIso } from "@/lib/date-format";
import { useFinance } from "@/lib/finance-context";
import { useMood } from "@/lib/mood-context";
import { TextField } from "../ui/TextField";
import { InlineAddPanel } from "../ui/InlineAddPanel";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Switch } from "../ui/Switch";
import { CategoryPicker } from "./CategoryPicker";

export function SingleExpensesSection() {
  const { singleExpenses, addSingleExpense, removeSingleExpense } = useFinance();
  const { fireTrigger } = useMood();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [category, setCategory] = useState<ExpenseCategory>("altro");
  const [chargedToBudget, setChargedToBudget] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const recent = [...singleExpenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  const submit = () => {
    const n = parseFloat(amount.replace(",", "."));
    if (!label.trim() || Number.isNaN(n)) return;
    addSingleExpense(capitalizeSentence(label.trim()), n, date, category, chargedToBudget);
    fireTrigger("finanze:spesa-registrata");
    setLabel("");
    setAmount("");
    setChargedToBudget(true);
  };

  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 font-display text-sm text-ink-100">
        <Receipt size={14} className="text-aura-pink" /> Spese singole
      </p>
      <div className="space-y-2">
        {recent.length === 0 && <p className="text-xs text-ink-800">Nessuna spesa singola registrata a mano.</p>}
        {recent.map((e) => {
          const meta = EXPENSE_CATEGORY_META[e.category];
          return (
            <div key={e.id} className="flex items-center gap-3 rounded-xl2 border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: `${meta.color}22` }}>
                <meta.icon size={13} style={{ color: meta.color }} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink-100">{e.label}</p>
                <p className="flex items-center gap-1 text-[11px] text-ink-800">
                  {formatDateShort(e.date)}
                  {e.chargedToBudget === false && <span className="text-aura-amber">· solo informativa</span>}
                </p>
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
        <InlineAddPanel label="Aggiungi spesa singola" canConfirm={Boolean(label.trim() && amount)} onConfirm={submit}>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Nome" placeholder="Es. Regalo compleanno" value={label} onChange={(e) => setLabel(e.target.value)} />
            <TextField label="Importo (€)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <CategoryPicker value={category} onChange={setCategory} />
          <label className="flex items-center justify-between gap-3 rounded-xl2 border border-white/10 bg-white/[0.03] px-3.5 py-3">
            <span className="min-w-0">
              <span className="block text-xs text-ink-100">Addebita dal budget</span>
              <span className="block text-[10px] text-ink-800">
                {chargedToBudget ? "Conta nel totale speso di questo ciclo" : "Solo un dato in cronologia, non tocca il budget"}
              </span>
            </span>
            <Switch checked={chargedToBudget} onChange={setChargedToBudget} tone="violet" />
          </label>
        </InlineAddPanel>
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminare questa spesa?"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            removeSingleExpense(pendingDelete);
            setPendingDelete(null);
          }}
        />
      )}

      <p className="mt-3 text-[11px] text-ink-800">
        Le spese registrate completando una Task o uscendo da un Luogo entrano già in automatico nel totale
        del mese — qui aggiungi solo quelle non passate da lì.
      </p>
    </div>
  );
}
