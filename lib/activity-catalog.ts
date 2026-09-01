import {
  HeartPulse,
  Dumbbell,
  Users,
  Target,
  Mountain,
  Waves,
  Flower2,
  Swords,
  Snowflake,
  Sparkle,
  type LucideIcon,
} from "lucide-react";

export interface ActivityCategory {
  id: string;
  label: string;
  color: string;
  icon: LucideIcon;
}

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  { id: "cardio", label: "Cardio", color: "#00E5C7", icon: HeartPulse },
  { id: "forza", label: "Forza", color: "#FFB454", icon: Dumbbell },
  { id: "squadra", label: "Sport di squadra", color: "#7C5CFF", icon: Users },
  { id: "individuali", label: "Sport individuali", color: "#FF6B9D", icon: Target },
  { id: "outdoor", label: "Outdoor", color: "#34D399", icon: Mountain },
  { id: "acquatici", label: "Acquatici", color: "#5EC8FF", icon: Waves },
  { id: "mente-corpo", label: "Mente-corpo", color: "#B7A6FF", icon: Flower2 },
  { id: "combattimento", label: "Danza e combattimento", color: "#FF4D6D", icon: Swords },
  { id: "invernali", label: "Invernali", color: "#8FD8FF", icon: Snowflake },
  { id: "altro", label: "Altro", color: "#8B90A8", icon: Sparkle },
];

export interface Activity {
  id: string;
  label: string;
  categoryId: string;
  /** MET (Metabolic Equivalent of Task) — quante volte il metabolismo a riposo, non un
   * numero a caso: preso dal Compendio delle Attività Fisiche (2024 Adult Compendium of
   * Physical Activities, Ainsworth/Herrmann et al. — la fonte scientifica di riferimento per
   * questo tipo di stima) o da valori equivalenti ben documentati per le attività non coperte
   * direttamente lì. Scelto per ognuna il valore "generale"/moderato più rappresentativo,
   * dato che qui non si chiede il ritmo esatto — vedi `estimatedCalories` per come si
   * trasforma nel numero di calorie vero, insieme al peso della persona. */
  met: number;
}

