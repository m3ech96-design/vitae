import { EntityLink } from "./entity-link";

/** Una singola voce dentro una lista — "ordinate" nel senso richiesto: ogni voce ha una sua
 * posizione esplicita nell'array `items` della lista (l'ordine dell'array stesso), spostabile
 * su/giù senza bisogno di drag-and-drop, affidabile anche su schermi piccoli a tocco. */
export interface NoteListItem {
  id: string;
  text: string;
  done: boolean;
}

/** Campi condivisi da liste e note testuali — tag ed evidenza in cima si applicano allo
 * stesso modo a entrambe, non solo a una delle due: un promemoria testuale importante
 * merita di poter essere fissato in cima esattamente quanto una lista della spesa attiva. */
interface NoteEntryBase {
  /** Etichette libere scelte dall'utente, per ritrovare voci per argomento invece che solo
   * per titolo o data — nessun catalogo predefinito, l'utente scrive quello che gli serve. */
  tags: string[];
  /** In cima all'elenco, sopra tutte le altre — indipendente dall'ordinamento scelto
   * (recenti/A-Z): un pin è una scelta esplicita dell'utente, non deve poter essere
   * scavalcata da un ordinamento automatico. */
  pinned: boolean;
  /** Collegamenti verso qualunque altra entità dell'app (vedi lib/entity-link.ts) — stesso
   * modello generico usato dal Diario, non una seconda implementazione parallela per lo
   * stesso concetto. */
  links: EntityLink[];
}

export interface NoteList extends NoteEntryBase {
  id: string;
  kind: "list";
  title: string;
  items: NoteListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteText extends NoteEntryBase {
  id: string;
  kind: "note";
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export type NoteEntry = NoteList | NoteText;
