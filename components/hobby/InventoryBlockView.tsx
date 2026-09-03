"use client";
import { useState } from "react";
import { Plus, Repeat } from "lucide-react";
import { InventoryBlock } from "@/lib/hobby-types";
import { inventoryTotalValue, inventoryGainLoss } from "@/lib/hobby-stats";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { GlassCard } from "../ui/GlassCard";
import { BlockHeader } from "./BlockHeader";
import { InventoryItemModal } from "./InventoryItemModal";

function ItemThumb({ photoKey }: { photoKey?: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) return <div className="h-11 w-11 shrink-0 rounded-xl2 bg-white/[0.05]" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-11 w-11 shrink-0 rounded-xl2 object-cover" />;
}

export function InventoryBlockView({ hobbyId, block }: { hobbyId: string; block: InventoryBlock }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const totalValue = inventoryTotalValue(block);
  const gainLoss = inventoryGainLoss(block);
  const editItem = block.items.find((i) => i.id === editId);

  return (
    <GlassCard className="p-4">
      <BlockHeader
        hobbyId={hobbyId}
        blockId={block.id}
        title={block.title}
        subtitle={block.items.length > 0 ? `${block.items.length} pezzi · valore ${totalValue.toLocaleString("it-IT")}€` : undefined}
        extra={
          <button onClick={() => setAddOpen(true)} className="focus-ring flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1.5 text-[11px] text-ink-300 hover:border-aura-emerald/50">
            <Plus size={12} /> Pezzo
          </button>
        }
      />

      {block.items.length === 0 ? (
        <p className="text-xs text-ink-800">Ancora nessun pezzo in collezione.</p>
      ) : (
        <>
          {gainLoss !== 0 && (
            <p className="mb-3 text-xs" style={{ color: gainLoss >= 0 ? "#34D399" : "#FF6B9D" }}>
              {gainLoss >= 0 ? "+" : ""}{Math.round(gainLoss).toLocaleString("it-IT")}€ rispetto a quanto pagato
            </p>
          )}
          <div className="space-y-1.5">
            {block.items.map((item) => (
              <button
                key={item.id}
                onClick={() => setEditId(item.id)}
                className="focus-ring flex w-full items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.015] px-3 py-2 text-left transition hover:border-white/20"
              >
                <ItemThumb photoKey={item.photoKeys[0]} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-100">
                    {item.name} {item.quantity > 1 && <span className="text-ink-600">×{item.quantity}</span>}
                  </p>
                  <p className="truncate text-[11px] text-ink-600">
                    {[item.category, item.condition].filter(Boolean).join(" · ")}
                    {item.forTrade && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 text-aura-cyan">
                        <Repeat size={10} /> in scambio
                      </span>
                    )}
                  </p>
                </div>
                {(item.estimatedValue ?? item.pricePaid) !== undefined && (
                  <span className="shrink-0 text-xs text-ink-600">{item.estimatedValue ?? item.pricePaid}€</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {addOpen && <InventoryItemModal hobbyId={hobbyId} blockId={block.id} onClose={() => setAddOpen(false)} />}
      {editItem && <InventoryItemModal hobbyId={hobbyId} blockId={block.id} item={editItem} onClose={() => setEditId(null)} />}
    </GlassCard>
  );
}
