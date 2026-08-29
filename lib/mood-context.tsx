"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { DEFAULT_MOODS, TRIGGER_CATALOG, MoodDefinition } from "./mood-catalog";
import { TASK_COLORS } from "./task-colors";
import { hashToUnit } from "./hash";
import { newId } from "./id";

const MOODS_KEY = "vitae:custom-moods";
const TRIGGER_MAP_KEY = "vitae:mood-trigger-map";
const ACTIVE_MOOD_KEY = "vitae:active-mood";
const SHARE_ON_VITAECOM_KEY = "vitae:share-mood-vitaecom";

/** Dura 12 ore reali — dopo si spegne da sola e si ricade su "Normale", non serve azzerarla
 * a mano. Prima era un'ora: troppo poco per uno stato che, nella pratica, resta valido per
 * buona parte della giornata. */
const MOOD_DURATION_MS = 12 * 60 * 60 * 1000;

export interface ActiveMood {
  moodId: string;
  startedAt: string;
}

interface PendingSuggestion {
  triggerKey: string;
  candidateMoodIds: string[];
}

interface MoodContextValue {
  hydrated: boolean;
  allMoods: MoodDefinition[];
  /** La mappatura innesco → stati possibili, tutta e sola quella scelta dall'utente — parte
   * dai suggerimenti del catalogo solo la primissima volta, mai più imposta da qui. */
  triggerMap: Record<string, string[]>;
  setTriggerMoods: (triggerKey: string, moodIds: string[]) => void;
  addCustomMood: (label: string) => string;
  removeCustomMood: (id: string) => void;
  /** Chiamata da ogni angolo dell'app dove succede qualcosa di potenzialmente emotivo — se
   * per quell'innesco non è configurato nessuno stato, non fa nulla in silenzio. */
  fireTrigger: (triggerKey: string) => void;
  pendingSuggestion: PendingSuggestion | null;
  confirmMood: (moodId: string) => void;
  dismissSuggestion: () => void;
  setMoodManually: (moodId: string) => void;
  clearMood: () => void;
  activeMood: ActiveMood | null;
  /** 1 = appena scelto, scende linearmente a 0 nell'arco delle 12 ore — usato per il bloom e
   * per quanto la tinta è marcata su card e barra di navigazione. */
  activeMoodIntensity: number;
  /** "Condividi Stato D'Animo Su Vitaecom" (vedi il pop-up "Ti Senti Così?") — se spenta, il
   * profilo Vitaecom mostra sempre "Normale" invece dello stato reale, indipendentemente da
   * cosa succede nel resto dell'app. Acceso di serie: la scelta di nascondersi è esplicita,
   * non il contrario. */
  shareMoodOnVitaecom: boolean;
  setShareMoodOnVitaecom: (value: boolean) => void;
}

