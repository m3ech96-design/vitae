"use client";
import Link from "next/link";
import { PawPrint } from "lucide-react";
import { Person } from "@/lib/types";
import { useAnimalHealth } from "@/lib/animal-health-context";
import { isHungry } from "@/lib/feeding";
import { AuraAvatar } from "../ui/AuraAvatar";
import { GlassCard } from "../ui/GlassCard";

export function AnimalCard({ animal }: { animal: Person }) {
  const { forAnimal } = useAnimalHealth();
  const { vaccinations } = forAnimal(animal.id);
  const today = new Date().toISOString().slice(0, 10);
  const vaccinationDue = vaccinations.some((v) => v.nextDueDate && v.nextDueDate <= today);
  const hungry = isHungry(animal);

  return (
    <Link href={`/animali/${animal.id}`}>
      <GlassCard className="flex flex-col items-center gap-2 p-4 transition hover:border-white/20">
        <AuraAvatar imageUrl={animal.avatarUrl} firstName={animal.firstName} shape="squircle" size={64} ring="idle" deceased={animal.deceased} />
        <p className="truncate text-sm text-ink-100">{animal.firstName}</p>
        <p className="truncate text-[11px] text-ink-600">{animal.breed || (animal.kind === "cane" ? "Cane" : "Gatto")}</p>
        {(hungry || vaccinationDue) && (
          <div className="flex flex-wrap justify-center gap-1">
            {hungry && (
              <span className="rounded-full bg-aura-amber/15 px-2 py-0.5 text-[10px] text-aura-amber">Ha fame</span>
            )}
            {vaccinationDue && (
              <span className="flex items-center gap-1 rounded-full bg-aura-pink/15 px-2 py-0.5 text-[10px] text-aura-pink">
                <PawPrint size={9} /> Vaccino
              </span>
            )}
          </div>
        )}
      </GlassCard>
    </Link>
  );
}
