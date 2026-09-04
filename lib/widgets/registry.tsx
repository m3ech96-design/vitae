import { WidgetCatalogEntry } from "./types";
import {
  NextTaskWidget,
  TodayTasksWidget,
  OverdueTasksWidget,
  TaskStreakWidget,
  CompletedThisWeekWidget,
  TasksByTypeWidget,
  ShoppingListWidget,
  RecurringTodayWidget,
  QuickAddTaskWidget,
} from "@/components/widgets/defs/task-widgets";
import { CaloriesTodayWidget, WaterTodayWidget, WeeklyCaloriesGoalWidget, LongestFastWidget, MostEatenFoodWidget, LeastEatenFoodWidget, RecentMealsWidget, MealSuggestionWidget } from "@/components/widgets/defs/food-widgets";
import {
  BudgetCycleWidget,
  LastExpenseWidget,
  SavingsGoalsTotalWidget,
  CycleLeftoverWidget,
  NextPlannedExpenseWidget,
  TopCategoryWidget,
  CycleComparisonWidget,
  CycleCountdownWidget,
  SavingsGoalVesselWidget,
} from "@/components/widgets/defs/finance-widgets";
import {
  CurrentWeightWidget,
  WorkoutStreakWidget,
  WeeklyActiveMinutesWidget,
  WeightChart30dWidget,
  WeightVsGoalWidget,
  NextMedicationWidget,
  NextMedicalAppointmentWidget,
  TodayActiveMinutesWidget,
} from "@/components/widgets/defs/health-widgets";
import {
  TodayNoteWidget,
  DiaryStreakWidget,
  OneYearAgoWidget,
  QuickDiaryNoteWidget,
} from "@/components/widgets/defs/diary-widgets";
import {
  NextHobbyActivityWidget,
  LastMetricProgressWidget,
  LastMatchWidget,
  CollectionValueWidget,
  WinRateWidget,
  LastLibraryItemWidget,
  MostActiveHobbyWidget,
  LastInventoryItemWidget,
  MetricStreakWidget,
  LongestStreakEverWidget,
} from "@/components/widgets/defs/hobby-widgets";
import {
  LastWishlistItemWidget,
  WishlistSavedTotalWidget,
  ClosestToGoalWidget,
  CheapestRemainingWidget,
} from "@/components/widgets/defs/wishlist-widgets";
import {
  NextMealWidget,
  NextVaccinationWidget,
  AnimalWeightTrendWidget,
  DaysSinceAdoptionWidget,
  AnimalMedicationsWidget,
} from "@/components/widgets/defs/animali-widgets";
import {
  MostVisitedPlaceWidget,
  LastVisitWidget,
  FavoritePlaceSpendingWidget,
} from "@/components/widgets/defs/map-widgets";
import {
  UnseenStoriesWidget,
  LastPostWidget,
  NewReactionsWidget,
  LastReceivedMessageWidget,
  QuickMoodPickerWidget,
} from "@/components/widgets/defs/vitaecom-widgets";
import {
  UpcomingBirthdaysWidget,
  TodayBirthdayWidget,
  StrongestBondWidget,
  PeopleInWorldNowWidget,
  NotContactedWidget,
  NextBirthdayCountdownWidget,
} from "@/components/widgets/defs/rapporti-widgets";
import { LatestNewsWidget, TodayDigestWidget } from "@/components/widgets/defs/news-widgets";
import { ShortcutsWidget } from "@/components/widgets/defs/shortcuts-widget";
import {
  GeneralStreakWidget,
  ProfileCompletionWidget,
  ActiveGoalsWidget,
  NextAnyAppointmentWidget,
  NextRecurringDueWidget,
  HouseholdPresenceWidget,
  TodayAtGlanceWidget,
  RecentPhotoWidget,
  BudgetLast3CyclesWidget,
  WeeklyTimelineWidget,
} from "@/components/widgets/defs/cross-widgets";
import { QuickHouseholdMessageWidget } from "@/components/widgets/defs/action-widgets";
import { QuickInteractionWidget } from "@/components/widgets/defs/quick-interaction-widget";

