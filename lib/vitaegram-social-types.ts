/**
 * Vitaegram, terza stesura: non più un diario privato, un vero social — pensato apposta
 * perché la stessa forma funzioni sia ora (dati locali, un solo utente vero) sia il giorno
 * in cui l'app avrà un database reale: un VitaegramPost è già "un post di un account",
 * mai legato a come sono salvati i dati oggi. Fino a quel giorno, gli unici "altri utenti"
 * che vedi sono account dimostrativi, sempre segnati `isDemo`.
 */
export interface VitaegramAccount {
  id: string;
  nickname: string;
  avatarUrl?: string;
  isDemo?: boolean;
}

export type VitaegramMentionType = "person" | "place" | "task";

/**
 * Un tag su un post è sempre verso un ACCOUNT — "gli avatar taggati per nickname", non le
 * tue Persone/Luoghi/Task private (quelle restano solo materiale per la didascalia in
 * "Imprimi Momento", non hanno un proprio commento da poter fissare in alto). Per ora gli
 * unici account taggabili sono quelli dimostrativi (vedi vitaegram-demo-data.ts) — il
 * giorno di un vero backend, la stessa forma varrà per account reali.
 */
export interface VitaegramTag {
  accountId: string;
}

export interface VitaegramComment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
  likedByUser: boolean;
  likeCount: number;
  /** Un solo livello di rientranza, sempre — mai sub-commenti dentro sub-commenti, per
   * poter reggere centinaia di risposte senza che lo schermo si restringa all'infinito. */
  replies: VitaegramComment[];
}

export interface VitaegramPost {
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
  tags: VitaegramTag[];
  likedByUser: boolean;
  likeCount: number;
  comments: VitaegramComment[];
  isDemo?: boolean;
}

/** Cosa "Imprimi Momento" raccoglie prima di chiedere all'utente cosa pubblicare davvero —
 * mai pubblicato da solo, solo materiale tra cui scegliere. */
export interface VitaegramMomentSnapshot {
  moodId?: string;
  recentTaskIds: string[];
  recentPlaceIds: string[];
}
