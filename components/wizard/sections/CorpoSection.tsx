"use client";
import { useState } from "react";
import { PersonalDetails } from "@/lib/types";
import { capitalizeSentence } from "@/lib/text";
import { useHealth } from "@/lib/health-context";
import { TextField, TextArea } from "../../ui/TextField";
import { DynamicFieldList } from "../DynamicFieldList";

export function CorpoSection({
  data,
  onUpdate,
  trackWeightHistory = false,
  justSavedKeys,
}: {
  data: PersonalDetails;
  onUpdate: (patch: Partial<PersonalDetails>) => void;
  /** Solo per l'utente: la prima pesata inserita qui alimenta anche la cronologia di Salute. */
  trackWeightHistory?: boolean;
  justSavedKeys?: string[];
}) {
  const { weightEntries, addWeightEntry } = useHealth();
  const [weightDraft, setWeightDraft] = useState(data.weight !== undefined ? String(data.weight) : "");
  const saved = (key: string) => Boolean(justSavedKeys?.includes(key));

  const commitWeight = () => {
    const n = parseFloat(weightDraft.replace(",", "."));
    onUpdate({ weight: weightDraft.trim() ? n : undefined });
    if (trackWeightHistory && !Number.isNaN(n) && n > 0 && weightEntries.length === 0) {
      addWeightEntry(n, new Date().toISOString().slice(0, 10));
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Peso (Kg)"
          inputMode="decimal"
          placeholder="Es. 68"
          value={weightDraft}
          onChange={(e) => setWeightDraft(e.target.value)}
          onBlur={commitWeight}
          justSaved={saved("weight")}
          hint={trackWeightHistory && weightEntries.length === 0 ? "Diventa La Prima Pesata In Salute" : undefined}
        />
        <TextField
          label="Altezza (Cm)"
          inputMode="decimal"
          placeholder="Es. 172"
          value={data.height ?? ""}
          onChange={(e) => {
            const n = parseFloat(e.target.value.replace(",", "."));
            onUpdate({ height: e.target.value ? n : undefined });
          }}
          justSaved={saved("height")}
        />
      </div>

      <TextArea
        label="Obiettivo Fisico"
        placeholder="Es. Correre Una Mezza Maratona"
        value={data.physicalGoal || ""}
        onChange={(e) => onUpdate({ physicalGoal: capitalizeSentence(e.target.value) })}
        justSaved={saved("physicalGoal")}
      />

      <DynamicFieldList fields={data.bodyCustomFields} onChange={(bodyCustomFields) => onUpdate({ bodyCustomFields })} />
    </div>
  );
}
