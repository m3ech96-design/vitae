import { TaskType, TASK_TYPE_LABEL, PlaceType } from "./types";
import { PLACE_TYPE_META } from "./places-meta";

/**
 * Come si comporta il colore di questo stato sullo sfondo scuro dell'app (vedi
 * lib/mood-tone.ts): "vivido" (acceso, rischia di stonare su un fondo scuro se non
 * ammorbidito), "delicato" (già tenue, quasi nessun ritocco), "cupo" (un negativo intenso,
 * trattamento più ombreggiato) o "pesante" (spento/stanco, diffuso e senza scatti). Le mood
 * personalizzate non ne hanno una: usano il trattamento "vivido" di base, il più neutro.
 */
export type MoodTone = "vivido" | "delicato" | "cupo" | "pesante";

export interface MoodDefinition {
  id: string;
  label: string;
  color: string;
  /** Gli stati di partenza sono modificabili ma non eliminabili (restano un vocabolario di
   * base sempre disponibile); quelli creati dall'utente si possono anche cancellare. */
  builtIn: boolean;
  tone?: MoodTone;
}

/**
 * Palette di partenza — non a caso: emozioni "calde" (frustrato) sui toni caldi già usati
 * per gli avvisi altrove nell'app (rosa acceso), quelle "fresche" (sereno, ispirato) sui
 * toni freddi dell'identità (violetto, ciano, blu cielo) — lo stesso vocabolario cromatico
 * che l'app usa già per tutto il resto, non una palette a parte inventata solo per questo.
 */
export const DEFAULT_MOODS: MoodDefinition[] = [
  // Lo stesso grigio del testo secondario di tutta l'app (ink-600), non un colore inventato
  // per l'occasione: quando nessun altro stato è attivo, la riga mostra questo invece di
  // restare vuota — un'assenza resa visibile, non un'aggiunta.
  { id: "normale", label: "Normale", color: "#8B90A8", builtIn: true, tone: "delicato" },
  { id: "felice", label: "Felice", color: "#FFD86B", builtIn: true, tone: "vivido" },
  { id: "innamorato", label: "Innamorato", color: "#FF6B9D", builtIn: true, tone: "vivido" },
  { id: "romantico", label: "Romantico", color: "#FF8FB4", builtIn: true, tone: "vivido" },
  { id: "ispirato", label: "Ispirato", color: "#7C5CFF", builtIn: true, tone: "delicato" },
  { id: "energico", label: "Energico", color: "#00E5C7", builtIn: true, tone: "vivido" },
  { id: "appagato", label: "Appagato", color: "#34D399", builtIn: true, tone: "delicato" },
  { id: "orgoglioso", label: "Orgoglioso", color: "#FFB454", builtIn: true, tone: "vivido" },
  { id: "sereno", label: "Sereno", color: "#5EC8FF", builtIn: true, tone: "delicato" },
  { id: "divertito", label: "Divertito", color: "#FFD86B", builtIn: true, tone: "vivido" },
  { id: "nostalgico", label: "Nostalgico", color: "#8FA3FF", builtIn: true, tone: "cupo" },
  { id: "curioso", label: "Curioso", color: "#00C2A8", builtIn: true, tone: "delicato" },
  { id: "stanco", label: "Stanco", color: "#8B90A8", builtIn: true, tone: "pesante" },
  { id: "annoiato", label: "Annoiato", color: "#6B7089", builtIn: true, tone: "pesante" },
  { id: "frustrato", label: "Frustrato", color: "#FF4D6D", builtIn: true, tone: "cupo" },
  { id: "sollevato", label: "Sollevato", color: "#5EDFC2", builtIn: true, tone: "delicato" },
];

export type TriggerCategory =
  | "Task"
  | "Luoghi"
  | "Rapporti"
  | "Scoperte"
  | "Salute"
  | "Finanze"
  | "Animali"
  | "Famiglia"
  | "Bisogni";

export interface TriggerDefinition {
  key: string;
  label: string;
  category: TriggerCategory;
  /** Stati suggeriti di serie SOLO per non partire da una scheda vuota — l'utente può
   * toglierli, aggiungerne altri dal catalogo, o inventarne di nuovi: non è una patch mia,
   * è un punto di partenza che si riscrive tutto dall'interfaccia. */
  defaultMoodIds: string[];
}

