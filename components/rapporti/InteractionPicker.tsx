"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Search } from "lucide-react";

export function InteractionPicker({
  positiveOptions,
  negativeOptions,
  onPick,
}: {
  positiveOptions: string[];
  negativeOptions: string[];
  onPick: (label: string, positive: boolean) => void;
}) {
  const [tab, setTab] = useState<"positive" | "negative">("positive");
  const [query, setQuery] = useState("");
  const options = tab === "positive" ? positiveOptions : negativeOptions;
  const filtered = useMemo(
    () => options.filter((o) => o.toLocaleLowerCase("it-IT").includes(query.toLocaleLowerCase("it-IT"))),
    [options, query]
  );

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setTab("positive")}
          className={`focus-ring flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs transition ${
            tab === "positive" ? "border-aura-cyan/60 bg-aura-cyan/15 text-ink-100" : "border-white/10 text-ink-600"
          }`}
        >
          <ThumbsUp size={13} /> Positive
        </button>
        <button
          onClick={() => setTab("negative")}
          className={`focus-ring flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs transition ${
            tab === "negative" ? "border-aura-pink/60 bg-aura-pink/15 text-ink-100" : "border-white/10 text-ink-600"
          }`}
        >
          <ThumbsDown size={13} /> Negative
        </button>
      </div>

      <div className="relative mb-3">
        <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-800" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca Un'Interazione..."
          className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] py-2 pl-8 pr-3 text-xs text-ink-100 placeholder:text-ink-800"
        />
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex max-h-64 flex-wrap gap-2 overflow-y-auto pr-1"
      >
        {filtered.map((label) => (
          <button
            key={label}
            onClick={() => onPick(label, tab === "positive")}
            className={`focus-ring rounded-xl2 border px-3 py-2 text-left text-xs leading-snug transition-all active:scale-95 ${
              tab === "positive"
                ? "border-aura-cyan/20 bg-white/[0.02] text-ink-300 hover:border-aura-cyan/50"
                : "border-aura-pink/20 bg-white/[0.02] text-ink-300 hover:border-aura-pink/50"
            }`}
          >
            {label}
          </button>
        ))}
        {filtered.length === 0 && <p className="py-2 text-xs text-ink-800">Nessuna Interazione Trovata.</p>}
      </motion.div>
    </div>
  );
}
