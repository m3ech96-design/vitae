"use client";
import { ChevronUp, ChevronDown, Trash2, Check } from "lucide-react";
import clsx from "clsx";
import { NoteListItem } from "@/lib/notes-types";

export function NoteListItemRow({
  item,
  isFirst,
  isLast,
  onToggle,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  item: NoteListItem;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl2 border border-white/[0.06] bg-white/[0.015] px-3 py-2.5">
      <button
        onClick={onToggle}
        className={clsx(
          "focus-ring flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition",
          item.done ? "border-aura-emerald bg-aura-emerald/20 text-aura-emerald" : "border-white/20 text-transparent"
        )}
        aria-label={item.done ? "Segna come da fare" : "Segna come completata"}
      >
        <Check size={13} />
      </button>
      <p className={clsx("min-w-0 flex-1 truncate text-sm", item.done ? "text-ink-800 line-through" : "text-ink-100")}>
        {item.text}
      </p>
      <div className="flex shrink-0 items-center gap-0.5 text-ink-800">
        <button onClick={onMoveUp} disabled={isFirst} className="focus-ring p-1 hover:text-ink-200 disabled:opacity-30" aria-label="Sposta su">
          <ChevronUp size={14} />
        </button>
        <button onClick={onMoveDown} disabled={isLast} className="focus-ring p-1 hover:text-ink-200 disabled:opacity-30" aria-label="Sposta giù">
          <ChevronDown size={14} />
        </button>
        <button onClick={onRemove} className="focus-ring p-1 hover:text-aura-pink" aria-label="Elimina voce">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
