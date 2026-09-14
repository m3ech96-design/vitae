export type DiaryMediaType = "image" | "video" | "audio";

export interface DiaryMedia {
  id: string;
  type: DiaryMediaType;
  /** Chiave verso image-store.ts / video-store.ts / audio-store.ts a seconda di `type`. */
  key: string;
}

import { EntityLink } from "./entity-link";

export interface DiaryEntry {
  id: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:MM
  text: string;
  media: DiaryMedia[];
  /** Stato d'animo di quel momento — facoltativo, uno solo, dallo stesso elenco usato in
   * tutta l'app (lib/mood-catalog.ts, anche gli stati creati dall'utente). */
  moodId?: string;
  /** Collegamenti verso qualunque altra entità dell'app (vedi lib/entity-link.ts) — stesso
   * modello generico usato da Liste e note, "linka tutto, ma proprio tutto" richiesto per
   * il Diario in particolare. */
  links: EntityLink[];
  createdAt: string;
  updatedAt?: string;
}

export function isEntryEmpty(text: string, media: DiaryMedia[]): boolean {
  return text.trim().length === 0 && media.length === 0;
}
