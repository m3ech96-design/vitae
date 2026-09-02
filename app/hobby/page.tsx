"use client";
import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { useHobby } from "@/lib/hobby-context";
import { HobbyCard } from "@/components/hobby/HobbyCard";
import { AddHobbyModal } from "@/components/hobby/AddHobbyModal";

export default function HobbyListPage() {
  const { hydrated, hobbies } = useHobby();
  const [addOpen, setAddOpen] = useState(false);

  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Hobby</p>
          <h1 className="mt-1 font-display text-2xl text-ink-100">Le tue passioni</h1>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-full bg-aura-gradient text-void-950 shadow-glow"
          aria-label="Nuovo hobby"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="mt-6">
        {hobbies.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl2 border border-dashed border-white/10 py-14 text-center">
            <Sparkles size={20} className="text-ink-800" />
            <p className="text-sm text-ink-600">Ancora nessun hobby. Aggiungi il primo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {hobbies.map((h) => (
              <HobbyCard key={h.id} hobby={h} />
            ))}
          </div>
        )}
      </div>

      {addOpen && <AddHobbyModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}
