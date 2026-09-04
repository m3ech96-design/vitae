import {
  HeartPulse,
  Wallet,
  Sparkles,
  Dumbbell,
  Users,
  ListTodo,
  BookOpen,
  Gamepad2,
  Gift,
  Newspaper,
  MapPin,
  PawPrint,
  GitBranch,
  Globe2,
  Utensils,
  LucideIcon,
} from "lucide-react";

export interface ShortcutDefinition {
  href: string;
  icon: LucideIcon;
  label: string;
  desc: string;
}

/**
 * Tutte le scorciatoie possibili verso le schede principali dell'app — il catalogo da cui
 * il widget "Scorciatoie" (vedi components/widgets/defs/shortcuts-widget.tsx) fa scegliere
 * quali inserire, al posto della lista fissa di quattro che viveva prima direttamente nella
 * Home (Salute/Attività e peso/Finanze/Rapporti): quelle quattro restano qui come le prime
 * quattro voci, così chi le aveva già non le perde spostandosi al widget, ma ora può
 * scegliere fra tutte le schede dell'app, non solo quelle quattro.
 */
export const SHORTCUT_CATALOG: ShortcutDefinition[] = [
  { href: "/salute", icon: HeartPulse, label: "Salute", desc: "Referti, appuntamenti, farmaci" },
  { href: "/attivita-peso", icon: Dumbbell, label: "Attività e peso", desc: "Allenamenti e pesate" },
  { href: "/finanze", icon: Wallet, label: "Finanze", desc: "Budget e risparmi" },
  { href: "/rapporti", icon: Sparkles, label: "Rapporti", desc: "Legami e animali" },
  { href: "/mondo", icon: Users, label: "Mondo", desc: "Persone e animali conosciuti" },
  { href: "/task", icon: ListTodo, label: "Task", desc: "Cose da fare" },
  { href: "/alimentazione", icon: Utensils, label: "Alimentazione", desc: "Pasti e obiettivi" },
  { href: "/diario", icon: BookOpen, label: "Diario", desc: "Note e ricordi" },
  { href: "/hobby", icon: Gamepad2, label: "Hobby", desc: "Attività e collezioni" },
  { href: "/wishlist", icon: Gift, label: "Wishlist", desc: "Desideri e obiettivi di risparmio" },
  { href: "/news", icon: Newspaper, label: "News", desc: "Notizie dalle tue fonti" },
  { href: "/map", icon: MapPin, label: "Mappa", desc: "Luoghi salvati" },
  { href: "/animali", icon: PawPrint, label: "Animali", desc: "Cura e salute" },
  { href: "/albero-genealogico", icon: GitBranch, label: "Albero genealogico", desc: "La tua famiglia" },
  { href: "/vitaecom", icon: Globe2, label: "Vitaeworld", desc: "Il tuo social" },
];

export function shortcutByHref(href: string): ShortcutDefinition | undefined {
  return SHORTCUT_CATALOG.find((s) => s.href === href);
}
