"use client";
import React, { createContext, useContext, useCallback } from "react";
import { useCollection } from "./use-collection";
import { deleteImage, isDataUrl } from "./image-store";

const REPORTS_KEY = "vitae:medical-reports";
const APPOINTMENTS_KEY = "vitae:medical-appointments";
const BLOOD_TESTS_KEY = "vitae:medical-blood-tests";
const VITALS_KEY = "vitae:medical-vitals";
const MEDICATIONS_KEY = "vitae:medical-medications";
const CONDITIONS_KEY = "vitae:medical-conditions";
const SURGERIES_KEY = "vitae:medical-surgeries";
const FAMILY_HISTORY_KEY = "vitae:medical-family-history";
const ALLERGIES_KEY = "vitae:medical-allergies";
const VACCINATIONS_KEY = "vitae:medical-vaccinations";
const CONTACTS_KEY = "vitae:medical-contacts";
const SYMPTOMS_KEY = "vitae:medical-symptoms";

export interface MedicalReport {
  id: string;
  title: string;
  /** Libero apposta (non un elenco chiuso): "Analisi", "Visita", "Imaging", o quello che
   * la persona scrive — un referto reale non entra sempre in una categoria pulita. */
  type: string;
  date: string;
  doctorOrLab?: string;
  notes?: string;
  /** Foto del referto, stessa chiave di image-store.ts già usata altrove nell'app. */
  photoKey?: string;
}

export interface MedicalAppointment {
  id: string;
  title: string;
  specialist?: string;
  place?: string;
  date: string;
  notes?: string;
  completed: boolean;
}

export interface BloodTestValue {
  id: string;
  name: string;
  value: number;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
}

export interface BloodTestPanel {
  id: string;
  date: string;
  lab?: string;
  values: BloodTestValue[];
  notes?: string;
}

export type VitalType = "pressione" | "battito" | "glicemia";

/** Sempre inserita a mano — vedi la nota nel README sul perché non esiste (e non può
 * esistere, senza un server dietro o un'app nativa) una sincronizzazione automatica con
 * smartwatch o app come Zepp/Mi Fit/Google Fit. */
export interface VitalEntry {
  id: string;
  type: VitalType;
  date: string;
  systolic?: number;
  diastolic?: number;
  value?: number;
}

export interface Medication {
  id: string;
  name: string;
  dosage?: string;
  times: string[];
  startDate?: string;
  /** Vuoto = ancora in corso. */
  endDate?: string;
  notes?: string;
}

export interface MedicalCondition {
  id: string;
  name: string;
  since?: string;
  notes?: string;
}

export interface Surgery {
  id: string;
  name: string;
  date?: string;
  notes?: string;
}

export interface FamilyHistoryEntry {
  id: string;
  condition: string;
  relative: string;
  notes?: string;
}

export interface Allergy {
  id: string;
  name: string;
  severity?: "lieve" | "moderata" | "grave";
  reaction?: string;
}

export interface Vaccination {
  id: string;
  name: string;
  date?: string;
  nextDueDate?: string;
  notes?: string;
}

export interface MedicalContact {
  id: string;
  name: string;
  role: string;
  phone?: string;
  address?: string;
}

export interface SymptomEntry {
  id: string;
  name: string;
  date: string;
  severity: number;
  durationNote?: string;
  notes?: string;
}

interface MedicalContextValue {
  hydrated: boolean;

  reports: MedicalReport[];
  addReport: (r: Omit<MedicalReport, "id">) => void;
  updateReport: (id: string, patch: Partial<Omit<MedicalReport, "id">>) => void;
  removeReport: (id: string) => void;

  appointments: MedicalAppointment[];
  addAppointment: (a: Omit<MedicalAppointment, "id">) => void;
  updateAppointment: (id: string, patch: Partial<Omit<MedicalAppointment, "id">>) => void;
  removeAppointment: (id: string) => void;

  bloodTests: BloodTestPanel[];
  addBloodTest: (b: Omit<BloodTestPanel, "id">) => void;
  removeBloodTest: (id: string) => void;

  vitals: VitalEntry[];
  addVital: (v: Omit<VitalEntry, "id">) => void;
  removeVital: (id: string) => void;

  medications: Medication[];
  addMedication: (m: Omit<Medication, "id">) => void;
  updateMedication: (id: string, patch: Partial<Omit<Medication, "id">>) => void;
  removeMedication: (id: string) => void;

  conditions: MedicalCondition[];
  addCondition: (c: Omit<MedicalCondition, "id">) => void;
  removeCondition: (id: string) => void;

  surgeries: Surgery[];
  addSurgery: (s: Omit<Surgery, "id">) => void;
  removeSurgery: (id: string) => void;

  familyHistory: FamilyHistoryEntry[];
  addFamilyHistory: (f: Omit<FamilyHistoryEntry, "id">) => void;
  removeFamilyHistory: (id: string) => void;

  allergies: Allergy[];
  addAllergy: (a: Omit<Allergy, "id">) => void;
  removeAllergy: (id: string) => void;

  vaccinations: Vaccination[];
  addVaccination: (v: Omit<Vaccination, "id">) => void;
  removeVaccination: (id: string) => void;

