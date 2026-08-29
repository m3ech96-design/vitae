import { PersonalDetails, ThumbItem } from "./types";

/**
 * La Vetrina del profilo Vitaecom non è un campo testo libero da compilare una seconda
 * volta: pesca da quello che hai già scritto nel wizard (film, musica, libri, giochi,
 * valori, luoghi, cibi, categorie d'interesse) e lasci scegliere all'utente cosa mostrare
 * agli altri. Ogni candidato ha una `key` stabile (`"<sorgente>:<id-o-valore>"`) — è quella
 * che finisce salvata in `profile.vitaecomShowcase`, mai l'oggetto intero, così se cambi il
 * valore altrove (rinomini un film nei Preferiti) la vetrina lo segue da sola.
 */
export type ShowcaseSource =
  | "favoriteMovies"
  | "favoriteMusic"
  | "favoriteBooks"
  | "favoriteGames"
  | "favoriteFoods"
  | "placesOfInterest"
  | "favoriteCategories"
  | "values"
  | "traits"
  | "lifestyle";

export const SHOWCASE_SOURCE_LABEL: Record<ShowcaseSource, string> = {
  favoriteMovies: "Film Preferiti",
  favoriteMusic: "Musica Preferita",
  favoriteBooks: "Libri Preferiti",
  favoriteGames: "Giochi Preferiti",
  favoriteFoods: "Cibi Preferiti",
  placesOfInterest: "Luoghi D'Interesse",
  favoriteCategories: "Categorie Preferite",
  values: "Valori",
  traits: "Carattere",
  lifestyle: "Stile Di Vita",
};

const THUMB_SOURCES: ShowcaseSource[] = ["favoriteMovies", "favoriteMusic", "favoriteBooks", "favoriteGames"];

export interface ShowcaseCandidate {
  key: string;
  source: ShowcaseSource;
  label: string;
  imageUrl?: string;
}

function stringListCandidates(source: ShowcaseSource, values: string[]): ShowcaseCandidate[] {
  return values.map((v) => ({ key: `${source}:${v}`, source, label: v }));
}

function thumbListCandidates(source: ShowcaseSource, items: ThumbItem[]): ShowcaseCandidate[] {
  return items.map((t) => ({ key: `${source}:${t.id}`, source, label: t.title, imageUrl: t.imageUrl }));
}

/** Tutto ciò che PUÒ entrare in vetrina, sorgente per sorgente — usato dall'editor
 * dell'owner per proporre cosa scegliere. */
export function showcaseCandidates(profile: PersonalDetails): ShowcaseCandidate[] {
  return [
    ...thumbListCandidates("favoriteMovies", profile.favoriteMovies),
    ...thumbListCandidates("favoriteMusic", profile.favoriteMusic),
    ...thumbListCandidates("favoriteBooks", profile.favoriteBooks),
    ...thumbListCandidates("favoriteGames", profile.favoriteGames),
    ...stringListCandidates("favoriteFoods", profile.favoriteFoods),
    ...stringListCandidates("placesOfInterest", profile.placesOfInterest),
    ...stringListCandidates("favoriteCategories", profile.favoriteCategories),
    ...stringListCandidates("values", profile.values),
    ...stringListCandidates("traits", profile.traits),
    ...stringListCandidates("lifestyle", profile.lifestyle),
  ];
}

/** Solo quelli davvero scelti, nell'ordine in cui l'utente li ha messi — quello che finisce
 * renderizzato nel riquadro, sia per l'owner che per chi visita. Le chiavi che puntano a un
 * valore nel frattempo rimosso altrove (es. un film tolto dai Preferiti) spariscono da sole,
 * senza lasciare un buco nella vetrina. */
export function resolveShowcase(profile: PersonalDetails, keys: string[]): ShowcaseCandidate[] {
  const all = new Map(showcaseCandidates(profile).map((c) => [c.key, c]));
  return keys.map((k) => all.get(k)).filter((c): c is ShowcaseCandidate => Boolean(c));
}

export function isThumbSource(source: ShowcaseSource): boolean {
  return THUMB_SOURCES.includes(source);
}
