"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { newId } from "./id";
import { NoteEntry, NoteList, NoteText, NoteListItem } from "./notes-types";
import { EntityLink } from "./entity-link";

const NOTES_KEY = "vitae:notes";

function nowIso(): string {
  return new Date().toISOString();
}

interface NotesContextValue {
  hydrated: boolean;
  entries: NoteEntry[];
  addList: (title: string) => NoteList;
  addNote: (title: string) => NoteText;
  renameEntry: (id: string, title: string) => void;
  removeEntry: (id: string) => void;

  updateNoteBody: (id: string, body: string) => void;

  addListItem: (listId: string, text: string) => void;
  updateListItem: (listId: string, itemId: string, patch: Partial<Omit<NoteListItem, "id">>) => void;
  removeListItem: (listId: string, itemId: string) => void;
  moveListItem: (listId: string, itemId: string, direction: "up" | "down") => void;

  togglePinned: (id: string) => void;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
  addLink: (id: string, link: EntityLink) => void;
  removeLink: (id: string, link: EntityLink) => void;

  /** Genera/aggiorna una lista spuntabile a partire da un elenco di testi calcolati
   * altrove (vedi lib/shopping-list.ts) — usato dalla lista della spesa automatica, ma
   * scritto in modo generico per qualunque altro "elenco calcolato" futuro. Trova la lista
   * per titolo esatto (creandola se non esiste), aggiunge le voci non ancora presenti e
   * rimuove quelle non più necessarie MA SOLO se non sono state spuntate — una voce già
   * comprata (done: true) non sparisce solo perché il menù è cambiato nel frattempo, l'
   * utente l'ha già evasa e la toglie lui quando vuole. Ritorna l'id della lista, creata o
   * trovata, così il chiamante può navigarci senza doverla ricercare una seconda volta. */
  mergeShoppingListItems: (listTitle: string, computedTexts: string[]) => string;
}

const NotesContext = createContext<NotesContextValue | null>(null);

/** Voci salvate prima dell'introduzione di tags/pinned/links non hanno questi campi nel
 * proprio JSON persistito — senza questa normalizzazione al caricamento, ogni punto del
 * codice che fa `.tags.includes(...)` o `.links.map(...)` su una voce vecchia andrebbe in
 * errore alla prima apertura dopo l'aggiornamento. Applicata una sola volta, qui, invece
 * di far ripetere `?? []` a ogni singolo punto di lettura sparso nell'app. */
