"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { LibraryBlock } from "@/lib/hobby-types";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { StarDisplay } from "./StarRating";
import { GlassCard } from "../ui/GlassCard";
import { BlockHeader } from "./BlockHeader";
import { LibraryItemModal } from "./LibraryItemModal";

const STATUS_LABEL: Record<string, string> = {
  "da-provare": "Da provare",
  "in-corso": "In corso",
  completato: "Completato",
  abbandonato: "Abbandonato",
};

function CoverThumb({ photoKey }: { photoKey?: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) return <div className="aspect-[2/3] w-full rounded-xl2 bg-white/[0.05]" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="aspect-[2/3] w-full rounded-xl2 object-cover" />;
}

export function LibraryBlockView({ hobbyId, block }: { hobbyId: string; block: LibraryBlock }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const completedCount = block.items.filter((i) => i.status === "completato").length;
  const editItem = block.items.find((i) => i.id === editId);

  return (
    <GlassCard className="p-4">
      <BlockHeader
        hobbyId={hobbyId}
        blockId={block.id}
        title={block.title}
        subtitle={block.items.length > 0 ? `${completedCount} completati su ${block.items.length}` : undefined}
        extra={
          <button onClick={() => setAddOpen(true)} className="focus-ring flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1.5 text-[11px] text-ink-300 hover:border-aura-cyan/50">
            <Plus size={12} /> Voce
          </button>
        }
      />

      {block.items.length === 0 ? (
        <p className="text-xs text-ink-800">Ancora nessuna voce.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {block.items.map((item) => (
            <button key={item.id} onClick={() => setEditId(item.id)} className="text-left">
              <CoverThumb photoKey={item.photoKey} />
              <p className="mt-1 truncate text-[11px] text-ink-100">{item.title}</p>
              <p className="text-[10px] text-ink-600">{STATUS_LABEL[item.status]}</p>
              {item.rating && <StarDisplay value={item.rating} size={9} />}
            </button>
          ))}
        </div>
      )}

      {addOpen && <LibraryItemModal hobbyId={hobbyId} blockId={block.id} onClose={() => setAddOpen(false)} />}
      {editItem && <LibraryItemModal hobbyId={hobbyId} blockId={block.id} item={editItem} onClose={() => setEditId(null)} />}
    </GlassCard>
  );
}
