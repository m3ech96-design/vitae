import { ListChecks, LineChart, Package, Hammer, Library, Swords, BarChart3, LucideIcon } from "lucide-react";
import { HobbyBlockKind } from "./hobby-types";

/** Icona per ciascuno dei sette tipi di blocco — un solo posto, riusato sia dal selettore
 * "Aggiungi blocco" (AddBlockSheet.tsx) sia dall'anteprima di un hobby (HobbyPreviewSheet.tsx),
 * invece di due mappe separate destinate a disallinearsi se un domani cambia un'icona. */
export const HOBBY_BLOCK_ICONS: Record<HobbyBlockKind, LucideIcon> = {
  checklist: ListChecks,
  metrica: LineChart,
  inventario: Package,
  progetti: Hammer,
  libreria: Library,
  partite: Swords,
  statistiche: BarChart3,
};
