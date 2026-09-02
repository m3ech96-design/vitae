"use client";
import { Person } from "@/lib/types";
import { TextField } from "../ui/TextField";
import { SwitchVisual } from "../ui/Switch";

export function AnimalAnagraficaSection({ animal, onUpdate }: { animal: Person; onUpdate: (patch: Partial<Person>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Razza" value={animal.breed || ""} onChange={(e) => onUpdate({ breed: e.target.value })} placeholder="Es. Labrador, Europeo" />
        <TextField
          label="Nascita o adozione"
          type="date"
          value={animal.birthOrAdoptionDate || ""}
          onChange={(e) => onUpdate({ birthOrAdoptionDate: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Microchip" value={animal.microchipNumber || ""} onChange={(e) => onUpdate({ microchipNumber: e.target.value })} />
        <TextField label="Segni particolari" value={animal.markings || ""} onChange={(e) => onUpdate({ markings: e.target.value })} placeholder="Es. Macchia bianca sul petto" />
      </div>
      <button
        onClick={() => onUpdate({ neutered: !animal.neutered })}
        className={`focus-ring flex w-full items-center justify-between rounded-xl2 border px-4 py-3 text-sm transition ${
          animal.neutered ? "border-aura-violet/50 bg-aura-violet/10 text-ink-100" : "border-white/10 text-ink-600"
        }`}
      >
        Sterilizzato/a
        <SwitchVisual checked={Boolean(animal.neutered)} />
      </button>
    </div>
  );
}