  contacts: MedicalContact[];
  addContact: (c: Omit<MedicalContact, "id">) => void;
  removeContact: (id: string) => void;

  symptoms: SymptomEntry[];
  addSymptom: (s: Omit<SymptomEntry, "id">) => void;
  removeSymptom: (id: string) => void;
}

const MedicalContext = createContext<MedicalContextValue | null>(null);

export function MedicalProvider({ children }: { children: React.ReactNode }) {
  const reports = useCollection<MedicalReport>(REPORTS_KEY);
  const appointments = useCollection<MedicalAppointment>(APPOINTMENTS_KEY);
  const bloodTests = useCollection<BloodTestPanel>(BLOOD_TESTS_KEY);
  const vitals = useCollection<VitalEntry>(VITALS_KEY);
  const medications = useCollection<Medication>(MEDICATIONS_KEY);
  const conditions = useCollection<MedicalCondition>(CONDITIONS_KEY);
  const surgeries = useCollection<Surgery>(SURGERIES_KEY);
  const familyHistory = useCollection<FamilyHistoryEntry>(FAMILY_HISTORY_KEY);
  const allergies = useCollection<Allergy>(ALLERGIES_KEY);
  const vaccinations = useCollection<Vaccination>(VACCINATIONS_KEY);
  const contacts = useCollection<MedicalContact>(CONTACTS_KEY);
  const symptoms = useCollection<SymptomEntry>(SYMPTOMS_KEY);

  /**
   * Corretto secondo le istruzioni: `reports` è l'unica delle dodici collezioni di questo
   * context ad avere un campo foto (`photoKey`, la foto del referto) — ma passava finora
   * dall'helper generico `useCollection`, che non sa nulla di quel campo e cancella solo la
   * voce dall'array. Un referto eliminato lasciava così la sua foto orfana per sempre in
   * IndexedDB (mai più raggiungibile, mai più liberata) — lo stesso problema già risolto per
   * hobby, diario, genealogia, wishlist e animali. `updateReport` ripulisce anche la vecchia
   * foto quando viene sostituita o rimossa dal referto (stesso principio di
   * diary-context.tsx: letto prima della scrittura, non dentro l'updater funzionale, perché
   * è un effetto collaterale sullo storage binario e non fa parte del calcolo del nuovo
   * array).
   */
  const updateReport = useCallback(
    (id: string, patch: Partial<Omit<MedicalReport, "id">>) => {
      if ("photoKey" in patch) {
        const current = reports.items.find((r) => r.id === id);
        if (current?.photoKey && current.photoKey !== patch.photoKey && !isDataUrl(current.photoKey)) {
          deleteImage(current.photoKey);
        }
      }
      reports.update(id, patch);
    },
    [reports]
  );

  const removeReport = useCallback(
    (id: string) => {
      const toRemove = reports.items.find((r) => r.id === id);
      if (toRemove?.photoKey && !isDataUrl(toRemove.photoKey)) deleteImage(toRemove.photoKey);
      reports.remove(id);
    },
    [reports]
  );

  const hydrated =
    reports.hydrated &&
    appointments.hydrated &&
    bloodTests.hydrated &&
    vitals.hydrated &&
    medications.hydrated &&
    conditions.hydrated &&
    surgeries.hydrated &&
    familyHistory.hydrated &&
    allergies.hydrated &&
    vaccinations.hydrated &&
    contacts.hydrated &&
    symptoms.hydrated;

  return (
    <MedicalContext.Provider
      value={{
        hydrated,
        reports: reports.items,
        addReport: reports.add,
        updateReport,
        removeReport,
        appointments: appointments.items,
        addAppointment: appointments.add,
        updateAppointment: appointments.update,
        removeAppointment: appointments.remove,
        bloodTests: bloodTests.items,
        addBloodTest: bloodTests.add,
        removeBloodTest: bloodTests.remove,
        vitals: vitals.items,
        addVital: vitals.add,
        removeVital: vitals.remove,
        medications: medications.items,
        addMedication: medications.add,
        updateMedication: medications.update,
        removeMedication: medications.remove,
        conditions: conditions.items,
        addCondition: conditions.add,
        removeCondition: conditions.remove,
        surgeries: surgeries.items,
        addSurgery: surgeries.add,
        removeSurgery: surgeries.remove,
        familyHistory: familyHistory.items,
        addFamilyHistory: familyHistory.add,
        removeFamilyHistory: familyHistory.remove,
        allergies: allergies.items,
        addAllergy: allergies.add,
        removeAllergy: allergies.remove,
        vaccinations: vaccinations.items,
        addVaccination: vaccinations.add,
        removeVaccination: vaccinations.remove,
        contacts: contacts.items,
        addContact: contacts.add,
        removeContact: contacts.remove,
        symptoms: symptoms.items,
        addSymptom: symptoms.add,
        removeSymptom: symptoms.remove,
      }}
    >
      {children}
    </MedicalContext.Provider>
  );
}

export function useMedical(): MedicalContextValue {
  const ctx = useContext(MedicalContext);
  if (!ctx) throw new Error("useMedical deve essere usato dentro MedicalProvider");
  return ctx;
}
