import { PersonalDetails, ThumbItem } from "./types";

export interface CommonGroup {
  label: string;
  items: string[];
}

function normalize(s: string): string {
  return s.trim().toLocaleLowerCase("it-IT");
}

/** Intersezione tra due liste di stringhe, senza badare a maiuscole/minuscole — restituisce
 * la grafia del profilo utente, così il confronto non dipende da chi ha scritto cosa. */
function overlapStrings(a: string[], b: string[]): string[] {
  const bSet = new Set(b.map(normalize));
  const seen = new Set<string>();
  return a.filter((x) => {
    const key = normalize(x);
    if (!bSet.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Stessa intersezione, ma per le liste con miniatura (Film, Musica, Libri, Giochi) —
 * confrontate per titolo. */
function overlapThumbs(a: ThumbItem[], b: ThumbItem[]): string[] {
  return overlapStrings(
    a.map((t) => t.title),
    b.map((t) => t.title)
  );
}

/**
 * Cosa hanno in comune l'utente e una Persona: utente e Persona condividono esattamente la
 * stessa struttura dati (Carattere, Valori, Stile Di Vita, Film/Libri/Giochi/Cibi preferiti —
 * stessi campi, stesse liste curate), quindi il confronto è una semplice intersezione — nessun
 * nuovo campo da compilare, solo dati che esistono già da entrambi i lati. Restituisce solo i
 * gruppi con almeno una voce in comune.
 */
export function commonGround(profile: PersonalDetails, person: PersonalDetails): CommonGroup[] {
  const groups: CommonGroup[] = [
    { label: "Carattere", items: overlapStrings(profile.traits, person.traits) },
    { label: "Valori", items: overlapStrings(profile.values, person.values) },
    { label: "Stile Di Vita", items: overlapStrings(profile.lifestyle, person.lifestyle) },
    { label: "Film", items: overlapThumbs(profile.favoriteMovies, person.favoriteMovies) },
    { label: "Musica", items: overlapThumbs(profile.favoriteMusic, person.favoriteMusic) },
    { label: "Libri", items: overlapThumbs(profile.favoriteBooks, person.favoriteBooks) },
    { label: "Videogiochi", items: overlapThumbs(profile.favoriteGames, person.favoriteGames) },
    { label: "Cibi Preferiti", items: overlapStrings(profile.favoriteFoods, person.favoriteFoods) },
    { label: "Luoghi D'Interesse", items: overlapStrings(profile.placesOfInterest, person.placesOfInterest) },
    { label: "Categorie Preferite", items: overlapStrings(profile.favoriteCategories, person.favoriteCategories) },
  ];
  return groups.filter((g) => g.items.length > 0);
}
