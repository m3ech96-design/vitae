"use client";
import { useState } from "react";
import { PersonalCardSheet } from "@/components/home/PersonalCardSheet";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";

export function AddPlanSheet({ onCreate, onClose }: { onCreate: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const canSave = name.trim().length > 0;

  const submit = () => {
    if (!canSave) return;
    onCreate(name.trim());
    onClose();
  };

  return (
    <PersonalCardSheet title="Nuova scheda allenamento" onClose={onClose}>
      <div className="space-y-4">
        <TextField
          label="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoFocus
          placeholder="Es. Scheda estate, 5x5..."
        />
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1 justify-center" onClick={onClose}>
            Annulla
          </Button>
          <Button size="sm" className="flex-1 justify-center" onClick={submit} disabled={!canSave}>
            Crea
          </Button>
        </div>
      </div>
    </PersonalCardSheet>
  );
}
