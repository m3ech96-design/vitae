"use client";
import { useState } from "react";
import { Plus, X, Tag } from "lucide-react";

export function TagEditor({
  tags,
  onAdd,
  onRemove,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const submit = () => {
    const clean = draft.trim();
    if (clean) onAdd(clean);
    setDraft("");
    setAdding(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Tag size={12} className="shrink-0 text-ink-800" />
      {tags.map((tag) => (
        <span key={tag} className="group flex items-center gap-1 rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] text-ink-300">
          #{tag}
          <button onClick={() => onRemove(tag)} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label={`Rimuovi tag ${tag}`}>
            <X size={9} />
          </button>
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          onBlur={submit}
          placeholder="tag..."
          className="focus-ring w-20 rounded-full border border-aura-violet/40 bg-white/[0.05] px-2.5 py-1 text-[11px] text-ink-100"
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="focus-ring flex items-center gap-0.5 rounded-full border border-dashed border-white/15 px-2 py-1 text-[11px] text-ink-800 hover:text-ink-300"
        >
          <Plus size={10} /> tag
        </button>
      )}
    </div>
  );
}
