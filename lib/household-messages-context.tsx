"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { newId } from "./id";

const MESSAGES_KEY = "vitae:household-messages";

export type MessageUrgency = "normale" | "importante" | "urgente";

export interface HouseholdMessage {
  id: string;
  text: string;
  urgency: MessageUrgency;
  createdAt: string;
  /** Chi ha confermato di averlo letto — id di persona (o "user" per l'utente stesso). */
  readBy: string[];
}

interface HouseholdMessagesContextValue {
  hydrated: boolean;
  messages: HouseholdMessage[];
  addMessage: (text: string, urgency: MessageUrgency) => void;
  markRead: (id: string, personId: string) => void;
  removeMessage: (id: string) => void;
}

const HouseholdMessagesContext = createContext<HouseholdMessagesContextValue | null>(null);

/**
 * "Tutti i membri della casa sono notificati all'istante" è il comportamento vero a cui
 * questo tende — ma richiede più dispositivi collegati a un server reale, che questa app non
 * ha ancora (è solo-locale: un utente reale più account dimostrativi, vedi la nota già
 * dichiarata altrove sul futuro passaggio multi-persona). Qui il messaggio appare comunque
 * all'istante, ma solo su QUESTO dispositivo — il modello dati (readBy per persona,
 * indipendente da chi lo consulta) è già corretto per quando quel giorno arriverà, non da
 * riscrivere allora.
 */
export function HouseholdMessagesProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<HouseholdMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(MESSAGES_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch {
      // dati locali non leggibili: si riparte da zero
    } finally {
      setHydrated(true);
    }
  }, []);

  const persist = useCallback((updater: HouseholdMessage[] | ((prev: HouseholdMessage[]) => HouseholdMessage[])) => {
    setMessages((prev) => {
      const next = typeof updater === "function" ? (updater as (v: HouseholdMessage[]) => HouseholdMessage[])(prev) : updater;
      try {
        window.localStorage.setItem(MESSAGES_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const addMessage = useCallback(
    (text: string, urgency: MessageUrgency) =>
      persist((prev) => [...prev, { id: newId(), text, urgency, createdAt: new Date().toISOString(), readBy: [] }]),
    [persist]
  );

  const markRead = useCallback(
    (id: string, personId: string) =>
      persist((prev) => prev.map((m) => (m.id === id && !m.readBy.includes(personId) ? { ...m, readBy: [...m.readBy, personId] } : m))),
    [persist]
  );

  const removeMessage = useCallback((id: string) => persist((prev) => prev.filter((m) => m.id !== id)), [persist]);

  const value = useMemo(
    () => ({ hydrated, messages, addMessage, markRead, removeMessage }),
    [hydrated, messages, addMessage, markRead, removeMessage]
  );

  return <HouseholdMessagesContext.Provider value={value}>{children}</HouseholdMessagesContext.Provider>;
}

export function useHouseholdMessages(): HouseholdMessagesContextValue {
  const ctx = useContext(HouseholdMessagesContext);
  if (!ctx) throw new Error("useHouseholdMessages va usato dentro un HouseholdMessagesProvider");
  return ctx;
}
