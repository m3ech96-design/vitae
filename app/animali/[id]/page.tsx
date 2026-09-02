"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useHousehold } from "@/lib/household-context";
import { useAnimalHealth } from "@/lib/animal-health-context";
import { Person } from "@/lib/types";
import { AuraAvatar } from "@/components/ui/AuraAvatar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AnimalCareSection } from "@/components/animali/AnimalCareSection";
import { AnimalAnagraficaSection } from "@/components/animali/AnimalAnagraficaSection";
import { AnimalWeightSection } from "@/components/animali/AnimalWeightSection";
import { AnimalVaccinationsSection } from "@/components/animali/AnimalVaccinationsSection";
import { AnimalMedicationsSection } from "@/components/animali/AnimalMedicationsSection";
import { AnimalAppointmentsSection } from "@/components/animali/AnimalAppointmentsSection";
import { AnimalReportsSection } from "@/components/animali/AnimalReportsSection";
import { AnimalAllergiesSection } from "@/components/animali/AnimalAllergiesSection";
import { AnimalFoodSection } from "@/components/animali/AnimalFoodSection";
import { AnimalEmergencyCard } from "@/components/animali/AnimalEmergencyCard";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 font-display text-sm text-ink-100">{title}</p>
      {children}
    </div>
  );
}

export default function AnimalDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { hydrated: householdHydrated, people, updatePerson, removePerson } = useHousehold();
  const { hydrated: healthHydrated, forAnimal, removeAllForAnimal } = useAnimalHealth();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!householdHydrated || !healthHydrated) return null;

  const animal = people.find((p) => p.id === params.id);
  if (!animal) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-ink-600">Questo animale non esiste più.</p>
        <button onClick={() => router.push("/animali")} className="focus-ring mt-4 text-sm text-aura-cyan">
          Torna agli animali
        </button>
      </div>
    );
  }

  const onUpdate = (patch: Partial<Person>) => updatePerson(animal.id, patch);
  const { vaccinations, medications, appointments, reports, allergies, weightEntries } = forAnimal(animal.id);

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/animali")} className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-aura-violet/50" aria-label="Torna agli animali">
          <ArrowLeft size={16} />
        </button>
        <button onClick={() => setConfirmDelete(true)} className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-aura-pink/50" aria-label="Elimina animale">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <AuraAvatar imageUrl={animal.avatarUrl} firstName={animal.firstName} shape="squircle" size={84} ring="idle" deceased={animal.deceased} />
        <h1 className="font-display text-2xl text-ink-100">{animal.firstName}</h1>
        {animal.breed && <p className="text-sm text-ink-600">{animal.breed}</p>}
      </div>

      <div className="mt-7 space-y-8">
        <AnimalEmergencyCard animal={animal} allergies={allergies} medications={medications} />

        <Section title="Anagrafica">
          <AnimalAnagraficaSection animal={animal} onUpdate={onUpdate} />
        </Section>

        <Section title="Peso">
          <AnimalWeightSection animalId={animal.id} weightEntries={weightEntries} />
        </Section>

        <Section title="Vaccinazioni">
          <AnimalVaccinationsSection animalId={animal.id} vaccinations={vaccinations} />
        </Section>

        <Section title="Farmaci">
          <AnimalMedicationsSection animalId={animal.id} medications={medications} />
        </Section>

        <Section title="Appuntamenti dal veterinario">
          <AnimalAppointmentsSection animalId={animal.id} appointments={appointments} />
        </Section>

        <Section title="Referti">
          <AnimalReportsSection animalId={animal.id} reports={reports} />
        </Section>

        <Section title="Allergie e intolleranze">
          <AnimalAllergiesSection animalId={animal.id} allergies={allergies} />
        </Section>

        <Section title="Cura quotidiana">
          <AnimalCareSection person={animal} onUpdate={onUpdate} />
        </Section>

        <Section title="Cibo">
          <AnimalFoodSection animal={animal} />
        </Section>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={`Eliminare ${animal.firstName}?`}
          description="Tutti i dati di salute collegati andranno persi. L'azione non si può annullare."
          onConfirm={() => {
            removeAllForAnimal(animal.id);
            removePerson(animal.id);
            router.push("/animali");
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
