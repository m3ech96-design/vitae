"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Plus, X } from "lucide-react";
import { Button } from "./Button";

export interface SpentBreakdownItem {
  category: string;
  amount: number;
}

export function SpentPrompt({
  onConfirm,
  onClose,
  splitCategories,
}: {
  /** Riceve sempre la ripartizione — un solo elemento se non stai dividendo la spesa. */
  onConfirm: (breakdown: SpentBreakdownItem[]) => void;
  onClose: () => void;
  /** Se presente, permette di dividere la spesa tra queste categorie invece di un unico importo. */
  splitCategories?: string[];
}) {
  const [amount, setAmount] = useState("");
  const [rows, setRows] = useState<SpentBreakdownItem[]>([]);
  const [category, setCategory] = useState(splitCategories?.[0] || "");
  const [customCategory, setCustomCategory] = useState("");
  const [rowAmount, setRowAmount] = useState("");

  const addRow = () => {
    const n = parseFloat(rowAmount.replace(",", "."));
    if (Number.isNaN(n) || n <= 0) return;
    const label = category === "Altro" ? customCategory.trim() || "Altro" : category;
    setRows((r) => [...r, { category: label, amount: n }]);
    setRowAmount("");
    setCustomCategory("");
  };

  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  const confirm = () => {
    if (splitCategories) {
      if (rows.length > 0) onConfirm(rows);
    } else {
      const n = parseFloat(amount.replace(",", "."));
      if (!Number.isNaN(n) && n > 0) onConfirm([{ category: "Cibo", amount: n }]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong flex max-h-[85vh] w-full max-w-xs flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 p-6 pb-0">
          <Wallet size={18} className="mb-3 text-aura-emerald" />
          <p className="mb-1 font-display text-base text-ink-100">Quanto hai speso?</p>
          <p className="mb-4 text-xs text-ink-600">
            {splitCategories ? "Facoltativo — puoi dividerlo tra più categorie." : "Facoltativo — servirà nella scheda Finanze."}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {!splitCategories ? (
            <input
              autoFocus
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00 €"
              className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-lg text-ink-100 placeholder:text-ink-800"
            />
          ) : (
            <div className="space-y-3">
              {rows.length > 0 && (
                <div className="space-y-1.5">
                  {rows.map((r, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl2 border border-white/[0.08] bg-white/[0.02] px-3 py-2">
                      <span className="text-xs text-ink-300">{r.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink-100">{r.amount.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</span>
                        <button onClick={() => removeRow(i)} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <p className="pt-1 text-right text-xs text-ink-600">
                    Totale: <span className="text-ink-100">{total.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</span>
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {splitCategories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`focus-ring rounded-full border px-2.5 py-1.5 text-[11px] transition ${
                      category === c ? "border-aura-emerald/60 bg-aura-emerald/15 text-ink-100" : "border-white/10 text-ink-600"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {category === "Altro" && (
                <input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Nome categoria..."
                  className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-800"
                />
              )}
              <div className="flex gap-2">
                <input
                  inputMode="decimal"
                  value={rowAmount}
                  onChange={(e) => setRowAmount(e.target.value)}
                  placeholder="0,00 €"
                  className="focus-ring flex-1 rounded-xl2 border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-800"
                />
                <button
                  onClick={addRow}
                  className="focus-ring flex items-center gap-1 rounded-xl2 border border-aura-emerald/40 px-3 text-aura-emerald hover:bg-aura-emerald/10"
                >
                  <Plus size={14} /> Aggiungi
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex shrink-0 justify-end gap-2 p-6 pt-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Salta
          </Button>
          <Button size="sm" onClick={confirm}>
            Conferma
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
