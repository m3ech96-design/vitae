"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { UserProfile } from "@/lib/types";
import { capitalizeWords } from "@/lib/text";
import { AvatarUploader } from "@/components/wizard/AvatarUploader";
import { TextField } from "@/components/ui/TextField";
import { IdentityCoreFields } from "@/components/wizard/sections/IdentityCoreFields";
import { EducationWorkSection } from "@/components/wizard/sections/EducationWorkSection";
import { CorpoSection } from "@/components/wizard/sections/CorpoSection";
import { InterestsSection } from "@/components/wizard/sections/InterestsSection";
import { CustomSectionView } from "@/components/wizard/sections/CustomSectionView";
import { CreateSectionControl } from "@/components/wizard/CreateSectionControl";

export default function ProfiloPage() {
  const { profile, hydrated, updateProfile } = useProfile();
  const router = useRouter();

  if (!hydrated) return null;

  const onUpdate = (patch: Partial<UserProfile>) => updateProfile(patch);

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <button
        onClick={() => router.push("/home")}
        className="focus-ring flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-200"
      >
        <ArrowLeft size={16} /> Home
      </button>

      <p className="mt-6 font-display text-xs uppercase tracking-[0.28em] text-ink-600">Il Tuo Profilo</p>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Tutto Ciò Che Sai Di Te</h1>
      <p className="mt-1.5 text-sm text-ink-600">
        Nessuna Fretta — Compila Quello Che Vuoi, Quando Vuoi. Resta Salvato Man Mano.
      </p>

      <div className="mt-8 space-y-9">
        <div className="flex justify-center">
          <AvatarUploader
            imageUrl={profile.avatarUrl}
            firstName={profile.firstName}
            lastName={profile.lastName}
            onChange={(url) => onUpdate({ avatarUrl: url })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Nome"
            value={profile.firstName}
            onChange={(e) => onUpdate({ firstName: capitalizeWords(e.target.value) })}
          />
          <TextField
            label="Cognome"
            value={profile.lastName}
            onChange={(e) => onUpdate({ lastName: capitalizeWords(e.target.value) })}
          />
        </div>

        <div>
          <p className="mb-4 font-display text-sm text-ink-100">Identità</p>
          <IdentityCoreFields data={profile} onUpdate={onUpdate} />
        </div>
        <div>
          <p className="mb-4 font-display text-sm text-ink-100">Istruzione E Lavoro</p>
          <EducationWorkSection data={profile} onUpdate={onUpdate} linkedPersonId="user" />
        </div>
        <div>
          <p className="mb-4 font-display text-sm text-ink-100">Corpo</p>
          <CorpoSection data={profile} onUpdate={onUpdate} trackWeightHistory />
        </div>
        <div>
          <p className="mb-4 font-display text-sm text-ink-100">Interessi</p>
          <InterestsSection data={profile} onUpdate={onUpdate} />
        </div>
        {profile.customSections.map((section) => (
          <CustomSectionView
            key={section.id}
            section={section}
            onUpdate={(patch) =>
              updateProfile({
                customSections: profile.customSections.map((s) => (s.id === section.id ? { ...s, ...patch } : s)),
              })
            }
          />
        ))}
        <CreateSectionControl
          onCreate={(title) =>
            updateProfile({
              customSections: [...profile.customSections, { id: Math.random().toString(36).slice(2, 9), title, fields: [] }],
            })
          }
        />
      </div>
    </div>
  );
}
