"use client";
import { useEffect } from "react";
import { Check } from "lucide-react";
import { PersonalDetails } from "@/lib/types";
import { capitalizeWords, capitalizeSentence } from "@/lib/text";
import { TextField, TextArea } from "../../ui/TextField";
import { TagListField } from "../TagListField";
import { DynamicFieldList } from "../DynamicFieldList";

function CheckToggle({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-xl2 border px-4 py-3 text-sm transition-all ${
        checked ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-600"
      }`}
    >
      {checked && <Check size={14} />}
      {label}
    </button>
  );
}

/**
 * Prima "Dove Ha Studiato" e "Dove Ha Lavorato" erano due campi sempre visibili, come se
 * chiunque fosse sempre sia studente che lavoratore. Ora due spunte indipendenti — Studia e
 * Lavora NON si escludono a vicenda, chi studia e lavora insieme esiste — aprono ciascuna il
 * proprio gruppo di campi, con un taglio diverso: Studia guarda avanti (obiettivi futuri, non
 * ancora un risultato), Lavora guarda anche indietro (dove hai già studiato, che titolo hai
 * preso). Sotto, la lista prosegue uguale per tutti — materie/competenze/abilità/lingue non
 * dipendono da nessuna delle due spunte.
 */
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
  const saved = (key: string) => Boolean(justSavedKeys?.includes(key));

  // Suggerisce "Dove Ha Studiato" da "Quale Scuola Frequenta" solo la prima volta che si
  // spunta Lavora, non ad ogni ridigitazione — dopo resta un campo di testo libero come
  // qualunque altro, cancellabile e riscrivibile senza che nulla lo sovrascriva più.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (data.works && !data.studiedAt && data.currentSchool) onUpdate({ studiedAt: data.currentSchool });
  }, [data.works]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <CheckToggle label="Studia" checked={Boolean(data.studies)} onClick={() => onUpdate({ studies: !data.studies })} />
        <CheckToggle label="Lavora" checked={Boolean(data.works)} onClick={() => onUpdate({ works: !data.works })} />
      </div>

      {data.studies && (
        <div className="space-y-6 rounded-xl2 border border-aura-violet/20 bg-aura-violet/[0.04] p-4">
          <TextField
            label="Quale scuola frequenta"
            placeholder="Es. Università Di Bologna"
            value={data.currentSchool || ""}
            onChange={(e) => onUpdate({ currentSchool: e.target.value })}
            justSaved={saved("currentSchool")}
          />
          <TextArea
            label="Obiettivi di studio futuri"
            value={data.futureStudyGoals || ""}
            onChange={(e) => onUpdate({ futureStudyGoals: capitalizeSentence(e.target.value) })}
            justSaved={saved("futureStudyGoals")}
          />
          <TextArea
            label="Obiettivi lavorativi futuri"
            value={data.futureWorkGoals || ""}
            onChange={(e) => onUpdate({ futureWorkGoals: capitalizeSentence(e.target.value) })}
            justSaved={saved("futureWorkGoals")}
          />
        </div>
      )}

      {data.works && (
        <div className="space-y-6 rounded-xl2 border border-aura-violet/20 bg-aura-violet/[0.04] p-4">
          <TextField
            label="Dove lavora"
            placeholder="Es. Studio Legale Ferrari"
            value={data.currentWorkplace || ""}
            onChange={(e) => onUpdate({ currentWorkplace: e.target.value })}
            justSaved={saved("currentWorkplace")}
          />
          <TagListField
            label="Lavori precedenti"
            tags={data.previousWorkplaces}
            onChange={(previousWorkplaces) => onUpdate({ previousWorkplaces })}
            placeholder="Aggiungi..."
          />
          <TextField
            label="Dove ha studiato"
            placeholder="Es. Università Di Bologna"
            value={data.studiedAt || ""}
            onChange={(e) => onUpdate({ studiedAt: e.target.value })}
            justSaved={saved("studiedAt")}
          />
          <TextField
            label="Titolo di studio"
            placeholder="Es. Laurea In Ingegneria Gestionale"
            value={data.educationTitle || ""}
            onChange={(e) => onUpdate({ educationTitle: capitalizeWords(e.target.value) })}
            justSaved={saved("educationTitle")}
          />
        </div>
      )}

      <div className="space-y-6 border-t border-white/[0.06] pt-6">
        <TagListField label="Materie conosciute" tags={data.subjects} onChange={(subjects) => onUpdate({ subjects })} placeholder="Aggiungi..." />
        <TagListField label="Competenze" tags={data.competencies} onChange={(competencies) => onUpdate({ competencies })} placeholder="Aggiungi..." />
        <TagListField label="Abilità" tags={data.abilities} onChange={(abilities) => onUpdate({ abilities })} placeholder="Aggiungi..." />
        <TagListField label="Lingue conosciute" tags={data.languages} onChange={(languages) => onUpdate({ languages })} placeholder="Aggiungi..." />

        <TextField
          label="Occupazione attuale"
          placeholder="Es. Avvocata"
          value={data.occupation || ""}
          onChange={(e) => onUpdate({ occupation: capitalizeWords(e.target.value) })}
          justSaved={saved("occupation")}
        />

        <TextArea
          label="Ambizione professionale"
          value={data.professionalAmbition || ""}
          onChange={(e) => onUpdate({ professionalAmbition: capitalizeSentence(e.target.value) })}
          justSaved={saved("professionalAmbition")}
        />
      </div>

      <DynamicFieldList fields={data.eduWorkCustomFields} onChange={(eduWorkCustomFields) => onUpdate({ eduWorkCustomFields })} />
    </div>
  );
}
