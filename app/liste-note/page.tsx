"use client";
import { useMemo, useState } from "react";
import { Plus, Search, StickyNote, X } from "lucide-react";
import { useNotes } from "@/lib/notes-context";
import { noteMatchesQuery } from "@/lib/notes-search";
import { NoteEntryCard } from "@/components/notes/NoteEntryCard";
import { AddNoteEntrySheet } from "@/components/notes/AddNoteEntrySheet";

type SortMode = "recenti" | "alfabetico";

const SORT_LABEL: Record<SortMode, string> = {
  recenti: "Più recenti",
  alfabetico: "A-Z",
};

export default function ListeNotePage() {
  const { hydrated, entries, addList, addNote } = useNotes();
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("recenti");

  const filtered = useMemo(() => {
    const arr = entries.filter((e) => noteMatchesQuery(e, query));
    arr.sort((a, b) =>
      sort === "alfabetico" ? a.title.localeCompare(b.title, "it") : b.updatedAt.localeCompare(a.updatedAt)
    );
    return arr;
  }, [entries, query, sort]);

  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Liste e note</p>
          <h1 className="mt-1 font-display text-2xl text-ink-100">Tutto ciò che vuoi annotare</h1>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="focus-ring flex items-center gap-1.5 rounded-full bg-aura-gradient px-3.5 py-2 text-[11px] font-display text-void-950 shadow-glow"
        >
          <Plus size={13} /> Nuovo
        </button>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-2.5">
        <Search size={15} className="shrink-0 text-ink-800" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per parola..."
          className="focus-ring min-w-0 flex-1 bg-transparent text-sm text-ink-100 placeholder:text-ink-800"
        />
        {query && (
          <button onClick={() => setQuery("")} className="focus-ring shrink-0 text-ink-800 hover:text-ink-200" aria-label="Cancella ricerca">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-1.5">
        {(Object.keys(SORT_LABEL) as SortMode[]).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`focus-ring rounded-full border px-3 py-1.5 text-[11px] transition ${
              sort === s ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-800"
            }`}
          >
            {SORT_LABEL[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-14 flex flex-col items-center gap-2 text-center">
          <StickyNote size={22} className="text-ink-800" />
          <p className="text-sm text-ink-600">
            {entries.length === 0 ? "Non hai ancora creato nessuna lista o nota." : "Nessun risultato per questa ricerca."}
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-2.5">
          {filtered.map((entry) => (
            <NoteEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {addOpen && (
        <AddNoteEntrySheet
          onCreateList={(title) => addList(title)}
          onCreateNote={(title) => addNote(title)}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}
