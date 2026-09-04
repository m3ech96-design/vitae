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
 *
 * Corretto secondo le istruzioni: i tre campi percentuale erano legati direttamente al numero
 * persistito, e cancellare la cifra scritta faceva ripartire `parseInt` da una stringa vuota
 * (`NaN`), rimesso subito a `0` — uno "0" che ricompariva a ogni cancellazione, impossibile da
 * togliere per scrivere una cifra nuova. Ora ogni campo ha il proprio stato di testo locale
 * (può restare vuoto mentre si scrive, come già fanno tutti gli altri campi numerici
 * dell'app): il numero persistito si aggiorna solo quando il testo è già una cifra valida, e
 * resta quello di prima finché il campo è vuoto o a metà — mai forzato a 0 nel frattempo.
 */
export function SalarySplitCalculator() {
  const { salarySplit, setSalarySplit, setMonthlyBudget, addSavingsEntry } = useFinance();
  const { fireTrigger } = useMood();
  const [salary, setSalary] = useState("");
  const [justApplied, setJustApplied] = useState(false);
  const [speseFisseText, setSpeseFisseText] = useState(() => String(salarySplit.speseFisse));
  const [tempoLiberoText, setTempoLiberoText] = useState(() => String(salarySplit.tempoLibero));
  const [risparmiText, setRisparmiText] = useState(() => String(salarySplit.risparmi));

  const n = parseFloat(salary.replace(",", "."));
  const validSalary = !Number.isNaN(n) && n > 0;

  // Per il calcolo e l'anteprima si usa sempre il testo scritto ORA, non l'ultimo valore
  // persistito — così l'anteprima (e il controllo "fa 100%?") riflette esattamente quello che
  // si vede nei campi, campo vuoto incluso (conta come 0 solo qui, mai scritto nel campo).
  const speseFissePct = speseFisseText === "" ? 0 : parseInt(speseFisseText, 10) || 0;
  const tempoLiberoPct = tempoLiberoText === "" ? 0 : parseInt(tempoLiberoText, 10) || 0;
  const risparmiPct = risparmiText === "" ? 0 : parseInt(risparmiText, 10) || 0;
  const totalPercent = speseFissePct + tempoLiberoPct + risparmiPct;
  const percentOk = totalPercent === 100;

  const speseFisseAmount = validSalary ? (n * speseFissePct) / 100 : 0;
  const tempoLiberoAmount = validSalary ? (n * tempoLiberoPct) / 100 : 0;
  const risparmiAmount = validSalary ? (n * risparmiPct) / 100 : 0;

  const setPercentText = (key: keyof typeof salarySplit, text: string) => {
    // Solo cifre (o vuoto) — un numero incompleto o vuoto resta locale, non tocca mai
    // l'impostazione persistita finché non torna un valore leggibile.
    if (text !== "" && !/^\d{1,3}$/.test(text)) return;
    if (key === "speseFisse") setSpeseFisseText(text);
    if (key === "tempoLibero") setTempoLiberoText(text);
    if (key === "risparmi") setRisparmiText(text);
    if (text === "") return;
    const clamped = Math.max(0, Math.min(100, parseInt(text, 10)));
    setSalarySplit({ ...salarySplit, [key]: clamped });
  };

  const apply = () => {
    if (!validSalary || !percentOk) return;
    addSavingsEntry(risparmiAmount, `Suddivisione stipendio (${risparmiPct}% di ${n.toLocaleString("it-IT")}€)`);
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
            value={speseFisseText}
            onChange={(e) => setPercentText("speseFisse", e.target.value)}
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
            value={tempoLiberoText}
            onChange={(e) => setPercentText("tempoLibero", e.target.value)}
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
            value={risparmiText}
            onChange={(e) => setPercentText("risparmi", e.target.value)}
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
