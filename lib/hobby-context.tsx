"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { newId } from "./id";
import { deleteImage, isDataUrl } from "./image-store";
import {
  Hobby,
  HobbyBlock,
  HobbyBlockKind,
  ChecklistBlock,
  ChecklistItem,
  MetricBlock,
  MetricEntry,
  InventoryBlock,
  InventoryItem,
  ProjectsBlock,
  Project,
  LibraryBlock,
  LibraryItem,
  MatchesBlock,
  Match,
  collectBlockPhotoKeys,
  collectHobbyPhotoKeys,
} from "./hobby-types";

const HOBBIES_KEY = "vitae:hobbies";

function emptyBlock(kind: HobbyBlockKind, title: string): HobbyBlock {
  const base = { id: newId(), title };
  switch (kind) {
    case "checklist":
      return { ...base, kind, items: [] };
    case "metrica":
      return { ...base, kind, unit: "", direction: "crescente", aggregation: "cumulativa", entries: [] };
    case "inventario":
      return { ...base, kind, items: [] };
    case "progetti":
      return { ...base, kind, projects: [] };
    case "libreria":
      return { ...base, kind, items: [] };
    case "partite":
      return { ...base, kind, matches: [] };
  }
}

function cleanupPhotos(keys: string[]) {
  keys.forEach((k) => {
    if (!isDataUrl(k)) deleteImage(k);
  });
}

interface HobbyContextValue {
  hydrated: boolean;
  hobbies: Hobby[];
  addHobby: (input: { name: string; photoKey?: string; details: Hobby["details"] }) => Hobby;
  updateHobby: (id: string, patch: Partial<Pick<Hobby, "name" | "photoKey" | "details">>) => void;
  removeHobby: (id: string) => void;

  addBlock: (hobbyId: string, kind: HobbyBlockKind, title: string) => void;
  removeBlock: (hobbyId: string, blockId: string) => void;
  renameBlock: (hobbyId: string, blockId: string, title: string) => void;
  setMatchesBlockPhoto: (hobbyId: string, blockId: string, photoKey: string | undefined) => void;
  updateMetricConfig: (hobbyId: string, blockId: string, patch: Partial<Pick<MetricBlock, "unit" | "direction" | "aggregation" | "goalValue" | "goalDeadline">>) => void;

  addChecklistItem: (hobbyId: string, blockId: string, input: Omit<ChecklistItem, "id" | "createdAt">) => void;
  updateChecklistItem: (hobbyId: string, blockId: string, itemId: string, patch: Partial<Omit<ChecklistItem, "id" | "createdAt">>) => void;
  removeChecklistItem: (hobbyId: string, blockId: string, itemId: string) => void;

  addMetricEntry: (hobbyId: string, blockId: string, input: Omit<MetricEntry, "id">) => void;
  updateMetricEntry: (hobbyId: string, blockId: string, entryId: string, patch: Partial<Omit<MetricEntry, "id">>) => void;
  removeMetricEntry: (hobbyId: string, blockId: string, entryId: string) => void;

  addInventoryItem: (hobbyId: string, blockId: string, input: Omit<InventoryItem, "id" | "createdAt">) => void;
  updateInventoryItem: (hobbyId: string, blockId: string, itemId: string, patch: Partial<Omit<InventoryItem, "id" | "createdAt">>) => void;
  removeInventoryItem: (hobbyId: string, blockId: string, itemId: string) => void;

  addProject: (hobbyId: string, blockId: string, input: Omit<Project, "id" | "createdAt">) => void;
  updateProject: (hobbyId: string, blockId: string, projectId: string, patch: Partial<Omit<Project, "id" | "createdAt">>) => void;
  removeProject: (hobbyId: string, blockId: string, projectId: string) => void;

  addLibraryItem: (hobbyId: string, blockId: string, input: Omit<LibraryItem, "id" | "createdAt">) => void;
  updateLibraryItem: (hobbyId: string, blockId: string, itemId: string, patch: Partial<Omit<LibraryItem, "id" | "createdAt">>) => void;
  removeLibraryItem: (hobbyId: string, blockId: string, itemId: string) => void;

  addMatch: (hobbyId: string, blockId: string, input: Omit<Match, "id" | "createdAt">) => void;
  updateMatch: (hobbyId: string, blockId: string, matchId: string, patch: Partial<Omit<Match, "id" | "createdAt">>) => void;
  removeMatch: (hobbyId: string, blockId: string, matchId: string) => void;
}

const HobbyContext = createContext<HobbyContextValue | null>(null);

