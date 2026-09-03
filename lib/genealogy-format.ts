import { GenealogyPerson, GenealogyRelationship } from "./genealogy-types";
import { GenealogyRelationshipType } from "./genealogy-relationship-types";

/**
 * "1952 – 2020" se deceduto con entrambi gli anni noti, "1952" se vivo con l'anno di nascita
 * noto, stringa vuota se non si conosce nemmeno l'anno di nascita — esattamente i tre casi
 * del punto 8 delle istruzioni originali ("se la data non è conosciuta" il testo sparisce del
 * tutto, non un placeholder tipo "????": qui la convenzione è diversa da quella già usata per
 * le Persone in lib/date-format.ts, perché lo chiedeva esplicitamente l'esempio della card).
 */
export function genealogyYearRange(person: GenealogyPerson): string {
  if (!person.alive) {
    if (person.birthYear && person.deathYear) return `${person.birthYear} – ${person.deathYear}`;
    if (person.deathYear) return `– ${person.deathYear}`;
    if (person.birthYear) return `${person.birthYear} –`;
    return "";
  }
  return person.birthYear ? String(person.birthYear) : "";
}

export function genealogyFullName(person: GenealogyPerson): string {
  const full = `${person.firstName} ${person.lastName}`.trim();
  // Stessa convenzione già in uso in lib/unknown-relative.ts per il modulo Persone: nessun
  // nome segnaposto salvato — l'etichetta "Sconosciuto" è solo per la resa quando nome e
  // cognome sono entrambi vuoti, e sparisce da sola appena l'utente ne scrive anche solo uno.
  return full || "Sconosciuto";
}

/**
 * L'etichetta da mostrare sulla card di `personId`, vista dalla persona di riferimento —
 * SOLO se esiste una relazione registrata DIRETTAMENTE tra le due. Per un ascendente/
 * discendente a più passi (es. un nonno, raggiunto solo tramite genitore→genitore) non esiste
 * alcuna relazione diretta salvata, e qui NON viene calcolata componendo le due relazioni
 * intermedie: sarebbe esattamente l'automatismo che le istruzioni originali vietano. La card
 * in quel caso mostra solo nome, avatar e anni — il collegamento resta comunque leggibile
 * dalla struttura dell'albero (le linee che uniscono i nodi), non dal testo. Chi vuole vedere
 * un'etichetta anche lì può aggiungere lui stesso quella relazione diretta.
 */
export function directRoleLabel(
  personId: string,
  referencePersonId: string,
  relationships: GenealogyRelationship[],
  typesById: Map<string, GenealogyRelationshipType>
): string | undefined {
  if (personId === referencePersonId) return undefined;
  const rel = relationships.find(
    (r) =>
      (r.personXId === referencePersonId && r.personYId === personId) ||
      (r.personXId === personId && r.personYId === referencePersonId)
  );
  if (!rel) return undefined;
  const typeId = rel.personXId === referencePersonId ? rel.typeIdForY : rel.typeIdForX;
  return typesById.get(typeId)?.label;
}
