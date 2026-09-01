"use client";
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { VitaecomPost, VitaecomComment, VitaecomTag, PostReport, ReportReason } from "./vitaecom-social-types";
import { buildDemoPosts, DEMO_ACCOUNTS } from "./vitaecom-demo-data";
import { chainRootOf } from "./vitaecom-lato-stato";
import { STORY_DURATION_MS } from "./vitaecom-stories";
import { DEFAULT_MOODS } from "./mood-catalog";
import { newId } from "./id";

const POSTS_KEY = "vitae:vitaecom-posts";
const NOTIF_KEY = "vitae:vitaecom-notifications";
const KNOWN_KEY = "vitae:vitaecom-known";
const SENT_KEY = "vitae:vitaecom-sent-requests";
const RECEIVED_KEY = "vitae:vitaecom-received-requests";
const KNOW_SEEDED_KEY = "vitae:vitaecom-know-seeded";
const KNOWN_NAMES_KEY = "vitae:vitaecom-known-names";
const HOUSEHOLD_MEMBERS_KEY = "vitae:vitaecom-household-members";
const HOUSEHOLD_SENT_KEY = "vitae:vitaecom-household-sent";
const HOUSEHOLD_RECEIVED_KEY = "vitae:vitaecom-household-received";
const HOUSEHOLD_SEEDED_KEY = "vitae:vitaecom-household-seeded";
const MOOD_TALLIES_KEY = "vitae:vitaecom-mood-tallies";
const HIDDEN_POSTS_KEY = "vitae:vitaecom-hidden-posts";
const MUTED_ACCOUNTS_KEY = "vitae:vitaecom-muted-accounts";
const REPORTS_KEY = "vitae:vitaecom-reports";
const SEEN_STORIES_KEY = "vitae:vitaecom-seen-stories";

interface NewPostInput {
  caption: string;
  captionByAI?: boolean;
  moodId?: string;
  photoKey?: string;
  videoKey?: string;
  tags: VitaecomTag[];
}

export interface VitaecomNotification {
  id: string;
  /** Assente per le notifiche non legate a un post (richieste di conoscenza/Casa). */
  postId?: string;
  fromAccountId: string;
  kind: "like" | "comment" | "know_request" | "know_accepted" | "tag" | "household_request" | "household_accepted" | "reaction";
  /** Solo per kind "reaction": quale stato d'animo ha reso chi ha reagito — "Il tuo post ha
   * reso [nickname] [stato d'animo]". */
  moodId?: string;
  createdAt: string;
  read: boolean;
}

interface VitaecomSocialContextValue {
  hydrated: boolean;
  posts: VitaecomPost[];
  notifications: VitaecomNotification[];
  hasUnreadNotification: boolean;
  markNotificationsRead: () => void;
  publish: (input: NewPostInput) => void;
  /** Una storia — vedi il commento sopra l'implementazione. */
  publishStory: (input: NewPostInput) => void;
  seenStoryIds: string[];
  markStorySeen: (postId: string) => void;
  /** Condividi un post — vedi il commento sopra l'implementazione per come si scelgono i
   * contenuti da incorporare. */
  sharePost: (input: { sourcePostId: string; caption: string; sharedMoodId: string; includeSourceAddition: boolean }) => void;
  /** Il "Lato Stato" di ogni catena di condivisione (chiave: chainRootId — vedi
   * lib/vitaecom-lato-stato.ts) — quante persone si sono sentite con ciascuno stato
   * d'animo, condiviso da tutti i post della stessa catena. */
  moodTallies: Record<string, Record<string, number>>;
  setPostReaction: (postId: string, moodId: string) => void;
  toggleLike: (postId: string) => void;
  toggleCommentLike: (postId: string, commentId: string, replyId?: string) => void;
  addComment: (postId: string, text: string, replyToCommentId?: string) => void;
  removePost: (postId: string) => void;
  /** "Non mi interessa questo post" / "Nascondi tutti i post di questo utente" — due filtri
   * personali distinti, mai una segnalazione (quella resta da decidere insieme). */
  hiddenPostIds: string[];
  mutedAccountIds: string[];
  hidePost: (postId: string) => void;
  muteAccount: (accountId: string) => void;
  reports: PostReport[];
  reportPost: (postId: string, authorId: string, reason: ReportReason, note?: string) => void;
  dismissReport: (reportId: string) => void;
  /**
   * "Persona Conosciuta" o "Sconosciuto" (vedi ProfileHeader) — conoscersi è sempre
   * reciproco una volta accettato, non due stati separati da tenere in sincrono a mano.
   * Senza un vero backend, l'unico modo di provare ENTRAMBI i sensi del flusso (mandare una
   * richiesta E riceverne una) è simularli: mandarne una a un account demo la fa accettare
   * da sola dopo una manciata di secondi (come già succede per Mi Piace/commenti sui tuoi
   * post); una richiesta in arrivo da un account demo esiste già seminata, così puoi provare
   * subito anche "Accetta"/"Accetta E Conosci Anche Tu" senza aspettare nulla.
   */
  knownAccountIds: string[];
  sentRequests: string[];
  receivedRequests: string[];
  sendKnowRequest: (accountId: string) => void;
  acceptKnowRequest: (accountId: string) => void;
  /**
   * Il nome vero (Nome, Cognome) che hai scoperto per un account Vitaecom — il minimo
   * indispensabile di "wizard delle scoperte" applicato direttamente all'account, non più
   * pescato da una Persona di Mondo collegata (quel ponte è stato tolto, vedi
   * ExploreProfileSheet). Serve a una sola cosa per ora: "Devi almeno conoscere il suo
   * nome!" prima di poterlo aggiungere alla tua Casa — il seme di quello che sarà, quando
   * Mondo e Persone si uniranno, la scheda Scoperte vera di ogni account.
   */
  knownNames: Record<string, { firstName: string; lastName: string }>;
  setKnownName: (accountId: string, firstName: string, lastName: string) => void;
  /**
   * L'appartenenza alla Casa è reciproca come "conoscersi": una richiesta, un'accettazione,
   * poi entrambi gli avatar compaiono nel riquadro Casa dell'altro. Stessa idea già usata
   * per "Inizia A Conoscere" — un account demo che accetta da solo dopo una manciata di
   * secondi, l'unico modo di provare il flusso fino in fondo senza un vero account dall'altra
   * parte; una richiesta in arrivo esiste già seminata per provare subito anche
   * "Accetta"/"Rifiuta" come destinatario.
   */
  householdMembers: string[];
  householdSentRequests: string[];
  householdReceivedRequests: string[];
  sendHouseholdRequest: (accountId: string) => void;
  respondHouseholdRequest: (accountId: string, accept: boolean) => void;
  dissociateFromHousehold: (accountId: string) => void;
}

