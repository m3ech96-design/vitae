"use client";
import { useEffect, useRef, useState } from "react";
import { useHousehold } from "./household-context";
import { HourlyPoint } from "./weather-advice";

export interface WeatherData {
  current: HourlyPoint;
  /** Le ore della finestra richiesta (oggi + 2 giorni, vedi app/api/weather/route.ts),
   * inclusa quella già passata di oggi — chi consuma questo campo filtra da sé "da adesso in
   * poi" quando serve (vedi WeatherCard), perché lo sheet con le previsioni potrebbe in
   * futuro voler mostrare anche le ore già trascorse di oggi. */
  hourly: HourlyPoint[];
  /** Nome del luogo a cui si riferisce il meteo — "la tua posizione" per il GPS live,
   * altrimenti il nome della Casa salvata (vedi il commento su source in useWeather sotto).
   * Mai taciuto: mostrare un meteo senza dire di quale luogo è stato letto sarebbe
   * fuorviante se il luogo non è quello atteso dall'utente. */
  placeLabel: string;
}

export interface WeatherState {
  data: WeatherData | null;
  loading: boolean;
  /** Messaggio pronto per l'utente — assente se tutto ok, anche quando `data` è ancora
   * `null` durante il primo caricamento. */
  error: string | null;
}

/**
 * Recupera il meteo per la posizione dell'utente — GPS one-shot (non un watch continuo come
 * useLiveLocation: il meteo non deve aggiornarsi mentre l'utente si sposta di poche decine
 * di metri, un singolo rilevamento all'apertura della scheda basta) con fallback sulla Casa
 * salvata (vedi useHousehold().home) se il permesso di posizione è negato o non disponibile.
 * Se nessuna delle due fonti è disponibile, `error` lo dice esplicitamente — mai un meteo
 * silenziosamente sbagliato mostrato come se fosse quello reale (vedi DEFAULT_MAP_CENTER in
 * lib/geo.ts, che esiste per un caso d'uso diverso — un centro mappa di ripiego, non un dato
 * meteo spacciato per verificato).
 *
 * Il fetch avviene una sola volta per posizione risolta (non un polling): il meteo non
 * cambia sensibilmente nell'arco di una sessione in cui si guarda la scheda Attività e peso,
 * e /api/weather ha comunque una cache di 10 minuti lato server (vedi route.ts).
 */
export function useWeather(): WeatherState {
  const { home } = useHousehold();
  const [state, setState] = useState<WeatherState>({ data: null, loading: true, error: null });
  const fetchedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      // Nessuna Geolocation API sul dispositivo — ripiega direttamente sulla Casa, se c'è.
      if (home) fetchWeatherFor(home.lat, home.lng, home.label);
      else setState({ data: null, loading: false, error: "Geolocalizzazione non disponibile su questo dispositivo." });
      return;
    }

    let cancelled = false;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!cancelled) fetchWeatherFor(pos.coords.latitude, pos.coords.longitude, "la tua posizione");
      },
      () => {
        // Permesso negato o posizione non disponibile — ripiega sulla Casa salvata, se c'è.
        if (cancelled) return;
        if (home) fetchWeatherFor(home.lat, home.lng, home.label);
        else setState({ data: null, loading: false, error: "Posizione non disponibile — concedi il permesso o imposta una Casa in Mappa." });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );

    async function fetchWeatherFor(lat: number, lng: number, placeLabel: string) {
      const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
      if (fetchedForRef.current === key) return;
      fetchedForRef.current = key;
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        const hourly: HourlyPoint[] = json.hourly.time.map((time: string, i: number) => ({
          time,
          temperature: json.hourly.temperature_2m[i],
          precipitation: json.hourly.precipitation[i],
          windSpeed: json.hourly.wind_speed_10m[i],
          weatherCode: json.hourly.weather_code[i],
        }));
        const current: HourlyPoint = {
          time: json.current.time,
          temperature: json.current.temperature_2m,
          precipitation: json.current.precipitation,
          windSpeed: json.current.wind_speed_10m,
          weatherCode: json.current.weather_code,
        };
        if (!cancelled) setState({ data: { current, hourly, placeLabel }, loading: false, error: null });
      } catch {
        if (!cancelled) setState({ data: null, loading: false, error: "Meteo non disponibile al momento." });
      }
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [home?.lat, home?.lng]);

  return state;
}
