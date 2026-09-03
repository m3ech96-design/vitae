"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Check } from "lucide-react";
import { NEWS_CATEGORIES, NEWS_SOURCES } from "@/lib/news-sources-catalog";
import { useNewsSources } from "@/lib/news-sources-context";
import { SwitchVisual } from "@/components/ui/Switch";

/**
 * "Voglio che l'utente possa scegliere... da una lista con precisi giornali, magazine e siti
 * per quella categoria" — questa schermata è quella lista: sfoglia per categoria (o cerca per
 * nome su tutto il catalogo), tocca una testata per aggiungerla o toglierla dalle proprie
 * fonti. Nessuna preselezione: la selezione arriva sempre e solo da qui.
 */
export default function NewsSourcesPage() {
  const router = useRouter();
  const { selectedIds, isSelected, toggleSource, selectAllInCategory, clearCategory } = useNewsSources();
  const [activeCategory, setActiveCategory] = useState(NEWS_CATEGORIES[0].id);
  const [query, setQuery] = useState("");

  const countByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of NEWS_SOURCES) if (selectedIds.includes(s.id)) map.set(s.category, (map.get(s.category) ?? 0) + 1);
    return map;
  }, [selectedIds]);

  const q = query.trim().toLocaleLowerCase("it-IT");
  const visibleSources = q
    ? NEWS_SOURCES.filter((s) => s.name.toLocaleLowerCase("it-IT").includes(q))
    : NEWS_SOURCES.filter((s) => s.category === activeCategory);

  const allSelectedInActive = !q && visibleSources.length > 0 && visibleSources.every((s) => isSelected(s.id));

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/news")}
          className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-[#B79A6B]/50"
          aria-label="Torna alle News"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="font-display text-xl text-ink-100">Gestisci fonti</h1>
          <p className="text-xs text-ink-800">
            {selectedIds.length === 0 ? "Nessuna fonte scelta ancora" : `${selectedIds.length} fonti selezionate`}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl2 border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
        <Search size={15} className="shrink-0 text-ink-800" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca una testata, rivista o sito..."
          className="w-full bg-transparent text-sm text-ink-100 placeholder:text-ink-800 focus:outline-none"
        />
      </div>

      {!q && (
        <>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {NEWS_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`focus-ring shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition ${
                  activeCategory === c.id ? "border-[#B79A6B]/60 bg-[#B79A6B]/15 text-ink-100" : "border-white/10 text-ink-600 hover:border-white/25"
                }`}
              >
                {c.label}
                {(countByCategory.get(c.id) ?? 0) > 0 && (
                  <span className="ml-1.5 text-[#B79A6B]">{countByCategory.get(c.id)}</span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={() => (allSelectedInActive ? clearCategory(activeCategory) : selectAllInCategory(activeCategory))}
              className="focus-ring text-[11px] text-ink-600 hover:text-ink-200"
            >
              {allSelectedInActive ? "Rimuovi tutte in questa categoria" : "Aggiungi tutte in questa categoria"}
            </button>
          </div>
        </>
      )}

      <div className="mt-3 space-y-2">
        {visibleSources.length === 0 && <p className="py-6 text-center text-xs text-ink-800">Nessuna testata trovata.</p>}
        {visibleSources.map((source) => {
          const selected = isSelected(source.id);
          return (
            <button
              key={source.id}
              type="button"
              onClick={() => toggleSource(source.id)}
              className={`focus-ring flex w-full items-center justify-between gap-3 rounded-xl2 border px-4 py-3 text-left transition ${
                selected ? "border-[#B79A6B]/40 bg-[#B79A6B]/10" : "border-white/[0.06] bg-white/[0.02] hover:border-white/15"
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink-100">{source.name}</span>
                {q && <span className="block text-[10px] text-ink-800">{NEWS_CATEGORIES.find((c) => c.id === source.category)?.label}</span>}
              </span>
              {selected && <Check size={14} className="shrink-0 text-[#B79A6B]" />}
              <SwitchVisual checked={selected} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