const TASK_TRIGGERS: TriggerDefinition[] = (Object.keys(TASK_TYPE_LABEL) as TaskType[]).map((type) => ({
  key: `task:${type}`,
  label: `Completare una task: ${TASK_TYPE_LABEL[type]}`,
  category: "Task",
  defaultMoodIds:
    type === "quotidiana"
      ? ["appagato"]
      : type === "obiettivo"
      ? ["orgoglioso", "appagato"]
      : type === "evento"
      ? ["divertito", "felice"]
      : type === "spesa"
      ? ["sollevato"]
      : [],
}));

const PLACE_TRIGGERS: TriggerDefinition[] = (Object.keys(PLACE_TYPE_META) as PlaceType[]).map((type) => ({
  key: `luogo:${type}`,
  label: `Uscire da un luogo: ${PLACE_TYPE_META[type].label}`,
  category: "Luoghi",
  defaultMoodIds:
    type === "palestra"
      ? ["energico", "stanco"]
      : type === "ristorante" || type === "bar"
      ? ["divertito", "felice"]
      : type === "lavoro"
      ? ["stanco", "orgoglioso"]
      : type === "culto"
      ? ["sereno"]
      : [],
}));

export const TRIGGER_CATALOG: TriggerDefinition[] = [
  ...TASK_TRIGGERS,
  {
    key: "task:streak",
    label: "Uno streak di task quotidiane raggiunge un nuovo traguardo",
    category: "Task",
    defaultMoodIds: ["orgoglioso", "energico"],
  },
  ...PLACE_TRIGGERS,
  { key: "luogo:nuovo", label: "Registrare un luogo mai visto prima", category: "Luoghi", defaultMoodIds: ["curioso"] },
  {
    key: "luogo:valutazione-alta",
    label: 'Valutare un luogo "Adoro" (80+)',
    category: "Luoghi",
    defaultMoodIds: ["felice"],
  },
  {
    key: "luogo:valutazione-bassa",
    label: 'Valutare un luogo "Pessimo" (sotto 20)',
    category: "Luoghi",
    defaultMoodIds: ["frustrato"],
  },
  { key: "rapporti:positiva", label: "Interazione positiva con una persona", category: "Rapporti", defaultMoodIds: ["felice"] },
  { key: "rapporti:negativa", label: "Interazione negativa con una persona", category: "Rapporti", defaultMoodIds: ["frustrato"] },
  {
    key: "rapporti:vera-amicizia",
    label: "Un legame diventa vera amicizia",
    category: "Rapporti",
    defaultMoodIds: ["felice", "appagato"],
  },
  {
    key: "rapporti:amore",
    label: "Il legame con il partner si rafforza",
    category: "Rapporti",
    defaultMoodIds: ["innamorato", "romantico"],
  },
  { key: "scoperte:salvate", label: "Salvare nuove scoperte su una persona", category: "Scoperte", defaultMoodIds: ["curioso"] },
  {
    key: "scoperte:nome-parente",
    label: "Scoprire il nome di un parente sconosciuto",
    category: "Scoperte",
    defaultMoodIds: ["felice", "nostalgico"],
  },
  { key: "salute:allenamento", label: "Registrare un allenamento", category: "Salute", defaultMoodIds: ["energico", "stanco"] },
  { key: "finanze:spesa-registrata", label: "Registrare una spesa", category: "Finanze", defaultMoodIds: [] },
  {
    key: "finanze:sopra-budget",
    label: "La proiezione di fine mese supera il budget",
    category: "Finanze",
    defaultMoodIds: ["frustrato"],
  },
  {
    key: "finanze:sotto-budget",
    label: "Restare sotto budget a fine mese",
    category: "Finanze",
    defaultMoodIds: ["sollevato", "orgoglioso"],
  },
  {
    key: "animali:interazione-positiva",
    label: "Interazione positiva con un animale",
    category: "Animali",
    defaultMoodIds: ["felice"],
  },
  {
    key: "animali:interazione-negativa",
    label: "Interazione negativa con un animale",
    category: "Animali",
    defaultMoodIds: ["frustrato"],
  },
  { key: "animali:sfamato", label: "Dar da mangiare a un animale affamato", category: "Animali", defaultMoodIds: ["sollevato"] },
  {
    key: "famiglia:nuovo-legame",
    label: "Collegare un nuovo parente nell'albero genealogico",
    category: "Famiglia",
    defaultMoodIds: ["curioso", "nostalgico"],
  },
  {
    key: "bisogni:desiderato",
    label: "Scegliere un nuovo bisogno della settimana",
    category: "Bisogni",
    defaultMoodIds: ["curioso"],
  },
  { key: "bisogni:esaudito", label: "Esaudire un bisogno della settimana", category: "Bisogni", defaultMoodIds: ["appagato"] },
];
