"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { newId } from "./id";
import { deleteImage, isDataUrl } from "./image-store";
import { GenealogyFamily, GenealogyPerson, GenealogyRelationship } from "./genealogy-types";
import { BUILT_IN_RELATIONSHIP_TYPES, GenealogyRelationshipType, GenealogyLayoutRole } from "./genealogy-relationship-types";

const PEOPLE_KEY = "vitae:genealogy-people";
const RELATIONSHIPS_KEY = "vitae:genealogy-relationships";
const FAMILIES_KEY = "vitae:genealogy-families";
const CUSTOM_TYPES_KEY = "vitae:genealogy-custom-types";
const HIDDEN_BUILTIN_KEY = "vitae:genealogy-hidden-builtin-types";

type PersonInput = Omit<GenealogyPerson, "id" | "createdAt" | "updatedAt">;
type RelationshipInput = Omit<GenealogyRelationship, "id" | "createdAt" | "updatedAt">;
type FamilyInput = Omit<GenealogyFamily, "id" | "createdAt" | "updatedAt">;
type CustomTypeInput = { label: string; layoutRole: GenealogyLayoutRole; visualEmphasis?: "adoptive" };

interface GenealogyContextValue {
  hydrated: boolean;
  people: GenealogyPerson[];
  relationships: GenealogyRelationship[];
  families: GenealogyFamily[];
  /** Tipi di serie + personalizzati, in un solo elenco — sempre completo, anche i tipi di
   * serie nascosti dal selettore (servono comunque per leggere correttamente le relazioni
   * già salvate che li usano). Per il selettore "aggiungi relazione" usare `visibleTypes`. */
  allTypes: GenealogyRelationshipType[];
  /** Come allTypes, ma senza i tipi di serie nascosti — quello che deve vedere l'utente
   * quando sceglie un nuovo tipo. */
  visibleTypes: GenealogyRelationshipType[];
  /** Gli id dei soli tipi di serie nascosti — usata dalla schermata impostazioni per mostrare
   * lo stato reale già salvato, non uno stato locale che riparte sempre vuoto. */
  hiddenBuiltInIds: string[];

  addPerson: (input: PersonInput) => GenealogyPerson;
  updatePerson: (id: string, patch: Partial<PersonInput>) => void;
  /** Rimuove la persona, ogni relazione che la coinvolge, e ogni famiglia che la aveva come
   * persona di riferimento (il segnalibro non ha più senso senza — non tocca però le altre
   * persone o relazioni: vedi la nota in lib/genealogy-types.ts). */
  removePerson: (id: string) => void;

  addRelationship: (input: RelationshipInput) => GenealogyRelationship;
  updateRelationship: (id: string, patch: Partial<RelationshipInput>) => void;
  removeRelationship: (id: string) => void;
  relationshipsFor: (personId: string) => GenealogyRelationship[];

  addFamily: (input: FamilyInput) => GenealogyFamily;
  updateFamily: (id: string, patch: Partial<FamilyInput>) => void;
  removeFamily: (id: string) => void;

  addCustomType: (input: CustomTypeInput) => GenealogyRelationshipType;
  updateCustomType: (id: string, patch: Partial<CustomTypeInput>) => void;
  /** Rifiutata (senza effetto) se una relazione la usa ancora — mai un tipo orfano dietro un
   * id che sparisce dal catalogo. */
  removeCustomType: (id: string) => boolean;
  setBuiltInTypeHidden: (id: string, hidden: boolean) => void;
}

