/**
 * Piccole tabelle di riferimento curate una volta, usate solo per le "curiosità" del
 * resoconto benessere (vedi wellbeing-curiosities.ts) — mai per calcoli nutrizionali veri
 * (quelli usano sempre i dati che l'utente ha inserito, non queste medie generiche).
 * Valori mediani tra più fonti nutrizionali consultate per porzione tipica reale (non il
 * valore per 100g, che da solo non dice quanto pesa la porzione che si mangia davvero).
 */
export interface FoodEquivalent {
  label: string;
  /** Articolo determinativo/indeterminativo già concordato nel genere e numero del
   * label, per comporre frasi tipo "equivale a {article} {label}" senza dover indovinare
   * il genere grammaticale a runtime da una stringa. */
  article: string;
  kcal: number;
}

export const FOOD_EQUIVALENTS: FoodEquivalent[] = [
  { label: "pizza margherita intera", article: "una", kcal: 800 },
  { label: "hamburger tipo Big Mac", article: "un", kcal: 550 },
  { label: "porzione di tiramisù", article: "una", kcal: 300 },
  { label: "cornetto da bar", article: "un", kcal: 200 },
  { label: "coppetta di gelato", article: "una", kcal: 250 },
  { label: "mela media", article: "una", kcal: 80 },
];

export interface DistanceEquivalent {
  label: string;
  km: number;
}

/** Distanze in linea d'aria tra città italiane note, per rendere concreti i chilometri
 * camminati/corsi accumulati in una settimana — cifre arrotondate, sufficienti per un
 * confronto illustrativo, non per la navigazione. */
export const DISTANCE_EQUIVALENTS: DistanceEquivalent[] = [
  { label: "Roma-Napoli", km: 189 },
  { label: "Milano-Roma", km: 477 },
  { label: "Milano-Napoli", km: 658 },
];

/** Il più grande tra quelli con km ≤ target, per dare il confronto più "pieno" senza
 * superare la distanza reale accumulata — se non ce n'è nessuno (target troppo piccolo),
 * `null`: meglio nessun confronto che uno fuorviante ("hai percorso più di Roma-Napoli"
 * quando in realtà ne hai fatto un decimo). */
export function bestDistanceEquivalent(km: number): DistanceEquivalent | null {
  const candidates = DISTANCE_EQUIVALENTS.filter((d) => d.km <= km).sort((a, b) => b.km - a.km);
  return candidates[0] ?? null;
}
