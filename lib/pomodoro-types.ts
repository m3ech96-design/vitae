/**
 * Tipi del modulo Focus (Pomodoro) — cicli di lavoro/pausa cronometrati, agganciabili a una
 * Task o a un blocco Metrica di un Hobby, oppure lasciati "liberi" senza alcun collegamento.
 * Una sessione libera non è un ripiego: studio generico, lettura, qualunque concentrazione
 * che non ha ancora (o non avrà mai) una Task o un Hobby dedicato resta comunque registrabile.
 */
export type FocusLinkKind = "task" | "metrica" | "libera";

export interface FocusLink {
  kind: FocusLinkKind;
  /** Presente solo per kind "task": l'id della Task collegata. */
  taskId?: string;
  /** Presenti solo per kind "metrica": hobby e blocco a cui si aggancia — i minuti di ogni
   * ciclo di lavoro completato diventano una MetricEntry in quel blocco (vedi
   * pomodoro-context.tsx), stesso principio del timer dentro il blocco Metrica stesso (vedi
   * MetricTimer.tsx) ma innescato da qui invece che da lì. */
  hobbyId?: string;
  blockId?: string;
}

/** Una sessione completata (o interrotta) — un solo record per intero ciclo di lavoro, non
 * per singolo minuto: la pausa che segue non è una sessione a parte, è solo il tempo di
 * recupero prima della prossima. */
export interface FocusSession {
  id: string;
  startedAt: string;
  endedAt: string;
  /** Minuti effettivi di lavoro concentrato (non conta il tempo di pausa). */
  workMinutes: number;
  link: FocusLink;
  /** Etichetta libera facoltativa — utile per una sessione "libera" senza altro collegamento
   * ("Lettura", "Studio inglese"...) o per annotare a parole cosa si è fatto anche quando
   * c'è già un collegamento a Task/Metrica. */
  label?: string;
  /** false se la sessione è stata interrotta prima di completare il ciclo di lavoro previsto
   * — registrata comunque (il tempo impiegato non va perso), ma distinta nello storico. */
  completed: boolean;
}

/** Le durate di un ciclo, in minuti — personalizzabili, non fissate ai classici 25/5:
 * `longBreakEvery` cicli di lavoro completati, la pausa successiva usa `longBreakMinutes`
 * invece di `breakMinutes`. */
export interface FocusSettings {
  workMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  longBreakEvery: number;
  /** Se true, al termine di una fase parte da sola la successiva (lavoro → pausa → lavoro...)
   * senza dover premere "Avvia" ogni volta — se false, si ferma e aspetta conferma. */
  autoStartNext: boolean;
  /** Se true, un suono/vibrazione segnala la fine di ogni fase. */
  soundEnabled: boolean;
}

export const DEFAULT_FOCUS_SETTINGS: FocusSettings = {
  workMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
  autoStartNext: false,
  soundEnabled: true,
};

export type FocusPhase = "lavoro" | "pausa" | "pausa-lunga";

/** Lo stato "vivo" di una sessione in corso — persistito (non solo in memoria) così il
 * timer flottante sopravvive al cambio di scheda e, con `startedAt` come vera fonte del
 * tempo trascorso (mai un contatore incrementale che si ferma se il tab perde il focus),
 * anche a una chiusura e riapertura dell'app nel mezzo di un ciclo. */
export interface ActiveFocusRun {
  phase: FocusPhase;
  /** Istante di inizio della fase corrente — il tempo restante si calcola sempre da qui, mai
   * da un contatore a scalare: un contatore si ferma se il tab va in background, questo no. */
  phaseStartedAt: string;
  phaseDurationMinutes: number;
  /** true mentre la fase è "in pausa manuale" (non la fase Pausa del ciclo — l'utente ha
   * premuto Pausa sul cronometro stesso, a metà di una fase di lavoro o di riposo). */
  paused: boolean;
  /** Tempo già trascorso nella fase corrente prima dell'ultima pausa manuale — si somma al
   * tempo trascorso da `phaseStartedAt` solo quando `paused` è true, per calcolare quanto
   * resta senza perdere il conto della pausa manuale stessa. */
  pausedElapsedMs: number;
  completedWorkCycles: number;
  link: FocusLink;
  label?: string;
}
