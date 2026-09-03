"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { ChecklistBlock } from "@/lib/hobby-types";
import { formatDateShort } from "@/lib/date-format";
import { GlassCard } from "../ui/GlassCard";
import { BlockHeader } from "./BlockHeader";
import { ChecklistItemModal } from "./ChecklistItemModal";

const STATUS_COLOR: Record<string, string> = {
  "da-fare": "#8B90A8",
  "in-corso": "#FFB454",
  fatta: "#34D399",
};
const STATUS_LABEL: Record<string, string> = {
  "da-fare": "Da fare",
  "in-corso": "In corso",
  fatta: "Fatta",
};

export function ChecklistBlockView({ hobbyId, block }: { hobbyId: string; block: ChecklistBlock }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const doneCount = block.items.filter((i) => i.status === "fatta").length;
  const editItem = block.items.find((i) => i.id === editId);

  return (
    <GlassCard className="p-4">
      <BlockHeader
        hobbyId={hobbyId}
        blockId={block.id}
        title={block.title}
        subtitle={block.items.length > 0 ? `${doneCount} di ${block.items.length} fatte` : undefined}
        extra={
          <button onClick={() => setAddOpen(true)} className="focus-ring flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1.5 text-[11px] text-ink-300 hover:border-aura-violet/50">
            <Plus size={12} /> Attività
          </button>
        }
      />

      {block.items.length === 0 ? (
        <p className="text-xs text-ink-800">Ancora nessuna attività.</p>
      ) : (
        <div className="space-y-1.5">
          {[...block.items]
            .sort((a, b) => (a.dueDate ?? a.createdAt).localeCompare(b.dueDate ?? b.createdAt))
            .map((item) => (
              <button
                key={item.id}
                onClick={() => setEditId(item.id)}
                className="focus-ring flex w-full items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.015] px-3.5 py-2.5 text-left transition hover:border-white/20"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink-100">{item.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-600">
                    <span style={{ color: STATUS_COLOR[item.status] }}>{STATUS_LABEL[item.status]}</span>
                    {item.dueDate && <span>· {formatDateShort(item.dueDate)}</span>}
                    {item.tags.slice(0, 2).map((t) => (
                      <span key={t} className="rounded-full bg-white/[0.05] px-1.5 py-0.5">{t}</span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
        </div>
      )}

      {addOpen && <ChecklistItemModal hobbyId={hobbyId} blockId={block.id} onClose={() => setAddOpen(false)} />}
      {editItem && <ChecklistItemModal hobbyId={hobbyId} blockId={block.id} item={editItem} onClose={() => setEditId(null)} />}
    </GlassCard>
  );
}
