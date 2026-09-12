"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { newId } from "./id";
import { NoteEntry, NoteList, NoteText, NoteListItem } from "./notes-types";

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
}

const NotesContext = createContext<NotesContextValue | null>(null);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<NoteEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(NOTES_KEY);
      if (raw) setEntries(JSON.parse(raw));
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
      const list: NoteList = { id: newId(), kind: "list", title, items: [], createdAt: nowIso(), updatedAt: nowIso() };
      persist((prev) => [...prev, list]);
      return list;
    },
    [persist]
  );

  const addNote = useCallback(
    (title: string) => {
      const note: NoteText = { id: newId(), kind: "note", title, body: "", createdAt: nowIso(), updatedAt: nowIso() };
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
    }),
    [hydrated, entries, addList, addNote, renameEntry, removeEntry, updateNoteBody, addListItem, updateListItem, removeListItem, moveListItem]
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes(): NotesContextValue {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes va usato dentro un NotesProvider");
  return ctx;
}
