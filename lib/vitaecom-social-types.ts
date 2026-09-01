/**
 * Vitaecom, terza stesura: non più un diario privato, un vero social — pensato apposta
 * perché la stessa forma funzioni sia ora (dati locali, un solo utente vero) sia il giorno
 * in cui l'app avrà un database reale: un VitaecomPost è già "un post di un account",
 * mai legato a come sono salvati i dati oggi. Fino a quel giorno, gli unici "altri utenti"
 * che vedi sono account dimostrativi, sempre segnati `isDemo`.
 */
export interface VitaecomAccount {
  id: string;
  nickname: string;
  avatarUrl?: string;
  isDemo?: boolean;
  /** Vetrina statica dell'account (solo per gli account dimostrativi, scritta a mano — vedi
   * vitaecom-demo-data.ts): l'app non ha un vero profilo `PersonalDetails` dietro un
   * account altrui da cui pescare come fa `lib/vitaecom-showcase.ts` per il proprietario,
   * quindi qui i testi sono già pronti, non generati da campi vivi. Ogni riga è già nel
   * formato "Etichetta: valore" pronto per un chip — vedi ShowcaseDrawer. */
  showcaseItems?: string[];
}

export type VitaecomMentionType = "person" | "place" | "task";

/**
 * Un tag su un post è sempre verso un ACCOUNT — "gli avatar taggati per nickname", non le
 * tue Persone/Luoghi/Task private (quelle restano solo materiale per la didascalia in
 * "Imprimi Momento", non hanno un proprio commento da poter fissare in alto). Per ora gli
 * unici account taggabili sono quelli dimostrativi (vedi vitaecom-demo-data.ts) — il
 * giorno di un vero backend, la stessa forma varrà per account reali.
 */
export interface VitaecomTag {
  accountId: string;
}

export interface VitaecomComment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
  likedByUser: boolean;
  likeCount: number;
  /** Un solo livello di rientranza, sempre — mai sub-commenti dentro sub-commenti, per
   * poter reggere centinaia di risposte senza che lo schermo si restringa all'infinito. */
  replies: VitaecomComment[];
}

export interface VitaecomPost {
  id: string;
  authorId: string;
  createdAt: string;
  /** Una storia — stessa forma di un post normale, stesse interazioni (Mi Piace, commenti,
   * condivisione, reazione con Lato Stato, il menu a tre puntini), solo mostrata nel
   * visualizzatore a schermo intero invece che nel feed, e per sole 24 ore (vedi
   * `expiresAt`). Mai nel feed di Vitaeworld/Bacheca/profilo — quelli restano solo post
   * "normali", filtrati esplicitamente. */
  isStory?: boolean;
  /** Solo per una storia — il momento in cui smette di essere mostrata. */
  expiresAt?: string;
  /** Determina il colore del bordo e il tono della riga sotto il nickname — solo per un
   * post che NON è una condivisione. Una condivisione mostra "si è sentito/a" con
   * `sharedMoodId`, vedi sotto. */
  moodId?: string;
  caption: string;
  captionByAI?: boolean;
  /** Solo una TUA foto vera (chiave verso lib/image-store.ts) — per i post dimostrativi,
   * un url esterno in `demoPhotoUrl`. Mai generata. */
  photoKey?: string;
  demoPhotoUrl?: string;
  /** Un solo video per post, alternativo alla foto (chiave verso lib/video-store.ts) —
   * mai generato, mai nei post dimostrativi. */
  videoKey?: string;
  tags: VitaecomTag[];
  likedByUser: boolean;
  likeCount: number;
  comments: VitaecomComment[];
  isDemo?: boolean;

  /**
   * Condivisione — "Lato Stato". La radice della catena (l'id del post originale): assente
   * per un post che è esso stesso l'originale. `moodTallies` in vitaecom-social-context.tsx
   * è indicizzato per questa chiave, non per il singolo post: tutti i post di una stessa
   * catena condividono lo stesso Lato Stato, dall'originale fino all'ultima condivisione.
   */
  chainRootId?: string;
  /** L'id del post condiviso direttamente (il tuo "di provenienza") — assente per l'originale. */
  sharedFromPostId?: string;
  /** Lo stato d'animo scelto in "Cosa provi?" durante QUESTA condivisione — va sotto il
   * nickname al posto del nome dello stato d'animo normale, e alimenta il Lato Stato. */
  sharedMoodId?: string;
  /** Il contenuto del post ORIGINALE, incorporato sempre in ogni condivisione (mai solo
   * quello immediatamente a monte, che vive invece nei campi embedSource* qui sotto). */
  embedOriginAuthorId?: string;
  embedOriginCaption?: string;
  embedOriginPhotoKey?: string;
  embedOriginDemoPhotoUrl?: string;
  embedOriginVideoKey?: string;
  /** Il contenuto AGGIUNTO dal post di provenienza diretto (non l'originale) — incorporato
   * solo se, condividendo, hai lasciato acceso "Incorpora anche il contenuto aggiunto da
   * [nickname]" (mostrato solo quando quel post aveva davvero qualcosa di suo da
   * aggiungere, cioè era a sua volta una condivisione con un proprio testo). */
  embedSourceAuthorId?: string;
  embedSourceCaption?: string;
  /** Il tuo stato d'animo di reazione su QUESTO post — solo il tuo: gli account demo non
   * hanno un dispositivo che reagisca sul serio (vedi simulateDemoEngagement per l'unica
   * simulazione onesta possibile, dal loro lato verso un tuo post). */
  userReactionMoodId?: string;
}

/** Cosa "Imprimi Momento" raccoglie prima di chiedere all'utente cosa pubblicare davvero —
 * mai pubblicato da solo, solo materiale tra cui scegliere. */
export interface VitaecomMomentSnapshot {
  moodId?: string;
  recentTaskIds: string[];
  recentPlaceIds: string[];
}

export const REPORT_REASONS = [
  "Contenuto inappropriato",
  "Molestie o bullismo",
  "Spam o inganno",
  "Nudo o contenuto sessuale",
  "Violenza",
  "Altro",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/**
 * Una segnalazione — oggi resta solo sul tuo dispositivo (non esiste ancora un server dove
 * mandarla davvero, né qualcuno dall'altra parte che la legga), ma la forma dei dati è già
 * quella che un giorno viaggerà verso una vera coda di moderazione, quando l'app smetterà di
 * essere solo-locale: non andrà ripensata da capo, solo spedita altrove.
 */
export interface PostReport {
  id: string;
  postId: string;
  authorId: string;
  reason: ReportReason;
  note?: string;
  createdAt: string;
}
