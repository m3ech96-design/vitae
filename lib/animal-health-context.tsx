"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { newId } from "./id";
import { deleteImage, isDataUrl } from "./image-store";

const VACCINATIONS_KEY = "vitae:animal-vaccinations";
const MEDICATIONS_KEY = "vitae:animal-medications";
const APPOINTMENTS_KEY = "vitae:animal-appointments";
const REPORTS_KEY = "vitae:animal-reports";
const ALLERGIES_KEY = "vitae:animal-allergies";
const WEIGHT_KEY = "vitae:animal-weight";

export interface AnimalVaccination {
  id: string;
  animalId: string;
  name: string;
  date: string;
  /** Richiamo previsto — è la data che il notificatore globale guarda per avvisare, non
   * legata a comparire nel riquadro Casa (vedi AnimalNotifier.tsx). */
  nextDueDate?: string;
  notes?: string;
}

export interface AnimalMedication {
  id: string;
  animalId: string;
  name: string;
  dosage?: string;
  times: string[]; // HH:MM
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface AnimalAppointment {
  id: string;
  animalId: string;
  title: string;
  vetName?: string;
  place?: string;
  date: string;
  notes?: string;
  completed: boolean;
}

export interface AnimalReport {
  id: string;
  animalId: string;
  title: string;
  /** Libero apposta, come in Salute — "Analisi", "Visita", "Intervento", o quello che si
   * scrive: comprende qui anche gli interventi chirurgici, invece di una collezione a
   * parte quasi identica solo per quello. */
  type: string;
  date: string;
  notes?: string;
  photoKey?: string;
}

export interface AnimalAllergy {
  id: string;
  animalId: string;
  name: string;
  severity?: "lieve" | "moderata" | "grave";
  reaction?: string;
}

export interface AnimalWeightEntry {
  id: string;
  animalId: string;
  date: string;
  value: number; // kg
}

interface AnimalHealthContextValue {
  hydrated: boolean;
  vaccinations: AnimalVaccination[];
  addVaccination: (v: Omit<AnimalVaccination, "id">) => void;
  updateVaccination: (id: string, patch: Partial<Omit<AnimalVaccination, "id" | "animalId">>) => void;
  removeVaccination: (id: string) => void;
  medications: AnimalMedication[];
  addMedication: (m: Omit<AnimalMedication, "id">) => void;
  updateMedication: (id: string, patch: Partial<Omit<AnimalMedication, "id" | "animalId">>) => void;
  removeMedication: (id: string) => void;
  appointments: AnimalAppointment[];
  addAppointment: (a: Omit<AnimalAppointment, "id">) => void;
  updateAppointment: (id: string, patch: Partial<Omit<AnimalAppointment, "id" | "animalId">>) => void;
  removeAppointment: (id: string) => void;
  reports: AnimalReport[];
  addReport: (r: Omit<AnimalReport, "id">) => void;
  removeReport: (id: string) => void;
  allergies: AnimalAllergy[];
  addAllergy: (a: Omit<AnimalAllergy, "id">) => void;
  removeAllergy: (id: string) => void;
  weightEntries: AnimalWeightEntry[];
  addWeightEntry: (w: Omit<AnimalWeightEntry, "id">) => void;
  removeWeightEntry: (id: string) => void;
  /** Tutto quello che riguarda un solo animale, già filtrato — comodo per la scheda di
   * dettaglio, che altrimenti dovrebbe rifiltrare sei elenchi ogni volta a mano. */
  forAnimal: (animalId: string) => {
    vaccinations: AnimalVaccination[];
    medications: AnimalMedication[];
    appointments: AnimalAppointment[];
    reports: AnimalReport[];
    allergies: AnimalAllergy[];
    weightEntries: AnimalWeightEntry[];
  };
  /** Elimina ogni record sanitario di un animale (comprese le foto dei referti in
   * IndexedDB) — da chiamare insieme a `removePerson` quando si elimina l'animale stesso,
   * altrimenti questi record resterebbero orfani per sempre, mai più raggiungibili né
   * cancellati. */
  removeAllForAnimal: (animalId: string) => void;
}

const AnimalHealthContext = createContext<AnimalHealthContextValue | null>(null);

/** Stessa forma funzionale sicura di lib/medical-context.tsx (da cui questo file è ricalcato
 * quasi a specchio, con `animalId` in più su ogni record) — un solo posto, non sei quasi
 * identici, per il pattern di persistenza. */
function useCollection<T extends { id: string }>(key: string) {
  const [items, setItems] = useState<T[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setItems(JSON.parse(raw) as T[]);
    } catch {
      // dati corrotti: riparte da una lista vuota
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback(
    (updater: T[] | ((prev: T[]) => T[])) => {
      setItems((prev) => {
        const next = typeof updater === "function" ? (updater as (p: T[]) => T[])(prev) : updater;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // storage non disponibile: continua solo in memoria
        }
        return next;
      });
    },
    [key]
  );

  const add = useCallback((item: Omit<T, "id">) => persist((prev) => [...prev, { ...item, id: newId() } as T]), [persist]);
  const update = useCallback(
    (id: string, patch: Partial<Omit<T, "id">>) => persist((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    [persist]
  );
  const remove = useCallback((id: string) => persist((prev) => prev.filter((x) => x.id !== id)), [persist]);
  const removeWhere = useCallback((predicate: (item: T) => boolean) => persist((prev) => prev.filter((x) => !predicate(x))), [persist]);

  return { items, hydrated, add, update, remove, removeWhere };
}

export function AnimalHealthProvider({ children }: { children: React.ReactNode }) {
  const vaccinations = useCollection<AnimalVaccination>(VACCINATIONS_KEY);
  const medications = useCollection<AnimalMedication>(MEDICATIONS_KEY);
  const appointments = useCollection<AnimalAppointment>(APPOINTMENTS_KEY);
  const reports = useCollection<AnimalReport>(REPORTS_KEY);
  const allergies = useCollection<AnimalAllergy>(ALLERGIES_KEY);
  const weightEntries = useCollection<AnimalWeightEntry>(WEIGHT_KEY);

  const hydrated =
    vaccinations.hydrated && medications.hydrated && appointments.hydrated && reports.hydrated && allergies.hydrated && weightEntries.hydrated;

  const forAnimal = useCallback(
    (animalId: string) => ({
      vaccinations: vaccinations.items.filter((v) => v.animalId === animalId),
      medications: medications.items.filter((m) => m.animalId === animalId),
      appointments: appointments.items.filter((a) => a.animalId === animalId),
      reports: reports.items.filter((r) => r.animalId === animalId),
      allergies: allergies.items.filter((a) => a.animalId === animalId),
      weightEntries: weightEntries.items.filter((w) => w.animalId === animalId),
    }),
    [vaccinations.items, medications.items, appointments.items, reports.items, allergies.items, weightEntries.items]
  );

  const removeAllForAnimal = useCallback(
    (animalId: string) => {
      reports.items
        .filter((r) => r.animalId === animalId && r.photoKey && !isDataUrl(r.photoKey))
        .forEach((r) => deleteImage(r.photoKey!));
      vaccinations.removeWhere((x) => x.animalId === animalId);
      medications.removeWhere((x) => x.animalId === animalId);
      appointments.removeWhere((x) => x.animalId === animalId);
      reports.removeWhere((x) => x.animalId === animalId);
      allergies.removeWhere((x) => x.animalId === animalId);
      weightEntries.removeWhere((x) => x.animalId === animalId);
    },
    [vaccinations, medications, appointments, reports, allergies, weightEntries]
  );

  const value = useMemo<AnimalHealthContextValue>(
    () => ({
      hydrated,
      vaccinations: vaccinations.items,
      addVaccination: vaccinations.add,
      updateVaccination: vaccinations.update,
      removeVaccination: vaccinations.remove,
      medications: medications.items,
      addMedication: medications.add,
      updateMedication: medications.update,
      removeMedication: medications.remove,
      appointments: appointments.items,
      addAppointment: appointments.add,
      updateAppointment: appointments.update,
      removeAppointment: appointments.remove,
      reports: reports.items,
      addReport: reports.add,
      removeReport: reports.remove,
      allergies: allergies.items,
      addAllergy: allergies.add,
      removeAllergy: allergies.remove,
      weightEntries: weightEntries.items,
      addWeightEntry: weightEntries.add,
      removeWeightEntry: weightEntries.remove,
      forAnimal,
      removeAllForAnimal,
    }),
    [hydrated, vaccinations, medications, appointments, reports, allergies, weightEntries, forAnimal, removeAllForAnimal]
  );

  return <AnimalHealthContext.Provider value={value}>{children}</AnimalHealthContext.Provider>;
}

export function useAnimalHealth(): AnimalHealthContextValue {
  const ctx = useContext(AnimalHealthContext);
  if (!ctx) throw new Error("useAnimalHealth va usato dentro un AnimalHealthProvider");
  return ctx;
}
