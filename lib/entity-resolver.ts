"use client";
import { LucideIcon, User, PawPrint, MapPin, ListTodo, UtensilsCrossed, Palette, Gift, Dumbbell, StickyNote, BookOpen } from "lucide-react";
import { useHousehold } from "./household-context";
import { usePlaces } from "./places-context";
import { useTasks } from "./tasks-context";
import { useFood } from "./food-context";
import { useHobby } from "./hobby-context";
import { useWishlist } from "./wishlist-context";
import { useWorkoutPlans } from "./workout-plans-context";
import { useNotes } from "./notes-context";
import { useDiary } from "./diary-context";
import { ANIMAL_KINDS } from "./types";
import { EntityLink, LinkableType } from "./entity-link";
import { personColor } from "./person-color";

/** Cosa serve per rendere una card di collegamento il più ricca possibile senza forzare
 * tutti i tipi nello stesso stampino: una foto vera quando l'entità ce l'ha (persone,
 * animali, luoghi, hobby, wishlist), altrimenti icona + colore di categoria — mai una foto
 * finta al posto di un'icona onesta. `missing: true` quando l'id non esiste più (entità
 * eliminata dopo che il link era stato creato): il riferimento resta nel testo (mai
 * cancellato in silenzio da sotto i piedi di chi lo aveva messo), ma il chiamante lo mostra
 * chiaramente come "non più disponibile" invece di una card vuota che sembra un bug. */
export interface ResolvedEntity {
  link: EntityLink;
  label: string;
  /** URL diretto già pronto (avatar persone/animali, foto luoghi) — mostrabile subito. */
  imageUrl?: string;
  /** Chiave IndexedDB (hobby, wishlist) — richiede useResolvedImage lato componente per
   * diventare un URL: tenuta distinta da `imageUrl` così il chiamante sa quale dei due
   * gestire, invece di dover indovinare se una stringa è già un URL o va risolta. */
  photoKey?: string;
  color: string;
  icon: LucideIcon;
  href: string;
  missing: boolean;
}

const TYPE_FALLBACK: Record<LinkableType, { color: string; icon: LucideIcon }> = {
  persona: { color: "#8B90A8", icon: User },
  animale: { color: "#B79A6B", icon: PawPrint },
  luogo: { color: "#5EC8FF", icon: MapPin },
  task: { color: "#7C5CFF", icon: ListTodo },
  ingrediente: { color: "#34D399", icon: UtensilsCrossed },
  hobby: { color: "#FF6B9D", icon: Palette },
  wishlist: { color: "#FFB454", icon: Gift },
  "scheda-allenamento": { color: "#00E5C7", icon: Dumbbell },
  nota: { color: "#B7A6FF", icon: StickyNote },
  diario: { color: "#FF8FB4", icon: BookOpen },
};

/**
 * Un solo posto che sa come risolvere QUALUNQUE {tipo, id} in qualcosa di mostrabile — il
 * Diario e Liste/note (gli unici due punti che oggi useranno il link generico) chiamano
 * entrambi questo hook invece di duplicare la logica "se persona guarda in household, se
 * luogo guarda in places, ..." ciascuno per conto proprio. Aggiungere un decimo tipo
 * collegabile in futuro significa toccare solo questo file, non ogni punto che mostra un
 * link.
 */
