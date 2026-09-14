"use client";
import Link from "next/link";
import { ListChecks, FileText, Pin } from "lucide-react";
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
  const progressPct = entry.kind === "list" && entry.items.length > 0 ? (entry.items.filter((i) => i.done).length / entry.items.length) * 100 : null;

  return (
    <Link href={`/liste-note/${entry.id}`}>
      <GlassCard className="flex items-center gap-3 p-4 transition hover:border-white/20">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl2 bg-aura-violet/15">
          <Icon size={16} className="text-aura-violet" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate font-display text-sm text-ink-100">
            {entry.pinned && <Pin size={11} className="shrink-0 fill-aura-amber text-aura-amber" />}
            <span className="truncate">{entry.title || "Senza titolo"}</span>
          </p>
          <p className="mt-0.5 truncate text-xs text-ink-600">{preview(entry)}</p>
          {progressPct !== null && (
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-aura-emerald/70 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          )}
          {entry.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {entry.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-ink-600">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <p className="shrink-0 self-start text-[10px] text-ink-800">{formatExactMoment(entry.updatedAt)}</p>
      </GlassCard>
    </Link>
  );
}
