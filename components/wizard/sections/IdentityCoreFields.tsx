"use client";
import { PersonalDetails } from "@/lib/types";
import { computeAge, capitalizeWords, capitalizeSentence } from "@/lib/text";
import { VALUES_LIST } from "@/lib/values-list";
import { LIFESTYLE_LIST } from "@/lib/lifestyle-list";
import { TextField, TextArea } from "../../ui/TextField";
import { TagMultiSelect } from "../TagMultiSelect";
import { DynamicFieldList } from "../DynamicFieldList";
import { CHARACTER_TRAITS } from "@/lib/traits";

const HUMAN_GENDERS = ["Donna", "Uomo", "Non Binario", "Preferisco Non Specificare"];
const ANIMAL_GENDERS = ["Maschio", "Femmina"];

/**
 * Campi di Identità condivisi tra il wizard dell'utente e la scheda Scoperte di una
 * persona. Non include nome/cognome/avatar: quelli si scelgono alla creazione e restano
 * modificabili in Impostazioni (per l'utente, in cima a questa stessa pagina).
 * Per gli animali: sesso Maschio/Femmina, niente Valori/Ambizioni/Obiettivi/Stile Di Vita
 * (il Carattere specifico per animali vive nella sezione Cura Dell'Animale), e il telefono
 * si riferisce a un padrone, non all'animale stesso.
 */
export function IdentityCoreFields({
  data,
  onUpdate,
  isAnimal = false,
  justSavedKeys,
  nameFields,
}: {
  data: PersonalDetails;
  onUpdate: (patch: Partial<PersonalDetails>) => void;
  isAnimal?: boolean;
  /** Chiavi appena salvate come Scoperta — i campi corrispondenti si schiariscono una volta. */
  justSavedKeys?: string[];
  /** Solo per un avatar "Sconosciuto" (lib/unknown-relative.ts): finché non ha un nome,
   * scoprirlo è una Scoperta a tutti gli effetti — vive qui, non in Impostazioni. Appena
   * smette di essere vuoto, questi campi spariscono da qui e tornano dov'erano sempre
   * stati, in Impostazioni: nessuno stato da sincronizzare, basta `isEmptyAvatar`. */
  nameFields?: {
    firstName: string;
    lastName: string;
    onChange: (patch: { firstName?: string; lastName?: string }) => void;
  };
}) {
  const saved = (key: string) => Boolean(justSavedKeys?.includes(key));
  const age = computeAge(data.birthday);
  const genders = isAnimal ? ANIMAL_GENDERS : HUMAN_GENDERS;

  return (
    <div className="space-y-6">
      {nameFields && (
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Nome"
            value={nameFields.firstName}
            onChange={(e) => nameFields.onChange({ firstName: capitalizeWords(e.target.value) })}
          />
          <TextField
            label="Cognome"
            value={nameFields.lastName}
            onChange={(e) => nameFields.onChange({ lastName: capitalizeWords(e.target.value) })}
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Soprannome"
          placeholder="Es. Ale"
          value={data.alias || ""}
          onChange={(e) => onUpdate({ alias: capitalizeWords(e.target.value) })}
          justSaved={saved("alias")}
        />
        <TextField
          label={isAnimal ? "Telefono di un padrone" : "Numero Di Telefono"}
          type="tel"
          placeholder="Es. 333 1234567"
          value={data.phone || ""}
          onChange={(e) => onUpdate({ phone: e.target.value })}
          justSaved={saved("phone")}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Compleanno"
          type="date"
          value={data.birthday || ""}
          onChange={(e) => onUpdate({ birthday: e.target.value })}
          justSaved={saved("birthday")}
          hint={age !== null ? `Età calcolata: ${age} anni` : undefined}
        />
        <TextField
          label="Luogo di nascita"
          placeholder="Es. Napoli"
          value={data.birthPlace || ""}
          onChange={(e) => onUpdate({ birthPlace: capitalizeWords(e.target.value) })}
          justSaved={saved("birthPlace")}
        />
      </div>

      <label className="block">
        <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">
          Sesso
        </span>
        <select
          value={data.gender || ""}
          onChange={(e) => onUpdate({ gender: e.target.value })}
          className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100"
        >
          <option value="" disabled className="bg-void-800">
            Seleziona
          </option>
          {genders.map((g) => (
            <option key={g} value={g} className="bg-void-800">
              {g}
            </option>
          ))}
        </select>
      </label>

      {!isAnimal && (
        <>
          <TagMultiSelect
            label="Carattere"
            options={CHARACTER_TRAITS}
            selected={data.traits}
            onChange={(traits) => onUpdate({ traits })}
          />

          <TagMultiSelect
            label="Valori"
            options={VALUES_LIST}
            selected={data.values}
            onChange={(values) => onUpdate({ values })}
          />
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <TextArea
          label="Punti di forza"
          value={data.strengths || ""}
          onChange={(e) => onUpdate({ strengths: capitalizeSentence(e.target.value) })}
          justSaved={saved("strengths")}
        />
        <TextArea
          label="Punti deboli"
          value={data.weaknesses || ""}
          onChange={(e) => onUpdate({ weaknesses: capitalizeSentence(e.target.value) })}
          justSaved={saved("weaknesses")}
        />
      </div>

      <TextArea label="Paure" value={data.fears || ""} onChange={(e) => onUpdate({ fears: capitalizeSentence(e.target.value) })}
          justSaved={saved("fears")} />

      {!isAnimal && (
        <>
          <TextArea
            label="Ambizioni"
            value={data.ambitions || ""}
            onChange={(e) => onUpdate({ ambitions: capitalizeSentence(e.target.value) })}
          justSaved={saved("ambitions")}
          />
          <TextArea label="Obiettivi" value={data.goals || ""} onChange={(e) => onUpdate({ goals: capitalizeSentence(e.target.value) })}
          justSaved={saved("goals")} />
          <TagMultiSelect
            label="Stile di vita"
            options={LIFESTYLE_LIST}
            selected={data.lifestyle}
            onChange={(lifestyle) => onUpdate({ lifestyle })}
          />
        </>
      )}

      <DynamicFieldList
        fields={data.identityCustomFields}
        onChange={(identityCustomFields) => onUpdate({ identityCustomFields })}
      />
    </div>
  );
}
