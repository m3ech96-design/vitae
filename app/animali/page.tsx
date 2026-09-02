"use client";
import { useState } from "react";
import { Plus, PawPrint } from "lucide-react";
import { useHousehold } from "@/lib/household-context";
import { ANIMAL_KINDS } from "@/lib/types";
import { AnimalCard } from "@/components/animali/AnimalCard";
import { AddPersonModal } from "@/components/persone/AddPersonModal";

export default function AnimaliPage() {
  const { hydrated, people } = useHousehold();
  const [addOpen, setAddOpen] = useState(false);

  if (!hydrated) return null;

  const animals = people.filter((p) => ANIMAL_KINDS.includes(p.kind));

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Animali</p>
          <h1 className="mt-1 font-display text-2xl text-ink-100">I tuoi compagni</h1>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-full bg-aura-gradient text-void-950 shadow-glow"
          aria-label="Aggiungi animale"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="mt-6">
        {animals.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl2 border border-dashed border-white/10 py-14 text-center">
            <PawPrint size={20} className="text-ink-800" />
            <p className="text-sm text-ink-600">Ancora nessun animale. Aggiungi il primo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {animals.map((a) => (
              <AnimalCard key={a.id} animal={a} />
            ))}
          </div>
        )}
      </div>

      {addOpen && <AddPersonModal title="Aggiungi animale" forceAnimal onClose={() => setAddOpen(false)} />}
    </div>
  );
}
