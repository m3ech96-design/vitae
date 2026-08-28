"use client";
import { useEffect, useState } from "react";

export interface LiveLocation {
  lat: number;
  lng: number;
  accuracy: number;
}

export interface LiveLocationState {
  position: LiveLocation | null;
  /** Messaggio pronto per l'utente, già tradotto — mai il messaggio grezzo del sistema
   * operativo (su iOS/Safari può essere letteralmente un codice interno tipo "Errore
   * kCLErrorDomain 0", incomprensibile per chiunque non sviluppi app Apple). */
  error: string | null;
  /** true solo per il permesso negato — l'unico caso davvero actionable (l'utente deve
   * andare a riattivarlo). Gli altri casi sono quasi sempre transitori (nessun segnale GPS
   * per un attimo, un tunnel, un ascensore) e si risolvono da soli al prossimo tentativo. */
  permissionDenied: boolean;
}

function translateGeolocationError(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Permesso Di Posizione Negato — Puoi Riattivarlo Dalle Impostazioni Del Telefono O Del Browser.";
    case err.POSITION_UNAVAILABLE:
      return "Posizione Non Disponibile Al Momento — Capita, Specie Al Chiuso: Riprova Da Solo Non Appena C'È Segnale.";
    case err.TIMEOUT:
      return "Il Rilevamento Della Posizione Sta Impiegando Più Del Previsto.";
    default:
      return "Posizione Non Disponibile Al Momento.";
  }
}

/**
 * Unico punto dell'app che apre un `watchPosition` del browser — sia il pallino "Sei Qui"
 * sulle mappe sia il rilevamento Casa/Fuori Casa lo usano, invece di due implementazioni
 * quasi identiche. Rileva la posizione finché il componente che lo usa resta montato e
 * `enabled` è true; smette e libera il watch altrimenti. Non blocca mai: se il permesso è
 * negato, `position` resta `null` e `error` racconta perché, senza eccezioni da gestire.
 */
export function useLiveLocation(enabled: boolean = true): LiveLocationState {
  const [position, setPosition] = useState<LiveLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setPosition(null);
      setError(null);
      setPermissionDenied(false);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocalizzazione Non Disponibile Su Questo Dispositivo.");
      return;
    }

    setError(null);
    setPermissionDenied(false);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setError(null);
        setPermissionDenied(false);
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        setError(translateGeolocationError(err));
        setPermissionDenied(err.code === err.PERMISSION_DENIED);
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { position, error, permissionDenied };
}
