import { WeatherCategory } from "./weather-code";

/**
 * Soglie di riferimento per il consiglio "attività fisica outdoor sì/no/con cautela" nella
 * scheda Attività e peso — stesso principio già in uso in lib/health-guidelines.ts: numeri
 * tratti da fonti reali, mai stimati, ognuno con la fonte annotata qui accanto. Questo file
 * separa le soglie (fatti citabili) dalla frase che ne deriva (adviceForWeather sotto, una
 * scelta di presentazione), stesso schema di health-guidelines.ts/wellbeing-report.ts.
 *
 * Fonti:
 * - Classificazione italiana dell'intensità della pioggia (mm/h), la stessa riportata da
 *   Wikipedia "Pioggia" e da più fonti meteorologiche indipendenti (es. Meteo Guidonia):
 *   pioviggine <1, debole 1-2, leggera 2-4, moderata 4-6, forte >6, rovescio >10, nubifragio
 *   >30 mm/h. Qui semplificata a due soglie pratiche per il consiglio (non serve distinguere
 *   sette fasce per dire "prendi un k-way" o "resta in casa").
 * - SIMFER (Società Italiana di Medicina Fisica e Riabilitativa), comunicato su caldo e
 *   attività fisica: intorno ai 30°C il sistema di termoregolazione lavora già al limite
 *   delle proprie capacità.
 * - Guide sportive convergenti (Fassi Sport e altre) sul limite pratico di 35°C oltre il
 *   quale si raccomanda di spostare l'allenamento al chiuso.
 * - American College of Sports Medicine (ACSM), soglia citata da più fonti divulgative
 *   sportive italiane: sconsiglia l'attività fisica outdoor sotto i -20°C; alcuni
 *   ricercatori (stessa fonte) suggeriscono di spostarla al chiuso già sotto i -15°C — qui
 *   adottata quest'ultima, più cautelativa, come soglia di sconsiglio.
 */

/** mm/h oltre cui la pioggia non è più "gestibile con un k-way" ma richiede di restare al
 * chiuso — la soglia italiana di "pioggia forte", non il rovescio (troppo permissivo: oltre
 * i 6 mm/h l'intensità è già scomoda per un'attività all'aperto, non serve arrivare al
 * rovescio per dirlo). */
export const HEAVY_RAIN_MM_PER_HOUR = 6;

/** mm/h sotto cui la pioggia è talmente lieve da non richiedere nemmeno la menzione del
 * k-way — sotto la soglia italiana di "pioggia debole" (1 mm/h): una pioviggine impercettibile
 * non cambia il consiglio. */
export const LIGHT_RAIN_MM_PER_HOUR = 1;

/** °C oltre cui iniziare a raccomandare orari più freschi invece delle ore centrali — SIMFER. */
export const HOT_CAUTION_CELSIUS = 30;

/** °C oltre cui l'attività fisica outdoor è sconsigliata a prescindere dall'orario — soglia
 * pratica citata da più guide sportive italiane. */
export const HOT_DISCOURAGED_CELSIUS = 35;

/** °C sotto cui l'attività fisica outdoor è sconsigliata — ACSM (soglia cautelativa di
 * -15°C, non i -20°C della soglia ACSM originale, vedi nota sopra). */
export const COLD_DISCOURAGED_CELSIUS = -15;

/** km/h oltre cui il vento diventa un fattore limitante di per sé (indipendentemente da
 * pioggia/temperatura) — soglia di "vento forte" usata nei bollettini di allerta della
 * Protezione Civile italiana per l'allertamento gialla sul rischio vento. */
export const STRONG_WIND_KMH = 40;

export interface HourlyPoint {
  /** ISO locale (timezone=auto lato Open-Meteo), es. "2026-09-17T14:00". */
  time: string;
  temperature: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
}

export interface WeatherAdvice {
  text: string;
  /** Guida il colore/tono della card — non un'informazione ulteriore, solo una lettura
   * rapida dello stesso `text` per chi scorre la scheda senza leggere ogni parola. */
  tone: "buono" | "cauto" | "sconsigliato";
}

function isRaining(category: WeatherCategory): boolean {
  return category === "pioggia" || category === "temporale";
}

/**
 * Il consiglio per LE PROSSIME ORE (usato dalla card compatta, sul meteo attuale) — non
 * guarda a un'intera giornata, guarda alle condizioni di adesso: è la domanda "posso uscire
 * ORA", non "quando conviene uscire oggi" (quella è bestHoursAdvice sotto, per lo sheet
 * esteso con le previsioni). Un solo punto orario in ingresso, non una serie, per lo stesso
 * motivo per cui la card compatta mostra un solo dato invece di un grafico: è la domanda più
 * immediata, risposta in una riga.
 */
