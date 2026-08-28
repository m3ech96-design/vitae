import { Person, CustomField } from "./types";

/** Tutti i campi liberi (label/valore) sparsi tra le sezioni di scoperta e le sezioni personalizzate. */
export function allCustomDiscoveredFields(person: Person): CustomField[] {
  return [
    ...person.identityCustomFields,
    ...person.eduWorkCustomFields,
    ...person.bodyCustomFields,
    ...person.homeCustomFields,
    ...person.interestsCustomFields,
    ...person.customSections.flatMap((s) => s.fields),
  ];
}
