/**
 * Un avatar "vuoto": esiste a tutti gli effetti — Scoperte, Impostazioni, Impegni,
 * esattamente come qualunque altra persona — ma senza nome, perché non lo conosci ancora.
 * Non è un nome segnaposto da confrontare ("Padre Sconosciuto" eccetera): è la semplice
 * assenza di nome E cognome, così il giorno che scrivi anche solo uno dei due (in
 * Impostazioni) torna da solo un avatar normale, senza un secondo stato da sincronizzare.
 * Diverso da un avatar Defunto (vedi AuraAvatar `deceased`): qui la persona è viva e
 * sconosciuta, non conosciuta e scomparsa — trattamenti visivi separati apposta.
 */
export function isEmptyAvatar(person: { firstName: string; lastName: string }): boolean {
  return !person.firstName.trim() && !person.lastName.trim();
}

/** true se questo firstName (letto al focus, prima della modifica) era ancora vuoto — usato
 * solo per decidere se la modifica in corso è "la prima volta che scopro il nome". */
export function isUnknownRelativeName(firstName: string): boolean {
  return !firstName.trim();
}

/** Etichetta da mostrare al posto del nome finché resta vuoto — mai salvata come dato vero,
 * solo per non lasciare mai un'etichetta bianca in giro per l'app. */
export function emptyAvatarLabel(kind: string): string {
  return kind === "donna" || kind === "bambina" || kind === "gatta" ? "Sconosciuta" : "Sconosciuto";
}