const GenealogyContext = createContext<GenealogyContextValue | null>(null);

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function GenealogyProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<GenealogyPerson[]>([]);
  const [relationships, setRelationships] = useState<GenealogyRelationship[]>([]);
  const [families, setFamilies] = useState<GenealogyFamily[]>([]);
  const [customTypes, setCustomTypes] = useState<GenealogyRelationshipType[]>([]);
  const [hiddenBuiltIn, setHiddenBuiltIn] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPeople(readJson(PEOPLE_KEY, []));
    setRelationships(readJson(RELATIONSHIPS_KEY, []));
    setFamilies(readJson(FAMILIES_KEY, []));
    setCustomTypes(readJson(CUSTOM_TYPES_KEY, []));
    setHiddenBuiltIn(readJson(HIDDEN_BUILTIN_KEY, []));
    setHydrated(true);
  }, []);

  const persistPeople = useCallback((updater: GenealogyPerson[] | ((prev: GenealogyPerson[]) => GenealogyPerson[])) => {
    setPeople((prev) => {
      const next = typeof updater === "function" ? (updater as (v: GenealogyPerson[]) => GenealogyPerson[])(prev) : updater;
      try {
        window.localStorage.setItem(PEOPLE_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const persistRelationships = useCallback(
    (updater: GenealogyRelationship[] | ((prev: GenealogyRelationship[]) => GenealogyRelationship[])) => {
      setRelationships((prev) => {
        const next =
          typeof updater === "function" ? (updater as (v: GenealogyRelationship[]) => GenealogyRelationship[])(prev) : updater;
        try {
          window.localStorage.setItem(RELATIONSHIPS_KEY, JSON.stringify(next));
        } catch {
          // ignorato
        }
        return next;
      });
    },
    []
  );

  const persistFamilies = useCallback((updater: GenealogyFamily[] | ((prev: GenealogyFamily[]) => GenealogyFamily[])) => {
    setFamilies((prev) => {
      const next = typeof updater === "function" ? (updater as (v: GenealogyFamily[]) => GenealogyFamily[])(prev) : updater;
      try {
        window.localStorage.setItem(FAMILIES_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const persistCustomTypes = useCallback(
    (updater: GenealogyRelationshipType[] | ((prev: GenealogyRelationshipType[]) => GenealogyRelationshipType[])) => {
      setCustomTypes((prev) => {
        const next =
          typeof updater === "function" ? (updater as (v: GenealogyRelationshipType[]) => GenealogyRelationshipType[])(prev) : updater;
        try {
          window.localStorage.setItem(CUSTOM_TYPES_KEY, JSON.stringify(next));
        } catch {
          // ignorato
        }
        return next;
      });
    },
    []
  );

  const persistHiddenBuiltIn = useCallback((updater: string[] | ((prev: string[]) => string[])) => {
    setHiddenBuiltIn((prev) => {
      const next = typeof updater === "function" ? (updater as (v: string[]) => string[])(prev) : updater;
      try {
        window.localStorage.setItem(HIDDEN_BUILTIN_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  // --- Persone ---------------------------------------------------------------------------

  const addPerson = useCallback(
    (input: PersonInput) => {
      const now = new Date().toISOString();
      const person: GenealogyPerson = { ...input, id: newId(), createdAt: now, updatedAt: now };
      persistPeople((prev) => [...prev, person]);
      return person;
    },
    [persistPeople]
  );

  const updatePerson = useCallback(
    (id: string, patch: Partial<PersonInput>) =>
      persistPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p))),
    [persistPeople]
  );

  const removePerson = useCallback(
    (id: string) => {
      const toRemove = people.find((p) => p.id === id);
      if (toRemove?.avatarKey && !isDataUrl(toRemove.avatarKey)) deleteImage(toRemove.avatarKey);
      persistPeople((prev) => prev.filter((p) => p.id !== id));
      persistRelationships((prev) => prev.filter((r) => r.personXId !== id && r.personYId !== id));
      // Una famiglia il cui riferimento non esiste più non punta più a nulla — il segnalibro
      // stesso perde senso, ma questo non tocca nessun'altra persona o relazione.
      persistFamilies((prev) => prev.filter((f) => f.referencePersonId !== id));
    },
    [people, persistPeople, persistRelationships, persistFamilies]
  );

  // --- Relazioni ---------------------------------------------------------------------------

  const addRelationship = useCallback(
    (input: RelationshipInput) => {
      const now = new Date().toISOString();
      const relationship: GenealogyRelationship = { ...input, id: newId(), createdAt: now, updatedAt: now };
      persistRelationships((prev) => [...prev, relationship]);
      return relationship;
    },
    [persistRelationships]
  );

  const updateRelationship = useCallback(
    (id: string, patch: Partial<RelationshipInput>) =>
      persistRelationships((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r))),
    [persistRelationships]
  );

  const removeRelationship = useCallback(
    (id: string) => persistRelationships((prev) => prev.filter((r) => r.id !== id)),
    [persistRelationships]
  );

  const relationshipsFor = useCallback(
    (personId: string) => relationships.filter((r) => r.personXId === personId || r.personYId === personId),
    [relationships]
  );

  // --- Famiglie (segnalibri) ----------------------------------------------------------------

  const addFamily = useCallback(
    (input: FamilyInput) => {
      const now = new Date().toISOString();
      const family: GenealogyFamily = { ...input, id: newId(), createdAt: now, updatedAt: now };
      persistFamilies((prev) => [...prev, family]);
      return family;
    },
    [persistFamilies]
  );

  const updateFamily = useCallback(
    (id: string, patch: Partial<FamilyInput>) =>
      persistFamilies((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch, updatedAt: new Date().toISOString() } : f))),
    [persistFamilies]
  );

  const removeFamily = useCallback((id: string) => persistFamilies((prev) => prev.filter((f) => f.id !== id)), [persistFamilies]);

  // --- Catalogo tipi -------------------------------------------------------------------------

  const allTypes = useMemo(() => [...BUILT_IN_RELATIONSHIP_TYPES, ...customTypes], [customTypes]);
  const visibleTypes = useMemo(() => allTypes.filter((t) => !hiddenBuiltIn.includes(t.id)), [allTypes, hiddenBuiltIn]);

  const addCustomType = useCallback(
    (input: CustomTypeInput) => {
      const type: GenealogyRelationshipType = {
        id: `custom-${newId()}`,
        label: input.label,
        layoutRole: input.layoutRole,
        builtIn: false,
        visualEmphasis: input.visualEmphasis,
      };
      persistCustomTypes((prev) => [...prev, type]);
      return type;
    },
    [persistCustomTypes]
  );

  const updateCustomType = useCallback(
    (id: string, patch: Partial<CustomTypeInput>) =>
      persistCustomTypes((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    [persistCustomTypes]
  );

  const removeCustomType = useCallback(
    (id: string) => {
      const inUse = relationships.some((r) => r.typeIdForX === id || r.typeIdForY === id);
      if (inUse) return false;
      persistCustomTypes((prev) => prev.filter((t) => t.id !== id));
      return true;
    },
    [relationships, persistCustomTypes]
  );

  const setBuiltInTypeHidden = useCallback(
    (id: string, hidden: boolean) =>
      persistHiddenBuiltIn((prev) => (hidden ? [...new Set([...prev, id])] : prev.filter((x) => x !== id))),
    [persistHiddenBuiltIn]
  );

  const value = useMemo(
    () => ({
      hydrated,
      people,
      relationships,
      families,
      allTypes,
      visibleTypes,
      hiddenBuiltInIds: hiddenBuiltIn,
      addPerson,
      updatePerson,
      removePerson,
      addRelationship,
      updateRelationship,
      removeRelationship,
      relationshipsFor,
      addFamily,
      updateFamily,
      removeFamily,
      addCustomType,
      updateCustomType,
      removeCustomType,
      setBuiltInTypeHidden,
    }),
    [
      hydrated,
      people,
      relationships,
      families,
      allTypes,
      visibleTypes,
      hiddenBuiltIn,
      addPerson,
      updatePerson,
      removePerson,
      addRelationship,
      updateRelationship,
      removeRelationship,
      relationshipsFor,
      addFamily,
      updateFamily,
      removeFamily,
      addCustomType,
      updateCustomType,
      removeCustomType,
      setBuiltInTypeHidden,
    ]
  );

  return <GenealogyContext.Provider value={value}>{children}</GenealogyContext.Provider>;
}

export function useGenealogy(): GenealogyContextValue {
  const ctx = useContext(GenealogyContext);
  if (!ctx) throw new Error("useGenealogy va usato dentro un GenealogyProvider");
  return ctx;
}
