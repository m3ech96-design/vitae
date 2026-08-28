"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { newId } from "./id";

const FEED_KEY = "vitae:feed";
const MAX_EVENTS = 30;

export interface FeedEvent {
  id: string;
  text: string;
  date: string;
}

interface FeedContextValue {
  hydrated: boolean;
  events: FeedEvent[];
  pushEvent: (text: string) => void;
  clearEvents: () => void;
}

const FeedContext = createContext<FeedContextValue | null>(null);

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FEED_KEY);
      if (raw) setEvents(JSON.parse(raw));
    } catch {
      // dati locali non leggibili: si riparte da zero
    } finally {
      setHydrated(true);
    }
  }, []);

  const pushEvent = useCallback((text: string) => {
    setEvents((prev) => {
      const next = [{ id: newId(), text, date: new Date().toISOString() }, ...prev].slice(0, MAX_EVENTS);
      try {
        window.localStorage.setItem(FEED_KEY, JSON.stringify(next));
      } catch {
        // ignorato
      }
      return next;
    });
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    try {
      window.localStorage.removeItem(FEED_KEY);
    } catch {
      // ignorato
    }
  }, []);

  const value = useMemo(() => ({ hydrated, events, pushEvent, clearEvents }), [hydrated, events, pushEvent, clearEvents]);

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}

export function useFeed(): FeedContextValue {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error("useFeed va usato dentro un FeedProvider");
  return ctx;
}
