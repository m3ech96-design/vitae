"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { Person, HomeLocation, Place, emptyPersonalDetails } from "./types";
import { newId } from "./id";
import {
  distanceMeters,
  HOME_LEAVE_THRESHOLD_METERS,
  PLACE_ENTER_THRESHOLD_METERS,
  PLACE_ICON_CLEAR_THRESHOLD_METERS,
} from "./geo";
import { usePlaces } from "./places-context";
import { deleteImage, isDataUrl } from "./image-store";
import { useLiveLocation } from "./use-live-location";

const PEOPLE_KEY = "vitae:people";
const TRACKING_KEY = "vitae:tracking-enabled";

interface HouseholdContextValue {
  hydrated: boolean;
  people: Person[];
  home: HomeLocation | null;
  addPerson: (person: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    kind: Person["kind"];
    livesAtHome: boolean;
    ownerId?: string;
    deceased?: boolean;
    /** Valore iniziale solo alla creazione — vedi AddPersonModal. Se omesso, parte da 0
     * come sempre. */
    relationshipScore?: number;
    isDemo?: boolean;
    /** Il ponte Vitaecom↔Mondo — vedi ensurePersonForAccount in vitaecom-social-context.tsx.
     * Assente per una Persona creata a mano, offline. */
    vitaecomAccountId?: string;
  }) => string;
  updatePerson: (id: string, patch: Partial<Person>) => void;
  removePerson: (id: string) => void;
  trackingEnabled: boolean;
  setTrackingEnabled: (v: boolean) => void;
  userIsAway: boolean;
  trackingError: string | null;
  /** true solo se il permesso è negato — l'unico caso in cui vale la pena allarmare
   * l'utente; il resto (nessun segnale per un attimo) è quasi sempre transitorio. */
  trackingPermissionDenied: boolean;
  nearbyPlace: Place | null;
  confirmNearbyPlace: () => void;
  dismissNearbyPlace: () => void;
  currentPlaceIcon: Place | null;
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

