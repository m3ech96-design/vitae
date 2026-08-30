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
  kcalPerMinute: number;
}

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  { id: "cardio", label: "Cardio", color: "#00E5C7", icon: HeartPulse, kcalPerMinute: 10 },
  { id: "forza", label: "Forza", color: "#FFB454", icon: Dumbbell, kcalPerMinute: 7 },
  { id: "squadra", label: "Sport di squadra", color: "#7C5CFF", icon: Users, kcalPerMinute: 9 },
  { id: "individuali", label: "Sport individuali", color: "#FF6B9D", icon: Target, kcalPerMinute: 7 },
  { id: "outdoor", label: "Outdoor", color: "#34D399", icon: Mountain, kcalPerMinute: 8 },
  { id: "acquatici", label: "Acquatici", color: "#5EC8FF", icon: Waves, kcalPerMinute: 9 },
  { id: "mente-corpo", label: "Mente-corpo", color: "#B7A6FF", icon: Flower2, kcalPerMinute: 3 },
  { id: "combattimento", label: "Danza e combattimento", color: "#FF4D6D", icon: Swords, kcalPerMinute: 8 },
  { id: "invernali", label: "Invernali", color: "#8FD8FF", icon: Snowflake, kcalPerMinute: 8 },
  { id: "altro", label: "Altro", color: "#8B90A8", icon: Sparkle, kcalPerMinute: 5 },
];

export interface Activity {
  id: string;
  label: string;
  categoryId: string;
}

const RAW: Record<string, string[]> = {
  cardio: [
    "Corsa", "Camminata Veloce", "Cyclette", "Salto Con La Corda", "Step", "Vogatore",
    "Ellittica", "Corsa In Salita", "Sprint", "Jogging", "Spinning", "Interval Training",
  ],
  forza: [
    "Sollevamento Pesi", "Allenamento A Corpo Libero", "Crossfit", "Kettlebell",
    "Calisthenics", "Circuit Training", "Powerlifting", "Trx", "Squat", "Stacchi Da Terra",
  ],
  squadra: [
    "Calcio", "Basket", "Pallavolo", "Rugby", "Football Americano", "Pallamano",
    "Hockey Su Prato", "Ultimate Frisbee", "Baseball", "Cricket",
  ],
  individuali: [
    "Tennis", "Padel", "Squash", "Badminton", "Golf", "Tiro Con L'Arco", "Scherma",
    "Bowling", "Ping Pong", "Arrampicata",
  ],
  outdoor: [
    "Trekking", "Escursionismo", "Trail Running", "Mountain Bike", "Bici Da Strada",
    "Skateboard", "Pattinaggio A Rotelle", "Parkour", "Orienteering", "Nordic Walking",
  ],
  acquatici: [
    "Nuoto", "Aquagym", "Acquafitness", "Immersioni", "Surf", "Windsurf", "Kayak",
    "Canottaggio", "Vela", "Snorkeling",
  ],
  "mente-corpo": [
    "Yoga", "Pilates", "Stretching", "Meditazione Attiva", "Tai Chi", "Qi Gong",
    "Mobility", "Respirazione Guidata", "Rilassamento Muscolare", "Ginnastica Posturale",
  ],
  combattimento: [
    "Boxe", "Kickboxing", "Muay Thai", "Karate", "Judo", "Taekwondo", "Jiu-Jitsu", "Mma",
    "Difesa Personale", "Danza Classica", "Danza Moderna", "Hip Hop", "Zumba",
    "Danza Del Ventre", "Salsa", "Tango", "Breakdance", "Danza Aerea",
  ],
  invernali: [
    "Sci Alpino", "Sci Di Fondo", "Snowboard", "Pattinaggio Su Ghiaccio", "Slittino",
    "Alpinismo Su Ghiaccio", "Sci Alpinismo", "Curling", "Hockey Su Ghiaccio", "Racchette Da Neve",
  ],
  altro: [
    "Giardinaggio", "Pulizie Intense", "Ballo Libero", "Gioco Con Animali Domestici",
    "Lavori Manuali", "Trasloco", "Escursione Urbana", "Frisbee Libero",
    "Riscaldamento Generico", "Gioco Attivo Con I Bambini",
  ],
};

export const ACTIVITIES: Activity[] = Object.entries(RAW).flatMap(([categoryId, labels]) =>
  labels.map((label) => ({ id: `${categoryId}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, label, categoryId }))
);

export function categoryOf(activityId: string): ActivityCategory {
  const activity = ACTIVITIES.find((a) => a.id === activityId);
  return ACTIVITY_CATEGORIES.find((c) => c.id === activity?.categoryId) ?? ACTIVITY_CATEGORIES[ACTIVITY_CATEGORIES.length - 1];
}

export function activityLabel(activityId: string): string {
  return ACTIVITIES.find((a) => a.id === activityId)?.label ?? "Attività";
}