const MoodContext = createContext<MoodContextValue | null>(null);

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function MoodProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [customMoods, setCustomMoods] = useState<MoodDefinition[]>([]);
  const [triggerMap, setTriggerMapState] = useState<Record<string, string[]>>({});
  const [activeMood, setActiveMood] = useState<ActiveMood | null>(null);
  const [pendingSuggestion, setPendingSuggestion] = useState<PendingSuggestion | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [shareMoodOnVitaecom, setShareMoodOnVitaecomState] = useState(true);

  useEffect(() => {
    const loadedMoods = loadJson<MoodDefinition[]>(MOODS_KEY, []);
    // La mappatura parte dai suggerimenti del catalogo solo se non è mai stata salvata
    // nulla — un solo seed, la primissima volta: da lì in poi è scritta solo dall'utente.
    const loadedMap = loadJson<Record<string, string[]> | null>(TRIGGER_MAP_KEY, null);
    const seededMap =
      loadedMap ?? Object.fromEntries(TRIGGER_CATALOG.map((t) => [t.key, t.defaultMoodIds]));
    const loadedActive = loadJson<ActiveMood | null>(ACTIVE_MOOD_KEY, null);
    const loadedShare = loadJson<boolean>(SHARE_ON_VITAECOM_KEY, true);

    setCustomMoods(loadedMoods);
    setTriggerMapState(seededMap);
    if (loadedActive && Date.now() - new Date(loadedActive.startedAt).getTime() < MOOD_DURATION_MS) {
      setActiveMood(loadedActive);
    }
    setShareMoodOnVitaecomState(loadedShare);
    setHydrated(true);
  }, []);

  // Ticchetta ogni mezzo minuto: basta a far scendere dolcemente l'intensità (con la
  // transizione CSS a fare il resto) e a spegnere lo stato da solo passate le 12 ore.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!activeMood) return;
    const elapsed = now - new Date(activeMood.startedAt).getTime();
    if (elapsed >= MOOD_DURATION_MS) setActiveMood(null);
  }, [now, activeMood]);

  const persistMoods = useCallback((next: MoodDefinition[]) => {
    setCustomMoods(next);
    try {
      window.localStorage.setItem(MOODS_KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  const persistMap = useCallback((next: Record<string, string[]>) => {
    setTriggerMapState(next);
    try {
      window.localStorage.setItem(TRIGGER_MAP_KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  const persistActive = useCallback((next: ActiveMood | null) => {
    setActiveMood(next);
    try {
      if (next) window.localStorage.setItem(ACTIVE_MOOD_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(ACTIVE_MOOD_KEY);
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  const allMoods = useMemo(() => [...DEFAULT_MOODS, ...customMoods], [customMoods]);

  const setTriggerMoods = useCallback(
    (triggerKey: string, moodIds: string[]) => {
      persistMap({ ...triggerMap, [triggerKey]: moodIds });
    },
    [triggerMap, persistMap]
  );

  const addCustomMood = useCallback(
    (label: string) => {
      const id = newId();
      const color = TASK_COLORS[Math.floor(hashToUnit(id) * TASK_COLORS.length) % TASK_COLORS.length];
      persistMoods([...customMoods, { id, label, color, builtIn: false }]);
      return id;
    },
    [customMoods, persistMoods]
  );

  const removeCustomMood = useCallback(
    (id: string) => {
      persistMoods(customMoods.filter((m) => m.id !== id));
      // Nessun innesco deve restare a puntare a uno stato che non esiste più.
      const nextMap: Record<string, string[]> = {};
      Object.entries(triggerMap).forEach(([k, ids]) => {
        nextMap[k] = ids.filter((x) => x !== id);
      });
      persistMap(nextMap);
      if (activeMood?.moodId === id) persistActive(null);
    },
    [customMoods, persistMoods, triggerMap, persistMap, activeMood, persistActive]
  );

  const fireTrigger = useCallback(
    (triggerKey: string) => {
      const candidates = triggerMap[triggerKey];
      if (!candidates || candidates.length === 0) return;
      setPendingSuggestion({ triggerKey, candidateMoodIds: candidates });
    },
    [triggerMap]
  );

  const confirmMood = useCallback(
    (moodId: string) => {
      persistActive({ moodId, startedAt: new Date().toISOString() });
      setPendingSuggestion(null);
    },
    [persistActive]
  );

  const dismissSuggestion = useCallback(() => setPendingSuggestion(null), []);

  const setMoodManually = useCallback(
    (moodId: string) => {
      persistActive({ moodId, startedAt: new Date().toISOString() });
    },
    [persistActive]
  );

  const clearMood = useCallback(() => persistActive(null), [persistActive]);

  const setShareMoodOnVitaecom = useCallback((value: boolean) => {
    setShareMoodOnVitaecomState(value);
    try {
      window.localStorage.setItem(SHARE_ON_VITAECOM_KEY, JSON.stringify(value));
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  const activeMoodIntensity = useMemo(() => {
    if (!activeMood) return 0;
    const elapsed = now - new Date(activeMood.startedAt).getTime();
    return Math.max(0, 1 - elapsed / MOOD_DURATION_MS);
  }, [activeMood, now]);

  return (
    <MoodContext.Provider
      value={{
        hydrated,
        allMoods,
        triggerMap,
        setTriggerMoods,
        addCustomMood,
        removeCustomMood,
        fireTrigger,
        pendingSuggestion,
        confirmMood,
        dismissSuggestion,
        setMoodManually,
        clearMood,
        activeMood,
        activeMoodIntensity,
        shareMoodOnVitaecom,
        setShareMoodOnVitaecom,
      }}
    >
      {children}
    </MoodContext.Provider>
  );
}

export function useMood(): MoodContextValue {
  const ctx = useContext(MoodContext);
  if (!ctx) throw new Error("useMood deve essere usato dentro MoodProvider");
  return ctx;
}
