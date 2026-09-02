"use client";
import { useMemo, useState } from "react";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useDiary } from "@/lib/diary-context";
import { formatDateShort } from "@/lib/date-format";
import { DiaryEntryCard } from "./DiaryEntryCard";

/**
 * Il diario "a libro": una nota alla volta, con una transizione di rotazione — non uno
 * slide/fade generico, ma lo stesso linguaggio di flip già usato per il cambio di barra di
 * navigazione (`BottomNav.tsx`, `rotateY`), qui applicato a un contesto nuovo: sfogliare
 * davvero, pagina dopo pagina, avanti o indietro a seconda della direzione presa.
 */
export function DiarySfoglia() {
  const { entries } = useDiary();
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const filtered = useMemo(() => {
    const base = [...entries].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const ordered = order === "asc" ? base : base.reverse();
    if (!query.trim()) return ordered;
    const q = query.trim().toLowerCase();
    return ordered.filter((e) => e.text.toLowerCase().includes(q));
  }, [entries, order, query]);

  const safeIndex = Math.min(index, Math.max(0, filtered.length - 1));
  const current = filtered[safeIndex];

  const goPrev = () => {
    setDirection(-1);
    setIndex((i) => Math.max(0, i - 1));
  };
  const goNext = () => {
    setDirection(1);
    setIndex((i) => Math.min(filtered.length - 1, i + 1));
  };

  // Cambiare ricerca o ordine riparte sempre dalla prima pagina del nuovo elenco filtrato —
  // restare su un indice numerico che nell'elenco precedente indicava un'altra nota sarebbe
  // solo confuso.
  const onQueryChange = (v: string) => {
    setQuery(v);
    setIndex(0);
  };
  const toggleOrder = () => {
    setOrder((o) => (o === "asc" ? "desc" : "asc"));
    setIndex(0);
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-800" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Cerca una parola nel diario..."
            className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] py-2.5 pl-8 pr-3 text-sm text-ink-100 placeholder:text-ink-800"
          />
        </div>
        <button
          onClick={toggleOrder}
          className="focus-ring flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3 py-2.5 text-xs text-ink-300 transition hover:border-aura-violet/50"
        >
          <ArrowUpDown size={13} />
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-ink-800">{order === "asc" ? "Dalla più vecchia alla più recente" : "Dalla più recente alla più vecchia"}</p>

      {filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <BookOpen size={22} className="text-ink-800" />
          <p className="text-sm text-ink-600">
            {query.trim() ? "Nessuna nota contiene questa parola." : "Il diario è ancora vuoto."}
          </p>
        </div>
      ) : (
        <>
          <div className="relative mt-5" style={{ perspective: 1200 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ rotateY: direction > 0 ? 65 : -65, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: direction > 0 ? -65 : 65, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: direction > 0 ? "left center" : "right center" }}
              >
                <p className="mb-2 text-xs text-ink-600">
                  {formatDateShort(current.date)} · {current.time}
                </p>
                <DiaryEntryCard entry={current} highlightQuery={query} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={safeIndex === 0}
              className="focus-ring flex items-center gap-1 text-xs text-ink-300 disabled:opacity-30"
            >
              <ChevronLeft size={14} /> Prima
            </button>
            <span className="text-xs text-ink-800">
              {safeIndex + 1} di {filtered.length}
            </span>
            <button
              onClick={goNext}
              disabled={safeIndex === filtered.length - 1}
              className="focus-ring flex items-center gap-1 text-xs text-ink-300 disabled:opacity-30"
            >
              Dopo <ChevronRight size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
