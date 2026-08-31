import { VitaecomPost } from "./vitaecom-social-types";

/** L'id che raggruppa tutta la catena di condivisione — se stesso per un post originale. */
export function chainRootOf(post: VitaecomPost): string {
  return post.chainRootId ?? post.id;
}

export interface LatoStatoLine {
  moodId: string;
  count: number;
}

/**
 * Quante linee di colore stanno nell'altezza della cornice, e quali — sempre quelle con il
 * numero più alto di persone (a parità, l'ordine è stabile per chiave così le linee non
 * "ballano" a ogni render). Una nuova quota che supera la più bassa già in classifica ne
 * prende il posto, esattamente come richiesto.
 */
export function visibleLatoStatoLines(tallies: Record<string, number> | undefined, frameHeightPx: number): LatoStatoLine[] {
  if (!tallies) return [];
  const all = Object.entries(tallies)
    .filter(([, count]) => count > 0)
    .map(([moodId, count]) => ({ moodId, count }));
  if (all.length === 0) return [];
  // Una linea ogni ~14px, tra 1 e 8 — abbastanza sottili da accumularsi visibilmente senza
  // sparire, mai così tante da diventare un pattern illeggibile.
  const maxLines = Math.max(1, Math.min(8, Math.round(frameHeightPx / 14)));
  return all
    .sort((a, b) => b.count - a.count || a.moodId.localeCompare(b.moodId))
    .slice(0, maxLines);
}
