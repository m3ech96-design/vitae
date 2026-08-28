"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const KEY = "vitae:vitaegram-draft";

export interface PostDraft {
  kind: "post";
  caption: string;
  captionByAI: boolean;
  includeMood: boolean;
  photoKey?: string;
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

interface VitaegramDraftContextValue {
  draft: Draft;
  setPostDraft: (d: Omit<PostDraft, "kind">) => void;
  setCommentDraft: (d: Omit<CommentDraft, "kind">) => void;
  clearDraft: () => void;
}

const VitaegramDraftContext = createContext<VitaegramDraftContextValue | null>(null);

/**
 * "Esce da Vitaegram, abbozzando l'eventuale creazione di un post, commento o altro che era
 * in corso in quel momento così da riprendere immediatamente quando l'utente torna su
 * Vitaegram" — vive qui, non dentro le pagine: il provider sta nel layout radice, sopra il
 * router, quindi non si smonta mai passando da Vitaegram a Home e viceversa (è client-side
 * navigation, non un vero ricaricamento). Anche salvato in locale, per il raro caso di un
 * ricaricamento vero della pagina nel mezzo.
 */
export function VitaegramDraftProvider({ children }: { children: React.ReactNode }) {
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

  return (
    <VitaegramDraftContext.Provider value={{ draft, setPostDraft, setCommentDraft, clearDraft }}>
      {children}
    </VitaegramDraftContext.Provider>
  );
}

export function useVitaegramDraft(): VitaegramDraftContextValue {
  const ctx = useContext(VitaegramDraftContext);
  if (!ctx) throw new Error("useVitaegramDraft deve essere usato dentro VitaegramDraftProvider");
  return ctx;
}
