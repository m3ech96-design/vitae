export interface CustomField {
  id: string;
  label: string;
  value: string;
  thumbnailUrl?: string;
}

export interface ThumbItem {
  id: string;
  title: string;
  imageUrl?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  fields: CustomField[];
}

export interface PersonalDetails {
  gender?: string;
  birthday?: string;
  /** Il "Soprannome" del wizard identità — un nomignolo informale (persona offline o il tuo
   * stesso profilo). Chiave diversa da `UserProfile.nickname` apposta: prima si chiamava
   * anche questo `nickname`, e siccome `UserProfile extends PersonalDetails` le due chiavi
   * coincidevano — scrivere qui sovrascriveva il vero nickname Vitaecom (bug corretto). */
  alias?: string;
  phone?: string;
  birthPlace?: string;
  traits: string[];
  values: string[];
  strengths?: string;
  weaknesses?: string;
  fears?: string;
  ambitions?: string;
  goals?: string;
  lifestyle: string[];
  identityCustomFields: CustomField[];

  /** "Spunta" — non un semplice sì/no isolato: attiva l'espansione dei campi di studio
   * qui sotto. Studia e Lavora non si escludono a vicenda (chi lavora e studia insieme
   * esiste), quindi restano due booleani indipendenti, non un'unica scelta esclusiva. */
  studies?: boolean;
  works?: boolean;
  /** Solo se "Studia" è spuntato. */
  currentSchool?: string;
  futureStudyGoals?: string;
  futureWorkGoals?: string;
  /** Solo se "Lavora" è spuntato. `studiedAt`/`educationTitle` vivono qui sotto (non più
   * sempre visibili): chi lavora può comunque voler registrare dove ha studiato, con un
   * suggerimento preso da `currentSchool` se l'ha già scritto — vedi EducationWorkSection. */
  currentWorkplace?: string;
  previousWorkplaces: string[];
  studiedAt?: string;
  educationTitle?: string;

  subjects: string[];
  competencies: string[];
  abilities: string[];
  languages: string[];
  occupation?: string;
  professionalAmbition?: string;
  eduWorkCustomFields: CustomField[];

  weight?: number;
  height?: number;
  physicalGoal?: string;
  bodyCustomFields: CustomField[];

  partnerPersonId?: string;
  friendPersonIds: string[];
  bestFriendPersonIds: string[];
  spouseId?: string;
  exSpouseIds: string[];
  fatherId?: string;
  motherId?: string;
  homeCustomFields: CustomField[];

  favoriteMovies: ThumbItem[];
  favoriteMusic: ThumbItem[];
  favoriteBooks: ThumbItem[];
  favoriteGames: ThumbItem[];
  favoriteFoods: string[];
  placesOfInterest: string[];
  favoriteCategories: string[];
  interestsCustomFields: CustomField[];

  customSections: CustomSection[];
}

export function emptyPersonalDetails(): PersonalDetails {
  return {
    traits: [],
    values: [],
    lifestyle: [],
    identityCustomFields: [],
    subjects: [],
    competencies: [],
    abilities: [],
    languages: [],
    previousWorkplaces: [],
    eduWorkCustomFields: [],
    bodyCustomFields: [],
    friendPersonIds: [],
    bestFriendPersonIds: [],
    exSpouseIds: [],
    homeCustomFields: [],
    favoriteMovies: [],
    favoriteMusic: [],
    favoriteBooks: [],
    favoriteGames: [],
    favoriteFoods: [],
    placesOfInterest: [],
    favoriteCategories: [],
    interestsCustomFields: [],
    customSections: [],
  };
}

export interface UserProfile extends PersonalDetails {
  avatarUrl?: string;
  firstName: string;
  lastName: string;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
  /** Il nome con cui esisti in Vitaecom — univoco (vedi lib/nickname-check.ts), mai
   * obbligatorio al wizard: se lo lasci vuoto lì, te lo richiede Vitaecom stesso al primo
   * accesso, e non entri finché non ne scegli uno libero. */
  nickname?: string;
  /** La Vetrina in cima al tuo profilo Vitaecom, visibile a chi ti visita — non un bio
   * testuale generico: riferimenti (`"favoriteMovies:<id>"`, `"values:Empatia"`, ecc, vedi
   * lib/vitaecom-showcase.ts) verso dati che hai già scritto altrove nel wizard (film, musica,
   * valori, luoghi...), scelti a mano tra quelli esistenti invece di duplicare un campo testo
   * a parte da tenere sincronizzato a mano. */
  vitaecomShowcase: string[];
}

export function createEmptyProfile(): UserProfile {
  const now = new Date().toISOString();
  return {
    ...emptyPersonalDetails(),
    firstName: "",
    lastName: "",
    onboardingComplete: false,
    createdAt: now,
    updatedAt: now,
    vitaecomShowcase: [],
  };
}

export type PersonKind = "uomo" | "donna" | "bambino" | "bambina" | "cane" | "gatto";

