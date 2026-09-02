"use client";
import { AlertTriangle, Pill, Fingerprint } from "lucide-react";
import { Person } from "@/lib/types";
import { AnimalAllergy, AnimalMedication } from "@/lib/animal-health-context";
import { GlassCard } from "../ui/GlassCard";

/**
 * Tutto quello che serve mostrare in fretta — a un veterinario di guardia, a un pet-sitter —
 * su un'unica scheda: allergie, farmaci in corso, microchip. Niente da aprire o cercare, solo
 * da scorrere con lo sguardo.
 */
export function AnimalEmergencyCard({ animal, allergies, medications }: { animal: Person; allergies: AnimalAllergy[]; medications: AnimalMedication[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const ongoingMeds = medications.filter((m) => !m.endDate || m.endDate >= today);

  if (allergies.length === 0 && ongoingMeds.length === 0 && !animal.microchipNumber) return null;

  return (
    <GlassCard glow="pink" className="space-y-3 p-4">
      <p className="flex items-center gap-1.5 font-display text-sm text-ink-100">
        <AlertTriangle size={14} className="text-aura-pink" /> Scheda d&apos;emergenza
      </p>
      {allergies.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-[0.1em] text-ink-600">Allergie</p>
          <p className="mt-0.5 text-sm text-ink-200">{allergies.map((a) => a.name).join(", ")}</p>
        </div>
      )}
      {ongoingMeds.length > 0 && (
        <div>
          <p className="flex items-center gap-1 text-[11px] uppercase tracking-[0.1em] text-ink-600">
            <Pill size={10} /> Farmaci in corso
          </p>
          <p className="mt-0.5 text-sm text-ink-200">{ongoingMeds.map((m) => m.name).join(", ")}</p>
        </div>
      )}
      {animal.microchipNumber && (
        <div>
          <p className="flex items-center gap-1 text-[11px] uppercase tracking-[0.1em] text-ink-600">
            <Fingerprint size={10} /> Microchip
          </p>
          <p className="mt-0.5 text-sm text-ink-200">{animal.microchipNumber}</p>
        </div>
      )}
    </GlassCard>
  );
}
