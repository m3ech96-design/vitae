"use client";
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { newId } from "./id";

const MESSAGES_KEY = "vitae:vitaecom-messages";

export interface VitaecomChatMessage {
  id: string;
  /** L'account dall'altra parte del filo — la chiave del thread, non chi ha scritto QUESTO
   * messaggio (quello lo dice `fromUser`). */
  accountId: string;
  fromUser: boolean;
  text: string;
  createdAt: string;
  /** Solo una TUA foto/video vero (chiavi verso image-store.ts/video-store.ts) — mai
   * entrambi insieme, mai generati, mai per un messaggio demo. */
  photoKey?: string;
  videoKey?: string;
}

interface VitaecomChatContextValue {
  hydrated: boolean;
  messages: VitaecomChatMessage[];
  messagesWith: (accountId: string) => VitaecomChatMessage[];
  sendMessage: (accountId: string, text: string, media?: { photoKey?: string; videoKey?: string }) => void;
}

const VitaecomChatContext = createContext<VitaecomChatContextValue | null>(null);

const DEMO_REPLIES = [
  "Ciao! Come va?",
  "Bello sentirti da queste parti 🙂",
  "Sì, esattamente quello che pensavo anch'io.",
  "Raccontami di più.",
  "Figata, mi fa piacere.",
];

/**
 * "Il pulsante Chat collega direttamente alla chat con quell'utente, che se non è ancora
 * esistente viene creata al momento" — nessun elenco di conversazioni da creare a mano
 * prima: il thread è semplicemente "tutti i messaggi con quell'accountId", vuoto finché non
 * scrivi il primo. Solo per account "Persona Conosciuta" (vedi KnowPanel) — la scheda Chat
 * non offre il pulsante per gli altri, ma questo contesto non lo impedisce lui stesso: non è
 * il posto giusto per una regola di visibilità, che resta nell'interfaccia.
 */
export function VitaecomChatProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [messages, setMessages] = useState<VitaecomChatMessage[]>([]);
  const messagesRef = useRef<VitaecomChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const persist = useCallback((next: VitaecomChatMessage[]) => {
    setMessages(next);
    try {
      window.localStorage.setItem(MESSAGES_KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(MESSAGES_KEY);
      if (raw) setMessages(JSON.parse(raw) as VitaecomChatMessage[]);
    } catch {
      // dati corrotti: riparte da nessun messaggio
    }
    setHydrated(true);
  }, []);

  const messagesWith = useCallback((accountId: string) => messages.filter((m) => m.accountId === accountId), [messages]);

  const sendMessage = useCallback(
    (accountId: string, text: string, media?: { photoKey?: string; videoKey?: string }) => {
      const trimmed = text.trim();
      if (!trimmed && !media?.photoKey && !media?.videoKey) return;
      const mine: VitaecomChatMessage = {
        id: newId(),
        accountId,
        fromUser: true,
        text: trimmed,
        createdAt: new Date().toISOString(),
        photoKey: media?.photoKey,
        videoKey: media?.videoKey,
      };
      persist([...messagesRef.current, mine]);

      const delay = 1800 + Math.random() * 2600;
      setTimeout(() => {
        const reply: VitaecomChatMessage = {
          id: newId(),
          accountId,
          fromUser: false,
          text: DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)],
          createdAt: new Date().toISOString(),
        };
        persist([...messagesRef.current, reply]);
      }, delay);
    },
    [persist]
  );

  return (
    <VitaecomChatContext.Provider value={{ hydrated, messages, messagesWith, sendMessage }}>
      {children}
    </VitaecomChatContext.Provider>
  );
}

export function useVitaecomChat(): VitaecomChatContextValue {
  const ctx = useContext(VitaecomChatContext);
  if (!ctx) throw new Error("useVitaecomChat deve essere usato dentro VitaecomChatProvider");
  return ctx;
}
