/** Una singola voce dentro una lista — "ordinate" nel senso richiesto: ogni voce ha una sua
 * posizione esplicita nell'array `items` della lista (l'ordine dell'array stesso), spostabile
 * su/giù senza bisogno di drag-and-drop, affidabile anche su schermi piccoli a tocco. */
export interface NoteListItem {
  id: string;
  text: string;
  done: boolean;
}

export interface NoteList {
  id: string;
  kind: "list";
  title: string;
  items: NoteListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteText {
  id: string;
  kind: "note";
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export type NoteEntry = NoteList | NoteText;