export const PERSON_KIND_LABEL: Record<PersonKind, string> = {
  uomo: "Uomo",
  donna: "Donna",
  bambino: "Bambino",
  bambina: "Bambina",
  cane: "Cane",
  gatto: "Gatto",
};

export const ANIMAL_KINDS: PersonKind[] = ["cane", "gatto"];

export interface RecurringPhrase {
  id: string;
  text: string;
}

export type ActionMode = "orario" | "casuale";

export interface ActionPhrase {
  id: string;
  text: string;
  mode: ActionMode;
  startTime?: string;
  endTime?: string;
}

export interface FeedingTime {
  id: string;
  time: string;
}

export interface FeedingLogEntry {
  id: string;
  date: string;
  foodType: string;
}

/** Identico nei campi a una Task di tipo Evento: inizio, fine, avviso anticipato — non si
 * spunta, si completa da sola quando l'orario di fine coincide con l'ora reale. */
export interface Engagement {
  id: string;
  title: string;
  notes?: string;
  type: TaskType;
  date: string;
  time?: string;
  endTime?: string;
  reminderOffset: ReminderOffset;
  reminded?: boolean;
  recurrence: Recurrence;
  customDays: Weekday[];
  color: string;
  priority: Priority;
  tags: string[];
  linkedPersonIds: string[];
  linkedPlaceId?: string;
  subtasks: SubTask[];
  shoppingList: ShoppingItem[];
  completed: boolean;
  completedAt?: string;
  spentAmount?: number;
  completionLog: string[];
  createdAt: string;
}

export interface Person extends PersonalDetails {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  kind: PersonKind;
  livesAtHome: boolean;
  /** Creata dal pulsante "Crea Una Persona Di Esempio" in Vitaecom (vedi
   * components/vitaecom/LinkAccountPanel.tsx), per provare Scoperte/Rapporto/Albero senza
   * dover prima collegare qualcuno di vero — una vera Persona a tutti gli effetti (si
   * modifica, si cancella, conta nell'Albero come chiunque altro), solo segnata con un
   * piccolo badge "Esempio" in Mondo per non confonderla con un contatto reale mesi dopo. */
  isDemo?: boolean;
  /** Impostato solo alla creazione, dal wizard — vedi AddPersonModal. Cambia il trattamento
   * dell'avatar ovunque compaia (desaturato, respiro che si assesta una volta sola) e fa
   * comparire "Defunto"/"Defunta" come terza riga nell'Albero Genealogico. */
  deceased?: boolean;
  /** Data di morte, sempre parziale per scelta — ognuno dei tre pezzi è facoltativo e
   * indipendente dagli altri (puoi sapere l'anno ma non il mese, o viceversa, o nessuno dei
   * tre): vedi components/persone/DeceasedDateFields.tsx. Solo l'anno compare nell'Albero
   * ("[nascita]-[morte]"), ma tutti e tre restano nella scheda della persona. */
  deceasedDay?: number;
  deceasedMonth?: number;
  deceasedYear?: number;
  /** Solo per gli animali: id della persona proprietaria ("user" per l'utente stesso). */
  ownerId?: string;
  wakeUntil?: string;
  createdAt: string;

  dialogModeEnabled: boolean;
  recurringPhrases: RecurringPhrase[];
  liveModeEnabled: boolean;
  actionPhrases: ActionPhrase[];

  relationshipScore: number;
  trueFriendshipScore: number;
  deepEnmityScore: number;
  loveScore: number;
  relationshipHistory: RelationshipEvent[];

  animalCharacter: string[];
  animalInterests: string[];
  animalHabits: string[];
  feedingTimes: FeedingTime[];
  feedingLog: FeedingLogEntry[];

  engagements: Engagement[];
}

export interface HomeLocation {
  placeId: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export type PlaceType =
  | "casa"
  | "lavoro"
  | "palestra"
  | "ristorante"
  | "bar"
  | "supermercato"
  | "negozio"
  | "culto"
  | "servizio"
  | "altro";

export interface VisitLogEntry {
  id: string;
  date: string;
  withPersonIds: string[];
  durationMinutes: number;
  spentAmount?: number;
  spentBreakdown?: { category: string; amount: number }[];
}

export interface Place {
  id: string;
  name: string;
  originalName: string;
  photoUrl?: string;
  type: PlaceType;
  address: string;
  lat: number;
  lng: number;
  linkedPersonId?: string;
  isPrimaryHome?: boolean;
  rating: number | null;
  visitsHistory: VisitLogEntry[];
  currentVisitStartedAt?: string;
  createdAt: string;
}

export type TaskType =
  | "quotidiana"
  | "spesa"
  | "appuntamento"
  | "promemoria"
  | "obiettivo"
  | "evento";

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  quotidiana: "Attività quotidiana",
  spesa: "Spesa",
  appuntamento: "Appuntamento",
  promemoria: "Promemoria",
  obiettivo: "Obiettivo",
  evento: "Evento",
};

