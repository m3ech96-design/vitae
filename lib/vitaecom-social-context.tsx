"use client";
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { VitaecomPost, VitaecomComment, VitaecomTag } from "./vitaecom-social-types";
import { buildDemoPosts, DEMO_ACCOUNTS } from "./vitaecom-demo-data";
import { newId } from "./id";

const POSTS_KEY = "vitae:vitaecom-posts";
const NOTIF_KEY = "vitae:vitaecom-notifications";
const LINKS_KEY = "vitae:vitaecom-account-links";

interface NewPostInput {
  caption: string;
  captionByAI?: boolean;
  moodId?: string;
  photoKey?: string;
  tags: VitaecomTag[];
}

export interface VitaecomNotification {
  id: string;
  postId: string;
  fromAccountId: string;
  kind: "like" | "comment";
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
  const postsRef = useRef<VitaecomPost[]>([]);
  const notifRef = useRef<VitaecomNotification[]>([]);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);
  useEffect(() => {
    notifRef.current = notifications;
  }, [notifications]);

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
