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
  /** Determina il colore del bordo e il tono della riga sotto il nickname. */
  moodId?: string;
  caption: string;
  captionByAI?: boolean;
  /** Solo una TUA foto vera (chiave verso lib/image-store.ts) — per i post dimostrativi,
   * un url esterno in `demoPhotoUrl`. Mai generata. */
  photoKey?: string;
  demoPhotoUrl?: string;
  tags: VitaecomTag[];
  likedByUser: boolean;
  likeCount: number;
  comments: VitaecomComment[];
  isDemo?: boolean;
}

/** Cosa "Imprimi Momento" raccoglie prima di chiedere all'utente cosa pubblicare davvero —
 * mai pubblicato da solo, solo materiale tra cui scegliere. */
export interface VitaecomMomentSnapshot {
  moodId?: string;
  recentTaskIds: string[];
  recentPlaceIds: string[];
}
