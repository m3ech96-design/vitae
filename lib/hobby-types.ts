import { CustomField } from "./types";

/**
 * Architettura a blocchi componibili: un Hobby non ha una forma fissa, ha un elenco
 * ordinato di blocchi — stesso tipo ripetibile quante volte serve (due Metrica diverse per
 * lo stesso hobby, ad esempio), nessun tetto al numero totale. Il tetto sta solo nel
 * vocabolario dei sei TIPI di blocco, non in quanti blocchi finiscono in un hobby.
 */
export type HobbyBlockKind = "checklist" | "metrica" | "inventario" | "progetti" | "libreria" | "partite";

export const HOBBY_BLOCK_LABELS: Record<HobbyBlockKind, string> = {
  checklist: "Checklist",
  metrica: "Metrica",
  inventario: "Inventario",
  progetti: "Progetti",
  libreria: "Libreria",
  partite: "Partite",
};

interface BlockBase {
  id: string;
  kind: HobbyBlockKind;
  /** Rinominabile — così due blocchi Metrica sullo stesso hobby restano distinguibili
   * ("Km percorsi" e "Dislivello", per esempio). */
  title: string;
}

// ---------------------------------------------------------------------------
// 1. Checklist
// ---------------------------------------------------------------------------
export type ChecklistStatus = "da-fare" | "in-corso" | "fatta";
export type Priority = "bassa" | "media" | "alta";

export interface ChecklistItem {
  id: string;
  title: string;
  status: ChecklistStatus;
  dueDate?: string;
  completedDate?: string;
  priority?: Priority;
  durationMinutes?: number;
  difficulty?: number; // 1-5
  satisfaction?: number; // 1-5
  note?: string;
  photoKeys: string[];
  placeId?: string;
  personIds: string[];
  tags: string[];
  createdAt: string;
}

export interface ChecklistBlock extends BlockBase {
  kind: "checklist";
  items: ChecklistItem[];
}

// ---------------------------------------------------------------------------
// 2. Metrica
// ---------------------------------------------------------------------------
export type MetricDirection = "crescente" | "decrescente";
export type MetricAggregation = "cumulativa" | "puntuale";

export interface MetricEntry {
  id: string;
  date: string;
  value: number;
  note?: string;
  placeId?: string;
  photoKey?: string;
}

export interface MetricBlock extends BlockBase {
  kind: "metrica";
  unit: string;
  direction: MetricDirection;
  aggregation: MetricAggregation;
  goalValue?: number;
  goalDeadline?: string;
  entries: MetricEntry[];
}

// ---------------------------------------------------------------------------
// 3. Inventario
// ---------------------------------------------------------------------------
export interface InventoryItem {
  id: string;
  name: string;
  photoKeys: string[];
  category?: string;
  acquiredDate?: string;
  source?: string;
  pricePaid?: number;
  estimatedValue?: number;
  condition?: string;
  catalogNumber?: string;
  quantity: number;
  forTrade: boolean;
  details: CustomField[];
  createdAt: string;
}

export interface InventoryBlock extends BlockBase {
  kind: "inventario";
  items: InventoryItem[];
}

// ---------------------------------------------------------------------------
// 4. Progetti
// ---------------------------------------------------------------------------
export type ProjectStatus = "idea" | "in-corso" | "in-pausa" | "finito" | "abbandonato";
export type ProjectDestination = "per-te" | "regalo" | "in-vendita";

export interface ProjectMaterial {
  id: string;
  name: string;
  cost: number;
}

export interface Project {
  id: string;
  name: string;
  photoKeys: string[]; // ordine libero: prima/durante/dopo
  status: ProjectStatus;
  startedDate?: string;
  finishedDate?: string;
  timeSpentMinutes?: number;
  materials: ProjectMaterial[];
  difficulty?: number; // 1-5
  inspirationUrl?: string;
  destination?: ProjectDestination;
  rating?: number; // 1-5
  note?: string;
  createdAt: string;
}

export interface ProjectsBlock extends BlockBase {
  kind: "progetti";
  projects: Project[];
}

// ---------------------------------------------------------------------------
// 5. Libreria
// ---------------------------------------------------------------------------
export type LibraryStatus = "da-provare" | "in-corso" | "completato" | "abbandonato";

export interface LibraryItem {
  id: string;
  title: string;
  photoKey?: string; // copertina
  creator?: string;
  startedDate?: string;
  completedDate?: string;
  status: LibraryStatus;
  rating?: number; // 1-5
  review?: string;
  genre?: string;
  length?: string; // testo libero: "320 pagine", "45 minuti", "2h30"
  rewatchCount: number;
  recommendedByPersonId?: string;
  createdAt: string;
}

export interface LibraryBlock extends BlockBase {
  kind: "libreria";
  items: LibraryItem[];
}

// ---------------------------------------------------------------------------
// 6. Partite
// ---------------------------------------------------------------------------
export type MatchResult = "vittoria" | "sconfitta" | "pareggio";

export interface Match {
  id: string;
  opponent?: string;
  opponentPersonId?: string;
  date: string;
  placeId?: string;
  competition?: string;
  result: MatchResult;
  score?: string;
  role?: string;
  durationMinutes?: number;
  note?: string;
  photoKey?: string; // foto/screenshot della singola partita
  createdAt: string;
}

export interface MatchesBlock extends BlockBase {
  kind: "partite";
  /** Copertina del blocco (box art del gioco, stemma della squadra...) — richiesta
   * esplicitamente per i videogiochi, stessa idea della copertina in Libreria. */
  photoKey?: string;
  matches: Match[];
}

export type HobbyBlock = ChecklistBlock | MetricBlock | InventoryBlock | ProjectsBlock | LibraryBlock | MatchesBlock;

export interface Hobby {
  id: string;
  name: string;
  photoKey?: string;
  details: CustomField[];
  blocks: HobbyBlock[];
  createdAt: string;
}

/** Tutte le chiavi immagine/video raggiunte da un blocco, per la pulizia in IndexedDB
 * quando il blocco (o l'intero hobby) viene eliminato — mai lasciare orfani. */
export function collectBlockPhotoKeys(block: HobbyBlock): string[] {
  switch (block.kind) {
    case "checklist":
      return block.items.flatMap((i) => i.photoKeys);
    case "metrica":
      return block.entries.map((e) => e.photoKey).filter((k): k is string => Boolean(k));
    case "inventario":
      return block.items.flatMap((i) => i.photoKeys);
    case "progetti":
      return block.projects.flatMap((p) => p.photoKeys);
    case "libreria":
      return block.items.map((i) => i.photoKey).filter((k): k is string => Boolean(k));
    case "partite":
      return [block.photoKey, ...block.matches.map((m) => m.photoKey)].filter((k): k is string => Boolean(k));
  }
}

export function collectHobbyPhotoKeys(hobby: Hobby): string[] {
  return [hobby.photoKey, ...hobby.blocks.flatMap(collectBlockPhotoKeys)].filter((k): k is string => Boolean(k));
}
