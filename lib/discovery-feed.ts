import { PersonalDetails, CustomField, ThumbItem } from "./types";

export const FIELD_LABELS: Partial<Record<keyof PersonalDetails, string>> = {
  nickname: "Soprannome",
  phone: "Numero Di Telefono",
  birthPlace: "Luogo Di Nascita",
  birthday: "Compleanno",
  gender: "Sesso",
  strengths: "Punti Di Forza",
  weaknesses: "Punti Deboli",
  fears: "Paure",
  ambitions: "Ambizioni",
  goals: "Obiettivi",
  studies: "Studia",
  works: "Lavora",
  currentSchool: "Quale Scuola Frequenta",
  futureStudyGoals: "Obiettivi Di Studio Futuri",
  futureWorkGoals: "Obiettivi Lavorativi Futuri",
  currentWorkplace: "Dove Lavora",
  studiedAt: "Dove Ha Studiato",
  educationTitle: "Titolo Di Studio",
  occupation: "Occupazione Attuale",
  professionalAmbition: "Ambizione Professionale",
  weight: "Peso",
  height: "Altezza",
  physicalGoal: "Obiettivo Fisico",
  partnerPersonId: "Partner",
  friendPersonIds: "Amici",
  bestFriendPersonIds: "Migliori Amici",
};

const PERSON_ID_SCALAR_FIELDS: (keyof PersonalDetails)[] = ["partnerPersonId"];
const PERSON_ID_ARRAY_FIELDS: (keyof PersonalDetails)[] = ["friendPersonIds", "bestFriendPersonIds"];
/** "Studia — True" si legge male: qui il valore diventa una parola vera, non il booleano
 * grezzo — solo per i due campi con la spunta, tutto il resto del file non li tocca. */
const BOOLEAN_FIELDS: (keyof PersonalDetails)[] = ["studies", "works"];

function describeArrayAddition(value: unknown[]): string | null {
  const last = value[value.length - 1];
  if (typeof last === "string") return last;
  const asField = last as Partial<CustomField>;
  if (asField?.label && asField.value !== undefined) return `${asField.label} — ${asField.value}`;
  const asThumb = last as Partial<ThumbItem>;
  if (asThumb?.title) return asThumb.title;
  return null;
}

/**
 * Confronta una patch coi valori precedenti e descrive cosa è stato scoperto, se qualcosa
 * lo è. I campi che contengono l'id di un'altra persona (Partner, Amici) vengono risolti
 * nel nome vero tramite `resolvePersonName` — altrimenti mostrerebbero l'id grezzo.
 */
export function describeDiscoveries(
  before: PersonalDetails,
  patch: Partial<PersonalDetails>,
  resolvePersonName?: (id: string) => string | undefined
): string[] {
  const descriptions: string[] = [];
  const resolve = (id: string) => resolvePersonName?.(id) ?? null;

  (Object.keys(patch) as (keyof PersonalDetails)[]).forEach((key) => {
    const newValue = patch[key];
    const oldValue = before[key];

    if (Array.isArray(newValue)) {
      const oldLen = Array.isArray(oldValue) ? oldValue.length : 0;
      if (newValue.length > oldLen) {
        const last = newValue[newValue.length - 1];
        if (PERSON_ID_ARRAY_FIELDS.includes(key) && typeof last === "string") {
          const name = resolve(last);
          if (name) descriptions.push(`${FIELD_LABELS[key] || key} — ${name}`);
        } else {
          const desc = describeArrayAddition(newValue);
          if (desc) descriptions.push(desc);
        }
      }
      return;
    }

    if (key === "customSections") return;

    if (newValue !== undefined && newValue !== "" && newValue !== oldValue) {
      const label = FIELD_LABELS[key] || key;
      if (PERSON_ID_SCALAR_FIELDS.includes(key) && typeof newValue === "string") {
        const name = resolve(newValue);
        if (name) descriptions.push(`${label} — ${name}`);
        return;
      }
      if (BOOLEAN_FIELDS.includes(key) && typeof newValue === "boolean") {
        if (newValue) descriptions.push(label);
        return;
      }
      descriptions.push(`${label} — ${newValue}`);
    }
  });

  return descriptions;
}
