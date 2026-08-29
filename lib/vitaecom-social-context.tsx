"use client";
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { VitaecomPost, VitaecomComment, VitaecomTag } from "./vitaecom-social-types";
import { buildDemoPosts, DEMO_ACCOUNTS } from "./vitaecom-demo-data";
import { newId } from "./id";

const POSTS_KEY = "vitae:vitaecom-posts";
const NOTIF_KEY = "vitae:vitaecom-notifications";
const LINKS_KEY = "vitae:vitaecom-account-links";
const KNOWN_KEY = "vitae:vitaecom-known";
const SENT_KEY = "vitae:vitaecom-sent-requests";
const RECEIVED_KEY = "vitae:vitaecom-received-requests";
const KNOW_SEEDED_KEY = "vitae:vitaecom-know-seeded";

interface NewPostInput {
  caption: string;
  captionByAI?: boolean;
  moodId?: string;
  photoKey?: string;
  tags: VitaecomTag[];
}

export interface VitaecomNotification {
  id: string;
  /** Assente per le notifiche non legate a un post (richieste di conoscenza). */
  postId?: string;
  fromAccountId: string;
  kind: "like" | "comment" | "know_request" | "know_accepted";
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
  toggleLike: (postId: string) => void;
  toggleCommentLike: (postId: string, commentId: string, replyId?: string) => void;
  addComment: (postId: string, text: string, replyToCommentId?: string) => void;
  removePost: (postId: string) => void;
  /** Un account Vitaecom (oggi solo quelli dimostrativi — vedi vitaecom-demo-data.ts) può
   * essere collegato a una Persona vera del tuo Mondo: è quello che rende reali le schede
   * Scoperte/Rapporto/Albero di "Esplora Altro" invece di lasciarle vuote per sempre. Il
   * collegamento è una scelta TUA, mai automatica — nessun accoppiamento per nome a caso. */
  accountLinks: Record<string, string>;
  linkAccountToPerson: (accountId: string, personId: string) => void;
  unlinkAccount: (accountId: string) => void;
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
  const [accountLinks, setAccountLinks] = useState<Record<string, string>>({});
  const [knownAccountIds, setKnownAccountIds] = useState<string[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<string[]>([]);
  const postsRef = useRef<VitaecomPost[]>([]);
  const notifRef = useRef<VitaecomNotification[]>([]);
  const knownRef = useRef<string[]>([]);
  const sentRef = useRef<string[]>([]);
  const receivedRef = useRef<string[]>([]);

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

  useEffect(() => {
    try {
      const rawPosts = window.localStorage.getItem(POSTS_KEY);
      if (rawPosts) {
        setPosts(JSON.parse(rawPosts) as VitaecomPost[]);
      } else {
        // Prima apertura di Vitaecom: semina i post dimostrativi una volta sola, poi
        // diventano dati locali come tutto il resto (i tuoi like/commenti sopra restano).
        const seeded = buildDemoPosts();
        setPosts(seeded);
        window.localStorage.setItem(POSTS_KEY, JSON.stringify(seeded));
      }
      const rawNotif = window.localStorage.getItem(NOTIF_KEY);
      if (rawNotif) setNotifications(JSON.parse(rawNotif) as VitaecomNotification[]);
      const rawLinks = window.localStorage.getItem(LINKS_KEY);
      if (rawLinks) setAccountLinks(JSON.parse(rawLinks) as Record<string, string>);

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
   * sempre chiaramente un account demo, mai spacciato per una persona vera.
   */
  const simulateDemoEngagement = useCallback(
    (postId: string) => {
      const delay = 4000 + Math.random() * 5000;
      setTimeout(() => {
        const account = DEMO_ACCOUNTS[Math.floor(Math.random() * DEMO_ACCOUNTS.length)];
        const isComment = Math.random() < 0.3;
        const current = postsRef.current;
        const updated = current.map((p) => {
          if (p.id !== postId) return p;
          if (isComment) {
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
          kind: isComment ? "comment" : "like",
          createdAt: new Date().toISOString(),
          read: false,
        };
        persistNotifications([notif, ...notifRef.current]);
      }, delay);
    },
    [persistPosts, persistNotifications]
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

  const persistLinks = useCallback((next: Record<string, string>) => {
    setAccountLinks(next);
    try {
      window.localStorage.setItem(LINKS_KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  const linkAccountToPerson = useCallback(
    (accountId: string, personId: string) => persistLinks({ ...accountLinks, [accountId]: personId }),
    [accountLinks, persistLinks]
  );

  const unlinkAccount = useCallback(
    (accountId: string) => {
      const next = { ...accountLinks };
      delete next[accountId];
      persistLinks(next);
    },
    [accountLinks, persistLinks]
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
        toggleLike,
        toggleCommentLike,
        addComment,
        removePost,
        accountLinks,
        linkAccountToPerson,
        unlinkAccount,
        knownAccountIds,
        sentRequests,
        receivedRequests,
        sendKnowRequest,
        acceptKnowRequest,
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
