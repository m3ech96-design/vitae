"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { VitaegramPost, VitaegramComment, VitaegramTag } from "./vitaegram-social-types";
import { buildDemoPosts } from "./vitaegram-demo-data";
import { newId } from "./id";

const KEY = "vitae:vitaegram-posts";

interface NewPostInput {
  caption: string;
  captionByAI?: boolean;
  moodId?: string;
  photoKey?: string;
  tags: VitaegramTag[];
}

interface VitaegramSocialContextValue {
  hydrated: boolean;
  posts: VitaegramPost[];
  publish: (input: NewPostInput) => void;
  toggleLike: (postId: string) => void;
  toggleCommentLike: (postId: string, commentId: string, replyId?: string) => void;
  addComment: (postId: string, text: string, replyToCommentId?: string) => void;
  removePost: (postId: string) => void;
}

const VitaegramSocialContext = createContext<VitaegramSocialContextValue | null>(null);

function mapComment(c: VitaegramComment, fn: (c: VitaegramComment) => VitaegramComment): VitaegramComment {
  const next = fn(c);
  return { ...next, replies: next.replies.map((r) => fn(r)) };
}

export function VitaegramSocialProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [posts, setPosts] = useState<VitaegramPost[]>([]);

  const persist = useCallback((next: VitaegramPost[]) => {
    setPosts(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        setPosts(JSON.parse(raw) as VitaegramPost[]);
      } else {
        // Prima apertura di Vitaegram: semina i post dimostrativi una volta sola, poi
        // diventano dati locali come tutto il resto (i tuoi like/commenti sopra restano).
        const seeded = buildDemoPosts();
        setPosts(seeded);
        window.localStorage.setItem(KEY, JSON.stringify(seeded));
      }
    } catch {
      setPosts(buildDemoPosts());
    }
    setHydrated(true);
  }, []);

  const publish = useCallback(
    (input: NewPostInput) => {
      const post: VitaegramPost = {
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
      persist([post, ...posts]);
    },
    [posts, persist]
  );

  const toggleLike = useCallback(
    (postId: string) => {
      persist(
        posts.map((p) =>
          p.id === postId ? { ...p, likedByUser: !p.likedByUser, likeCount: p.likeCount + (p.likedByUser ? -1 : 1) } : p
        )
      );
    },
    [posts, persist]
  );

  const toggleCommentLike = useCallback(
    (postId: string, commentId: string, replyId?: string) => {
      persist(
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
    [posts, persist]
  );

  const addComment = useCallback(
    (postId: string, text: string, replyToCommentId?: string) => {
      if (!text.trim()) return;
      const comment: VitaegramComment = {
        id: newId(),
        authorId: "user",
        text: text.trim(),
        createdAt: new Date().toISOString(),
        likedByUser: false,
        likeCount: 0,
        replies: [],
      };
      persist(
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
    [posts, persist]
  );

  const removePost = useCallback((postId: string) => persist(posts.filter((p) => p.id !== postId)), [posts, persist]);

  return (
    <VitaegramSocialContext.Provider value={{ hydrated, posts, publish, toggleLike, toggleCommentLike, addComment, removePost }}>
      {children}
    </VitaegramSocialContext.Provider>
  );
}

export function useVitaegramSocial(): VitaegramSocialContextValue {
  const ctx = useContext(VitaegramSocialContext);
  if (!ctx) throw new Error("useVitaegramSocial deve essere usato dentro VitaegramSocialProvider");
  return ctx;
}
