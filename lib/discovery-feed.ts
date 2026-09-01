import { PersonalDetails, Person, CustomField, ThumbItem } from "./types";

/** Le due chiamate reali passano sempre una `Person` intera (mai una `PersonalDetails`
 * isolata), quindi qui dentro possiamo leggere anche i campi propri di `Person` come
 * `deceased` — da cui il tipo dedicato invece del semplice `PersonalDetails`. */
type DiscoverableSubject = PersonalDetails & Partial<Pick<Person, "deceased" | "deceasedDay" | "deceasedMonth" | "deceasedYear" | "kind">>;

export const FIELD_LABELS: Partial<Record<keyof PersonalDetails, string>> = {
  alias: "Soprannome",
  phone: "Numero di telefono",
  birthPlace: "Luogo di nascita",
  birthday: "Compleanno",
  gender: "Sesso",
  strengths: "Punti di forza",
  weaknesses: "Punti deboli",
  fears: "Paure",
  ambitions: "Ambizioni",
  goals: "Obiettivi",
  studies: "Studia",
  works: "Lavora",
  currentSchool: "Quale scuola frequenta",
  futureStudyGoals: "Obiettivi di studio futuri",
  futureWorkGoals: "Obiettivi lavorativi futuri",
  currentWorkplace: "Dove lavora",
  studiedAt: "Dove ha studiato",
  educationTitle: "Titolo di studio",
  occupation: "Occupazione attuale",
  professionalAmbition: "Ambizione professionale",
  weight: "Peso",
  height: "Altezza",
  physicalGoal: "Obiettivo fisico",
  partnerPersonId: "Partner",
  friendPersonIds: "Amici",
  bestFriendPersonIds: "Migliori amici",
};

const PERSON_ID_SCALAR_FIELDS: (keyof PersonalDetails)[] = ["partnerPersonId"];
const PERSON_ID_ARRAY_FIELDS: (keyof PersonalDetails)[] = ["friendPersonIds", "bestFriendPersonIds"];
/** "Studia — True" si legge male: qui il valore diventa una parola vera, non il booleano
 * grezzo — solo per i due campi con la spunta, tutto il resto del file non li tocca. */
const BOOLEAN_FIELDS: (keyof PersonalDetails)[] = ["studies", "works"];
/** "Deceased" arriva da `Person`, non da `PersonalDetails` (describeDiscoveries riceve
 * l'oggetto persona intero) — non essendo elencato sopra finiva nel ramo generico e
 * produceva "deceased — false" anche quando lo si toglieva. Trattato qui a parte: genera
 * una riga solo quando diventa true (togliere il lutto non è una nuova scoperta), con
 * un'etichetta vera invece del nome del campo, e la data di morte non genera una riga sua —
 * viaggia già dentro questa stessa frase. */
const DECEASED_DATE_FIELDS: (keyof DiscoverableSubject)[] = ["deceasedDay", "deceasedMonth", "deceasedYear"];

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
  before: DiscoverableSubject,
  patch: Partial<DiscoverableSubject>,
  resolvePersonName?: (id: string) => string | undefined
): string[] {
  const descriptions: string[] = [];
  const resolve = (id: string) => resolvePersonName?.(id) ?? null;

  (Object.keys(patch) as (keyof DiscoverableSubject)[]).forEach((key) => {
    const newValue = patch[key];
    const oldValue = before[key];

    if (Array.isArray(newValue)) {
      const oldLen = Array.isArray(oldValue) ? oldValue.length : 0;
      if (newValue.length > oldLen) {
        const last = newValue[newValue.length - 1];
        if (PERSON_ID_ARRAY_FIELDS.includes(key as keyof PersonalDetails) && typeof last === "string") {
          const name = resolve(last);
          if (name) descriptions.push(`${FIELD_LABELS[key as keyof PersonalDetails] || key} — ${name}`);
        } else {
          const desc = describeArrayAddition(newValue);
          if (desc) descriptions.push(desc);
        }
      }
      return;
    }

    if (key === "customSections") return;
    // Scritto in automatico insieme a "gender" (vedi kindForGenderChange in lib/types.ts),
    // mai dall'utente in prima persona: non è una sua Scoperta, non genera una riga sua.
    if (key === "kind") return;
    if (DECEASED_DATE_FIELDS.includes(key)) return;

    if (key === "deceased") {
      if (newValue === true && oldValue !== true) {
        const gender = patch.gender ?? before.gender;
        const isDonna = gender === "Donna" || gender === "Femmina";
        const isUomo = gender === "Uomo" || gender === "Maschio";
        descriptions.push(isDonna ? "È deceduta" : isUomo ? "È deceduto" : "È deceduto/a");
      }
      return;
    }

    if (newValue !== undefined && newValue !== "" && newValue !== oldValue) {
      const label = FIELD_LABELS[key as keyof PersonalDetails] || key;
      if (PERSON_ID_SCALAR_FIELDS.includes(key as keyof PersonalDetails) && typeof newValue === "string") {
        const name = resolve(newValue);
        if (name) descriptions.push(`${label} — ${name}`);
        return;
      }
      if (BOOLEAN_FIELDS.includes(key as keyof PersonalDetails) && typeof newValue === "boolean") {
        if (newValue) descriptions.push(label);
        return;
      }
      descriptions.push(`${label} — ${newValue}`);
    }
  });

  return descriptions;
}
