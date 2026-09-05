"use client";
import { useState } from "react";
import { PiggyBank, Wallet, Coffee, Home as HomeIcon, ArrowLeftRight } from "lucide-react";
import { useFinance } from "@/lib/finance-context";
import { useMood } from "@/lib/mood-context";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";

type SplitKey = "speseFisse" | "tempoLibero" | "risparmi";

/**
 * "Dato un numero n di retribuzione, permetti all'utente di trarre da quel numero: n% spese
 * fisse, n% tempo libero, n% risparmi (di default 50/30/20 ma modificabile)" — questo è quel
 * calcolatore. Le percentuali sono un'impostazione vera (persistita, vedi finance-context.tsx),
 * non tre campi che ripartono da 50/30/20 ogni volta.
 *
 * Il calcolo può andare anche al contrario: in modalità "Importi", scrivere direttamente
 * quanti euro vanno a una delle tre categorie ricalcola solo la sua percentuale sull'intero
 * (arrotondata) — le altre due caselle, sia come importo scritto sia come percentuale
 * persistita, restano quelle che erano. Non c'è ribilanciamento automatico: è la somma dei
 * tre importi, mostrata sotto ai campi, a dire se si è arrivati o no alla retribuzione
 * (l'"intero" da raggiungere qui è l'euro, non il 100% — stesso principio del controllo
 * percentuale, applicato all'importo assoluto). "Applica" usa gli importi scritti così
 * come sono, non quelli ricostruiti dalla percentuale arrotondata, per evitare che due
 * arrotondamenti indipendenti facciano perdere centesimi.
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
 *
 * Corretto secondo ulteriori istruzioni: sia in modalità Percentuali sia in modalità Importi,
 * toccare un campo NON tocca più gli altri due — prima, in modalità Importi, cambiava anche le
 * percentuali (e gli importi mostrati) delle altre due categorie per tenerle a somma fissa.
 * Ora ogni campo è indipendente in entrambe le modalità, e resta solo il controllo del totale
 * (100% o, in Importi, la retribuzione intera) a segnalare se serve un aggiustamento manuale.
 */
