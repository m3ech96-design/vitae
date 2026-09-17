import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudLightning,
  type LucideIcon,
} from "lucide-react";

/**
 * Tabella dei codici meteo WMO (World Meteorological Organization) restituiti da
 * Open-Meteo in `weather_code` — lo stesso standard usato da praticamente ogni servizio
 * meteo che non ha un proprio sistema proprietario (Open-Meteo, DWD, Météo-France...),
 * quindi non una lista arbitraria: i valori e le soglie qui sotto sono quelli pubblicati
 * nella documentazione ufficiale (https://open-meteo.com/en/docs), non stimati.
 *
 * `category` è la classificazione usata da lib/weather-advice.ts per decidere il consiglio
 * — una manciata di gruppi (non uno per codice) perché il consiglio "vestiti per la
 * pioggia" non cambia tra pioggia leggera e moderata, solo tra "niente pioggia" e "pioggia".
 */
export type WeatherCategory = "sereno" | "nuvoloso" | "nebbia" | "pioggia" | "neve" | "temporale";

export interface WeatherCodeInfo {
  label: string;
  icon: LucideIcon;
  category: WeatherCategory;
}

const WEATHER_CODES: Record<number, WeatherCodeInfo> = {
  0: { label: "Cielo sereno", icon: Sun, category: "sereno" },
  1: { label: "Prevalentemente sereno", icon: Sun, category: "sereno" },
  2: { label: "Parzialmente nuvoloso", icon: CloudSun, category: "nuvoloso" },
  3: { label: "Nuvoloso", icon: Cloud, category: "nuvoloso" },
  45: { label: "Nebbia", icon: CloudFog, category: "nebbia" },
  48: { label: "Nebbia con brina", icon: CloudFog, category: "nebbia" },
  51: { label: "Pioviggine leggera", icon: CloudDrizzle, category: "pioggia" },
  53: { label: "Pioviggine", icon: CloudDrizzle, category: "pioggia" },
  55: { label: "Pioviggine intensa", icon: CloudDrizzle, category: "pioggia" },
  56: { label: "Pioviggine gelata leggera", icon: CloudDrizzle, category: "pioggia" },
  57: { label: "Pioviggine gelata intensa", icon: CloudDrizzle, category: "pioggia" },
  61: { label: "Pioggia leggera", icon: CloudRain, category: "pioggia" },
  63: { label: "Pioggia", icon: CloudRain, category: "pioggia" },
  65: { label: "Pioggia intensa", icon: CloudRainWind, category: "pioggia" },
  66: { label: "Pioggia gelata leggera", icon: CloudRain, category: "pioggia" },
  67: { label: "Pioggia gelata intensa", icon: CloudRainWind, category: "pioggia" },
  71: { label: "Neve leggera", icon: CloudSnow, category: "neve" },
  73: { label: "Neve", icon: CloudSnow, category: "neve" },
  75: { label: "Neve intensa", icon: CloudSnow, category: "neve" },
  77: { label: "Granuli di neve", icon: CloudSnow, category: "neve" },
  80: { label: "Rovesci leggeri", icon: CloudRain, category: "pioggia" },
  81: { label: "Rovesci", icon: CloudRain, category: "pioggia" },
  82: { label: "Rovesci violenti", icon: CloudRainWind, category: "pioggia" },
  85: { label: "Rovesci di neve leggeri", icon: CloudSnow, category: "neve" },
  86: { label: "Rovesci di neve intensi", icon: CloudSnow, category: "neve" },
  95: { label: "Temporale", icon: CloudLightning, category: "temporale" },
  96: { label: "Temporale con grandine leggera", icon: CloudLightning, category: "temporale" },
  99: { label: "Temporale con grandine intensa", icon: CloudLightning, category: "temporale" },
};

/** Ripiego onesto per un codice non mappato (l'API potrebbe aggiungerne — vedi la nota
 * "Additional optional URL parameters will be added" nella documentazione Open-Meteo):
 * "nuvoloso" è la categoria più neutra, mai un errore che romperebbe la card. */
const FALLBACK: WeatherCodeInfo = { label: "Condizioni variabili", icon: Cloud, category: "nuvoloso" };

export function weatherCodeInfo(code: number): WeatherCodeInfo {
  return WEATHER_CODES[code] ?? FALLBACK;
}