export function currentAdvice(point: Pick<HourlyPoint, "temperature" | "precipitation" | "windSpeed" | "weatherCode">, category: WeatherCategory): WeatherAdvice {
  if (category === "temporale") {
    return { text: "Meglio rimandare: è in corso un temporale.", tone: "sconsigliato" };
  }
  if (point.temperature <= COLD_DISCOURAGED_CELSIUS) {
    return { text: `Sconsigliata l'attività fisica all'aperto: ${Math.round(point.temperature)}°C sono troppo rigidi.`, tone: "sconsigliato" };
  }
  if (point.temperature >= HOT_DISCOURAGED_CELSIUS) {
    return { text: `È sconsigliato fare attività fisica all'aperto oggi: ${Math.round(point.temperature)}°C sono troppi.`, tone: "sconsigliato" };
  }
  if (isRaining(category) && point.precipitation > HEAVY_RAIN_MM_PER_HOUR) {
    return { text: "È sconsigliato fare attività fisica all'aperto ora: la pioggia è troppo intensa.", tone: "sconsigliato" };
  }
  if (point.windSpeed >= STRONG_WIND_KMH) {
    return { text: `Vento forte in corso (${Math.round(point.windSpeed)} km/h): meglio rimandare l'attività all'aperto.`, tone: "sconsigliato" };
  }
  if (isRaining(category) && point.precipitation > LIGHT_RAIN_MM_PER_HOUR) {
    return { text: "La quantità di pioggia permette di fare attività fisica con un k-way.", tone: "cauto" };
  }
  if (point.temperature >= HOT_CAUTION_CELSIUS) {
    return { text: `Fa caldo (${Math.round(point.temperature)}°C): meglio le ore più fresche della giornata.`, tone: "cauto" };
  }
  if (category === "nebbia") {
    return { text: "C'è nebbia: visibilità ridotta, meglio evitare strade trafficate.", tone: "cauto" };
  }
  return { text: "Ottima giornata per fare attività all'aperto.", tone: "buono" };
}

/**
 * Il consiglio "quando conviene uscire", per lo sheet con le previsioni orarie — cerca,
 * nelle ore di luce della finestra fornita (di norma il resto di oggi), la più lunga
 * sequenza di ore in cui NESSUna delle condizioni di sconsiglio (temporale, pioggia forte,
 * caldo/freddo estremi, vento forte) è presente, e la propone come fascia oraria — questo è
 * il caso "È consigliato fare attività fisica all'aperto dalle ore X alle ore Y" richiesto
 * esplicitamente. Se NESSUNA ora della finestra è libera da condizioni sconsigliate, ripiega
 * su un giudizio generale sul resto della giornata invece di proporre un intervallo vuoto.
 */
export function bestHoursAdvice(points: HourlyPoint[], categoryOf: (code: number) => WeatherCategory): WeatherAdvice {
  if (points.length === 0) return { text: "Previsioni non disponibili al momento.", tone: "cauto" };

  const isGood = (p: HourlyPoint) => {
    const category = categoryOf(p.weatherCode);
    if (category === "temporale") return false;
    if (p.temperature <= COLD_DISCOURAGED_CELSIUS || p.temperature >= HOT_DISCOURAGED_CELSIUS) return false;
    if (isRaining(category) && p.precipitation > HEAVY_RAIN_MM_PER_HOUR) return false;
    if (p.windSpeed >= STRONG_WIND_KMH) return false;
    return true;
  };

  const goodPoints = points.filter(isGood);

  if (goodPoints.length === 0) {
    // Nessuna ora libera da condizioni sconsigliate — il motivo prevalente lo dice il primo
    // punto della finestra (di norma "adesso"), coerente con currentAdvice qui sopra.
    const first = points[0];
    return currentAdvice(first, categoryOf(first.weatherCode));
  }

  if (goodPoints.length === points.length) {
    return { text: "Ottima giornata per fare attività all'aperto.", tone: "buono" };
  }

  // Sequenza contigua più lunga di ore "buone" — non un elenco sparso di orari isolati, una
  // fascia unica e continua è quello che si può davvero pianificare ("esco dalle 17 alle 19").
  let bestStart = 0;
  let bestLen = 0;
  let curStart = 0;
  let curLen = 0;
  points.forEach((p, i) => {
    if (isGood(p)) {
      if (curLen === 0) curStart = i;
      curLen++;
      if (curLen > bestLen) {
        bestLen = curLen;
        bestStart = curStart;
      }
    } else {
      curLen = 0;
    }
  });

  const startHour = new Date(points[bestStart].time).getHours();
  // L'ora di fine è la fine dell'ultimo slot buono, non l'inizio — un'ora "buona" alle 18:00
  // copre la finestra 18-19, quindi la fascia finisce alle 19, non alle 18.
  const endHour = (new Date(points[bestStart + bestLen - 1].time).getHours() + 1) % 24;

  const anyRainInWindow = goodPoints.some((p) => isRaining(categoryOf(p.weatherCode)) && p.precipitation > LIGHT_RAIN_MM_PER_HOUR);
  const suffix = anyRainInWindow ? " (con un k-way)" : "";

  return {
    text: `È consigliato fare attività fisica all'aperto dalle ore ${startHour} alle ore ${endHour}${suffix}.`,
    tone: "buono",
  };
}
