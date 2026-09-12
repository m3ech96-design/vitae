"use client";
import Link from "next/link";
import { ListChecks, FileText } from "lucide-react";
import { NoteEntry } from "@/lib/notes-types";
import { formatExactMoment } from "@/lib/date-format";
import { GlassCard } from "@/components/ui/GlassCard";

function preview(entry: NoteEntry): string {
  if (entry.kind === "note") return entry.body.trim() || "Nota vuota";
  if (entry.items.length === 0) return "Lista vuota";
  const done = entry.items.filter((i) => i.done).length;
  return `${done}/${entry.items.length} completate`;
}

export function NoteEntryCard({ entry }: { entry: NoteEntry }) {
  const Icon = entry.kind === "list" ? ListChecks : FileText;
  return (
    <Link href={`/liste-note/${entry.id}`}>
      <GlassCard className="flex items-center gap-3 p-4 transition hover:border-white/20">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl2 bg-aura-violet/15">
          <Icon size={16} className="text-aura-violet" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm text-ink-100">{entry.title || "Senza titolo"}</p>
          <p className="mt-0.5 truncate text-xs text-ink-600">{preview(entry)}</p>
        </div>
        <p className="shrink-0 text-[10px] text-ink-800">{formatExactMoment(entry.updatedAt)}</p>
      </GlassCard>
    </Link>
  );
}