export function useEntityResolver() {
  const { people } = useHousehold();
  const { places } = usePlaces();
  const { tasks } = useTasks();
  const { ingredients } = useFood();
  const { hobbies } = useHobby();
  const { items: wishlistItems } = useWishlist();
  const { plans: workoutPlans } = useWorkoutPlans();
  const { entries: noteEntries } = useNotes();
  const { entries: diaryEntries } = useDiary();

  function resolve(link: EntityLink): ResolvedEntity {
    const fallback = TYPE_FALLBACK[link.type];

    switch (link.type) {
      case "persona": {
        const p = people.find((x) => x.id === link.id && !ANIMAL_KINDS.includes(x.kind));
        return {
          link,
          label: p ? `${p.firstName} ${p.lastName}`.trim() : "Persona eliminata",
          imageUrl: p?.avatarUrl,
          color: p ? personColor(p.id) : fallback.color,
          icon: fallback.icon,
          href: p ? `/rapporti/${p.id}` : "#",
          missing: !p,
        };
      }
      case "animale": {
        const a = people.find((x) => x.id === link.id && ANIMAL_KINDS.includes(x.kind));
        return {
          link,
          label: a?.firstName ?? "Animale eliminato",
          imageUrl: a?.avatarUrl,
          color: a ? personColor(a.id) : fallback.color,
          icon: fallback.icon,
          href: a ? `/animali/${a.id}` : "#",
          missing: !a,
        };
      }
      case "luogo": {
        const pl = places.find((x) => x.id === link.id);
        return {
          link,
          label: pl?.name ?? "Luogo eliminato",
          imageUrl: pl?.photoUrl,
          color: fallback.color,
          icon: fallback.icon,
          href: pl ? `/map?place=${pl.id}` : "#",
          missing: !pl,
        };
      }
      case "task": {
        const t = tasks.find((x) => x.id === link.id);
        return {
          link,
          label: t?.title ?? "Task eliminata",
          color: t?.color ?? fallback.color,
          icon: fallback.icon,
          href: "/task",
          missing: !t,
        };
      }
      case "ingrediente": {
        const i = ingredients.find((x) => x.id === link.id);
        return {
          link,
          label: i?.name ?? "Ingrediente eliminato",
          color: fallback.color,
          icon: fallback.icon,
          href: "/alimentazione/ingredienti",
          missing: !i,
        };
      }
      case "hobby": {
        const h = hobbies.find((x) => x.id === link.id);
        return {
          link,
          label: h?.name ?? "Hobby eliminato",
          photoKey: h?.photoKey,
          color: fallback.color,
          icon: fallback.icon,
          href: h ? `/hobby/${h.id}` : "#",
          missing: !h,
        };
      }
      case "wishlist": {
        const w = wishlistItems.find((x) => x.id === link.id);
        return {
          link,
          label: w?.name ?? "Articolo eliminato",
          photoKey: w?.photoKey,
          color: fallback.color,
          icon: fallback.icon,
          href: "/wishlist",
          missing: !w,
        };
      }
      case "scheda-allenamento": {
        const wp = workoutPlans.find((x) => x.id === link.id);
        return {
          link,
          label: wp?.name ?? "Scheda eliminata",
          color: fallback.color,
          icon: fallback.icon,
          href: wp ? `/attivita-peso/schede-allenamenti/${wp.id}` : "/attivita-peso/schede-allenamenti",
          missing: !wp,
        };
      }
      case "nota": {
        const n = noteEntries.find((x) => x.id === link.id);
        return {
          link,
          label: n?.title || "Senza titolo",
          color: fallback.color,
          icon: fallback.icon,
          href: n ? `/liste-note/${n.id}` : "/liste-note",
          missing: !n,
        };
      }
      case "diario": {
        const d = diaryEntries.find((x) => x.id === link.id);
        return {
          link,
          // Una voce di diario non ha un titolo (solo testo libero) — un estratto breve
          // resta comunque riconoscibile, coerente con come Tiber la presenta già (vedi
          // leggi_diario in lib/tiber/tools/diary.ts).
          label: d ? `${d.text.slice(0, 40)}${d.text.length > 40 ? "…" : ""}` : "Voce eliminata",
          color: fallback.color,
          icon: fallback.icon,
          // Nessuna pagina per singola voce (come "task" qui sopra) — porta al Diario in
          // generale, non a un punto preciso al suo interno.
          href: "/diario",
          missing: !d,
        };
      }
    }
  }

  return { resolve };
}
