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
import { SwitchVisual } from "@/components/ui/Switch";
import { PhraseEditor } from "@/components/persone/PhraseEditor";
import { ActionEditor } from "@/components/persone/ActionEditor";

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

      <p className="mt-6 font-display text-xs uppercase tracking-[0.28em] text-ink-600">Il tuo profilo</p>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Tutto ciò che sai di te</h1>
      <p className="mt-1.5 text-sm text-ink-600">
        Nessuna fretta — compila quello che vuoi, quando vuoi. resta salvato man mano.
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
          <p className="mb-4 font-display text-sm text-ink-100">Istruzione e lavoro</p>
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

        <div className="border-t border-white/[0.06] pt-7">
          <button
            onClick={() => onUpdate({ dialogModeEnabled: !profile.dialogModeEnabled })}
            className={`focus-ring flex w-full items-center justify-between rounded-xl2 border px-4 py-3 text-sm transition ${
              profile.dialogModeEnabled ? "border-aura-violet/50 bg-aura-violet/10 text-ink-100" : "border-white/10 text-ink-600"
            }`}
          >
            Modalità dialogo
            <SwitchVisual checked={Boolean(profile.dialogModeEnabled)} />
          </button>
          <p className="mb-3 mt-2 text-xs text-ink-800">
            Frasi ricorrenti che compaiono a caso vicino al tuo avatar, ben visibili su Vitaecom.
          </p>
          <PhraseEditor phrases={profile.recurringPhrases} onChange={(recurringPhrases) => onUpdate({ recurringPhrases })} />
        </div>

        <div className="border-t border-white/[0.06] pt-7">
          <button
            onClick={() => onUpdate({ liveModeEnabled: !profile.liveModeEnabled })}
            className={`focus-ring flex w-full items-center justify-between rounded-xl2 border px-4 py-3 text-sm transition ${
              profile.liveModeEnabled ? "border-aura-violet/50 bg-aura-violet/10 text-ink-100" : "border-white/10 text-ink-600"
            }`}
          >
            Modalità vivo
            <SwitchVisual checked={Boolean(profile.liveModeEnabled)} />
          </button>
          <p className="mb-3 mt-2 text-xs text-ink-800">
            Cosa stai facendo, in certi orari o a caso — sempre aggiornata, visibile a tutti su Vitaecom.
          </p>
          <ActionEditor action={profile.actionPhrase} onChange={(actionPhrase) => onUpdate({ actionPhrase })} />
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
