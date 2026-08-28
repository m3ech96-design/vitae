"use client";
import { PersonalDetails, StressLevel, STRESS_LABEL } from "@/lib/types";
import { capitalizeWords, capitalizeSentence } from "@/lib/text";
import { usePlaces } from "@/lib/places-context";
import { AddressSuggestion } from "@/lib/geocode";
import { TextField, TextArea } from "../../ui/TextField";
import { AddressAutocomplete } from "../../ui/AddressAutocomplete";
import { TagListField } from "../TagListField";
import { DynamicFieldList } from "../DynamicFieldList";

const STRESS_LEVELS: StressLevel[] = ["basso", "medio", "alto"];

export function EducationWorkSection({
  data,
  onUpdate,
  linkedPersonId = "user",
  justSavedKeys,
}: {
  data: PersonalDetails;
  onUpdate: (patch: Partial<PersonalDetails>) => void;
  /** A chi va attribuito il marker creato in automatico: "user" per il wizard, l'id della persona per le Scoperte. */
  linkedPersonId?: string;
  justSavedKeys?: string[];
}) {
  const { places, addPlace } = usePlaces();
  const saved = (key: string) => Boolean(justSavedKeys?.includes(key));

  const onPickAddress = (suggestion: AddressSuggestion, kind: "studio" | "lavoro") => {
    if (kind === "studio") onUpdate({ studiedAt: suggestion.label });
    else onUpdate({ workedAt: suggestion.label });

    const alreadyExists = places.some((p) => p.address === suggestion.label);
    if (!alreadyExists) {
      addPlace({
        name: suggestion.label.split(",")[0],
        type: kind === "lavoro" ? "lavoro" : "altro",
        address: suggestion.label,
        lat: suggestion.lat,
        lng: suggestion.lng,
        linkedPersonId,
      });
    }
  };

  return (
    <div className="space-y-6">
      <AddressAutocomplete
        label="Dove Ha Studiato"
        placeholder="Es. Via Zamboni 33, Bologna"
        value={data.studiedAt || ""}
        onChange={(text) => onUpdate({ studiedAt: text })}
        onSelect={(s) => onPickAddress(s, "studio")}
      />

      <TextField
        label="Titolo Di Studio"
        placeholder="Es. Laurea In Ingegneria Gestionale"
        value={data.educationTitle || ""}
        onChange={(e) => onUpdate({ educationTitle: capitalizeWords(e.target.value) })}
        justSaved={saved("educationTitle")}
      />

      <TagListField label="Materie Conosciute" tags={data.subjects} onChange={(subjects) => onUpdate({ subjects })} placeholder="Aggiungi..." />
      <TagListField label="Competenze" tags={data.competencies} onChange={(competencies) => onUpdate({ competencies })} placeholder="Aggiungi..." />
      <TagListField label="Abilità" tags={data.abilities} onChange={(abilities) => onUpdate({ abilities })} placeholder="Aggiungi..." />
      <TagListField label="Lingue Conosciute" tags={data.languages} onChange={(languages) => onUpdate({ languages })} placeholder="Aggiungi..." />

      <div className="space-y-6 border-t border-white/[0.06] pt-6">
        <AddressAutocomplete
          label="Dove Ha Lavorato"
          placeholder="Es. Corso Italia 4, Torino"
          value={data.workedAt || ""}
          onChange={(text) => onUpdate({ workedAt: text })}
          onSelect={(s) => onPickAddress(s, "lavoro")}
        />

        <TextField
          label="Occupazione Attuale"
          placeholder="Es. Avvocata"
          value={data.occupation || ""}
          onChange={(e) => onUpdate({ occupation: capitalizeWords(e.target.value) })}
          justSaved={saved("occupation")}
        />

        <label className="block">
          <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">Stress</span>
          <div className="flex gap-2">
            {STRESS_LEVELS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onUpdate({ stress: s })}
                className={`focus-ring rounded-full border px-4 py-2 text-sm transition-all ${
                  data.stress === s ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-600"
                }`}
              >
                {STRESS_LABEL[s]}
              </button>
            ))}
          </div>
        </label>

        <TextArea
          label="Ambizione Professionale"
          value={data.professionalAmbition || ""}
          onChange={(e) => onUpdate({ professionalAmbition: capitalizeSentence(e.target.value) })}
          justSaved={saved("professionalAmbition")}
        />
      </div>

      <DynamicFieldList fields={data.eduWorkCustomFields} onChange={(eduWorkCustomFields) => onUpdate({ eduWorkCustomFields })} />
    </div>
  );
}
