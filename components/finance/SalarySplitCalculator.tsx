"use client";
import { useState } from "react";
import { PiggyBank, Wallet, Coffee, Home as HomeIcon } from "lucide-react";
import { useFinance } from "@/lib/finance-context";
import { useMood } from "@/lib/mood-context";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";

/**
 * "Dato un numero n di retribuzione, permetti all'utente di trarre da quel numero: n% spese
 * fisse, n% tempo libero, n% risparmi (di default 50/30/20 ma modificabile)" — questo è quel
 * calcolatore. Le percentuali sono un'impostazione vera (persistita, vedi finance-context.tsx),
 * non tre campi che ripartono da 50/30/20 ogni volta.
 *
 * "L'esito dei risparmi va direttamente nei risparmi con meccaniche come se lo avessi fatto
 * manualmente (cronologia, eccetera)": `addSavingsEntry` è la stessa funzione che usa il resto
 * della scheda Risparmi per un versamento a mano — nessuna scorciatoia parallela, la voce
 * finisce nella stessa cronologia con lo stesso meccanismo.
 *
 * "Tempo libero + spese fisse entra nel budget": la somma delle due diventa il budget del
 * ciclo corrente (`setMonthlyBudget`) — è quanto ti sei detto di poter spendere, non un'altra
 * spesa registrata a parte.
 */
export function SalarySplitCalculator() {
  const { salarySplit, setSalarySplit, setMonthlyBudget, addSavingsEntry } = useFinance();
  const { fireTrigger } = useMood();
  const [salary, setSalary] = useState("");
  const [justApplied, setJustApplied] = useState(false);

  const n = parseFloat(salary.replace(",", "."));
  const validSalary = !Number.isNaN(n) && n > 0;
  const totalPercent = salarySplit.speseFisse + salarySplit.tempoLibero + salarySplit.risparmi;
  const percentOk = totalPercent === 100;

  const speseFisseAmount = validSalary ? (n * salarySplit.speseFisse) / 100 : 0;
  const tempoLiberoAmount = validSalary ? (n * salarySplit.tempoLibero) / 100 : 0;
  const risparmiAmount = validSalary ? (n * salarySplit.risparmi) / 100 : 0;

  const updatePercent = (key: keyof typeof salarySplit, value: string) => {
    const parsed = parseInt(value, 10);
    setSalarySplit({ ...salarySplit, [key]: Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed)) });
  };

  const apply = () => {
    if (!validSalary || !percentOk) return;
    addSavingsEntry(risparmiAmount, `Suddivisione stipendio (${salarySplit.risparmi}% di ${n.toLocaleString("it-IT")}€)`);
    setMonthlyBudget(speseFisseAmount + tempoLiberoAmount);
    fireTrigger("finanze:stipendio-diviso");
    setSalary("");
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2500);
  };

  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 font-display text-sm text-ink-100">
        <PiggyBank size={14} className="text-aura-emerald" /> Suddividi lo stipendio
      </p>
      <p className="mb-3 text-xs text-ink-600">
        Da una retribuzione, decidi quanto va a spese fisse, tempo libero e risparmi — i risparmi vanno subito
        da parte, il resto diventa il budget del ciclo.
      </p>

      <TextField
        label="Retribuzione (€)"
        inputMode="decimal"
        placeholder="Es. 1600"
        value={salary}
        onChange={(e) => setSalary(e.target.value)}
      />

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl2 border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-ink-600">
            <HomeIcon size={12} className="text-aura-violet" /> Spese fisse
          </div>
          <input
            type="number"
            inputMode="numeric"
            value={salarySplit.speseFisse}
            onChange={(e) => updatePercent("speseFisse", e.target.value)}
            className="focus-ring w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-sm text-ink-100"
          />
          <p className="mt-1.5 text-[11px] text-ink-800">{Math.round(speseFisseAmount).toLocaleString("it-IT")}€</p>
        </div>
        <div className="rounded-xl2 border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-ink-600">
            <Coffee size={12} className="text-aura-cyan" /> Tempo libero
          </div>
          <input
            type="number"
            inputMode="numeric"
            value={salarySplit.tempoLibero}
            onChange={(e) => updatePercent("tempoLibero", e.target.value)}
            className="focus-ring w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-sm text-ink-100"
          />
          <p className="mt-1.5 text-[11px] text-ink-800">{Math.round(tempoLiberoAmount).toLocaleString("it-IT")}€</p>
        </div>
        <div className="rounded-xl2 border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-ink-600">
            <PiggyBank size={12} className="text-aura-emerald" /> Risparmi
          </div>
          <input
            type="number"
            inputMode="numeric"
            value={salarySplit.risparmi}
            onChange={(e) => updatePercent("risparmi", e.target.value)}
            className="focus-ring w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-sm text-ink-100"
          />
          <p className="mt-1.5 text-[11px] text-ink-800">{Math.round(risparmiAmount).toLocaleString("it-IT")}€</p>
        </div>
      </div>

      <p className={`mt-2 text-[11px] ${percentOk ? "text-ink-800" : "text-aura-pink"}`}>
        {percentOk ? "Totale: 100%" : `Totale: ${totalPercent}% — deve fare 100% per poter applicare`}
      </p>

      <Button className="mt-3 w-full justify-center" onClick={apply} disabled={!validSalary || !percentOk}>
        <Wallet size={14} />
        {justApplied ? "Applicato!" : "Applica alla scheda Finanze"}
      </Button>

      {validSalary && percentOk && (
        <p className="mt-2 text-[11px] text-ink-800">
          {Math.round(risparmiAmount).toLocaleString("it-IT")}€ ai Risparmi (con cronologia), budget del ciclo
          impostato a {Math.round(speseFisseAmount + tempoLiberoAmount).toLocaleString("it-IT")}€.
        </p>
      )}
    </div>
  );
}
