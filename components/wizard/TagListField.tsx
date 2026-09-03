"use client";
import { useState, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
import { capitalizeWords } from "@/lib/text";

export function TagListField({
  label,
  tags,
  onChange,
  placeholder,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = capitalizeWords(draft.trim());
    if (!v) return;
    if (tags.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...tags, v]);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  return (
    <div>
      <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-ink-100"
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(tags.filter((x) => x !== t))}
              className="focus-ring text-ink-800 transition hover:text-aura-pink"
              aria-label={`Rimuovi ${t}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1.5 rounded-full border border-dashed border-white/15 pl-3 pr-1.5 py-1">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="focus-ring w-28 bg-transparent text-sm text-ink-100 placeholder:text-ink-800 outline-none"
          />
          <button
            type="button"
            onClick={add}
            disabled={!draft.trim()}
            className="focus-ring rounded-full p-1 text-ink-600 transition hover:text-aura-cyan disabled:opacity-30"
            aria-label="Aggiungi"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
