import { Person } from "./types";

/**
 * Cerca non solo nel nome, ma in tutto ciò che hai scoperto: soprannome, occupazione,
 * dove ha studiato/lavorato, tag di interessi, e ogni campo libero — così ritrovi
 * "quella persona che lavora in quel posto" anche se non ricordi come si chiama.
 */
export function personMatchesQuery(person: Person, query: string): boolean {
  const q = query.trim().toLocaleLowerCase("it-IT");
  if (!q) return true;

  const haystack: string[] = [
    person.firstName,
    person.lastName,
    person.nickname || "",
    person.occupation || "",
    person.studiedAt || "",
    person.workedAt || "",
    person.birthPlace || "",
    ...person.traits,
    ...person.values,
    ...person.lifestyle,
    ...person.favoriteFoods,
    ...person.placesOfInterest,
    ...person.favoriteCategories,
    ...person.subjects,
    ...person.competencies,
    ...person.abilities,
    ...person.languages,
    ...person.favoriteMovies.map((m) => m.title),
    ...person.favoriteMusic.map((m) => m.title),
    ...person.favoriteBooks.map((m) => m.title),
    ...person.favoriteGames.map((m) => m.title),
    ...person.identityCustomFields.flatMap((f) => [f.label, f.value]),
    ...person.eduWorkCustomFields.flatMap((f) => [f.label, f.value]),
    ...person.bodyCustomFields.flatMap((f) => [f.label, f.value]),
    ...person.homeCustomFields.flatMap((f) => [f.label, f.value]),
    ...person.interestsCustomFields.flatMap((f) => [f.label, f.value]),
    ...person.customSections.flatMap((s) => [s.title, ...s.fields.flatMap((f) => [f.label, f.value])]),
  ];

  return haystack.some((v) => v.toLocaleLowerCase("it-IT").includes(q));
}
