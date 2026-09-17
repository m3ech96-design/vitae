import { TiberToolDefinition } from "./tool-types";
import { taskTools } from "./tools/tasks";
import { financeTools } from "./tools/finance";
import { notesTools } from "./tools/notes";
import { foodTools } from "./tools/food";
import { healthTools } from "./tools/health";
import { animalTools } from "./tools/animals";
import { peopleTools } from "./tools/people";
import { placesTools } from "./tools/places";
import { hobbyTools } from "./tools/hobby";
import { wishlistTools } from "./tools/wishlist";
import { diaryTools } from "./tools/diary";
import { moodTools } from "./tools/mood";
import { activityTools } from "./tools/activity";
import { workoutPlanTools } from "./tools/workout-plans";

/**
 * Catalogo completo di ciò che Tiber può fare — unione di tutti i moduli dell'app, ognuno
 * scritto nel proprio file sotto tools/ per restare gestibile e verificabile modulo per
 * modulo. Aggiungere un nuovo modulo significa aggiungere un nuovo file tools/<modulo>.ts e
 * una riga di spread qui sotto, mai toccare gli altri moduli già presenti.
 */
export const TIBER_TOOLS: Record<string, TiberToolDefinition> = {
  ...taskTools,
  ...financeTools,
  ...notesTools,
  ...foodTools,
  ...healthTools,
  ...animalTools,
  ...peopleTools,
  ...placesTools,
  ...hobbyTools,
  ...wishlistTools,
  ...diaryTools,
  ...moodTools,
  ...activityTools,
  ...workoutPlanTools,
};

export function tiberToolDeclarations() {
  return Object.values(TIBER_TOOLS).map((t) => t.declaration);
}

export function isDestructiveTool(name: string): boolean {
  return Boolean(TIBER_TOOLS[name]?.destructive);
}
