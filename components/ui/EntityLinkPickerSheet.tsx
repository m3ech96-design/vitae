"use client";
import { useMemo, useState } from "react";
import { useHousehold } from "@/lib/household-context";
import { usePlaces } from "@/lib/places-context";
import { useTasks } from "@/lib/tasks-context";
import { useFood } from "@/lib/food-context";
import { useHobby } from "@/lib/hobby-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useWorkoutPlans } from "@/lib/workout-plans-context";
import { useNotes } from "@/lib/notes-context";
import { useDiary } from "@/lib/diary-context";
import { ANIMAL_KINDS } from "@/lib/types";
import { EntityLink, LinkableType, LINKABLE_TYPE_LABEL } from "@/lib/entity-link";
import { useEntityResolver } from "@/lib/entity-resolver";
import { PersonalCardSheet } from "@/components/home/PersonalCardSheet";
import { TextField } from "@/components/ui/TextField";
import { EntityLinkCard } from "@/components/ui/EntityLinkCard";

interface SearchableEntry {
  type: LinkableType;
  id: string;
  name: string;
}

/**
 * Cerca tra TUTTE le entità collegabili con una sola casella di ricerca, raggruppate per
 * tipo — "linka tutto, ma proprio tutto" (richiesta originale per il Diario) significa che
 * l'utente non deve sapere in anticipo in quale modulo si trova ciò che vuole collegare:
 * scrive un nome e vede risultati arrivare da qualunque parte dell'app li contenga.
 * Già collegati (`excludeIds`) non compaiono più tra i risultati — niente doppioni dello
 * stesso link sulla stessa voce.
 */
export function EntityLinkPickerSheet({
  existingLinks,
  onAdd,
  onClose,
}: {
  existingLinks: EntityLink[];
  onAdd: (link: EntityLink) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const { people } = useHousehold();
  const { places } = usePlaces();
  const { tasks } = useTasks();
  const { ingredients } = useFood();
  const { hobbies } = useHobby();
  const { items: wishlistItems } = useWishlist();
  const { plans: workoutPlans } = useWorkoutPlans();
  const { entries: noteEntries } = useNotes();
  const { entries: diaryEntries } = useDiary();
  const { resolve } = useEntityResolver();

  const allEntries: SearchableEntry[] = useMemo(() => {
    const isAlreadyLinked = (type: LinkableType, id: string) => existingLinks.some((l) => l.type === type && l.id === id);
    const entries: SearchableEntry[] = [
      ...people
        .filter((p) => !ANIMAL_KINDS.includes(p.kind))
        .map((p) => ({ type: "persona" as const, id: p.id, name: `${p.firstName} ${p.lastName}`.trim() })),
      ...people.filter((p) => ANIMAL_KINDS.includes(p.kind)).map((p) => ({ type: "animale" as const, id: p.id, name: p.firstName })),
      ...places.map((p) => ({ type: "luogo" as const, id: p.id, name: p.name })),
      ...tasks.map((t) => ({ type: "task" as const, id: t.id, name: t.title })),
      ...ingredients.map((i) => ({ type: "ingrediente" as const, id: i.id, name: i.name })),
      ...hobbies.map((h) => ({ type: "hobby" as const, id: h.id, name: h.name })),
      ...wishlistItems.map((w) => ({ type: "wishlist" as const, id: w.id, name: w.name })),
      ...workoutPlans.map((wp) => ({ type: "scheda-allenamento" as const, id: wp.id, name: wp.name })),
      ...noteEntries.map((n) => ({ type: "nota" as const, id: n.id, name: n.title || "Senza titolo" })),
      ...diaryEntries.map((d) => ({ type: "diario" as const, id: d.id, name: d.text })),
    ];
    return entries.filter((e) => !isAlreadyLinked(e.type, e.id));
  }, [people, places, tasks, ingredients, hobbies, wishlistItems, workoutPlans, noteEntries, diaryEntries, existingLinks]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allEntries.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 30);
  }, [allEntries, query]);

  const grouped = useMemo(() => {
    const map = new Map<LinkableType, SearchableEntry[]>();
    results.forEach((r) => {
      const list = map.get(r.type) ?? [];
      list.push(r);
      map.set(r.type, list);
    });
    return Array.from(map.entries());
  }, [results]);

  return (
    <PersonalCardSheet title="Collega qualcosa" onClose={onClose}>
      <div className="space-y-4">
        <TextField
          label="Cerca"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nome di persona, luogo, task, ricetta..."
          autoFocus
        />

        {query.trim() && results.length === 0 && <p className="text-xs text-ink-800">Nessun risultato per &quot;{query}&quot;.</p>}

        {grouped.map(([type, entries]) => (
          <div key={type}>
            <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-ink-600">{LINKABLE_TYPE_LABEL[type]}</p>
            <div className="flex flex-wrap gap-3">
              {entries.map((e) => {
                const resolved = resolve({ type: e.type, id: e.id });
                return (
                  <button
                    key={`${e.type}-${e.id}`}
                    onClick={() => {
                      onAdd({ type: e.type, id: e.id });
                      onClose();
                    }}
                    className="focus-ring"
                  >
                    <EntityLinkCard entity={resolved} disableNavigation />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </PersonalCardSheet>
  );
}
