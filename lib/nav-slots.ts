"use client";
import { useCallback, useEffect, useState } from "react";
import {
  ListChecks,
  Users,
  HeartPulse,
  Wallet,
  Sparkles,
  MapPinned,
  Aperture,
  Newspaper,
  Dumbbell,
  Utensils,
  Heart,
  BookHeart,
  Palette,
  PawPrint,
} from "lucide-react";

const SLOTS_KEY = "vitae:nav-slots";

export interface NavItemDef {
  href: string;
  label: string;
  icon: typeof ListChecks;
}

/** Tutte le schede assegnabili alla barra di navigazione "offline" — Home e "Altro" non ne
 * fanno parte (sempre fissi, mai sostituibili, come richiesto). Le tre non scelte per la
 * fila principale finiscono da sole nel pannello "Altro": non è una lista a parte da tenere
 * sincronizzata, è semplicemente questo stesso elenco meno gli href assegnati ai tre slot. */
export const ALL_NAV_ITEMS: NavItemDef[] = [
  { href: "/task", label: "Task", icon: ListChecks },
  { href: "/vitaecom", label: "Vitaecom", icon: Aperture },
  { href: "/mondo", label: "Mondo", icon: Users },
  { href: "/salute", label: "Salute", icon: HeartPulse },
  { href: "/attivita-peso", label: "Attività e peso", icon: Dumbbell },
  { href: "/alimentazione", label: "Alimentazione", icon: Utensils },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/diario", label: "Diario", icon: BookHeart },
  { href: "/hobby", label: "Hobby", icon: Palette },
  { href: "/animali", label: "Animali", icon: PawPrint },
  { href: "/finanze", label: "Finanze", icon: Wallet },
  { href: "/rapporti", label: "Rapporti", icon: Sparkles },
  { href: "/map", label: "Mappa", icon: MapPinned },
  { href: "/news", label: "News", icon: Newspaper },
];

export const DEFAULT_SLOTS = ["/task", "/vitaecom", "/mondo"];

/** I tre slot della fila principale della barra "offline" (dopo Home, prima di "Altro"),
 * personalizzabili uno per uno con una pressione lunga (vedi BottomNav.tsx). Persistiti in
 * locale come il resto dei dati dell'app — nessun server dietro, solo questo dispositivo. */
export function useNavSlots() {
  const [slots, setSlotsState] = useState<string[]>(DEFAULT_SLOTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SLOTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        // Un href salvato che non esiste più (o non è lungo 3) non deve rompere la barra:
        // ripiega sul default invece di mostrare uno slot vuoto.
        if (Array.isArray(parsed) && parsed.length === 3 && parsed.every((h) => ALL_NAV_ITEMS.some((i) => i.href === h))) {
          setSlotsState(parsed);
        }
      }
    } catch {
      // storage non disponibile: restano i tre di serie
    }
    setHydrated(true);
  }, []);

  const setSlot = useCallback((index: number, href: string) => {
    setSlotsState((prev) => {
      const next = [...prev];
      next[index] = href;
      try {
        window.localStorage.setItem(SLOTS_KEY, JSON.stringify(next));
      } catch {
        // storage non disponibile: continua solo in memoria
      }
      return next;
    });
  }, []);

  /** Scambia due schede già in barra — usata quando la pressione lunga su uno slot sceglie
   * una scheda che occupa già un altro slot: invece di lasciare un doppione e far sparire la
   * scheda di partenza, ognuna prende il posto dell'altra. Un solo aggiornamento funzionale,
   * non due `setSlot` di fila: due scritture separate sullo stesso array nello stesso
   * gestore di evento leggerebbero altrimenti lo stesso stato non ancora aggiornato, la
   * stessa causa di bug già vista più volte in questo progetto. */
  const swapSlots = useCallback((a: number, b: number) => {
    setSlotsState((prev) => {
      const next = [...prev];
      [next[a], next[b]] = [next[b], next[a]];
      try {
        window.localStorage.setItem(SLOTS_KEY, JSON.stringify(next));
      } catch {
        // storage non disponibile: continua solo in memoria
      }
      return next;
    });
  }, []);

  return { slots, hydrated, setSlot, swapSlots };
}