export type Recurrence = "nessuna" | "quotidiano" | "settimanale" | "mensile" | "annuale" | "personalizzato";

export const RECURRENCE_LABEL: Record<Recurrence, string> = {
  nessuna: "Non si ripete",
  quotidiano: "Ogni giorno",
  settimanale: "Ogni settimana",
  mensile: "Ogni mese",
  annuale: "Ogni anno",
  personalizzato: "Personalizzata",
};

export type Priority = "nessuna" | "bassa" | "media" | "alta" | "urgente";

export const PRIORITY_LABEL: Record<Priority, string> = {
  nessuna: "Nessuna",
  bassa: "Bassa",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
};

export const PRIORITY_TINT: Record<Priority, string | null> = {
  nessuna: null,
  bassa: "#5EC8FF",
  media: "#FFB454",
  alta: "#FF8A3D",
  urgente: "#FF4D6D",
};

export interface SubTask {
  id: string;
  title: string;
  date?: string;
  time?: string;
  done: boolean;
}

export interface ShoppingItem {
  id: string;
  label: string;
  done: boolean;
}

export type Weekday = "SU" | "MO" | "TU" | "WE" | "TH" | "FR" | "SA";

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  MO: "Lun",
  TU: "Mar",
  WE: "Mer",
  TH: "Gio",
  FR: "Ven",
  SA: "Sab",
  SU: "Dom",
};

export type ReminderOffset = "5min" | "10min" | "30min" | "1h" | "2h" | "1day" | "1week" | "none";

export const REMINDER_OFFSET_LABEL: Record<ReminderOffset, string> = {
  "5min": "5 minuti prima",
  "10min": "10 minuti prima",
  "30min": "30 minuti prima",
  "1h": "1 ora prima",
  "2h": "2 ore prima",
  "1day": "1 giorno prima",
  "1week": "1 settimana prima",
  none: "Non avvisare",
};

export const REMINDER_OFFSET_MINUTES: Record<ReminderOffset, number | null> = {
  "5min": 5,
  "10min": 10,
  "30min": 30,
  "1h": 60,
  "2h": 120,
  "1day": 1440,
  "1week": 10080,
  none: null,
};

/** Evento e Appuntamento: hanno inizio e fine, non si spuntano — si completano da soli a fine orario.
 * Promemoria, Obiettivo e Spesa: hanno una scadenza, si spuntano a mano; se la scadenza passa
 * senza spunta, vanno in "Non Completate". Attività Quotidiana: invariata (spunta ogni giorno). */
export function taskGroup(type: TaskType): "tempo" | "scadenza" | "quotidiana" {
  if (type === "evento" || type === "appuntamento") return "tempo";
  if (type === "quotidiana") return "quotidiana";
  return "scadenza";
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  type: TaskType;
  date: string;
  time?: string;
  /** Solo Evento/Appuntamento: orario di fine — a questo orario la task si completa da sola. */
  endTime?: string;
  /** Solo Promemoria/Obiettivo/Spesa: data e ora di scadenza. */
  dueDate?: string;
  dueTime?: string;
  reminderOffset: ReminderOffset;
  reminded?: boolean;
  recurrence: Recurrence;
  customDays: Weekday[];
  color: string;
  priority: Priority;
  tags: string[];
  linkedPersonIds: string[];
  linkedPlaceId?: string;
  subtasks: SubTask[];
  shoppingList: ShoppingItem[];
  completed: boolean;
  completedAt?: string;
  spentAmount?: number;
  spentBreakdown?: { category: string; amount: number }[];
  completionLog: string[];
  createdAt: string;
}

export type RelationshipAxis = "base" | "true-friendship" | "deep-enmity" | "love";

export interface RelationshipEvent {
  id: string;
  date: string;
  label: string;
  delta: number;
  axis: RelationshipAxis;
}

export type ExpenseCategory =
  | "casa"
  | "cibo"
  | "trasporti"
  | "salute"
  | "svago"
  | "abbonamenti"
  | "shopping"
  | "bollette"
  | "servizi"
  | "altro";

export type ExpenseRecurrence = "settimanale" | "mensile" | "annuale";
export const EXPENSE_RECURRENCE_LABEL: Record<ExpenseRecurrence, string> = {
  settimanale: "Ogni settimana",
  mensile: "Ogni mese",
  annuale: "Ogni anno",
};

export interface RecurringExpense {
  id: string;
  label: string;
  amount: number;
  category: ExpenseCategory;
  recurrence: ExpenseRecurrence;
  active: boolean;
  createdAt: string;
}

export interface PlannedExpense {
  id: string;
  label: string;
  amount: number;
  dueDate: string;
  category: ExpenseCategory;
  paid: boolean;
  createdAt: string;
}

export interface SingleExpense {
  id: string;
  label: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  label: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
}

export interface SavingsEntry {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Workout {
  id: string;
  activityId: string;
  minutes: number;
  calories: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface WeightEntry {
  id: string;
  value: number;
  date: string;
}
