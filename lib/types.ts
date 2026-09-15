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
   * stesso profilo). Chiave tenuta volutamente diversa da un vecchio campo `nickname` che
   * esisteva un tempo su `UserProfile` (rimosso insieme a Vitaecom): dato che `UserProfile`
   * estende `PersonalDetails`, le due chiavi coincidevano, e scrivere qui sovrascriveva
   * quell'altro nickname (bug corretto all'epoca). */
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

  /** Prima esistevano solo per le Persone (`Person`), non per te stesso — bug/limite
   * segnalato esplicitamente: ora vivono qui, in `PersonalDetails`, così sia `Person` che
   * `UserProfile` li ereditano allo stesso modo, e la Modalità Vivo/Dialogo diventa
   * modificabile anche nel proprio profilo, non solo per gli altri. La Frase Azione — su
   * richiesta esplicita — non è più una lista: al più una, sempre quella in vigore. */
  dialogModeEnabled: boolean;
  recurringPhrases: RecurringPhrase[];
  liveModeEnabled: boolean;
  actionPhrase?: ActionPhrase;
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
    dialogModeEnabled: false,
    recurringPhrases: [],
    liveModeEnabled: false,
  };
}

export interface UserProfile extends PersonalDetails {
  avatarUrl?: string;
  firstName: string;
  lastName: string;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
  /** Se false, il resoconto di benessere settimanale (vedi lib/wellbeing-report.ts) non
   * compare in Salute — l'utente può disattivarlo se lo trova invadente (richiesto
   * esplicitamente: il resoconto non deve mai essere imposto). Default `true`: comincia
   * visibile, non richiede un'attivazione esplicita per essere scoperto. */
  wellbeingReportEnabled?: boolean;
  /** Come su Person (lib/types.ts) per gli altri componenti della famiglia: di notte
   * l'utente principale risulta dormiente come chiunque altro, a meno che non si sia svegliato
   * per un'ora toccando il proprio avatar — vedi lib/time.ts. */
  wakeUntil?: string;
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

/**
 * Bug reale, trovato con un audit mirato: "kind" (Uomo/Donna/Bambino/Bambina — deciso una
 * volta sola alla creazione, in AddPersonModal) e "gender" (il campo "Sesso" della scheda
 * Scoperte, modificabile in qualunque momento) sono due dati diversi che raccontano la
 * stessa cosa. "Sconosciuto/a" (unknown-relative.ts) e "Defunto/a" (PersonWindow) leggono
 * "kind" — se "gender" cambia dopo la creazione senza toccare anche "kind", quelle due
 * etichette restano quelle vecchie: esattamente il sintomo di "le modifiche non si
 * aggiornano ovunque". Va richiamata ogni volta che il "Sesso" cambia, per tenere i due dati
 * sempre coerenti — mai per gli animali, dove "kind" resta Cane/Gatto a prescindere dal
 * sesso.
 */
export function kindForGenderChange(currentKind: PersonKind, gender: string | undefined): PersonKind {
  if (ANIMAL_KINDS.includes(currentKind)) return currentKind;
  const isChild = currentKind === "bambino" || currentKind === "bambina";
  if (gender === "Donna" || gender === "Femmina") return isChild ? "bambina" : "donna";
  if (gender === "Uomo" || gender === "Maschio") return isChild ? "bambino" : "uomo";
  // Non binario, "preferisco non specificare", o vuoto: non c'è una scelta giusta da
  // indovinare, quindi "kind" resta quello che era invece di forzarne uno a caso.
  return currentKind;
}

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
  /** Il nome del prodotto al momento del pasto (fotografia: resta leggibile anche se quel
   * prodotto viene poi eliminato da lib/animal-food-context.tsx). */
  foodType: string;
  /** Riferimento al prodotto vero, se esiste ancora — solo per usi futuri, non necessario
   * per la sola visualizzazione della cronologia (che usa già foodType). */
  productId?: string;
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
  /** Badge "Esempio" in Mondo, per non confondere una persona di prova con un contatto
   * reale. */
  isDemo?: boolean;
  /** Impostato solo alla creazione, dal wizard — vedi AddPersonModal. Cambia il trattamento
   * dell'avatar ovunque compaia (desaturato, respiro che si assesta una volta sola) e fa
   * comparire "Defunto"/"Defunta" nella scheda della persona. */
  deceased?: boolean;
  /** Data di morte, sempre parziale per scelta — ognuno dei tre pezzi è facoltativo e
   * indipendente dagli altri (puoi sapere l'anno ma non il mese, o viceversa, o nessuno dei
   * tre): vedi components/persone/DeceasedDateFields.tsx. */
  deceasedDay?: number;
  deceasedMonth?: number;
  deceasedYear?: number;
  /** Solo per gli animali: id della persona proprietaria ("user" per l'utente stesso). */
  ownerId?: string;
  wakeUntil?: string;
  createdAt: string;

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
  /** Anagrafica, solo per gli animali — tutta facoltativa, tutta modificabile in ogni
   * momento dalla scheda "Animali". */
  breed?: string;
  birthOrAdoptionDate?: string;
  microchipNumber?: string;
  markings?: string;
  neutered?: boolean;

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
  /** Se false, questa spesa (supermercato o altro luogo) resta solo un dato in cronologia e
   * non viene mai sommata al budget del ciclo — scelta esplicita di chi la registra (vedi
   * SpentPrompt), non dedotta dal tipo di luogo. Assente o true = addebitata dal budget, il
   * comportamento di sempre per chi non tocca questa scelta. */
  chargedToBudget?: boolean;
}

