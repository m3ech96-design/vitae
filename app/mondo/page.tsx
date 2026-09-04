"use client";
import { useMemo, useState } from "react";
import { Plus, Users, Search, X, PawPrint } from "lucide-react";
import { useHousehold } from "@/lib/household-context";
import { useTasks } from "@/lib/tasks-context";
import { usePlaces } from "@/lib/places-context";
import { Person, ANIMAL_KINDS } from "@/lib/types";
import { personMatchesQuery } from "@/lib/person-search";
import { totalOutings } from "@/lib/frequency";
import { PersonCard } from "@/components/persone/PersonCard";
import { AddPersonModal } from "@/components/persone/AddPersonModal";
import { PersonWindow } from "@/components/persone/PersonWindow";

type SortMode = "alfabetico" | "frequentazione";
type FilterMode = "tutti" | "persone" | "animali" | "in-casa" | "vitaecom";

export default function MondoPage() {
  const { hydrated, people } = useHousehold();
  const { tasks } = useTasks();
  const { places } = usePlaces();
  const [addOpen, setAddOpen] = useState(false);
  const [addAnimalOpen, setAddAnimalOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("alfabetico");
  const [filter, setFilter] = useState<FilterMode>("tutti");
  const [query, setQuery] = useState("");

  const sorted = useMemo(() => {
    let arr = [...people];
    if (filter === "persone") arr = arr.filter((p) => !ANIMAL_KINDS.includes(p.kind));
    if (filter === "animali") arr = arr.filter((p) => ANIMAL_KINDS.includes(p.kind));
    if (filter === "in-casa") arr = arr.filter((p) => p.livesAtHome);
    if (filter === "vitaecom") arr = arr.filter((p) => Boolean(p.vitaecomAccountId));
    if (query.trim()) arr = arr.filter((p) => personMatchesQuery(p, query));
    if (sort === "alfabetico") arr.sort((a, b) => a.firstName.localeCompare(b.firstName, "it"));
    else arr.sort((a, b) => totalOutings(b.id, tasks, places) - totalOutings(a.id, tasks, places));
    return arr;
  }, [people, sort, filter, query, tasks, places]);

  const openPerson: Person | undefined = sorted.find((p) => p.id === openId);

  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Mondo</p>
          <h1 className="mt-1 font-display text-2xl text-ink-100">Chi conosci</h1>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => setAddAnimalOpen(true)}
            className="focus-ring flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2.5 text-xs text-ink-200 transition hover:border-aura-cyan/50"
          >
            <PawPrint size={14} /> Animale
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="focus-ring flex items-center gap-1.5 rounded-full bg-aura-gradient px-4 py-2.5 text-xs font-display text-void-950 shadow-glow"
          >
            <Plus size={15} /> Persona
          </button>
        </div>
      </div>

      <div className="relative mt-5">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-800" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per nome, occupazione, interessi..."
          className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-9 text-sm text-ink-100 placeholder:text-ink-800"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-ink-800 hover:text-ink-200"
            aria-label="Cancella ricerca"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="mt-5 flex gap-2">
        <button
          onClick={() => setSort("alfabetico")}
          className={`focus-ring rounded-full border px-3.5 py-2 text-xs transition ${
            sort === "alfabetico" ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-600"
          }`}
        >
          Alfabetico
        </button>
        <button
          onClick={() => setSort("frequentazione")}
          className={`focus-ring rounded-full border px-3.5 py-2 text-xs transition ${
            sort === "frequentazione" ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-600"
          }`}
        >
          Frequentazione
        </button>
      </div>

      <div className="mt-2.5 flex gap-1.5 overflow-x-auto no-scrollbar">
        {([
          ["tutti", "Tutti"],
          ["persone", "Persone"],
          ["animali", "Animali"],
          ["in-casa", "In casa"],
          ["vitaecom", "Vitaecom"],
        ] as [FilterMode, string][]).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => setFilter(mode)}
            className={`focus-ring shrink-0 rounded-full border px-3 py-1.5 text-[11px] transition ${
              filter === mode ? "border-aura-cyan/60 bg-aura-cyan/15 text-ink-100" : "border-white/10 text-ink-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-9">
        {sorted.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Users size={22} className="text-ink-800" />
            <p className="text-sm text-ink-600">
              {query || filter !== "tutti" ? "Nessun risultato per questa ricerca." : "Non hai ancora aggiunto nessuna persona."}
            </p>
          </div>
        )}
        {sorted.map((p) => (
          <PersonCard key={p.id} person={p} onOpen={() => setOpenId(p.id)} />
        ))}
      </div>

      {addOpen && <AddPersonModal onClose={() => setAddOpen(false)} />}
      {addAnimalOpen && <AddPersonModal onClose={() => setAddAnimalOpen(false)} title="Aggiungi animale" forceAnimal />}
      {openPerson && <PersonWindow person={openPerson} onClose={() => setOpenId(null)} />}
    </div>
  );
}
