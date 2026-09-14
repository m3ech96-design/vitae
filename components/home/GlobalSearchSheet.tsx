"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useHousehold } from "@/lib/household-context";
import { usePlaces } from "@/lib/places-context";
import { useTasks } from "@/lib/tasks-context";
import { useFood } from "@/lib/food-context";
import { useHobby } from "@/lib/hobby-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useWorkoutPlans } from "@/lib/workout-plans-context";
import { useNotes } from "@/lib/notes-context";
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
 * Stessa logica di ricerca cross-tipo di EntityLinkPickerSheet (vedi
 * components/ui/EntityLinkPickerSheet.tsx) — questo sheet è concettualmente lo stesso
 * "cerca tra tutto", ma qui il tap su un risultato NAVIGA verso di esso (è la ricerca
 * globale dell'app), mentre lì il tap SELEZIONA per crearci un collegamento. Due scopi
 * diversi abbastanza da giustificare due componenti — un parametro "modalità" cambierebbe
 * il significato del tap in un modo che renderebbe il componente più confuso da leggere di
 * quanto valga evitare questa piccola duplicazione della sola query.
 *
 * "Non invasiva" (richiesta esplicita): niente di simile a questo compare mai da solo, si
 * apre solo dal pulsante di ricerca in Home e si chiude con un tap fuori o sulla X, come
 * ogni altro sheet dell'app — nessun overlay permanente, nessuna barra di ricerca sempre
 * visibile che ruba spazio quando non serve.
 */
export function GlobalSearchSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { people } = useHousehold();
  const { places } = usePlaces();
  const { tasks } = useTasks();
  const { ingredients } = useFood();
  const { hobbies } = useHobby();
  const { items: wishlistItems } = useWishlist();
  const { plans: workoutPlans } = useWorkoutPlans();
  const { entries: noteEntries } = useNotes();
  const { resolve } = useEntityResolver();

  const allEntries: SearchableEntry[] = useMemo(
    () => [
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
    ],
    [people, places, tasks, ingredients, hobbies, wishlistItems, workoutPlans, noteEntries]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allEntries.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 40);
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

  const goTo = (link: EntityLink) => {
    const resolved = resolve(link);
    if (resolved.missing) return;
    router.push(resolved.href);
    onClose();
  };

  return (
    <PersonalCardSheet title="Cerca" onClose={onClose}>
      <div className="space-y-4">
        <TextField
          label="Cerca in tutta l'app"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Persone, luoghi, task, ricette, note..."
          autoFocus
        />

        {!query.trim() && (
          <p className="text-xs text-ink-800">
            Scrivi un nome per cercare tra persone, animali, luoghi, task, ricette, hobby, wishlist, schede allenamento e
            note.
          </p>
        )}
        {query.trim() && results.length === 0 && <p className="text-xs text-ink-800">Nessun risultato per &quot;{query}&quot;.</p>}

        {grouped.map(([type, entries]) => (
          <div key={type}>
            <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-ink-600">{LINKABLE_TYPE_LABEL[type]}</p>
            <div className="flex flex-wrap gap-3">
              {entries.map((e) => (
                <button key={`${e.type}-${e.id}`} onClick={() => goTo({ type: e.type, id: e.id })} className="focus-ring">
                  <EntityLinkCard entity={resolve({ type: e.type, id: e.id })} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PersonalCardSheet>
  );
}