function normalizePerson(p: Partial<Person> & { id: string }): Person {
  return {
    firstName: "",
    lastName: "",
    kind: "uomo",
    livesAtHome: false,
    createdAt: new Date().toISOString(),
    ...emptyPersonalDetails(),
    relationshipScore: 0,
    trueFriendshipScore: 0,
    deepEnmityScore: 0,
    loveScore: 0,
    relationshipHistory: [],
    animalCharacter: [],
    animalInterests: [],
    animalHabits: [],
    feedingTimes: [],
    feedingLog: [],
    engagements: [],
    ...p,
  };
}

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const { places, checkIn } = usePlaces();
  const [people, setPeople] = useState<Person[]>([]);
  const [trackingEnabled, setTrackingEnabledState] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [userIsAway, setUserIsAway] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [nearbyPlaceId, setNearbyPlaceId] = useState<string | null>(null);
  const [currentPlaceIconId, setCurrentPlaceIconId] = useState<string | null>(null);
  const dismissedRef = useRef<Set<string>>(new Set());
  const placesRef = useRef<Place[]>(places);
  placesRef.current = places;

  const home: HomeLocation | null = useMemo(() => {
    const casa = places.find((p) => p.type === "casa" && p.isPrimaryHome);
    return casa ? { placeId: casa.id, label: casa.name, address: casa.address, lat: casa.lat, lng: casa.lng } : null;
  }, [places]);

  useEffect(() => {
    try {
      const rawPeople = window.localStorage.getItem(PEOPLE_KEY);
      if (rawPeople) setPeople((JSON.parse(rawPeople) as Person[]).map(normalizePerson));
      const rawTracking = window.localStorage.getItem(TRACKING_KEY);
      if (rawTracking) setTrackingEnabledState(rawTracking === "true");
    } catch {
      // dati locali non leggibili: si riparte da zero
    } finally {
      setHydrated(true);
    }
  }, []);

  const persistPeople = useCallback((updater: Person[] | ((prev: Person[]) => Person[])) => {
    // Corretto un bug reale (il pulsante "Esiste, Ma Non So Chi È" — e in generale qualunque
    // sequenza addPerson+updatePerson nello stesso gestore di evento): `people` qui era la
    // versione dell'array catturata al render corrente. Chiamare `addPerson` e poi subito
    // `updatePerson` nello stesso click faceva sì che la seconda chiamata ricalcolasse il
    // nuovo array da una copia di `people` ancora SENZA la persona appena creata da
    // `addPerson` — il secondo `setPeople` sovrascriveva il primo, perdendo silenziosamente
    // la persona appena creata. La forma funzionale di `setState` risolve sempre contro lo
    // stato pendente più recente, indipendentemente dall'ordine di battitura nello stesso
    // evento.
    setPeople((prev) => {
      const next = typeof updater === "function" ? (updater as (p: Person[]) => Person[])(prev) : updater;
      try {
        window.localStorage.setItem(PEOPLE_KEY, JSON.stringify(next));
      } catch {
        // storage non disponibile: continua solo in memoria
      }
      return next;
    });
  }, []);

  /** Sempre allineato all'ultimo render — usato solo per letture "al volo" dentro callback
   * (es. il file dell'avatar da liberare in `removePerson`) che non devono essere loro
   * stesse dentro l'updater funzionale di `persistPeople`, per restare pure. */
  const peopleRef = useRef<Person[]>(people);
  peopleRef.current = people;

  const addPerson: HouseholdContextValue["addPerson"] = useCallback(
    (person) => {
      const id = newId();
      persistPeople((prev) => [
        ...prev,
        {
          ...person,
          id,
          createdAt: new Date().toISOString(),
          ...emptyPersonalDetails(),
          trueFriendshipScore: 0,
          deepEnmityScore: 0,
          loveScore: 0,
          relationshipHistory: [],
          animalCharacter: [],
          animalInterests: [],
          animalHabits: [],
          feedingTimes: [],
          feedingLog: [],
          engagements: [],
          // Il valore iniziale scelto in AddPersonModal vince sempre sul default — per
          // questo viene dopo emptyPersonalDetails() ma la riga va scritta qui esplicitamente,
          // altrimenti un futuro campo omonimo tra i default potrebbe silenziosamente
          // sovrascriverlo di nuovo (come succedeva prima con relationshipScore: 0 fisso).
          relationshipScore: person.relationshipScore ?? 0,
        },
      ]);
      return id;
    },
    [persistPeople]
  );

  const updatePerson: HouseholdContextValue["updatePerson"] = useCallback(
    (id, patch) => {
      persistPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    },
    [persistPeople]
  );

  const removePerson = useCallback(
    (id: string) => {
      const person = peopleRef.current.find((p) => p.id === id);
      if (person?.avatarUrl && !isDataUrl(person.avatarUrl)) deleteImage(person.avatarUrl);
      persistPeople((prev) => prev.filter((p) => p.id !== id));
    },
    [persistPeople]
  );

  const setTrackingEnabled = useCallback((v: boolean) => {
    setTrackingEnabledState(v);
    try {
      window.localStorage.setItem(TRACKING_KEY, String(v));
    } catch {
      // ignorato
    }
  }, []);

  const confirmNearbyPlace = useCallback(() => {
    if (!nearbyPlaceId) return;
    checkIn(nearbyPlaceId);
    setCurrentPlaceIconId(nearbyPlaceId);
    setNearbyPlaceId(null);
  }, [nearbyPlaceId, checkIn]);

  const dismissNearbyPlace = useCallback(() => {
    if (nearbyPlaceId) dismissedRef.current.add(nearbyPlaceId);
    setNearbyPlaceId(null);
  }, [nearbyPlaceId]);

  // Rilevamento automatico di prossimità: entro 100m da un luogo registrato,
  // il sistema chiede "Sei Attualmente A [Luogo]?" — l'ingresso è automatico,
  // solo l'uscita resta manuale (dalla sezione Mappa, pulsante "Esci").
  // Usa lo stesso `watchPosition` condiviso del pallino "Sei Qui" sulle mappe (vedi
  // use-live-location.ts), invece di aprirne uno per conto proprio.
  const { position: livePosition, error: liveError, permissionDenied: trackingPermissionDenied } = useLiveLocation(trackingEnabled);

  useEffect(() => {
    setTrackingError(liveError);
  }, [liveError]);

  useEffect(() => {
    if (!trackingEnabled || !livePosition) return;
    const here = { lat: livePosition.lat, lng: livePosition.lng };

    if (home) {
      setUserIsAway(distanceMeters(home, here) > HOME_LEAVE_THRESHOLD_METERS);
    }

    const currentPlaces = placesRef.current;

    // Un luogo "dimenticato" dal banner (ignorato con "Non È Qui") resta escluso solo
    // finché resti nei paraggi — non è un rifiuto per tutta la sessione. Appena te ne
    // allontani oltre la soglia d'ingresso, la prossima volta che ci ripassi vicino il
    // banner puoi rivederlo.
    dismissedRef.current.forEach((id) => {
      const place = currentPlaces.find((p) => p.id === id);
      if (!place || distanceMeters(here, place) > PLACE_ENTER_THRESHOLD_METERS) {
        dismissedRef.current.delete(id);
      }
    });

    const checkedIn = currentPlaces.find((p) => p.currentVisitStartedAt);
    if (checkedIn) {
      const d = distanceMeters(here, checkedIn);
      setCurrentPlaceIconId(d <= PLACE_ICON_CLEAR_THRESHOLD_METERS ? checkedIn.id : null);
    } else {
      setCurrentPlaceIconId(null);
    }

    if (!checkedIn) {
      const candidate = currentPlaces
        .filter((p) => !p.isPrimaryHome && !dismissedRef.current.has(p.id))
        .map((p) => ({ place: p, d: distanceMeters(here, p) }))
        .filter((x) => x.d <= PLACE_ENTER_THRESHOLD_METERS)
        .sort((a, b) => a.d - b.d)[0];
      setNearbyPlaceId(candidate ? candidate.place.id : null);
    }
  }, [trackingEnabled, livePosition, home]);

  const nearbyPlace = nearbyPlaceId ? places.find((p) => p.id === nearbyPlaceId) ?? null : null;
  const currentPlaceIcon = currentPlaceIconId ? places.find((p) => p.id === currentPlaceIconId) ?? null : null;

  const value = useMemo(
    () => ({
      hydrated,
      people,
      home,
      addPerson,
      updatePerson,
      removePerson,
      trackingEnabled,
      setTrackingEnabled,
      userIsAway,
      trackingError,
      trackingPermissionDenied,
      nearbyPlace,
      confirmNearbyPlace,
      dismissNearbyPlace,
      currentPlaceIcon,
    }),
    [
      hydrated,
      people,
      home,
      addPerson,
      updatePerson,
      removePerson,
      trackingEnabled,
      setTrackingEnabled,
      userIsAway,
      trackingError,
      trackingPermissionDenied,
      nearbyPlace,
      confirmNearbyPlace,
      dismissNearbyPlace,
      currentPlaceIcon,
    ]
  );

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}

export function useHousehold(): HouseholdContextValue {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error("useHousehold va usato dentro un HouseholdProvider");
  return ctx;
}
