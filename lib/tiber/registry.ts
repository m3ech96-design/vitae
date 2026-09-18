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

/** Un modulo = una scheda (o un pezzo di scheda) dell'app di cui l'utente può negare
 * l'accesso a Tiber dalle impostazioni (vedi settings-context.tsx) — l'id è quello che
 * finisce nell'elenco `disabledModules` salvato, la label è quella mostrata nell'elenco a
 * spunta. Un solo posto dove aggiungerne uno nuovo: qui, non in tre file diversi. */
export interface TiberModule {
  id: string;
  label: string;
  tools: Record<string, TiberToolDefinition>;
}

export const TIBER_MODULES: TiberModule[] = [
  { id: "tasks", label: "Task", tools: taskTools },
  { id: "finance", label: "Finanze", tools: financeTools },
  { id: "notes", label: "Liste e note", tools: notesTools },
  { id: "food", label: "Alimentazione", tools: foodTools },
  { id: "health", label: "Salute (referti, farmaci, appuntamenti)", tools: healthTools },
  { id: "activity", label: "Attività fisica e peso", tools: activityTools },
  { id: "animals", label: "Animali", tools: animalTools },
  { id: "people", label: "Rapporti", tools: peopleTools },
  { id: "places", label: "Mappa", tools: placesTools },
  { id: "hobby", label: "Hobby", tools: hobbyTools },
  { id: "wishlist", label: "Wishlist", tools: wishlistTools },
  { id: "diary", label: "Diario", tools: diaryTools },
  { id: "mood", label: "Stato d'animo", tools: moodTools },
  { id: "workoutPlans", label: "Schede allenamento", tools: workoutPlanTools },
];

/**
 * Catalogo completo di ciò che Tiber può fare — unione di tutti i moduli dell'app, ognuno
 * scritto nel proprio file sotto tools/ per restare gestibile e verificabile modulo per
 * modulo. Aggiungere un nuovo modulo significa aggiungere un nuovo file tools/<modulo>.ts e
 * una riga in TIBER_MODULES qui sopra, mai toccare gli altri moduli già presenti.
 *
 * Include SEMPRE tutti i moduli, a prescindere dai permessi scelti dall'utente — usato per
 * risolvere un nome di tool già presente in una conversazione salvata (es. mostrare l'esito
 * di una vecchia chiamata) e come riferimento per `isDestructiveTool`. Per le chiamate vere
 * a Gemini e per l'esecuzione, vedi `getEnabledTools`/`enabledToolDeclarations` sotto — quelli
 * sì rispettano i permessi.
 */
export const TIBER_TOOLS: Record<string, TiberToolDefinition> = Object.fromEntries(
  TIBER_MODULES.flatMap((m) => Object.entries(m.tools))
);

/** Il catalogo davvero utilizzabile in un dato momento — esclude i moduli che l'utente ha
 * disattivato dalle impostazioni. Usato sia per le `declaration` mandate a Gemini (un
 * modulo disattivato non è nemmeno visibile come possibilità, non solo "sconsigliato") sia
 * per bloccare l'esecuzione vera (vedi runTool in context.tsx) — un doppio confine, non
 * solo un suggerimento al modello che potrebbe non rispettarlo. */
export function getEnabledTools(disabledModules: string[]): Record<string, TiberToolDefinition> {
  if (disabledModules.length === 0) return TIBER_TOOLS;
  return Object.fromEntries(
    TIBER_MODULES.filter((m) => !disabledModules.includes(m.id)).flatMap((m) => Object.entries(m.tools))
  );
}

export function enabledToolDeclarations(disabledModules: string[]) {
  return Object.values(getEnabledTools(disabledModules)).map((t) => t.declaration);
}

export function isDestructiveTool(name: string): boolean {
  return Boolean(TIBER_TOOLS[name]?.destructive);
}

/** Un momento di riflessione spontanea (vedi triggerReflection in context.tsx) può guardare
 * i dati ma non deve poterli modificare di sua iniziativa, senza che l'utente abbia chiesto
 * nulla — un conto è l'autonomia concessa quando l'utente parla con lui, un altro è agire
 * mentre nessuno lo sta seguendo. Riconosciuto per convenzione di nome (ogni tool di sola
 * lettura di questo catalogo comincia con uno di questi prefissi, vedi i tool stessi) invece
 * di un campo esplicito su ciascuno — la stessa convenzione già seguita scrivendoli. */
const READ_ONLY_PREFIXES = ["elenca_", "stato_", "dettagli_", "leggi_"];
export function isReadOnlyTool(name: string): boolean {
  return READ_ONLY_PREFIXES.some((p) => name.startsWith(p));
}
