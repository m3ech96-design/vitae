"use client";
import { useState } from "react";
import { Plus, X, AlertTriangle } from "lucide-react";
import { useMedical } from "@/lib/medical-context";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";

const SEVERITIES = [
  { id: "lieve", label: "Lieve", color: "#34D399" },
  { id: "moderata", label: "Moderata", color: "#FFB454" },
  { id: "grave", label: "Grave", color: "#FF4D6D" },
] as const;

export function AllergiesSection() {
  const { allergies, addAllergy, removeAllergy } = useMedical();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]["id"] | undefined>(undefined);
  const [reaction, setReaction] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    addAllergy({ name: name.trim(), severity, reaction: reaction.trim() || undefined });
    setName("");
    setSeverity(undefined);
    setReaction("");
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {allergies.map((a) => {
        const sev = SEVERITIES.find((s) => s.id === a.severity);
        return (
          <div key={a.id} className="flex items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm text-ink-100">
                {a.severity === "grave" && <AlertTriangle size={13} className="shrink-0 text-aura-pink" />}
                {a.name}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-ink-800">
                {sev && <span style={{ color: sev.color }}>{sev.label}</span>}
                {sev && a.reaction ? " · " : ""}
                {a.reaction}
              </p>
            </div>
            <button onClick={() => removeAllergy(a.id)} className="focus-ring shrink-0 text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
              <X size={14} />
            </button>
          </div>
        );
      })}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-ink-600 hover:border-aura-violet/50 hover:text-ink-200"
        >
          <Plus size={14} /> Aggiungi allergia o intolleranza
        </button>
      ) : (
        <div className="space-y-2.5 rounded-xl2 border border-aura-violet/30 bg-white/[0.03] p-3">
          <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Polline, lattosio, penicillina" autoFocus />
          <div className="flex gap-2">
            {SEVERITIES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSeverity(severity === s.id ? undefined : s.id)}
                className="focus-ring rounded-full border px-3 py-1.5 text-xs transition"
                style={{
                  borderColor: severity === s.id ? s.color : "rgba(255,255,255,0.1)",
                  background: severity === s.id ? `${s.color}22` : "transparent",
                  color: severity === s.id ? "#F1F1FA" : "#8B90A8",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <TextField label="Reazione (facoltativo)" value={reaction} onChange={(e) => setReaction(e.target.value)} placeholder="Es. Prurito, gonfiore" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button size="sm" onClick={submit} disabled={!name.trim()}>
              Salva
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
