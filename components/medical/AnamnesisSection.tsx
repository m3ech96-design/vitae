"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useMedical } from "@/lib/medical-context";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";

type Tab = "condizioni" | "interventi" | "familiarita";

function ConditionsList() {
  const { conditions, addCondition, removeCondition } = useMedical();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [since, setSince] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    addCondition({ name: name.trim(), since: since.trim() || undefined });
    setName("");
    setSince("");
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {conditions.map((c) => (
        <div key={c.id} className="flex items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
          <div>
            <p className="text-sm text-ink-100">{c.name}</p>
            {c.since && <p className="text-[11px] text-ink-800">Da: {c.since}</p>}
          </div>
          <button onClick={() => removeCondition(c.id)} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
            <X size={14} />
          </button>
        </div>
      ))}
      {!open ? (
        <button onClick={() => setOpen(true)} className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-ink-600 hover:border-aura-violet/50 hover:text-ink-200">
          <Plus size={14} /> Aggiungi condizione cronica
        </button>
      ) : (
        <div className="space-y-2.5 rounded-xl2 border border-aura-violet/30 bg-white/[0.03] p-3">
          <TextField label="Condizione" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Ipertensione, asma" autoFocus />
          <TextField label="Da quando (facoltativo)" value={since} onChange={(e) => setSince(e.target.value)} placeholder="Es. 2019, infanzia" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Annulla</Button>
            <Button size="sm" onClick={submit} disabled={!name.trim()}>Salva</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SurgeriesList() {
  const { surgeries, addSurgery, removeSurgery } = useMedical();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    addSurgery({ name: name.trim(), date: date || undefined });
    setName("");
    setDate("");
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {surgeries.map((s) => (
        <div key={s.id} className="flex items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
          <div>
            <p className="text-sm text-ink-100">{s.name}</p>
            {s.date && <p className="text-[11px] text-ink-800">{s.date}</p>}
          </div>
          <button onClick={() => removeSurgery(s.id)} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
            <X size={14} />
          </button>
        </div>
      ))}
      {!open ? (
        <button onClick={() => setOpen(true)} className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-ink-600 hover:border-aura-violet/50 hover:text-ink-200">
          <Plus size={14} /> Aggiungi intervento
        </button>
      ) : (
        <div className="space-y-2.5 rounded-xl2 border border-aura-violet/30 bg-white/[0.03] p-3">
          <TextField label="Intervento" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Appendicectomia" autoFocus />
          <TextField label="Data (facoltativo)" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Annulla</Button>
            <Button size="sm" onClick={submit} disabled={!name.trim()}>Salva</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FamilyHistoryList() {
  const { familyHistory, addFamilyHistory, removeFamilyHistory } = useMedical();
  const [open, setOpen] = useState(false);
  const [condition, setCondition] = useState("");
  const [relative, setRelative] = useState("");

  const submit = () => {
    if (!condition.trim() || !relative.trim()) return;
    addFamilyHistory({ condition: condition.trim(), relative: relative.trim() });
    setCondition("");
    setRelative("");
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {familyHistory.map((f) => (
        <div key={f.id} className="flex items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
          <div>
            <p className="text-sm text-ink-100">{f.condition}</p>
            <p className="text-[11px] text-ink-800">{f.relative}</p>
          </div>
          <button onClick={() => removeFamilyHistory(f.id)} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
            <X size={14} />
          </button>
        </div>
      ))}
      {!open ? (
        <button onClick={() => setOpen(true)} className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-ink-600 hover:border-aura-violet/50 hover:text-ink-200">
          <Plus size={14} /> Aggiungi familiarità
        </button>
      ) : (
        <div className="space-y-2.5 rounded-xl2 border border-aura-violet/30 bg-white/[0.03] p-3">
          <TextField label="Condizione" value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="Es. Diabete, cardiopatia" autoFocus />
          <TextField label="Parente" value={relative} onChange={(e) => setRelative(e.target.value)} placeholder="Es. Madre, nonno paterno" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Annulla</Button>
            <Button size="sm" onClick={submit} disabled={!condition.trim() || !relative.trim()}>Salva</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AnamnesisSection() {
  const [tab, setTab] = useState<Tab>("condizioni");
  return (
    <div>
      <div className="mb-3 flex gap-1.5">
        {([
          ["condizioni", "Condizioni"],
          ["interventi", "Interventi"],
          ["familiarita", "Familiarità"],
        ] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`focus-ring rounded-full border px-3 py-1.5 text-xs transition ${
              tab === id ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "condizioni" && <ConditionsList />}
      {tab === "interventi" && <SurgeriesList />}
      {tab === "familiarita" && <FamilyHistoryList />}
    </div>
  );
}
