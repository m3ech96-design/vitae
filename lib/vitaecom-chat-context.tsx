"use client";
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { newId } from "./id";
import { DEFAULT_MOODS } from "./mood-catalog";

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
  /** Reazioni allo stato d'animo sul messaggio — la tua è sempre vera; quella dell'altro
   * account è simulata (vedi sendMessage qui sotto), la stessa idea onesta già usata per
   * Mi Piace/commenti/reazioni sui post. */
  userReactionMoodId?: string;
  otherReactionMoodId?: string;
}

interface VitaecomChatContextValue {
  hydrated: boolean;
  messages: VitaecomChatMessage[];
  messagesWith: (accountId: string) => VitaecomChatMessage[];
  sendMessage: (accountId: string, text: string, media?: { photoKey?: string; videoKey?: string }) => void;
  setMessageReaction: (messageId: string, moodId: string) => void;
  /** Un segnale, non uno stato da leggere in continuo: bumpato ogni volta che l'account
   * dall'altra parte reagisce a un tuo messaggio, con lo stato d'animo appena scelto — la
   * pagina della conversazione lo osserva per avviare l'animazione dell'avatar (vedi
   * app/vitaecom/chat/[accountId]/page.tsx), una volta sola per ogni reazione, non a ogni
   * nuovo render. */
  reactionPing: Record<string, { at: number; moodId: string }>;
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
  const [reactionPing, setReactionPing] = useState<Record<string, { at: number; moodId: string }>>({});
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
        // Un solo esito per volta, mai entrambi sullo stesso invio: o una risposta scritta,
        // o una reazione al messaggio che hai appena mandato — la stessa logica "un account
        // demo interagisce con qualcosa di tuo dopo una manciata di secondi" già usata per i
        // post, qui applicata a un messaggio.
        if (Math.random() < 0.3) {
          const mood = DEFAULT_MOODS[Math.floor(Math.random() * DEFAULT_MOODS.length)];
          persist(messagesRef.current.map((m) => (m.id === mine.id ? { ...m, otherReactionMoodId: mood.id } : m)));
          setReactionPing((prev) => ({ ...prev, [accountId]: { at: Date.now(), moodId: mood.id } }));
          return;
        }
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

  /** La tua reazione a un messaggio (tuo o dell'altro account) — sempre vera, sostituisce
   * quella precedente sullo stesso messaggio se stavi cambiando idea, mai una somma. */
  const setMessageReaction = useCallback(
    (messageId: string, moodId: string) => {
      persist(messagesRef.current.map((m) => (m.id === messageId ? { ...m, userReactionMoodId: moodId } : m)));
    },
    [persist]
  );

  return (
    <VitaecomChatContext.Provider value={{ hydrated, messages, messagesWith, sendMessage, setMessageReaction, reactionPing }}>
      {children}
    </VitaecomChatContext.Provider>
  );
}

export function useVitaecomChat(): VitaecomChatContextValue {
  const ctx = useContext(VitaecomChatContext);
  if (!ctx) throw new Error("useVitaecomChat deve essere usato dentro VitaecomChatProvider");
  return ctx;
}
