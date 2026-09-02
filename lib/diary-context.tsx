"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { newId } from "./id";
import { DiaryEntry, DiaryMedia } from "./diary-types";
import { deleteImage, isDataUrl } from "./image-store";
import { deleteVideo } from "./video-store";
import { deleteAudio } from "./audio-store";

const ENTRIES_KEY = "vitae:diary-entries";
const SCRUB_PREVIEW_KEY = "vitae:diary-scrub-preview";

interface DiaryContextValue {
  hydrated: boolean;
  entries: DiaryEntry[];
  /** L'effetto "sceglibile o no" delle anteprime video che scorrono — un interruttore
   * globale, non per singolo video: attivarlo/disattivarlo caso per caso avrebbe aggiunto un
   * controllo su ogni video senza un reale beneficio in più. */
  scrubPreviewEnabled: boolean;
  setScrubPreviewEnabled: (v: boolean) => void;
  addEntry: (input: Omit<DiaryEntry, "id" | "createdAt">) => DiaryEntry;
  updateEntry: (id: string, patch: Partial<Omit<DiaryEntry, "id" | "createdAt">>) => void;
  removeEntry: (id: string) => void;
}

const DiaryContext = createContext<DiaryContextValue | null>(null);

function deleteMedia(media: DiaryMedia) {
  if (media.type === "image" && !isDataUrl(media.key)) deleteImage(media.key);
  if (media.type === "video") deleteVideo(media.key);
  if (media.type === "audio") deleteAudio(media.key);
}

export function DiaryProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [scrubPreviewEnabled, setScrubPreviewEnabledState] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ENTRIES_KEY);
      if (raw) setEntries(JSON.parse(raw));
      const scrub = window.localStorage.getItem(SCRUB_PREVIEW_KEY);
      if (scrub !== null) setScrubPreviewEnabledState(scrub === "1");
    } catch {
      // dati locali non leggibili: si riparte da zero
    } finally {
      setHydrated(true);
    }
  }, []);

  const persistEntries = useCallback((updater: DiaryEntry[] | ((prev: DiaryEntry[]) => DiaryEntry[])) => {
    setEntries((prev) => {
      const next = typeof updater === "function" ? (updater as (v: DiaryEntry[]) => DiaryEntry[])(prev) : updater;
      try {
        window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const setScrubPreviewEnabled = useCallback((v: boolean) => {
    setScrubPreviewEnabledState(v);
    try {
      window.localStorage.setItem(SCRUB_PREVIEW_KEY, v ? "1" : "0");
    } catch {
      // ignorato
    }
  }, []);

  const addEntry = useCallback(
    (input: Omit<DiaryEntry, "id" | "createdAt">) => {
      const entry: DiaryEntry = { ...input, id: newId(), createdAt: new Date().toISOString() };
      persistEntries((prev) => [...prev, entry]);
      return entry;
    },
    [persistEntries]
  );

  const updateEntry = useCallback(
    (id: string, patch: Partial<Omit<DiaryEntry, "id" | "createdAt">>) => {
      // Se la modifica sostituisce l'elenco media, i media tolti vanno ripuliti da
      // IndexedDB — altrimenti resterebbero orfani per sempre (mai più raggiungibili, mai
      // più eliminati). Letto qui prima della scrittura, non dentro l'updater funzionale:
      // è un effetto collaterale sullo storage binario, non fa parte del calcolo del nuovo
      // array (quella parte resta comunque sicura tramite persistEntries).
      if (patch.media) {
        const current = entries.find((e) => e.id === id);
        const removedMedia = current?.media.filter((m) => !patch.media!.some((nm) => nm.id === m.id)) ?? [];
        removedMedia.forEach(deleteMedia);
      }
      persistEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e)));
    },
    [persistEntries, entries]
  );

  const removeEntry = useCallback(
    (id: string) => {
      const toRemove = entries.find((e) => e.id === id);
      toRemove?.media.forEach(deleteMedia);
      persistEntries((prev) => prev.filter((e) => e.id !== id));
    },
    [persistEntries, entries]
  );

  const value = useMemo(
    () => ({ hydrated, entries, scrubPreviewEnabled, setScrubPreviewEnabled, addEntry, updateEntry, removeEntry }),
    [hydrated, entries, scrubPreviewEnabled, setScrubPreviewEnabled, addEntry, updateEntry, removeEntry]
  );

  return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>;
}

export function useDiary(): DiaryContextValue {
  const ctx = useContext(DiaryContext);
  if (!ctx) throw new Error("useDiary va usato dentro un DiaryProvider");
  return ctx;
}