const RAW: Record<string, { label: string; met: number }[]> = {
  cardio: [
    { label: "Corsa", met: 9.8 },
    { label: "Camminata Veloce", met: 4.8 },
    { label: "Cyclette", met: 7.0 },
    { label: "Salto Con La Corda", met: 11.8 },
    { label: "Step", met: 7.3 },
    { label: "Vogatore", met: 7.5 },
    { label: "Ellittica", met: 5.0 },
    { label: "Corsa In Salita", met: 10.3 },
    { label: "Sprint", met: 14.8 },
    { label: "Jogging", met: 7.5 },
    { label: "Spinning", met: 9.0 },
    { label: "Interval Training", met: 7.0 },
  ],
  forza: [
    { label: "Sollevamento Pesi", met: 5.0 },
    { label: "Allenamento A Corpo Libero", met: 3.8 },
    { label: "Crossfit", met: 8.0 },
    { label: "Kettlebell", met: 9.8 },
    { label: "Calisthenics", met: 3.8 },
    { label: "Circuit Training", met: 5.0 },
    { label: "Powerlifting", met: 6.0 },
    { label: "Trx", met: 4.0 },
    { label: "Squat", met: 5.0 },
    { label: "Stacchi Da Terra", met: 6.0 },
  ],
  squadra: [
    { label: "Calcio", met: 7.0 },
    { label: "Basket", met: 8.0 },
    { label: "Pallavolo", met: 6.0 },
    { label: "Rugby", met: 8.3 },
    { label: "Football Americano", met: 8.0 },
    { label: "Pallamano", met: 8.0 },
    { label: "Hockey Su Prato", met: 7.8 },
    { label: "Ultimate Frisbee", met: 8.0 },
    { label: "Baseball", met: 5.0 },
    { label: "Cricket", met: 5.0 },
  ],
  individuali: [
    { label: "Tennis", met: 6.8 },
    { label: "Padel", met: 7.0 },
    { label: "Squash", met: 7.3 },
    { label: "Badminton", met: 5.5 },
    { label: "Golf", met: 4.3 },
    { label: "Tiro Con L'Arco", met: 3.5 },
    { label: "Scherma", met: 6.0 },
    { label: "Bowling", met: 3.8 },
    { label: "Ping Pong", met: 4.0 },
    { label: "Arrampicata", met: 5.8 },
  ],
  outdoor: [
    { label: "Trekking", met: 7.0 },
    { label: "Escursionismo", met: 5.3 },
    { label: "Trail Running", met: 9.3 },
    { label: "Mountain Bike", met: 8.5 },
    { label: "Bici Da Strada", met: 8.0 },
    { label: "Skateboard", met: 5.0 },
    { label: "Pattinaggio A Rotelle", met: 7.5 },
    { label: "Parkour", met: 8.0 },
    { label: "Orienteering", met: 9.0 },
    { label: "Nordic Walking", met: 4.3 },
  ],
  acquatici: [
    { label: "Nuoto", met: 5.8 },
    { label: "Aquagym", met: 5.5 },
    { label: "Acquafitness", met: 6.5 },
    { label: "Immersioni", met: 5.8 },
    { label: "Surf", met: 3.0 },
    { label: "Windsurf", met: 5.0 },
    { label: "Kayak", met: 5.0 },
    { label: "Canottaggio", met: 5.8 },
    { label: "Vela", met: 3.0 },
    { label: "Snorkeling", met: 5.0 },
  ],
  "mente-corpo": [
    { label: "Yoga", met: 2.5 },
    { label: "Pilates", met: 2.8 },
    { label: "Stretching", met: 2.3 },
    { label: "Meditazione Attiva", met: 1.5 },
    { label: "Tai Chi", met: 4.0 },
    { label: "Qi Gong", met: 3.0 },
    { label: "Mobility", met: 2.3 },
    { label: "Respirazione Guidata", met: 1.3 },
    { label: "Rilassamento Muscolare", met: 1.3 },
    { label: "Ginnastica Posturale", met: 2.5 },
  ],
  combattimento: [
    { label: "Boxe", met: 7.8 },
    { label: "Kickboxing", met: 7.3 },
    { label: "Muay Thai", met: 10.3 },
    { label: "Karate", met: 10.3 },
    { label: "Judo", met: 11.3 },
    { label: "Taekwondo", met: 10.3 },
    { label: "Jiu-Jitsu", met: 10.3 },
    { label: "Mma", met: 12.3 },
    { label: "Difesa Personale", met: 5.5 },
    { label: "Danza Classica", met: 5.0 },
    { label: "Danza Moderna", met: 5.0 },
    { label: "Hip Hop", met: 6.5 },
    { label: "Zumba", met: 6.5 },
    { label: "Danza Del Ventre", met: 4.5 },
    { label: "Salsa", met: 4.8 },
    { label: "Tango", met: 3.0 },
    { label: "Breakdance", met: 8.0 },
    { label: "Danza Aerea", met: 4.5 },
  ],
  invernali: [
    { label: "Sci Alpino", met: 6.3 },
    { label: "Sci Di Fondo", met: 8.5 },
    { label: "Snowboard", met: 7.5 },
    { label: "Pattinaggio Su Ghiaccio", met: 7.0 },
    { label: "Slittino", met: 7.0 },
    { label: "Alpinismo Su Ghiaccio", met: 6.5 },
    { label: "Sci Alpinismo", met: 9.0 },
    { label: "Curling", met: 4.0 },
    { label: "Hockey Su Ghiaccio", met: 8.0 },
    { label: "Racchette Da Neve", met: 5.3 },
  ],
  altro: [
    { label: "Giardinaggio", met: 4.0 },
    { label: "Pulizie Intense", met: 3.8 },
    { label: "Ballo Libero", met: 5.5 },
    { label: "Gioco Con Animali Domestici", met: 4.0 },
    { label: "Lavori Manuali", met: 4.0 },
    { label: "Trasloco", met: 5.5 },
    { label: "Escursione Urbana", met: 3.5 },
    { label: "Frisbee Libero", met: 3.0 },
    { label: "Riscaldamento Generico", met: 2.5 },
    { label: "Gioco Attivo Con I Bambini", met: 4.0 },
  ],
};

export const ACTIVITIES: Activity[] = Object.entries(RAW).flatMap(([categoryId, entries]) =>
  entries.map(({ label, met }) => ({
    id: `${categoryId}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    label,
    categoryId,
    met,
  }))
);

export function categoryOf(activityId: string): ActivityCategory {
  const activity = ACTIVITIES.find((a) => a.id === activityId);
  return ACTIVITY_CATEGORIES.find((c) => c.id === activity?.categoryId) ?? ACTIVITY_CATEGORIES[ACTIVITY_CATEGORIES.length - 1];
}

export function activityLabel(activityId: string): string {
  return ACTIVITIES.find((a) => a.id === activityId)?.label ?? "Attività";
}

export function metOf(activityId: string): number {
  return ACTIVITIES.find((a) => a.id === activityId)?.met ?? 5.0;
}

/**
 * Calorie stimate per una singola sessione — non più un tasso fisso per categoria, ma la
 * formula standard del Compendio: MET × peso in kg × ore. È qui che il peso della persona
 * conta davvero: due persone che corrono per lo stesso tempo bruciano cifre diverse, ed è
 * proprio quello che veniva ignorato prima. `weightKg` è facoltativo — se non lo passa
 * nessuno (mai pesato, mai impostato nel wizard), si scende sul peso medio di riferimento
 * usato dalla letteratura sul tema (70 kg) invece di lasciare un buco.
 */
export function estimatedCalories(activityId: string, minutes: number, weightKg?: number): number {
  const met = metOf(activityId);
  const weight = weightKg && weightKg > 0 ? weightKg : 70;
  const hours = minutes / 60;
  return Math.round(met * weight * hours);
}