const VitaecomSocialContext = createContext<VitaecomSocialContextValue | null>(null);

function mapComment(c: VitaecomComment, fn: (c: VitaecomComment) => VitaecomComment): VitaecomComment {
  const next = fn(c);
  return { ...next, replies: next.replies.map((r) => fn(r)) };
}

const DEMO_REPLY_TEXTS = ["Bellissimo 🙂", "Mi piace tantissimo questa cosa.", "Vero, capisco perfettamente.", "Che bello leggerlo."];

export function VitaecomSocialProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [posts, setPosts] = useState<VitaecomPost[]>([]);
  const [notifications, setNotifications] = useState<VitaecomNotification[]>([]);
  const [knownAccountIds, setKnownAccountIds] = useState<string[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<string[]>([]);
  const [knownNames, setKnownNamesState] = useState<Record<string, { firstName: string; lastName: string }>>({});
  const [householdMembers, setHouseholdMembers] = useState<string[]>([]);
  const [householdSentRequests, setHouseholdSentRequests] = useState<string[]>([]);
  const [householdReceivedRequests, setHouseholdReceivedRequests] = useState<string[]>([]);
  const [moodTallies, setMoodTalliesState] = useState<Record<string, Record<string, number>>>({});
  const moodTalliesRef = useRef<Record<string, Record<string, number>>>({});
  const [hiddenPostIds, setHiddenPostIds] = useState<string[]>([]);
  const [mutedAccountIds, setMutedAccountIds] = useState<string[]>([]);
  const [reports, setReports] = useState<PostReport[]>([]);
  const [seenStoryIds, setSeenStoryIds] = useState<string[]>([]);
  const mutedAccountIdsRef = useRef<string[]>([]);
  const postsRef = useRef<VitaecomPost[]>([]);
  const notifRef = useRef<VitaecomNotification[]>([]);
  const knownRef = useRef<string[]>([]);
  const sentRef = useRef<string[]>([]);
  const receivedRef = useRef<string[]>([]);
  const householdMembersRef = useRef<string[]>([]);
  const householdSentRef = useRef<string[]>([]);
  const householdReceivedRef = useRef<string[]>([]);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);
  useEffect(() => {
    notifRef.current = notifications;
  }, [notifications]);
  useEffect(() => {
    knownRef.current = knownAccountIds;
  }, [knownAccountIds]);
  useEffect(() => {
    householdMembersRef.current = householdMembers;
  }, [householdMembers]);
  useEffect(() => {
    householdSentRef.current = householdSentRequests;
  }, [householdSentRequests]);
  useEffect(() => {
    householdReceivedRef.current = householdReceivedRequests;
  }, [householdReceivedRequests]);
  useEffect(() => {
    moodTalliesRef.current = moodTallies;
  }, [moodTallies]);
  useEffect(() => {
    mutedAccountIdsRef.current = mutedAccountIds;
  }, [mutedAccountIds]);
  useEffect(() => {
    sentRef.current = sentRequests;
  }, [sentRequests]);
  useEffect(() => {
    receivedRef.current = receivedRequests;
  }, [receivedRequests]);

  const persistPosts = useCallback((next: VitaecomPost[]) => {
    setPosts(next);
    try {
      window.localStorage.setItem(POSTS_KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  const persistNotifications = useCallback((next: VitaecomNotification[]) => {
    setNotifications(next);
    try {
      window.localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  const persistKnown = useCallback((next: string[]) => {
    setKnownAccountIds(next);
    try {
      window.localStorage.setItem(KNOWN_KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  const persistSent = useCallback((next: string[]) => {
    setSentRequests(next);
    try {
      window.localStorage.setItem(SENT_KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  const persistReceived = useCallback((next: string[]) => {
    setReceivedRequests(next);
    try {
      window.localStorage.setItem(RECEIVED_KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  const persistKnownNames = useCallback((next: Record<string, { firstName: string; lastName: string }>) => {
    setKnownNamesState(next);
    try {
      window.localStorage.setItem(KNOWN_NAMES_KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  const persistHouseholdMembers = useCallback((next: string[]) => {
    setHouseholdMembers(next);
    try {
      window.localStorage.setItem(HOUSEHOLD_MEMBERS_KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  const persistHouseholdSent = useCallback((next: string[]) => {
    setHouseholdSentRequests(next);
    try {
      window.localStorage.setItem(HOUSEHOLD_SENT_KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  const persistHouseholdReceived = useCallback((next: string[]) => {
    setHouseholdReceivedRequests(next);
    try {
      window.localStorage.setItem(HOUSEHOLD_RECEIVED_KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  const persistMoodTallies = useCallback((next: Record<string, Record<string, number>>) => {
    setMoodTalliesState(next);
    try {
      window.localStorage.setItem(MOOD_TALLIES_KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  /** Una sola porta per ogni cambio di quota — sia una condivisione (+1 sullo stato scelto
   * in "Cosa Provi?") sia una reazione (+1, e se stavi cambiando reazione su un post -1 su
   * quella precedente) passano da qui, così il Lato Stato si aggiorna sempre allo stesso
   * modo qualunque sia la fonte. */
  const bumpMoodTally = useCallback(
    (chainRootId: string, moodId: string, delta: number) => {
      const chain = { ...(moodTalliesRef.current[chainRootId] ?? {}) };
      chain[moodId] = Math.max(0, (chain[moodId] ?? 0) + delta);
      if (chain[moodId] === 0) delete chain[moodId];
      persistMoodTallies({ ...moodTalliesRef.current, [chainRootId]: chain });
    },
    [persistMoodTallies]
  );

  useEffect(() => {
    try {
      const rawPosts = window.localStorage.getItem(POSTS_KEY);
      let seededTagNotifs: VitaecomNotification[] = [];
      if (rawPosts) {
        setPosts(JSON.parse(rawPosts) as VitaecomPost[]);
      } else {
        // Prima apertura di Vitaecom: semina i post dimostrativi una volta sola, poi
        // diventano dati locali come tutto il resto (i tuoi like/commenti sopra restano).
        const seeded = buildDemoPosts();
        setPosts(seeded);
        window.localStorage.setItem(POSTS_KEY, JSON.stringify(seeded));
        // Anche i tag notificano l'utente taggato — qui l'unico "utente taggato" che può
        // davvero ricevere una notifica sei tu (gli account demo non hanno un dispositivo
        // proprio): un post dimostrativo che ti tagga genera la notifica alla primissima
        // apertura, come già succede per la richiesta "Inizia A Conoscere" seminata sotto.
        seededTagNotifs = seeded
          .filter((p) => p.tags.some((t) => t.accountId === "user"))
          .map((p) => ({
            id: newId(),
            postId: p.id,
            fromAccountId: p.authorId,
            kind: "tag" as const,
            createdAt: p.createdAt,
            read: false,
          }));
      }
      const rawNotif = window.localStorage.getItem(NOTIF_KEY);
      if (rawNotif) setNotifications(JSON.parse(rawNotif) as VitaecomNotification[]);
      else if (seededTagNotifs.length > 0) {
        setNotifications(seededTagNotifs);
        window.localStorage.setItem(NOTIF_KEY, JSON.stringify(seededTagNotifs));
      }

      const rawKnown = window.localStorage.getItem(KNOWN_KEY);
      if (rawKnown) setKnownAccountIds(JSON.parse(rawKnown) as string[]);
      const rawSent = window.localStorage.getItem(SENT_KEY);
      if (rawSent) setSentRequests(JSON.parse(rawSent) as string[]);

      // Una richiesta in arrivo già seminata, una volta sola alla primissima apertura — per
      // poter provare subito "Accetta"/"Accetta E Conosci Anche Tu" senza dover prima capire
      // come farsene mandare una vera (impossibile, senza un secondo account reale).
      if (!window.localStorage.getItem(KNOW_SEEDED_KEY)) {
        const seededAccount = DEMO_ACCOUNTS[DEMO_ACCOUNTS.length - 1];
        const seededReceived = [seededAccount.id];
        setReceivedRequests(seededReceived);
        window.localStorage.setItem(RECEIVED_KEY, JSON.stringify(seededReceived));
        const seededNotif: VitaecomNotification = {
          id: newId(),
          fromAccountId: seededAccount.id,
          kind: "know_request",
          createdAt: new Date().toISOString(),
          read: false,
        };
        setNotifications((prev) => {
          const merged = [seededNotif, ...prev];
          try {
            window.localStorage.setItem(NOTIF_KEY, JSON.stringify(merged));
          } catch {
            // storage non disponibile: continua solo in memoria
          }
          return merged;
        });
        window.localStorage.setItem(KNOW_SEEDED_KEY, "1");
      } else {
        const rawReceived = window.localStorage.getItem(RECEIVED_KEY);
        if (rawReceived) setReceivedRequests(JSON.parse(rawReceived) as string[]);
      }

      const rawKnownNames = window.localStorage.getItem(KNOWN_NAMES_KEY);
      if (rawKnownNames) setKnownNamesState(JSON.parse(rawKnownNames) as Record<string, { firstName: string; lastName: string }>);
      const rawMoodTallies = window.localStorage.getItem(MOOD_TALLIES_KEY);
      if (rawMoodTallies) setMoodTalliesState(JSON.parse(rawMoodTallies) as Record<string, Record<string, number>>);
      const rawHidden = window.localStorage.getItem(HIDDEN_POSTS_KEY);
      if (rawHidden) setHiddenPostIds(JSON.parse(rawHidden) as string[]);
      const rawMuted = window.localStorage.getItem(MUTED_ACCOUNTS_KEY);
      if (rawMuted) setMutedAccountIds(JSON.parse(rawMuted) as string[]);
      const rawReports = window.localStorage.getItem(REPORTS_KEY);
      if (rawReports) setReports(JSON.parse(rawReports) as PostReport[]);
      const rawSeenStories = window.localStorage.getItem(SEEN_STORIES_KEY);
      if (rawSeenStories) setSeenStoryIds(JSON.parse(rawSeenStories) as string[]);
      const rawHouseholdMembers = window.localStorage.getItem(HOUSEHOLD_MEMBERS_KEY);
      if (rawHouseholdMembers) setHouseholdMembers(JSON.parse(rawHouseholdMembers) as string[]);
      const rawHouseholdSent = window.localStorage.getItem(HOUSEHOLD_SENT_KEY);
      if (rawHouseholdSent) setHouseholdSentRequests(JSON.parse(rawHouseholdSent) as string[]);

      // Una richiesta di Casa in arrivo già seminata, una volta sola alla primissima
      // apertura — stessa idea di KNOW_SEEDED_KEY qui sopra: per provare subito
      // "Accetta"/"Rifiuta" come destinatario, non solo come chi la manda. Chi te la manda
      // deve già essere una Persona Conosciuta (ha senso solo così), quindi lo seminiamo
      // anche tra i tuoi conosciuti se non lo fosse già — e con lui anche Nina, per lo
      // stesso motivo ma per le storie demo (vedi vitaecom-demo-data.ts): senza conoscerla,
      // la sua non comparirebbe nella fila in cima a Vitaeworld alla primissima apertura.
      if (!window.localStorage.getItem(HOUSEHOLD_SEEDED_KEY)) {
        const seededAccount = DEMO_ACCOUNTS[1];
        const seededReceived = [seededAccount.id];
        setHouseholdReceivedRequests(seededReceived);
        window.localStorage.setItem(HOUSEHOLD_RECEIVED_KEY, JSON.stringify(seededReceived));
        setKnownAccountIds((prev) => {
          const toAdd = [seededAccount.id, DEMO_ACCOUNTS[0].id].filter((id) => !prev.includes(id));
          if (toAdd.length === 0) return prev;
          const merged = [...prev, ...toAdd];
          window.localStorage.setItem(KNOWN_KEY, JSON.stringify(merged));
          return merged;
        });
        const seededNotif: VitaecomNotification = {
          id: newId(),
          fromAccountId: seededAccount.id,
          kind: "household_request",
          createdAt: new Date().toISOString(),
          read: false,
        };
        setNotifications((prev) => {
          const merged = [seededNotif, ...prev];
          try {
            window.localStorage.setItem(NOTIF_KEY, JSON.stringify(merged));
          } catch {
            // storage non disponibile: continua solo in memoria
          }
          return merged;
        });
        window.localStorage.setItem(HOUSEHOLD_SEEDED_KEY, "1");
      } else {
        const rawHouseholdReceived = window.localStorage.getItem(HOUSEHOLD_RECEIVED_KEY);
        if (rawHouseholdReceived) setHouseholdReceivedRequests(JSON.parse(rawHouseholdReceived) as string[]);
      }
    } catch {
      setPosts(buildDemoPosts());
    }
    setHydrated(true);
  }, []);

  /**
   * "Quando qualcuno clicca la gemma, arriva una notifica..." — senza un vero backend non
   * c'è nessun altro account reale che possa mai cliccarla per davvero. Per non lasciare
   * la funzione a vuoto nell'anteprima, un account dimostrativo interagisce con un tuo post
   * nuovo dopo una manciata di secondi — solo per i TUOI post, mai per quelli demo, e
   * sempre chiaramente un account demo, mai spacciato per una persona vera. Da quando
   * esistono le reazioni, un terzo possibile esito è proprio quello: l'account demo prova
   * uno stato d'animo, che alimenta il Lato Stato della catena e genera la notifica "Il Tuo
   * Post Ha Reso [nickname] [Stato D'Animo]" — sia a te come autore di questo post, sia
   * all'autore del post originale quando sono due persone diverse (in pratica: solo se
   * anche l'originale sei tu, essendo questa chiamata sempre su un post appena pubblicato
   * da te).
   */
  const simulateDemoEngagement = useCallback(
    (postId: string) => {
      const delay = 4000 + Math.random() * 5000;
      setTimeout(() => {
        const eligible = DEMO_ACCOUNTS.filter((a) => !mutedAccountIdsRef.current.includes(a.id));
        if (eligible.length === 0) return;
        const account = eligible[Math.floor(Math.random() * eligible.length)];
        const roll = Math.random();
        const kind: "comment" | "reaction" | "like" = roll < 0.25 ? "comment" : roll < 0.5 ? "reaction" : "like";
        const current = postsRef.current;
        const post = current.find((p) => p.id === postId);
        if (!post) return;

        if (kind === "reaction") {
          const reactionMood = DEFAULT_MOODS[Math.floor(Math.random() * DEFAULT_MOODS.length)];
          const chainRoot = chainRootOf(post);
          bumpMoodTally(chainRoot, reactionMood.id, 1);
          // "All'utente che ha condiviso E all'utente del post originale" — qui il primo sei
          // sempre tu (questa funzione gira solo sui tuoi post appena pubblicati); il
          // secondo è una notifica in più solo se anche l'autore dell'originale sei tu
          // (es. hai condiviso una tua vecchia foto), mai per un originale di un account
          // demo, che non ha un dispositivo su cui vederla.
          const rootPost = current.find((p) => p.id === chainRoot);
          const notifiedPostIds = new Set<string>([postId]);
          if (rootPost && rootPost.id !== postId && rootPost.authorId === "user") notifiedPostIds.add(rootPost.id);
          const notifs: VitaecomNotification[] = Array.from(notifiedPostIds).map((pid) => ({
            id: newId(),
            postId: pid,
            fromAccountId: account.id,
            kind: "reaction" as const,
            moodId: reactionMood.id,
            createdAt: new Date().toISOString(),
            read: false,
          }));
          persistNotifications([...notifs, ...notifRef.current]);
          return;
        }

        const updated = current.map((p) => {
          if (p.id !== postId) return p;
          if (kind === "comment") {
            const comment: VitaecomComment = {
              id: newId(),
              authorId: account.id,
              text: DEMO_REPLY_TEXTS[Math.floor(Math.random() * DEMO_REPLY_TEXTS.length)],
              createdAt: new Date().toISOString(),
              likedByUser: false,
              likeCount: 0,
              replies: [],
            };
            return { ...p, comments: [...p.comments, comment] };
          }
          return { ...p, likeCount: p.likeCount + 1 };
        });
        persistPosts(updated);
        const notif: VitaecomNotification = {
          id: newId(),
          postId,
          fromAccountId: account.id,
          kind,
          createdAt: new Date().toISOString(),
          read: false,
        };
        persistNotifications([notif, ...notifRef.current]);
      }, delay);
    },
    [persistPosts, persistNotifications, bumpMoodTally]
  );

  const publish = useCallback(
    (input: NewPostInput) => {
      const post: VitaecomPost = {
        id: newId(),
        authorId: "user",
        createdAt: new Date().toISOString(),
        moodId: input.moodId,
        caption: input.caption,
        captionByAI: input.captionByAI,
        photoKey: input.photoKey,
        videoKey: input.videoKey,
        tags: input.tags,
        likedByUser: false,
        likeCount: 0,
        comments: [],
      };
      persistPosts([post, ...posts]);
      simulateDemoEngagement(post.id);
    },
    [posts, persistPosts, simulateDemoEngagement]
  );

  /** Una storia — stessa forma di publish(), con `isStory`/`expiresAt` in più. Le
   * interazioni che riceve (Mi Piace, commenti, reazioni, condivisione) sono le stesse di
   * un post normale, perché è a tutti gli effetti un post: solo il visualizzatore che la
   * mostra, e il filtro che la tiene fuori dai feed normali, sono diversi. */
  const publishStory = useCallback(
    (input: NewPostInput) => {
      const post: VitaecomPost = {
        id: newId(),
        authorId: "user",
        createdAt: new Date().toISOString(),
        isStory: true,
        expiresAt: new Date(Date.now() + STORY_DURATION_MS).toISOString(),
        moodId: input.moodId,
        caption: input.caption,
        captionByAI: input.captionByAI,
        photoKey: input.photoKey,
        videoKey: input.videoKey,
        tags: input.tags,
        likedByUser: false,
        likeCount: 0,
        comments: [],
      };
      persistPosts([post, ...posts]);
      simulateDemoEngagement(post.id);
    },
    [posts, persistPosts, simulateDemoEngagement]
  );

  const markStorySeen = useCallback((postId: string) => {
    setSeenStoryIds((prev) => {
      if (prev.includes(postId)) return prev;
      const next = [...prev, postId];
      try {
        window.localStorage.setItem(SEEN_STORIES_KEY, JSON.stringify(next));
      } catch {
        // storage non disponibile: continua solo in memoria
      }
      return next;
    });
  }, []);

  /**
   * Condividere un post: il contenuto ORIGINALE (il primo della catena) si incorpora
   * sempre; quello del post di provenienza diretto (se aveva un'aggiunta sua, cioè era a
   * sua volta una condivisione) solo se `includeSourceAddition` è acceso — "mai quello
   * prima", quindi qui non risaliamo oltre un livello. Il Lato Stato dell'intera catena
   * riceve subito la quota dello stato d'animo scelto in "Cosa Provi?".
   */
  const sharePost = useCallback(
    (input: { sourcePostId: string; caption: string; sharedMoodId: string; includeSourceAddition: boolean }) => {
      const source = postsRef.current.find((p) => p.id === input.sourcePostId);
      if (!source) return;
      const chainRoot = chainRootOf(source);
      const rootPost = postsRef.current.find((p) => p.id === chainRoot) ?? source;
      const sourceHasOwnAddition = Boolean(source.sharedFromPostId) && Boolean(source.caption.trim());

      const post: VitaecomPost = {
        id: newId(),
        authorId: "user",
        createdAt: new Date().toISOString(),
        caption: input.caption,
        tags: [],
        likedByUser: false,
        likeCount: 0,
        comments: [],
        chainRootId: chainRoot,
        sharedFromPostId: source.id,
        sharedMoodId: input.sharedMoodId,
        embedOriginAuthorId: rootPost.authorId,
        embedOriginCaption: rootPost.caption,
        embedOriginPhotoKey: rootPost.photoKey,
        embedOriginDemoPhotoUrl: rootPost.demoPhotoUrl,
        embedOriginVideoKey: rootPost.videoKey,
        ...(input.includeSourceAddition && sourceHasOwnAddition
          ? { embedSourceAuthorId: source.authorId, embedSourceCaption: source.caption }
          : {}),
      };
      persistPosts([post, ...postsRef.current]);
      bumpMoodTally(chainRoot, input.sharedMoodId, 1);
      simulateDemoEngagement(post.id);
    },
    [persistPosts, simulateDemoEngagement, bumpMoodTally]
  );

  /** La sfera di reazione su un post — solo la tua: vedi userReactionMoodId sul tipo. Se
   * stavi già cambiando idea su questo stesso post, la quota precedente si toglie dal Lato
   * Stato e quella nuova si aggiunge, mai un doppio conteggio per la stessa persona. */
  const setPostReaction = useCallback(
    (postId: string, moodId: string) => {
      const post = postsRef.current.find((p) => p.id === postId);
      if (!post) return;
      const chainRoot = chainRootOf(post);
      const previous = post.userReactionMoodId;
      if (previous === moodId) return;
      persistPosts(postsRef.current.map((p) => (p.id === postId ? { ...p, userReactionMoodId: moodId } : p)));
      if (previous) bumpMoodTally(chainRoot, previous, -1);
      bumpMoodTally(chainRoot, moodId, 1);
    },
    [persistPosts, bumpMoodTally]
  );

  const toggleLike = useCallback(
    (postId: string) => {
      persistPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, likedByUser: !p.likedByUser, likeCount: p.likeCount + (p.likedByUser ? -1 : 1) } : p
        )
      );
    },
    [posts, persistPosts]
  );

  const toggleCommentLike = useCallback(
    (postId: string, commentId: string, replyId?: string) => {
      persistPosts(
        posts.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            comments: p.comments.map((c) =>
              mapComment(c, (target) => {
                const isTarget = replyId ? target.id === replyId : target.id === commentId && !replyId;
                if (!isTarget) return target;
                return { ...target, likedByUser: !target.likedByUser, likeCount: target.likeCount + (target.likedByUser ? -1 : 1) };
              })
            ),
          };
        })
      );
    },
    [posts, persistPosts]
  );

  const addComment = useCallback(
    (postId: string, text: string, replyToCommentId?: string) => {
      if (!text.trim()) return;
      const comment: VitaecomComment = {
        id: newId(),
        authorId: "user",
        text: text.trim(),
        createdAt: new Date().toISOString(),
        likedByUser: false,
        likeCount: 0,
        replies: [],
      };
      persistPosts(
        posts.map((p) => {
          if (p.id !== postId) return p;
          if (!replyToCommentId) return { ...p, comments: [...p.comments, comment] };
          // Un solo livello: se rispondi a una risposta, il sub-commento finisce comunque
          // sul commento padre, mai più in profondità (vedi la nota sul tipo).
          return {
            ...p,
            comments: p.comments.map((c) =>
              c.id === replyToCommentId || c.replies.some((r) => r.id === replyToCommentId)
                ? { ...c, replies: [...c.replies, comment] }
                : c
            ),
          };
        })
      );
    },
    [posts, persistPosts]
  );

  const removePost = useCallback((postId: string) => persistPosts(posts.filter((p) => p.id !== postId)), [posts, persistPosts]);

  /** "Non mi interessa questo post" — lo toglie dal tuo Vitaeworld, per sempre, solo per te.
   * Non è una segnalazione (vedi "Segnala questo post", ancora da decidere insieme): qui
   * non succede nulla dall'altra parte, è solo il tuo filtro personale. */
  const hidePost = useCallback((postId: string) => {
    setHiddenPostIds((prev) => {
      if (prev.includes(postId)) return prev;
      const next = [...prev, postId];
      try {
        window.localStorage.setItem(HIDDEN_POSTS_KEY, JSON.stringify(next));
      } catch {
        // storage non disponibile: continua solo in memoria
      }
      return next;
    });
  }, []);

  /** "Nascondi tutti i post di questo utente" — niente più suoi post, niente più notifiche
   * dalla sua attività (né i post futuri, che non vengono più mostrati, né una nuova
   * simulazione di Mi Piace/commento/reazione, che smette di sceglierlo — vedi
   * simulateDemoEngagement qui sotto). Anche qui, solo un filtro tuo: dall'altra parte un
   * account demo non sa e non può sapere di essere stato messo a tacere. */
  const muteAccount = useCallback((accountId: string) => {
    setMutedAccountIds((prev) => {
      if (prev.includes(accountId)) return prev;
      const next = [...prev, accountId];
      try {
        window.localStorage.setItem(MUTED_ACCOUNTS_KEY, JSON.stringify(next));
      } catch {
        // storage non disponibile: continua solo in memoria
      }
      return next;
    });
  }, []);

  /** "Segnala questo post" — scrive la segnalazione (vedi PostReport per la forma, già
   * pensata per un domani con un vero server) e, come una scelta ragionevole più che una
   * regola rigida, nasconde subito anche il post dal tuo Vitaeworld: difficilmente vuoi
   * ancora vederlo dopo averlo segnalato. Non è un secondo "Non mi interessa" duplicato —
   * quello resta un filtro tuo senza motivo dichiarato, questo porta sempre un perché. */
  const reportPost = useCallback(
    (postId: string, authorId: string, reason: ReportReason, note?: string) => {
      const report: PostReport = { id: newId(), postId, authorId, reason, note: note?.trim() || undefined, createdAt: new Date().toISOString() };
      setReports((prev) => {
        const next = [report, ...prev];
        try {
          window.localStorage.setItem(REPORTS_KEY, JSON.stringify(next));
        } catch {
          // storage non disponibile: continua solo in memoria
        }
        return next;
      });
      hidePost(postId);
    },
    [hidePost]
  );

  /** Segna una segnalazione come esaminata — la toglie dalla sezione "Segnalazioni" senza
   * toccare il post (che intanto è già nascosto dal tuo Vitaeworld da quando è stata fatta):
   * la lasci lì se preferisci ricontrollarla, o se un domani con un vero server questa
   * diventerà la conferma che manda l'esito a chi gestisce la moderazione. */
  const dismissReport = useCallback((reportId: string) => {
    setReports((prev) => {
      const next = prev.filter((r) => r.id !== reportId);
      try {
        window.localStorage.setItem(REPORTS_KEY, JSON.stringify(next));
      } catch {
        // storage non disponibile: continua solo in memoria
      }
      return next;
    });
  }, []);

  /**
   * Un account demo che accetta da solo dopo una manciata di secondi — stessa idea già usata
   * per Mi Piace/commenti sui tuoi post nuovi (vedi simulateDemoEngagement): senza un vero
   * account dall'altra parte, è l'unico modo di rendere il flusso "manda una richiesta"
   * davvero provabile fino in fondo, non solo fino al "richiesta inviata" e basta.
   */
  const sendKnowRequest = useCallback(
    (accountId: string) => {
      if (sentRef.current.includes(accountId) || knownRef.current.includes(accountId)) return;
      persistSent([...sentRef.current, accountId]);
      const delay = 3000 + Math.random() * 4000;
      setTimeout(() => {
        persistSent(sentRef.current.filter((id) => id !== accountId));
        persistKnown([...knownRef.current, accountId]);
        const notif: VitaecomNotification = {
          id: newId(),
          fromAccountId: accountId,
          kind: "know_accepted",
          createdAt: new Date().toISOString(),
          read: false,
        };
        persistNotifications([notif, ...notifRef.current]);
      }, delay);
    },
    [persistSent, persistKnown, persistNotifications]
  );

  const acceptKnowRequest = useCallback(
    (accountId: string) => {
      persistReceived(receivedRef.current.filter((id) => id !== accountId));
      persistKnown([...knownRef.current, accountId]);
    },
    [persistReceived, persistKnown]
  );

  const markNotificationsRead = useCallback(() => {
    persistNotifications(notifications.map((n) => ({ ...n, read: true })));
  }, [notifications, persistNotifications]);

  const setKnownName = useCallback(
    (accountId: string, firstName: string, lastName: string) => {
      persistKnownNames({ ...knownNames, [accountId]: { firstName: firstName.trim(), lastName: lastName.trim() } });
    },
    [knownNames, persistKnownNames]
  );

  /**
   * Stessa idea di sendKnowRequest — un account demo che accetta da solo dopo una manciata
   * di secondi, l'unico modo di provare il flusso "manda una richiesta" fino in fondo senza
   * un vero account dall'altra parte. Da qui in poi i due avatar compaiono l'uno nel
   * riquadro Casa dell'altro (vedi VitaecomHouseholdAvatarCell in Home).
   */
  const sendHouseholdRequest = useCallback(
    (accountId: string) => {
      if (householdSentRef.current.includes(accountId) || householdMembersRef.current.includes(accountId)) return;
      persistHouseholdSent([...householdSentRef.current, accountId]);
      const delay = 3000 + Math.random() * 4000;
      setTimeout(() => {
        persistHouseholdSent(householdSentRef.current.filter((id) => id !== accountId));
        persistHouseholdMembers([...householdMembersRef.current, accountId]);
        const notif: VitaecomNotification = {
          id: newId(),
          fromAccountId: accountId,
          kind: "household_accepted",
          createdAt: new Date().toISOString(),
          read: false,
        };
        persistNotifications([notif, ...notifRef.current]);
      }, delay);
    },
    [persistHouseholdSent, persistHouseholdMembers, persistNotifications]
  );

  const respondHouseholdRequest = useCallback(
    (accountId: string, accept: boolean) => {
      persistHouseholdReceived(householdReceivedRef.current.filter((id) => id !== accountId));
      if (accept) persistHouseholdMembers([...householdMembersRef.current, accountId]);
    },
    [persistHouseholdReceived, persistHouseholdMembers]
  );

  /**
   * Rimuove l'appartenenza reciproca sul TUO dispositivo — l'unico che esiste davvero in
   * questa app solo-locale. "Anche dal suo lato" (l'account dissociato non vede più i tuoi
   * spostamenti) non è qualcosa che un dispositivo solo può rappresentare per un account
   * demo, che non ne ha uno proprio: stesso limite onesto già dichiarato per Vitaecom fin
   * dal Checkpoint 16, non un pezzo mancante.
   */
  const dissociateFromHousehold = useCallback(
    (accountId: string) => {
      persistHouseholdMembers(householdMembersRef.current.filter((id) => id !== accountId));
    },
    [persistHouseholdMembers]
  );

  return (
    <VitaecomSocialContext.Provider
      value={{
        hydrated,
        posts,
        notifications,
        hasUnreadNotification: notifications.some((n) => !n.read),
        markNotificationsRead,
        publish,
        publishStory,
        seenStoryIds,
        markStorySeen,
        sharePost,
        moodTallies,
        setPostReaction,
        toggleLike,
        toggleCommentLike,
        addComment,
        removePost,
        hiddenPostIds,
        mutedAccountIds,
        hidePost,
        muteAccount,
        reports,
        reportPost,
        dismissReport,
        knownAccountIds,
        sentRequests,
        receivedRequests,
        sendKnowRequest,
        acceptKnowRequest,
        knownNames,
        setKnownName,
        householdMembers,
        householdSentRequests,
        householdReceivedRequests,
        sendHouseholdRequest,
        respondHouseholdRequest,
        dissociateFromHousehold,
      }}
    >
      {children}
    </VitaecomSocialContext.Provider>
  );
}

export function useVitaecomSocial(): VitaecomSocialContextValue {
  const ctx = useContext(VitaecomSocialContext);
  if (!ctx) throw new Error("useVitaecomSocial deve essere usato dentro VitaecomSocialProvider");
  return ctx;
}
