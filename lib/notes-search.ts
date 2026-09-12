import { NoteEntry } from "./notes-types";

/** Cerca la parola non solo nel titolo, ma anche dentro il contenuto — il corpo di una nota,
 * o il testo di ogni voce di una lista — stesso principio di person-search.ts: si ritrova
 * "quella lista che aveva scritto x" anche senza ricordarne il titolo. */
export function noteMatchesQuery(entry: NoteEntry, query: string): boolean {
  const q = query.trim().toLocaleLowerCase("it-IT");
  if (!q) return true;

  const haystack: string[] =
    entry.kind === "note" ? [entry.title, entry.body] : [entry.title, ...entry.items.map((i) => i.text)];

  return haystack.some((v) => v.toLocaleLowerCase("it-IT").includes(q));
}