export function SalarySplitCalculator() {
  const { salarySplit, setSalarySplit, setMonthlyBudget, addSavingsEntry } = useFinance();
  const { fireTrigger } = useMood();
  const [mode, setMode] = useState<"percentuali" | "importi">("percentuali");
  const [salary, setSalary] = useState("");
  const [justApplied, setJustApplied] = useState(false);
  const [speseFisseText, setSpeseFisseText] = useState(() => String(salarySplit.speseFisse));
  const [tempoLiberoText, setTempoLiberoText] = useState(() => String(salarySplit.tempoLibero));
  const [risparmiText, setRisparmiText] = useState(() => String(salarySplit.risparmi));
  // Testo degli importi in euro — solo per la modalità "Importi": indipendente dal testo
  // delle percentuali qui sopra, così passare da una modalità all'altra non fa sparire
  // quello che si stava scrivendo nell'altra.
  const [amountText, setAmountText] = useState<Record<SplitKey, string>>({ speseFisse: "", tempoLibero: "", risparmi: "" });

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

  // Stesso controllo del totale, ma per la modalità Importi: qui l'"intero" da raggiungere
  // è la retribuzione in euro, non 100%. Un campo vuoto conta come 0€, solo per questo
  // conteggio — mai scritto nel campo (stessa convenzione delle percentuali qui sopra).
  const parseAmount = (text: string) => {
    if (text.trim() === "") return 0;
    const v = parseFloat(text.replace(",", "."));
    return Number.isNaN(v) ? 0 : v;
  };
  const speseFisseAmountText = parseAmount(amountText.speseFisse);
  const tempoLiberoAmountText = parseAmount(amountText.tempoLibero);
  const risparmiAmountText = parseAmount(amountText.risparmi);
  const totalAmount = speseFisseAmountText + tempoLiberoAmountText + risparmiAmountText;
  // Tolleranza di un centesimo per via degli arrotondamenti a due decimali.
  const amountOk = validSalary && Math.abs(totalAmount - n) < 0.01;

  const setPercentText = (key: SplitKey, text: string) => {
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

  // Scrivere un importo in euro per una categoria aggiorna solo quella percentuale
  // (arrotondata sull'intero) — le altre due caselle restano quelle che erano, sia come
  // importo scritto sia come percentuale persistita. Non c'è più ribilanciamento
  // automatico: è la somma dei tre importi, mostrata sotto, a segnalare se si è arrivati
  // o no all'intero (la retribuzione) — la stessa logica del totale percentuale qui sopra,
  // applicata all'euro invece che al 100%.
  const setAmountForKey = (key: SplitKey, text: string) => {
    setAmountText((prev) => ({ ...prev, [key]: text }));
    if (!validSalary || text.trim() === "") return;
    const amount = parseFloat(text.replace(",", "."));
    if (Number.isNaN(amount) || amount < 0) return;
    const pct = Math.round((amount / n) * 100);
    setSalarySplit({ ...salarySplit, [key]: Math.max(0, Math.min(100, pct)) });
    if (key === "speseFisse") setSpeseFisseText(String(pct));
    if (key === "tempoLibero") setTempoLiberoText(String(pct));
    if (key === "risparmi") setRisparmiText(String(pct));
  };

  const apply = () => {
    if (!validSalary) return;
    // In modalità Importi il vincolo che conta è sull'euro scritto nei campi (amountOk),
    // non sulle percentuali arrotondate — due arrotondamenti indipendenti possono sommare
    // a 100€... ma non esattamente a 100% e viceversa. Si applicano quindi gli importi
    // scritti così come sono, non quelli ricostruiti dalla percentuale arrotondata.
    if (mode === "percentuali") {
      if (!percentOk) return;
      addSavingsEntry(risparmiAmount, `Suddivisione stipendio (${risparmiPct}% di ${n.toLocaleString("it-IT")}€)`);
      setMonthlyBudget(speseFisseAmount + tempoLiberoAmount);
    } else {
      if (!amountOk) return;
      addSavingsEntry(risparmiAmountText, `Suddivisione stipendio (${Math.round(risparmiAmountText).toLocaleString("it-IT")}€ di ${n.toLocaleString("it-IT")}€)`);
      setMonthlyBudget(speseFisseAmountText + tempoLiberoAmountText);
    }
    fireTrigger("finanze:stipendio-diviso");
    setSalary("");
    setAmountText({ speseFisse: "", tempoLibero: "", risparmi: "" });
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2500);
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className="flex items-center gap-1.5 font-display text-sm text-ink-100">
          <PiggyBank size={14} className="text-aura-emerald" /> Suddividi lo stipendio
        </p>
        <button
          onClick={() => setMode((m) => (m === "percentuali" ? "importi" : "percentuali"))}
          className="focus-ring flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-ink-600 transition hover:border-aura-cyan/50 hover:text-ink-200"
        >
          <ArrowLeftRight size={11} /> {mode === "percentuali" ? "Passa a Importi" : "Passa a Percentuali"}
        </button>
      </div>
      <p className="mb-3 text-xs text-ink-600">
        {mode === "percentuali"
          ? "Da una retribuzione, decidi quanto va a spese fisse, tempo libero e risparmi — i risparmi vanno subito da parte, il resto diventa il budget del ciclo."
          : "Scrivi direttamente quanti euro vuoi destinare a una categoria: la percentuale sull'intero si calcola da sola, le altre due caselle restano come sono."}
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
          {mode === "percentuali" ? (
            <>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  value={speseFisseText}
                  onChange={(e) => setPercentText("speseFisse", e.target.value)}
                  className="focus-ring w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 pr-6 text-sm text-ink-100"
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-600">%</span>
              </div>
              <p className="mt-1.5 text-[11px] text-ink-800">{Math.round(speseFisseAmount).toLocaleString("it-IT")}€</p>
            </>
          ) : (
            <>
              <input
                type="number"
                inputMode="decimal"
                placeholder="€"
                value={amountText.speseFisse}
                onChange={(e) => setAmountForKey("speseFisse", e.target.value)}
                disabled={!validSalary}
                className="focus-ring w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-sm text-ink-100 disabled:opacity-40"
              />
              <p className="mt-1.5 text-[11px] text-ink-800">{speseFissePct}% · {Math.round(speseFisseAmount).toLocaleString("it-IT")}€</p>
            </>
          )}
        </div>
        <div className="rounded-xl2 border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-ink-600">
            <Coffee size={12} className="text-aura-cyan" /> Tempo libero
          </div>
          {mode === "percentuali" ? (
            <>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  value={tempoLiberoText}
                  onChange={(e) => setPercentText("tempoLibero", e.target.value)}
                  className="focus-ring w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 pr-6 text-sm text-ink-100"
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-600">%</span>
              </div>
              <p className="mt-1.5 text-[11px] text-ink-800">{Math.round(tempoLiberoAmount).toLocaleString("it-IT")}€</p>
            </>
          ) : (
            <>
              <input
                type="number"
                inputMode="decimal"
                placeholder="€"
                value={amountText.tempoLibero}
                onChange={(e) => setAmountForKey("tempoLibero", e.target.value)}
                disabled={!validSalary}
                className="focus-ring w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-sm text-ink-100 disabled:opacity-40"
              />
              <p className="mt-1.5 text-[11px] text-ink-800">{tempoLiberoPct}% · {Math.round(tempoLiberoAmount).toLocaleString("it-IT")}€</p>
            </>
          )}
        </div>
        <div className="rounded-xl2 border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-ink-600">
            <PiggyBank size={12} className="text-aura-emerald" /> Risparmi
          </div>
          {mode === "percentuali" ? (
            <>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  value={risparmiText}
                  onChange={(e) => setPercentText("risparmi", e.target.value)}
                  className="focus-ring w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 pr-6 text-sm text-ink-100"
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-600">%</span>
              </div>
              <p className="mt-1.5 text-[11px] text-ink-800">{Math.round(risparmiAmount).toLocaleString("it-IT")}€</p>
            </>
          ) : (
            <>
              <input
                type="number"
                inputMode="decimal"
                placeholder="€"
                value={amountText.risparmi}
                onChange={(e) => setAmountForKey("risparmi", e.target.value)}
                disabled={!validSalary}
                className="focus-ring w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-sm text-ink-100 disabled:opacity-40"
              />
              <p className="mt-1.5 text-[11px] text-ink-800">{risparmiPct}% · {Math.round(risparmiAmount).toLocaleString("it-IT")}€</p>
            </>
          )}
        </div>
      </div>

      {mode === "importi" && !validSalary && (
        <p className="mt-2 text-[11px] text-aura-amber">Scrivi prima una retribuzione: senza un intero, un importo non ha una percentuale.</p>
      )}

      {mode === "percentuali" ? (
        <p className={`mt-2 text-[11px] ${percentOk ? "text-ink-800" : "text-aura-pink"}`}>
          {percentOk ? "Totale: 100%" : `Totale: ${totalPercent}% — deve fare 100% per poter applicare`}
        </p>
      ) : (
        validSalary && (
          <p className={`mt-2 text-[11px] ${amountOk ? "text-ink-800" : "text-aura-pink"}`}>
            {amountOk
              ? `Totale: ${Math.round(totalAmount).toLocaleString("it-IT")}€`
              : `Totale: ${Math.round(totalAmount).toLocaleString("it-IT")}€ — deve fare ${Math.round(n).toLocaleString("it-IT")}€ per poter applicare`}
          </p>
        )
      )}

      <Button className="mt-3 w-full justify-center" onClick={apply} disabled={!validSalary || (mode === "percentuali" ? !percentOk : !amountOk)}>
        <Wallet size={14} />
        {justApplied ? "Applicato!" : "Applica alla scheda Finanze"}
      </Button>

      {validSalary && (mode === "percentuali" ? percentOk : amountOk) && (
        <p className="mt-2 text-[11px] text-ink-800">
          {mode === "percentuali"
            ? `${Math.round(risparmiAmount).toLocaleString("it-IT")}€ ai Risparmi (con cronologia), budget del ciclo impostato a ${Math.round(speseFisseAmount + tempoLiberoAmount).toLocaleString("it-IT")}€.`
            : `${Math.round(risparmiAmountText).toLocaleString("it-IT")}€ ai Risparmi (con cronologia), budget del ciclo impostato a ${Math.round(speseFisseAmountText + tempoLiberoAmountText).toLocaleString("it-IT")}€.`}
        </p>
      )}
    </div>
  );
}
