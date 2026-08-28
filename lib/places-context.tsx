"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { Place, PlaceType } from "./types";
import { newId } from "./id";
import { SPENDING_PLACE_TYPES } from "./places-meta";
import { deleteImage, isDataUrl } from "./image-store";
import { capArray } from "./cap-array";

const PLACES_KEY = "vitae:places";

interface NewPlaceInput {
  name: string;
  photoUrl?: string;
  type: PlaceType;
  address: string;
  lat: number;
  lng: number;
  linkedPersonId?: string;
  isPrimaryHome?: boolean;
}

interface PlacesContextValue {
  hydrated: boolean;
  places: Place[];
  addPlace: (input: NewPlaceInput) => Place;
  updatePlace: (id: string, patch: Partial<Place>) => void;
  removePlace: (id: string) => void;
  checkIn: (id: string) => void;
  checkOut: (id: string, withPersonIds: string[]) => { promptRating: boolean; askSpent: boolean };
  setRating: (id: string, rating: number) => void;
  logTaskVisit: (id: string, withPersonIds: string[]) => void;
  setLastVisitSpentAmount: (id: string, amount: number) => void;
  setLastVisitSpentBreakdown: (id: string, breakdown: { category: string; amount: number }[]) => void;
}

const PlacesContext = createContext<PlacesContextValue | null>(null);

export function PlacesProvider({ children }: { children: React.ReactNode }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PLACES_KEY);
      if (raw) setPlaces(JSON.parse(raw));
    } catch {
      // dati locali non leggibili: si riparte da zero
    } finally {
      setHydrated(true);
    }
  }, []);

  const persist = useCallback((next: Place[]) => {
    setPlaces(next);
    try {
      window.localStorage.setItem(PLACES_KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile: continua solo in memoria
    }
  }, []);

  const addPlace = useCallback(
    (input: NewPlaceInput): Place => {
      const place: Place = {
        id: newId(),
        name: input.name,
        originalName: input.name,
        photoUrl: input.photoUrl,
        type: input.type,
        address: input.address,
        lat: input.lat,
        lng: input.lng,
        linkedPersonId: input.linkedPersonId,
        isPrimaryHome: input.isPrimaryHome,
        rating: null,
        visitsHistory: [],
        createdAt: new Date().toISOString(),
      };
      persist([...places, place]);
      return place;
    },
    [places, persist]
  );

  const updatePlace = useCallback(
    (id: string, patch: Partial<Place>) => {
      persist(places.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    },
    [places, persist]
  );

  const removePlace = useCallback(
    (id: string) => {
      const place = places.find((p) => p.id === id);
      if (place?.photoUrl && !isDataUrl(place.photoUrl)) deleteImage(place.photoUrl);
      persist(places.filter((p) => p.id !== id));
    },
    [places, persist]
  );

  const checkIn = useCallback(
    (id: string) => {
      persist(
        places.map((p) =>
          p.id === id ? { ...p, currentVisitStartedAt: new Date().toISOString() } : p
        )
      );
    },
    [places, persist]
  );

  const checkOut = useCallback(
    (id: string, withPersonIds: string[]) => {
      const place = places.find((p) => p.id === id);
      if (!place || !place.currentVisitStartedAt) return { promptRating: false, askSpent: false };
      const started = new Date(place.currentVisitStartedAt).getTime();
      const durationMinutes = Math.round((Date.now() - started) / 60000);
      const entry = {
        id: newId(),
        date: new Date().toISOString(),
        withPersonIds,
        durationMinutes,
      };
      persist(
        places.map((p) =>
          p.id === id
            ? {
                ...p,
                currentVisitStartedAt: undefined,
                visitsHistory: capArray([...p.visitsHistory, entry], 500),
              }
            : p
        )
      );
      return {
        promptRating: durationMinutes >= 5,
        askSpent: SPENDING_PLACE_TYPES.includes(place.type),
      };
    },
    [places, persist]
  );

  const setRating = useCallback(
    (id: string, rating: number) => {
      persist(places.map((p) => (p.id === id ? { ...p, rating } : p)));
    },
    [places, persist]
  );

  const logTaskVisit = useCallback(
    (id: string, withPersonIds: string[]) => {
      persist(
        places.map((p) =>
          p.id === id
            ? {
                ...p,
                visitsHistory: capArray(
                  [...p.visitsHistory, { id: newId(), date: new Date().toISOString(), withPersonIds, durationMinutes: 0 }],
                  500
                ),
              }
            : p
        )
      );
    },
    [places, persist]
  );

  const setLastVisitSpentAmount = useCallback(
    (id: string, amount: number) => {
      persist(
        places.map((p) => {
          if (p.id !== id || p.visitsHistory.length === 0) return p;
          const history = [...p.visitsHistory];
          history[history.length - 1] = { ...history[history.length - 1], spentAmount: amount };
          return { ...p, visitsHistory: history };
        })
      );
    },
    [places, persist]
  );

  const setLastVisitSpentBreakdown = useCallback(
    (id: string, breakdown: { category: string; amount: number }[]) => {
      const total = breakdown.reduce((sum, b) => sum + b.amount, 0);
      persist(
        places.map((p) => {
          if (p.id !== id || p.visitsHistory.length === 0) return p;
          const history = [...p.visitsHistory];
          history[history.length - 1] = { ...history[history.length - 1], spentAmount: total, spentBreakdown: breakdown };
          return { ...p, visitsHistory: history };
        })
      );
    },
    [places, persist]
  );

  const value = useMemo(
    () => ({
      hydrated,
      places,
      addPlace,
      updatePlace,
      removePlace,
      checkIn,
      checkOut,
      setRating,
      logTaskVisit,
      setLastVisitSpentAmount,
      setLastVisitSpentBreakdown,
    }),
    [
      hydrated,
      places,
      addPlace,
      updatePlace,
      removePlace,
      checkIn,
      checkOut,
      setRating,
      logTaskVisit,
      setLastVisitSpentAmount,
      setLastVisitSpentBreakdown,
    ]
  );

  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>;
}

export function usePlaces(): PlacesContextValue {
  const ctx = useContext(PlacesContext);
  if (!ctx) throw new Error("usePlaces va usato dentro un PlacesProvider");
  return ctx;
}
