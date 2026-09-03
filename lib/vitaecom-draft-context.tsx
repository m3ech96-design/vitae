"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const KEY = "vitae:vitaecom-draft";

export interface PostDraft {
  kind: "post";
  caption: string;
  captionByAI: boolean;
  includeMood: boolean;
  photoKey?: string;
  videoKey?: string;
  taggedAccountIds: string[];
  taskIds: string[];
}

export interface CommentDraft {
  kind: "comment";
  postId: string;
  text: string;
  replyTo?: string;
}

type Draft = PostDraft | CommentDraft | null;

interface VitaecomDraftContextValue {
  draft: Draft;
  setPostDraft: (d: Omit<PostDraft, "kind">) => void;
  setCommentDraft: (d: Omit<CommentDraft, "kind">) => void;
  clearDraft: () => void;
}

const VitaecomDraftContext = createContext<VitaecomDraftContextValue | null>(null);

/**
 * "Esce da Vitaecom, abbozzando l'eventuale creazione di un post, commento o altro che era
 * in corso in quel momento così da riprendere immediatamente quando l'utente torna su
 * Vitaecom" — vive qui, non dentro le pagine: il provider sta nel layout radice, sopra il
 * router, quindi non si smonta mai passando da Vitaecom a Home e viceversa (è client-side
 * navigation, non un vero ricaricamento). Anche salvato in locale, per il raro caso di un
 * ricaricamento vero della pagina nel mezzo.
 */
export function VitaecomDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<Draft>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setDraft(JSON.parse(raw) as Draft);
    } catch {
      // nessuna bozza salvata, o storage non disponibile: si riparte senza
    }
  }, []);

  const persist = useCallback((next: Draft) => {
    setDraft(next);
    try {
      if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
      else window.localStorage.removeItem(KEY);
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  const setPostDraft = useCallback((d: Omit<PostDraft, "kind">) => persist({ kind: "post", ...d }), [persist]);
  const setCommentDraft = useCallback((d: Omit<CommentDraft, "kind">) => persist({ kind: "comment", ...d }), [persist]);
  const clearDraft = useCallback(() => persist(null), [persist]);

  const value = useMemo<VitaecomDraftContextValue>(
    () => ({ draft, setPostDraft, setCommentDraft, clearDraft }),
    [draft, setPostDraft, setCommentDraft, clearDraft]
  );

  return <VitaecomDraftContext.Provider value={value}>{children}</VitaecomDraftContext.Provider>;
}

export function useVitaecomDraft(): VitaecomDraftContextValue {
  const ctx = useContext(VitaecomDraftContext);
  if (!ctx) throw new Error("useVitaecomDraft deve essere usato dentro VitaecomDraftProvider");
  return ctx;
}