export function HobbyProvider({ children }: { children: React.ReactNode }) {
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HOBBIES_KEY);
      if (raw) setHobbies(JSON.parse(raw));
    } catch {
      // dati locali non leggibili: si riparte da zero
    } finally {
      setHydrated(true);
    }
  }, []);

  const persist = useCallback((updater: Hobby[] | ((prev: Hobby[]) => Hobby[])) => {
    setHobbies((prev) => {
      const next = typeof updater === "function" ? (updater as (v: Hobby[]) => Hobby[])(prev) : updater;
      try {
        window.localStorage.setItem(HOBBIES_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  /** Aggiorna un blocco di un hobby con una funzione tipizzata sul suo blocco specifico —
   * ogni chiamante conosce già il tipo di blocco a cui sta scrivendo (viene sempre da un
   * componente che quel tipo lo sta già mostrando), quindi il cast qui è sicuro. */
  const withBlock = useCallback(
    <T extends HobbyBlock>(prev: Hobby[], hobbyId: string, blockId: string, updater: (block: T) => T): Hobby[] =>
      prev.map((h) => {
        if (h.id !== hobbyId) return h;
        return { ...h, blocks: h.blocks.map((b) => (b.id === blockId ? updater(b as T) : b)) };
      }),
    []
  );

  // --- Hobby ---
  const addHobby = useCallback(
    (input: { name: string; photoKey?: string; details: Hobby["details"] }) => {
      const hobby: Hobby = { ...input, id: newId(), blocks: [], createdAt: new Date().toISOString() };
      persist((prev) => [...prev, hobby]);
      return hobby;
    },
    [persist]
  );

  const updateHobby = useCallback(
    (id: string, patch: Partial<Pick<Hobby, "name" | "photoKey" | "details">>) =>
      persist((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h))),
    [persist]
  );

  const removeHobby = useCallback(
    (id: string) => {
      const toRemove = hobbies.find((h) => h.id === id);
      if (toRemove) cleanupPhotos(collectHobbyPhotoKeys(toRemove));
      persist((prev) => prev.filter((h) => h.id !== id));
    },
    [persist, hobbies]
  );

  // --- Blocchi ---
  const addBlock = useCallback(
    (hobbyId: string, kind: HobbyBlockKind, title: string) =>
      persist((prev) => prev.map((h) => (h.id === hobbyId ? { ...h, blocks: [...h.blocks, emptyBlock(kind, title)] } : h))),
    [persist]
  );

  const removeBlock = useCallback(
    (hobbyId: string, blockId: string) => {
      const hobby = hobbies.find((h) => h.id === hobbyId);
      const block = hobby?.blocks.find((b) => b.id === blockId);
      if (block) cleanupPhotos(collectBlockPhotoKeys(block));
      persist((prev) => prev.map((h) => (h.id === hobbyId ? { ...h, blocks: h.blocks.filter((b) => b.id !== blockId) } : h)));
    },
    [persist, hobbies]
  );

  const renameBlock = useCallback(
    (hobbyId: string, blockId: string, title: string) =>
      persist((prev) =>
        prev.map((h) => (h.id === hobbyId ? { ...h, blocks: h.blocks.map((b) => (b.id === blockId ? { ...b, title } : b)) } : h))
      ),
    [persist]
  );

  const setMatchesBlockPhoto = useCallback(
    (hobbyId: string, blockId: string, photoKey: string | undefined) =>
      persist((prev) => withBlock<MatchesBlock>(prev, hobbyId, blockId, (b) => ({ ...b, photoKey }))),
    [persist, withBlock]
  );

  const updateMetricConfig = useCallback(
    (hobbyId: string, blockId: string, patch: Partial<Pick<MetricBlock, "unit" | "direction" | "aggregation" | "goalValue" | "goalDeadline">>) =>
      persist((prev) => withBlock<MetricBlock>(prev, hobbyId, blockId, (b) => ({ ...b, ...patch }))),
    [persist, withBlock]
  );

  // --- 1. Checklist ---
  const addChecklistItem = useCallback(
    (hobbyId: string, blockId: string, input: Omit<ChecklistItem, "id" | "createdAt">) =>
      persist((prev) =>
        withBlock<ChecklistBlock>(prev, hobbyId, blockId, (b) => ({
          ...b,
          items: [...b.items, { ...input, id: newId(), createdAt: new Date().toISOString() }],
        }))
      ),
    [persist, withBlock]
  );
  const updateChecklistItem = useCallback(
    (hobbyId: string, blockId: string, itemId: string, patch: Partial<Omit<ChecklistItem, "id" | "createdAt">>) =>
      persist((prev) =>
        withBlock<ChecklistBlock>(prev, hobbyId, blockId, (b) => ({
          ...b,
          items: b.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
        }))
      ),
    [persist, withBlock]
  );
  const removeChecklistItem = useCallback(
    (hobbyId: string, blockId: string, itemId: string) => {
      const hobby = hobbies.find((h) => h.id === hobbyId);
      const block = hobby?.blocks.find((b) => b.id === blockId) as ChecklistBlock | undefined;
      const item = block?.items.find((i) => i.id === itemId);
      if (item) cleanupPhotos(item.photoKeys);
      persist((prev) => withBlock<ChecklistBlock>(prev, hobbyId, blockId, (b) => ({ ...b, items: b.items.filter((i) => i.id !== itemId) })));
    },
    [persist, withBlock, hobbies]
  );

  // --- 2. Metrica ---
  const addMetricEntry = useCallback(
    (hobbyId: string, blockId: string, input: Omit<MetricEntry, "id">) =>
      persist((prev) => withBlock<MetricBlock>(prev, hobbyId, blockId, (b) => ({ ...b, entries: [...b.entries, { ...input, id: newId() }] }))),
    [persist, withBlock]
  );
  const updateMetricEntry = useCallback(
    (hobbyId: string, blockId: string, entryId: string, patch: Partial<Omit<MetricEntry, "id">>) =>
      persist((prev) =>
        withBlock<MetricBlock>(prev, hobbyId, blockId, (b) => ({ ...b, entries: b.entries.map((e) => (e.id === entryId ? { ...e, ...patch } : e)) }))
      ),
    [persist, withBlock]
  );
  const removeMetricEntry = useCallback(
    (hobbyId: string, blockId: string, entryId: string) => {
      const hobby = hobbies.find((h) => h.id === hobbyId);
      const block = hobby?.blocks.find((b) => b.id === blockId) as MetricBlock | undefined;
      const entry = block?.entries.find((e) => e.id === entryId);
      if (entry?.photoKey) cleanupPhotos([entry.photoKey]);
      persist((prev) => withBlock<MetricBlock>(prev, hobbyId, blockId, (b) => ({ ...b, entries: b.entries.filter((e) => e.id !== entryId) })));
    },
    [persist, withBlock, hobbies]
  );

  // --- 3. Inventario ---
  const addInventoryItem = useCallback(
    (hobbyId: string, blockId: string, input: Omit<InventoryItem, "id" | "createdAt">) =>
      persist((prev) =>
        withBlock<InventoryBlock>(prev, hobbyId, blockId, (b) => ({
          ...b,
          items: [...b.items, { ...input, id: newId(), createdAt: new Date().toISOString() }],
        }))
      ),
    [persist, withBlock]
  );
  const updateInventoryItem = useCallback(
    (hobbyId: string, blockId: string, itemId: string, patch: Partial<Omit<InventoryItem, "id" | "createdAt">>) =>
      persist((prev) =>
        withBlock<InventoryBlock>(prev, hobbyId, blockId, (b) => ({ ...b, items: b.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }))
      ),
    [persist, withBlock]
  );
  const removeInventoryItem = useCallback(
    (hobbyId: string, blockId: string, itemId: string) => {
      const hobby = hobbies.find((h) => h.id === hobbyId);
      const block = hobby?.blocks.find((b) => b.id === blockId) as InventoryBlock | undefined;
      const item = block?.items.find((i) => i.id === itemId);
      if (item) cleanupPhotos(item.photoKeys);
      persist((prev) => withBlock<InventoryBlock>(prev, hobbyId, blockId, (b) => ({ ...b, items: b.items.filter((i) => i.id !== itemId) })));
    },
    [persist, withBlock, hobbies]
  );

  // --- 4. Progetti ---
  const addProject = useCallback(
    (hobbyId: string, blockId: string, input: Omit<Project, "id" | "createdAt">) =>
      persist((prev) =>
        withBlock<ProjectsBlock>(prev, hobbyId, blockId, (b) => ({
          ...b,
          projects: [...b.projects, { ...input, id: newId(), createdAt: new Date().toISOString() }],
        }))
      ),
    [persist, withBlock]
  );
  const updateProject = useCallback(
    (hobbyId: string, blockId: string, projectId: string, patch: Partial<Omit<Project, "id" | "createdAt">>) =>
      persist((prev) =>
        withBlock<ProjectsBlock>(prev, hobbyId, blockId, (b) => ({ ...b, projects: b.projects.map((p) => (p.id === projectId ? { ...p, ...patch } : p)) }))
      ),
    [persist, withBlock]
  );
  const removeProject = useCallback(
    (hobbyId: string, blockId: string, projectId: string) => {
      const hobby = hobbies.find((h) => h.id === hobbyId);
      const block = hobby?.blocks.find((b) => b.id === blockId) as ProjectsBlock | undefined;
      const project = block?.projects.find((p) => p.id === projectId);
      if (project) cleanupPhotos(project.photoKeys);
      persist((prev) => withBlock<ProjectsBlock>(prev, hobbyId, blockId, (b) => ({ ...b, projects: b.projects.filter((p) => p.id !== projectId) })));
    },
    [persist, withBlock, hobbies]
  );

  // --- 5. Libreria ---
  const addLibraryItem = useCallback(
    (hobbyId: string, blockId: string, input: Omit<LibraryItem, "id" | "createdAt">) =>
      persist((prev) =>
        withBlock<LibraryBlock>(prev, hobbyId, blockId, (b) => ({
          ...b,
          items: [...b.items, { ...input, id: newId(), createdAt: new Date().toISOString() }],
        }))
      ),
    [persist, withBlock]
  );
  const updateLibraryItem = useCallback(
    (hobbyId: string, blockId: string, itemId: string, patch: Partial<Omit<LibraryItem, "id" | "createdAt">>) =>
      persist((prev) =>
        withBlock<LibraryBlock>(prev, hobbyId, blockId, (b) => ({ ...b, items: b.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }))
      ),
    [persist, withBlock]
  );
  const removeLibraryItem = useCallback(
    (hobbyId: string, blockId: string, itemId: string) => {
      const hobby = hobbies.find((h) => h.id === hobbyId);
      const block = hobby?.blocks.find((b) => b.id === blockId) as LibraryBlock | undefined;
      const item = block?.items.find((i) => i.id === itemId);
      if (item?.photoKey) cleanupPhotos([item.photoKey]);
      persist((prev) => withBlock<LibraryBlock>(prev, hobbyId, blockId, (b) => ({ ...b, items: b.items.filter((i) => i.id !== itemId) })));
    },
    [persist, withBlock, hobbies]
  );

  // --- 6. Partite ---
  const addMatch = useCallback(
    (hobbyId: string, blockId: string, input: Omit<Match, "id" | "createdAt">) =>
      persist((prev) =>
        withBlock<MatchesBlock>(prev, hobbyId, blockId, (b) => ({
          ...b,
          matches: [...b.matches, { ...input, id: newId(), createdAt: new Date().toISOString() }],
        }))
      ),
    [persist, withBlock]
  );
  const updateMatch = useCallback(
    (hobbyId: string, blockId: string, matchId: string, patch: Partial<Omit<Match, "id" | "createdAt">>) =>
      persist((prev) =>
        withBlock<MatchesBlock>(prev, hobbyId, blockId, (b) => ({ ...b, matches: b.matches.map((m) => (m.id === matchId ? { ...m, ...patch } : m)) }))
      ),
    [persist, withBlock]
  );
  const removeMatch = useCallback(
    (hobbyId: string, blockId: string, matchId: string) => {
      const hobby = hobbies.find((h) => h.id === hobbyId);
      const block = hobby?.blocks.find((b) => b.id === blockId) as MatchesBlock | undefined;
      const match = block?.matches.find((m) => m.id === matchId);
      if (match?.photoKey) cleanupPhotos([match.photoKey]);
      persist((prev) => withBlock<MatchesBlock>(prev, hobbyId, blockId, (b) => ({ ...b, matches: b.matches.filter((m) => m.id !== matchId) })));
    },
    [persist, withBlock, hobbies]
  );

  const value = useMemo<HobbyContextValue>(
    () => ({
      hydrated,
      hobbies,
      addHobby,
      updateHobby,
      removeHobby,
      addBlock,
      removeBlock,
      renameBlock,
      setMatchesBlockPhoto,
      updateMetricConfig,
      addChecklistItem,
      updateChecklistItem,
      removeChecklistItem,
      addMetricEntry,
      updateMetricEntry,
      removeMetricEntry,
      addInventoryItem,
      updateInventoryItem,
      removeInventoryItem,
      addProject,
      updateProject,
      removeProject,
      addLibraryItem,
      updateLibraryItem,
      removeLibraryItem,
      addMatch,
      updateMatch,
      removeMatch,
    }),
    [
      hydrated,
      hobbies,
      addHobby,
      updateHobby,
      removeHobby,
      addBlock,
      removeBlock,
      renameBlock,
      setMatchesBlockPhoto,
      updateMetricConfig,
      addChecklistItem,
      updateChecklistItem,
      removeChecklistItem,
      addMetricEntry,
      updateMetricEntry,
      removeMetricEntry,
      addInventoryItem,
      updateInventoryItem,
      removeInventoryItem,
      addProject,
      updateProject,
      removeProject,
      addLibraryItem,
      updateLibraryItem,
      removeLibraryItem,
      addMatch,
      updateMatch,
      removeMatch,
    ]
  );

  return <HobbyContext.Provider value={value}>{children}</HobbyContext.Provider>;
}

export function useHobby(): HobbyContextValue {
  const ctx = useContext(HobbyContext);
  if (!ctx) throw new Error("useHobby va usato dentro un HobbyProvider");
  return ctx;
}
