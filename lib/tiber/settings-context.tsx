"use client";
import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { TIBER_MODULES } from "./registry";

const STORAGE_KEY = "vitae:tiber-settings";

interface TiberSettingsValue {
  hydrated: boolean;
  /** id dei moduli (vedi TIBER_MODULES in registry.ts) a cui Tiber NON ha accesso — assenti
   * = accesso concesso, coerente con il comportamento di sempre finché l'utente non
   * disattiva esplicitamente qualcosa. */
  disabledModules: string[];
  toggleModule: (id: string, enabled: boolean) => void;
  /** L'interruttore per le "intromissioni" — i commenti/le domande che Tiber fa di sua
   * iniziativa (vedi triggerReflection in context.tsx). Non tocca la possibilità di
   * chattare con lui normalmente, solo la sua iniziativa spontanea. */
  proactiveEnabled: boolean;
  setProactiveEnabled: (v: boolean) => void;
  /** L'interruttore "Tiber ti parla" — spento di default. Accende insieme tre cose sempre
   * come blocco unico, mai separatamente: la lettura ad alta voce delle risposte di Tiber
   * (lib/tiber/speech.ts), il microfono nella chat normale, e il popup con conferma prima
   * dell'audio per le intromissioni spontanee sulla bolla flottante (TiberFloatingBubble.tsx).
   * Spento, quel popup non esiste nemmeno: la bolla si comporta esattamente come prima che
   * questo interruttore esistesse — non un ramo "silenzioso" dello stesso codice, un ramo
   * diverso che non chiama mai né speechSynthesis né getUserMedia. */
  voiceEnabled: boolean;
  setVoiceEnabled: (v: boolean) => void;
}

const TiberSettingsContext = createContext<TiberSettingsValue | null>(null);

interface StoredSettings {
  disabledModules: string[];
  proactiveEnabled: boolean;
  voiceEnabled: boolean;
}

const DEFAULTS: StoredSettings = { disabledModules: [], proactiveEnabled: true, voiceEnabled: false };

export function TiberSettingsProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [disabledModules, setDisabledModules] = useState<string[]>(DEFAULTS.disabledModules);
  const [proactiveEnabled, setProactiveEnabledState] = useState(DEFAULTS.proactiveEnabled);
  const [voiceEnabled, setVoiceEnabledState] = useState(DEFAULTS.voiceEnabled);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredSettings>;
        // Filtrati contro i moduli davvero esistenti — un id salvato da una versione
        // precedente dell'app che avesse rinominato/rimosso un modulo non deve bloccare
        // silenziosamente qualcosa che l'utente non ha mai scelto di disattivare.
        const validIds = new Set(TIBER_MODULES.map((m) => m.id));
        setDisabledModules((parsed.disabledModules ?? []).filter((id) => validIds.has(id)));
        if (typeof parsed.proactiveEnabled === "boolean") setProactiveEnabledState(parsed.proactiveEnabled);
        // Assente in ogni salvataggio fatto prima di questa funzionalità — resta il default
        // (spento) invece di andare in errore o forzare `false` esplicitamente qui: è già
        // `false` di suo in DEFAULTS, questo è solo il caso in cui il campo esiste davvero.
        if (typeof parsed.voiceEnabled === "boolean") setVoiceEnabledState(parsed.voiceEnabled);
      }
    } catch {
      // dati locali non leggibili: si riparte dai default
    } finally {
      setHydrated(true);
    }
  }, []);

  const persist = useCallback((next: StoredSettings) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignorato
    }
  }, []);

  const toggleModule = useCallback(
    (id: string, enabled: boolean) => {
      setDisabledModules((prev) => {
        const next = enabled ? prev.filter((x) => x !== id) : Array.from(new Set([...prev, id]));
        persist({ disabledModules: next, proactiveEnabled, voiceEnabled });
        return next;
      });
    },
    [persist, proactiveEnabled, voiceEnabled]
  );

  const setProactiveEnabled = useCallback(
    (v: boolean) => {
      setProactiveEnabledState(v);
      persist({ disabledModules, proactiveEnabled: v, voiceEnabled });
    },
    [persist, disabledModules, voiceEnabled]
  );

  const setVoiceEnabled = useCallback(
    (v: boolean) => {
      setVoiceEnabledState(v);
      persist({ disabledModules, proactiveEnabled, voiceEnabled: v });
    },
    [persist, disabledModules, proactiveEnabled]
  );

  const value: TiberSettingsValue = {
    hydrated,
    disabledModules,
    toggleModule,
    proactiveEnabled,
    setProactiveEnabled,
    voiceEnabled,
    setVoiceEnabled,
  };
  return <TiberSettingsContext.Provider value={value}>{children}</TiberSettingsContext.Provider>;
}

export function useTiberSettings(): TiberSettingsValue {
  const ctx = useContext(TiberSettingsContext);
  if (!ctx) throw new Error("useTiberSettings va usato dentro un TiberSettingsProvider");
  return ctx;
}