/**
 * Il catalogo — ogni voce esiste sempre qui, a prescindere da quante ne siano piazzate in
 * home: è l'utente a scegliere (vedi AddWidgetSheet.tsx), il sistema si limita a reggerle
 * tutte allo stesso modo qualunque sia la taglia. Alcune idee del brainstorm originale non
 * sono qui — dichiarate onestamente, non perse per dimenticanza: una mini-mappa statica
 * dentro un widget e una miniatura della Costellazione dei Rapporti richiedono di adattare
 * componenti pensati per lo schermo intero a un riquadro minuscolo (un lavoro a sé, non
 * un'aggiunta rapida); un grafico "spesa vs budget ultimi 3 cicli" e un "cosa non fai da più
 * tempo" generico erano più vaghi delle altre 90 idee messe a fuoco — su richiesta si
 * possono ancora precisare e aggiungere.
 */
export const WIDGET_REGISTRY: WidgetCatalogEntry[] = [
  // --- Task ---
  { id: "task-next", title: "Prossima task", category: "Task", href: "/task", defaultSize: "square", allowedSizes: ["square", "half"], Component: NextTaskWidget },
  { id: "task-today", title: "Task di oggi", category: "Task", href: "/task", defaultSize: "half", allowedSizes: ["half", "full"], Component: TodayTasksWidget },
  { id: "task-overdue", title: "Task scadute", category: "Task", href: "/task", defaultSize: "square", allowedSizes: ["square"], Component: OverdueTasksWidget },
  { id: "task-streak", title: "Streak task quotidiane", category: "Task", href: "/task", defaultSize: "square", allowedSizes: ["square"], Component: TaskStreakWidget },
  { id: "task-completed-week", title: "Completate questa settimana", category: "Task", href: "/task", defaultSize: "square", allowedSizes: ["square"], Component: CompletedThisWeekWidget },
  { id: "task-by-type", title: "Task per categoria", category: "Task", href: "/task", defaultSize: "half", allowedSizes: ["half", "full"], Component: TasksByTypeWidget },
  { id: "task-shopping-list", title: "Lista della spesa attiva", category: "Task", href: "/task", defaultSize: "half", allowedSizes: ["half", "full"], Component: ShoppingListWidget },
  { id: "task-recurring-today", title: "Ricorrenti non ancora fatte", category: "Task", href: "/task", defaultSize: "half", allowedSizes: ["half", "full"], Component: RecurringTodayWidget },
  { id: "task-quick-add", title: "Aggiungi task rapida", category: "Azioni rapide", href: "/task", defaultSize: "square", allowedSizes: ["square", "half"], Component: QuickAddTaskWidget },

  // --- Alimentazione ---
  { id: "food-calories-today", title: "Calorie di oggi", category: "Alimentazione", href: "/alimentazione", defaultSize: "square", allowedSizes: ["square"], Component: CaloriesTodayWidget },
  { id: "food-water-today", title: "Acqua bevuta", category: "Alimentazione", href: "/alimentazione", defaultSize: "square", allowedSizes: ["square"], Component: WaterTodayWidget },
  { id: "food-weekly-goal", title: "Obiettivo calorie settimanali", category: "Alimentazione", href: "/alimentazione", defaultSize: "square", allowedSizes: ["square", "half"], Component: WeeklyCaloriesGoalWidget },
  { id: "food-longest-fast", title: "Digiuno più lungo", category: "Alimentazione", href: "/alimentazione", defaultSize: "square", allowedSizes: ["square"], Component: LongestFastWidget },
  { id: "food-most-eaten", title: "Cibo che mangi di più", category: "Alimentazione", href: "/alimentazione", defaultSize: "square", allowedSizes: ["square"], Component: MostEatenFoodWidget },
  { id: "food-least-eaten", title: "Cibo che mangi di meno", category: "Alimentazione", href: "/alimentazione", defaultSize: "square", allowedSizes: ["square"], Component: LeastEatenFoodWidget },
  { id: "food-recent-meals", title: "Ultimi pasti di oggi", category: "Alimentazione", href: "/alimentazione", defaultSize: "half", allowedSizes: ["half", "full"], Component: RecentMealsWidget },
  { id: "food-meal-suggestion", title: "Suggerimento pasto", category: "Alimentazione", href: "/alimentazione", defaultSize: "half", allowedSizes: ["half", "square"], Component: MealSuggestionWidget },

  // --- Finanze ---
  { id: "finance-budget-cycle", title: "Budget del ciclo", category: "Finanze", href: "/finanze", defaultSize: "square", allowedSizes: ["square", "half"], Component: BudgetCycleWidget },
  { id: "finance-last-expense", title: "Ultima spesa", category: "Finanze", href: "/finanze", defaultSize: "square", allowedSizes: ["square"], Component: LastExpenseWidget },
  { id: "finance-savings-total", title: "Risparmiato sugli obiettivi", category: "Finanze", href: "/finanze", defaultSize: "square", allowedSizes: ["square"], Component: SavingsGoalsTotalWidget },
  { id: "finance-cycle-leftover", title: "Rimasto nel ciclo", category: "Finanze", href: "/finanze", defaultSize: "square", allowedSizes: ["square"], Component: CycleLeftoverWidget },
  { id: "finance-next-planned", title: "Prossima spesa pianificata", category: "Finanze", href: "/finanze", defaultSize: "half", allowedSizes: ["half", "full"], Component: NextPlannedExpenseWidget },
  { id: "finance-top-category", title: "Categoria di spesa principale", category: "Finanze", href: "/finanze", defaultSize: "square", allowedSizes: ["square"], Component: TopCategoryWidget },
  { id: "finance-cycle-comparison", title: "Ciclo vs ciclo precedente", category: "Finanze", href: "/finanze", defaultSize: "half", allowedSizes: ["half"], Component: CycleComparisonWidget },
  { id: "finance-cycle-countdown", title: "Countdown nuovo ciclo", category: "Finanze", href: "/finanze", defaultSize: "square", allowedSizes: ["square"], Component: CycleCountdownWidget },
  { id: "finance-savings-vessel", title: "Vaso di risparmio", category: "Finanze", href: "/finanze", defaultSize: "half", allowedSizes: ["half", "square"], Component: SavingsGoalVesselWidget },

  // --- Salute / Attività e peso ---
  { id: "health-current-weight", title: "Peso attuale", category: "Salute", href: "/attivita-peso", defaultSize: "square", allowedSizes: ["square"], Component: CurrentWeightWidget },
  { id: "health-workout-streak", title: "Streak allenamenti", category: "Salute", href: "/attivita-peso", defaultSize: "square", allowedSizes: ["square"], Component: WorkoutStreakWidget },
  { id: "health-weekly-minutes", title: "Minuti attivi (7gg)", category: "Salute", href: "/attivita-peso", defaultSize: "square", allowedSizes: ["square"], Component: WeeklyActiveMinutesWidget },
  { id: "health-weight-chart", title: "Grafico peso (30gg)", category: "Salute", href: "/attivita-peso", defaultSize: "half", allowedSizes: ["half", "full"], Component: WeightChart30dWidget },
  { id: "health-weight-vs-goal", title: "Peso vs obiettivo", category: "Salute", href: "/attivita-peso", defaultSize: "square", allowedSizes: ["square"], Component: WeightVsGoalWidget },
  { id: "health-next-medication", title: "Prossimo farmaco", category: "Salute", href: "/salute", defaultSize: "half", allowedSizes: ["half", "square"], Component: NextMedicationWidget },
  { id: "health-next-appointment", title: "Prossimo appuntamento medico", category: "Salute", href: "/salute", defaultSize: "half", allowedSizes: ["half", "square"], Component: NextMedicalAppointmentWidget },
  { id: "health-today-minutes", title: "Minuti attivi oggi", category: "Salute", href: "/attivita-peso", defaultSize: "square", allowedSizes: ["square"], Component: TodayActiveMinutesWidget },

  // --- Diario ---
  { id: "diary-today-note", title: "Nota di oggi", category: "Diario", href: "/diario", defaultSize: "half", allowedSizes: ["half", "full"], Component: TodayNoteWidget },
  { id: "diary-streak", title: "Streak di scrittura", category: "Diario", href: "/diario", defaultSize: "square", allowedSizes: ["square"], Component: DiaryStreakWidget },
  { id: "diary-one-year-ago", title: "Un anno fa oggi", category: "Diario", href: "/diario", defaultSize: "half", allowedSizes: ["half", "full"], Component: OneYearAgoWidget },
  { id: "diary-quick-note", title: "Scrivi nota rapida", category: "Azioni rapide", href: "/diario", defaultSize: "square", allowedSizes: ["square", "half"], Component: QuickDiaryNoteWidget },

  // --- Hobby ---
  { id: "hobby-next-activity", title: "Prossima attività da fare", category: "Hobby", href: "/hobby", defaultSize: "half", allowedSizes: ["half", "square"], Component: NextHobbyActivityWidget },
  { id: "hobby-last-metric", title: "Ultimo progresso metrica", category: "Hobby", href: "/hobby", defaultSize: "square", allowedSizes: ["square"], Component: LastMetricProgressWidget },
  { id: "hobby-last-match", title: "Ultima partita giocata", category: "Hobby", href: "/hobby", defaultSize: "square", allowedSizes: ["square"], Component: LastMatchWidget },
  { id: "hobby-collection-value", title: "Valore di una collezione", category: "Hobby", href: "/hobby", defaultSize: "square", allowedSizes: ["square"], Component: CollectionValueWidget },
  { id: "hobby-win-rate", title: "Percentuale vittorie", category: "Hobby", href: "/hobby", defaultSize: "square", allowedSizes: ["square"], Component: WinRateWidget },
  { id: "hobby-last-library", title: "Ultimo libro/film aggiunto", category: "Hobby", href: "/hobby", defaultSize: "square", allowedSizes: ["square"], Component: LastLibraryItemWidget },
  { id: "hobby-most-active", title: "Hobby più attivo del mese", category: "Hobby", href: "/hobby", defaultSize: "square", allowedSizes: ["square"], Component: MostActiveHobbyWidget },
  { id: "hobby-last-inventory-item", title: "Ultimo pezzo aggiunto", category: "Hobby", href: "/hobby", defaultSize: "square", allowedSizes: ["square"], Component: LastInventoryItemWidget },
  { id: "hobby-metric-streak", title: "Streak di costanza (metrica)", category: "Hobby", href: "/hobby", defaultSize: "square", allowedSizes: ["square"], Component: MetricStreakWidget },
  { id: "hobby-longest-streak-ever", title: "Record striscia di sempre", category: "Hobby", href: "/hobby", defaultSize: "square", allowedSizes: ["square"], Component: LongestStreakEverWidget },

  // --- Wishlist ---
  { id: "wishlist-last-item", title: "Ultimo articolo aggiunto", category: "Wishlist", href: "/wishlist", defaultSize: "square", allowedSizes: ["square", "half"], Component: LastWishlistItemWidget },
  { id: "wishlist-saved-total", title: "Totale risparmiato", category: "Wishlist", href: "/wishlist", defaultSize: "square", allowedSizes: ["square"], Component: WishlistSavedTotalWidget },
  { id: "wishlist-closest-goal", title: "Più vicino al completamento", category: "Wishlist", href: "/wishlist", defaultSize: "half", allowedSizes: ["half", "square"], Component: ClosestToGoalWidget },
  { id: "wishlist-cheapest", title: "Più economico rimasto", category: "Wishlist", href: "/wishlist", defaultSize: "square", allowedSizes: ["square"], Component: CheapestRemainingWidget },

  // --- Animali ---
  { id: "animali-next-meal", title: "Prossima pappa", category: "Animali", href: "/animali", defaultSize: "square", allowedSizes: ["square"], Component: NextMealWidget },
  { id: "animali-next-vaccination", title: "Prossimo vaccino", category: "Animali", href: "/animali", defaultSize: "square", allowedSizes: ["square", "half"], Component: NextVaccinationWidget },
  { id: "animali-weight-trend", title: "Peso animale — trend", category: "Animali", href: "/animali", defaultSize: "square", allowedSizes: ["square"], Component: AnimalWeightTrendWidget },
  { id: "animali-days-since-adoption", title: "Giorni dall'adozione", category: "Animali", href: "/animali", defaultSize: "square", allowedSizes: ["square"], Component: DaysSinceAdoptionWidget },
  { id: "animali-medications", title: "Farmaci in corso", category: "Animali", href: "/animali", defaultSize: "half", allowedSizes: ["half", "full"], Component: AnimalMedicationsWidget },

  // --- Mappa / Luoghi ---
  { id: "map-most-visited", title: "Luogo più visitato del mese", category: "Mappa", href: "/map", defaultSize: "square", allowedSizes: ["square"], Component: MostVisitedPlaceWidget },
  { id: "map-last-visit", title: "Ultima visita registrata", category: "Mappa", href: "/map", defaultSize: "half", allowedSizes: ["half", "square"], Component: LastVisitWidget },
  { id: "map-favorite-spending", title: "Spesa nel luogo preferito", category: "Mappa", href: "/map", defaultSize: "square", allowedSizes: ["square"], Component: FavoritePlaceSpendingWidget },

  // --- Vitaecom ---
  { id: "vitaecom-unseen-stories", title: "Storie non viste", category: "Vitaecom", href: "/vitaecom", defaultSize: "square", allowedSizes: ["square"], Component: UnseenStoriesWidget },
  { id: "vitaecom-last-post", title: "Ultimo post pubblicato", category: "Vitaecom", href: "/vitaecom", defaultSize: "square", allowedSizes: ["square", "half"], Component: LastPostWidget },
  { id: "vitaecom-new-reactions", title: "Reazioni e commenti nuovi", category: "Vitaecom", href: "/vitaecom", defaultSize: "square", allowedSizes: ["square"], Component: NewReactionsWidget },
  { id: "vitaecom-last-message", title: "Ultimo messaggio ricevuto", category: "Vitaecom", href: "/vitaecom", defaultSize: "half", allowedSizes: ["half", "square"], Component: LastReceivedMessageWidget },
  { id: "vitaecom-quick-mood", title: "Selettore rapido stato d'animo", category: "Azioni rapide", defaultSize: "square", allowedSizes: ["square", "half"], Component: QuickMoodPickerWidget },

  // --- Rapporti ---
  { id: "rapporti-birthdays", title: "Compleanni in arrivo", category: "Rapporti", href: "/rapporti", defaultSize: "half", allowedSizes: ["half", "full"], Component: UpcomingBirthdaysWidget },
  { id: "rapporti-today-birthday", title: "Compleanno di oggi", category: "Rapporti", href: "/rapporti", defaultSize: "square", allowedSizes: ["square"], Component: TodayBirthdayWidget },
  { id: "rapporti-strongest-bond", title: "Rapporto più forte", category: "Rapporti", href: "/rapporti", defaultSize: "square", allowedSizes: ["square"], Component: StrongestBondWidget },
  { id: "rapporti-in-world", title: "Persone nel mondo ora", category: "Rapporti", href: "/rapporti", defaultSize: "square", allowedSizes: ["square"], Component: PeopleInWorldNowWidget },
  { id: "rapporti-not-contacted", title: "Non senti da un po'", category: "Rapporti", href: "/rapporti", defaultSize: "square", allowedSizes: ["square", "half"], Component: NotContactedWidget },
  { id: "rapporti-next-birthday-countdown", title: "Countdown prossimo compleanno", category: "Rapporti", href: "/rapporti", defaultSize: "square", allowedSizes: ["square"], Component: NextBirthdayCountdownWidget },
  // Niente `href`: il widget è interattivo al proprio interno (ricerca, richiamo, le
  // interazioni stesse), non un riepilogo che rimanda altrove — un tocco sulla card non deve
  // portare via dalla Home mentre si sta usando. Solo taglia intera e niente ridimensionamento:
  // deve restare spazioso con più persone dentro, non schiacciato come un widget qualunque
  // (vedi il commento in cima a quick-interaction-widget.tsx).
  { id: "rapporti-quick-interaction", title: "Interazione rapida", category: "Rapporti", defaultSize: "full", allowedSizes: ["full"], Component: QuickInteractionWidget },

  // --- News ---
  { id: "news-latest", title: "Ultime notizie", category: "News", href: "/news", defaultSize: "half", allowedSizes: ["half", "full"], Component: LatestNewsWidget },
  { id: "news-today-digest", title: "Solo di oggi", category: "News", href: "/news", defaultSize: "full", allowedSizes: ["half", "full"], Component: TodayDigestWidget },

  // --- Trasversali ---
  { id: "cross-general-streak", title: "Streak generale", category: "Trasversali", href: "/task", defaultSize: "square", allowedSizes: ["square"], Component: GeneralStreakWidget },
  { id: "cross-profile-completion", title: "Percentuale profilo completato", category: "Trasversali", href: "/profilo", defaultSize: "square", allowedSizes: ["square"], Component: ProfileCompletionWidget },
  { id: "cross-active-goals", title: "Obiettivi attivi", category: "Trasversali", href: "/finanze", defaultSize: "square", allowedSizes: ["square", "half"], Component: ActiveGoalsWidget },
  { id: "cross-next-appointment", title: "Prossimo appuntamento (qualsiasi)", category: "Trasversali", href: "/salute", defaultSize: "half", allowedSizes: ["half", "square"], Component: NextAnyAppointmentWidget },
  { id: "cross-next-recurring", title: "Prossima scadenza ricorrente", category: "Trasversali", href: "/animali", defaultSize: "square", allowedSizes: ["square"], Component: NextRecurringDueWidget },
  { id: "cross-household-presence", title: "Stato della casa", category: "Trasversali", defaultSize: "square", allowedSizes: ["square"], Component: HouseholdPresenceWidget },
  { id: "cross-today-glance", title: "Cosa ti aspetta oggi", category: "Trasversali", href: "/task", defaultSize: "full", allowedSizes: ["half", "full"], Component: TodayAtGlanceWidget },
  { id: "cross-recent-photo", title: "Ultima foto aggiunta", category: "Trasversali", href: "/diario", defaultSize: "square", allowedSizes: ["square", "half"], Component: RecentPhotoWidget },
  { id: "cross-budget-3-cycles", title: "Spesa — ultimi 3 cicli", category: "Trasversali", href: "/finanze", defaultSize: "half", allowedSizes: ["half", "square"], Component: BudgetLast3CyclesWidget },
  { id: "cross-weekly-timeline", title: "Timeline della settimana", category: "Trasversali", href: "/task", defaultSize: "full", allowedSizes: ["half", "full"], Component: WeeklyTimelineWidget },

  // --- Azioni rapide ---
  { id: "action-household-message", title: "Messaggio rapido alla casa", category: "Azioni rapide", defaultSize: "half", allowedSizes: ["half", "full"], Component: QuickHouseholdMessageWidget },

  // --- Scorciatoie ---
  // Niente `href` qui, apposta: contiene più link diversi al proprio interno (vedi il
  // commento sopra ShortcutsWidget) invece di uno solo verso cui portare l'intera card.
  { id: "cross-shortcuts", title: "Scorciatoie", category: "Trasversali", defaultSize: "full", allowedSizes: ["half", "full"], Component: ShortcutsWidget },
];

export const WIDGET_MAP: Record<string, WidgetCatalogEntry> = Object.fromEntries(WIDGET_REGISTRY.map((w) => [w.id, w]));