function normalizeEntry(e: NoteEntry): NoteEntry {
  return { ...e, tags: e.tags ?? [], pinned: e.pinned ?? false, links: e.links ?? [] };
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<NoteEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(NOTES_KEY);
      if (raw) setEntries((JSON.parse(raw) as NoteEntry[]).map(normalizeEntry));
    } catch {
      // dati locali non leggibili: si riparte da zero
    } finally {
      setHydrated(true);
    }
  }, []);

  const persist = useCallback((updater: NoteEntry[] | ((prev: NoteEntry[]) => NoteEntry[])) => {
    setEntries((prev) => {
      const next = typeof updater === "function" ? (updater as (e: NoteEntry[]) => NoteEntry[])(prev) : updater;
      try {
        window.localStorage.setItem(NOTES_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const addList = useCallback(
    (title: string) => {
      const list: NoteList = {
        id: newId(),
        kind: "list",
        title,
        items: [],
        tags: [],
        pinned: false,
        links: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      persist((prev) => [...prev, list]);
      return list;
    },
    [persist]
  );

  const addNote = useCallback(
    (title: string) => {
      const note: NoteText = {
        id: newId(),
        kind: "note",
        title,
        body: "",
        tags: [],
        pinned: false,
        links: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      persist((prev) => [...prev, note]);
      return note;
    },
    [persist]
  );

  const renameEntry = useCallback(
    (id: string, title: string) =>
      persist((prev) => prev.map((e) => (e.id === id ? { ...e, title, updatedAt: nowIso() } : e))),
    [persist]
  );

  const removeEntry = useCallback((id: string) => persist((prev) => prev.filter((e) => e.id !== id)), [persist]);

  const updateNoteBody = useCallback(
    (id: string, body: string) =>
      persist((prev) => prev.map((e) => (e.id === id && e.kind === "note" ? { ...e, body, updatedAt: nowIso() } : e))),
    [persist]
  );

  const addListItem = useCallback(
    (listId: string, text: string) => {
      const item: NoteListItem = { id: newId(), text, done: false };
      persist((prev) =>
        prev.map((e) => (e.id === listId && e.kind === "list" ? { ...e, items: [...e.items, item], updatedAt: nowIso() } : e))
      );
    },
    [persist]
  );

  const updateListItem = useCallback(
    (listId: string, itemId: string, patch: Partial<Omit<NoteListItem, "id">>) =>
      persist((prev) =>
        prev.map((e) =>
          e.id === listId && e.kind === "list"
            ? { ...e, items: e.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)), updatedAt: nowIso() }
            : e
        )
      ),
    [persist]
  );

  const removeListItem = useCallback(
    (listId: string, itemId: string) =>
      persist((prev) =>
        prev.map((e) =>
          e.id === listId && e.kind === "list" ? { ...e, items: e.items.filter((i) => i.id !== itemId), updatedAt: nowIso() } : e
        )
      ),
    [persist]
  );

  /** Sposta una voce di una posizione su o giù nell'array — l'"ordine" di una lista è
   * semplicemente l'ordine dell'array `items`, senza bisogno di un campo posizione separato
   * da tenere sincronizzato. Un tentativo di andare oltre i due estremi non fa nulla, invece
   * di lanciare o produrre un array corrotto. */
  const moveListItem = useCallback(
    (listId: string, itemId: string, direction: "up" | "down") =>
      persist((prev) =>
        prev.map((e) => {
          if (e.id !== listId || e.kind !== "list") return e;
          const index = e.items.findIndex((i) => i.id === itemId);
          if (index === -1) return e;
          const targetIndex = direction === "up" ? index - 1 : index + 1;
          if (targetIndex < 0 || targetIndex >= e.items.length) return e;
          const items = [...e.items];
          [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
          return { ...e, items, updatedAt: nowIso() };
        })
      ),
    [persist]
  );

  const togglePinned = useCallback(
    (id: string) => persist((prev) => prev.map((e) => (e.id === id ? { ...e, pinned: !e.pinned, updatedAt: nowIso() } : e))),
    [persist]
  );

  const addTag = useCallback(
    (id: string, tag: string) => {
      const clean = tag.trim();
      if (!clean) return;
      persist((prev) =>
        prev.map((e) => (e.id === id && !e.tags.includes(clean) ? { ...e, tags: [...e.tags, clean], updatedAt: nowIso() } : e))
      );
    },
    [persist]
  );

  const removeTag = useCallback(
    (id: string, tag: string) =>
      persist((prev) => prev.map((e) => (e.id === id ? { ...e, tags: e.tags.filter((t) => t !== tag), updatedAt: nowIso() } : e))),
    [persist]
  );

  const addLink = useCallback(
    (id: string, link: EntityLink) => {
      persist((prev) =>
        prev.map((e) => {
          if (e.id !== id) return e;
          const already = e.links.some((l) => l.type === link.type && l.id === link.id);
          return already ? e : { ...e, links: [...e.links, link], updatedAt: nowIso() };
        })
      );
    },
    [persist]
  );

  const removeLink = useCallback(
    (id: string, link: EntityLink) =>
      persist((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, links: e.links.filter((l) => !(l.type === link.type && l.id === link.id)), updatedAt: nowIso() } : e
        )
      ),
    [persist]
  );
  /** L'id della lista è generato PRIMA di chiamare persist, non letto da `entries` dopo —
   * `entries` si aggiorna al prossimo render, quindi cercarla lì nello stesso giro
   * produrrebbe l'id sbagliato (quello della versione ancora vecchia in chiusura) se il
   * chiamante la usa subito per navigare. Generarlo prima e riusarlo dentro l'updater
   * funzionale elimina il problema per costruzione, senza dover aspettare un render. */
  const mergeShoppingListItems = useCallback(
    (listTitle: string, computedTexts: string[]) => {
      let resultId = "";
      persist((prev) => {
        const existing = prev.find((e) => e.kind === "list" && e.title === listTitle) as NoteList | undefined;

        if (!existing) {
          resultId = newId();
          const items: NoteListItem[] = computedTexts.map((text) => ({ id: newId(), text, done: false }));
          const list: NoteList = {
            id: resultId,
            kind: "list",
            title: listTitle,
            items,
            tags: [],
            pinned: false,
            links: [],
            createdAt: nowIso(),
            updatedAt: nowIso(),
          };
          return [...prev, list];
        }

        resultId = existing.id;
        const wantedTexts = new Set(computedTexts);
        // Le voci già spuntate restano SEMPRE, anche se il testo calcolato non le richiede
        // più — vedi il commento sull'interfaccia: comprato è comprato, il menù che cambia
        // dopo non deve far sparire una spunta che l'utente ha già dato.
        const kept = existing.items.filter((item) => item.done || wantedTexts.has(item.text));
        const alreadyPresentTexts = new Set(kept.map((item) => item.text));
        const toAdd = computedTexts
          .filter((text) => !alreadyPresentTexts.has(text))
          .map((text): NoteListItem => ({ id: newId(), text, done: false }));

        return prev.map((e) => (e.id === existing.id ? { ...e, items: [...kept, ...toAdd], updatedAt: nowIso() } : e));
      });
      return resultId;
    },
    [persist]
  );

  const value = useMemo(
    () => ({
      hydrated,
      entries,
      addList,
      addNote,
      renameEntry,
      removeEntry,
      updateNoteBody,
      addListItem,
      updateListItem,
      removeListItem,
      moveListItem,
      mergeShoppingListItems,
      togglePinned,
      addTag,
      removeTag,
      addLink,
      removeLink,
    }),
    [
      hydrated,
      entries,
      addList,
      addNote,
      renameEntry,
      removeEntry,
      updateNoteBody,
      addListItem,
      updateListItem,
      removeListItem,
      moveListItem,
      mergeShoppingListItems,
      togglePinned,
      addTag,
      removeTag,
      addLink,
      removeLink,
    ]
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes(): NotesContextValue {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes va usato dentro un NotesProvider");
  return ctx;
}