export interface Place {
  id: string;
  name: string;
  originalName: string;
  photoUrl?: string;
  /** Galleria del luogo — foto aggiuntive oltre a `photoUrl` (che resta la copertina
   * mostrata come sfondo nella card e nell'intestazione). Nessun limite al numero di foto:
   * ognuna è solo una chiave verso image-store.ts (IndexedDB), non una data URL diretta,
   * quindi non c'è un vincolo pratico di quota come ci sarebbe stato in localStorage. */
  photoKeys?: string[];
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
  /** Stesso significato di VisitLogEntry.chargedToBudget — una Task di tipo Spesa può
   * registrare quanto è costata solo per tenerne nota, senza che tocchi il budget del ciclo. */
  chargedToBudget?: boolean;
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
  /** Stesso significato di VisitLogEntry.chargedToBudget — una spesa manuale può restare
   * solo un dato in cronologia, scelto al momento di aggiungerla. */
  chargedToBudget?: boolean;
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
  /** Presente SOLO quando questa entry nasce dall'applicazione del calcolatore stipendio
   * (vedi SalarySplitCalculator.tsx) — la retribuzione totale che ha generato questo
   * versamento, non solo la quota finita nei risparmi. Prima esisteva solo dentro `note`
   * come testo libero ("Suddivisione stipendio (20% di 2000€)"): utile da leggere ma non
   * da usare come dato, perché un parsing di stringa si romperebbe al primo cambio di
   * formattazione o lingua. Questo campo è la stessa informazione, ma come numero vero su
   * cui costruire un report entrate/uscite affidabile. */
  totalIncomeAmount?: number;
}

/** Log dei versamenti per un singolo obiettivo — a differenza di SavingsGoal.currentAmount
 * (un totale che si limita ad aggiornarsi), questo conserva OGNI versamento con la sua
 * data: senza questo storico non esisterebbe alcun modo onesto di stimare "a che ritmo
 * risparmi per QUESTO obiettivo", solo il totale attuale senza contesto temporale. Creato
 * insieme a questa funzionalità, quindi uno storico che comincia da qui in avanti — non
 * inventa un ritmo per i versamenti fatti prima che questo log esistesse. */
export interface SavingsGoalContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
}

export interface Workout {
  id: string;
  activityId: string;
  minutes: number;
  calories: number;
  /** Distanza percorsa in km — opzionale: ha senso solo per attività dove "percorrere
   * distanza" è il concetto stesso (corsa, camminata, ciclismo, nuoto...), non per tutte
   * (pesi, yoga, sport di squadra senza un tragitto). Non derivata né stimata da minuti o
   * calorie: quando presente è un dato che l'utente ha registrato per quella sessione. */
  distanceKm?: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface WeightEntry {
  id: string;
  value: number;
  date: string;
}

/** Un singolo esercizio dentro una scheda allenamento — il video può essere un link YouTube
 * (solo l'URL, riprodotto incorporato) oppure un video/immagine locale (chiave IndexedDB,
 * come il resto dei media dell'app): mai entrambi insieme, il campo `mediaType` decide quale
 * dei due usare. */
export type WorkoutPlanExerciseMediaType = "youtube" | "video" | "image";

/** Una singola sessione svolta per questo esercizio — cosa hai fatto DAVVERO quel giorno,
 * distinto da `reps`/`note` sull'esercizio che restano la prescrizione della scheda (es.
 * "3x10") e non cambiano a ogni allenamento. Peso e ripetizioni sono numeri qui (non testo
 * libero come `reps`) proprio perché servono a calcolare massimale e volume nel tempo —
 * cosa che una stringa tipo "al cedimento" non permetterebbe mai di fare in modo affidabile. */
export interface ExerciseLogEntry {
  id: string;
  date: string;
  weightKg: number;
  reps: number;
  /** Quante serie a questo peso/ripetizioni — il volume (peso × reps × serie) ha senso solo
   * sapendo quante volte è stata ripetuta la stessa combinazione quel giorno. */
  sets: number;
  note?: string;
}

export interface WorkoutPlanExercise {
  id: string;
  name: string;
  reps: string;
  note?: string;
  mediaType?: WorkoutPlanExerciseMediaType;
  /** URL YouTube se mediaType è "youtube", altrimenti chiave IndexedDB (video-store/image-store). */
  mediaValue?: string;
  /** Storico delle sessioni svolte per QUESTO esercizio — legato all'id della riga, non al
   * nome: se lo rinomini o lo sposti tra tabelle lo storico resta suo, ma un esercizio
   * diverso con lo stesso nome scritto altrove non lo eredita per sbaglio. */
  log?: ExerciseLogEntry[];
}

/** Una tabella rinominabile dentro "Schede allenamenti" (es. "Push day", "Gambe") — una
 * scheda allenamento può contenerne quante se ne vogliono, ciascuna con la propria lista di
 * esercizi in ordine libero. */
export interface WorkoutPlanTable {
  id: string;
  name: string;
  exercises: WorkoutPlanExercise[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  tables: WorkoutPlanTable[];
  createdAt: string;
}
