"use client";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { LibraryBlock, LibraryItem } from "@/lib/hobby-types";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { StarDisplay } from "./StarRating";
import { GlassCard } from "../ui/GlassCard";
import { BlockHeader } from "./BlockHeader";
import { LibraryItemModal } from "./LibraryItemModal";
import { LibraryItemDetail } from "./LibraryItemDetail";

const STATUS_LABEL: Record<string, string> = {
  "da-provare": "Da provare",
  "in-corso": "In corso",
  completato: "Completato",
  abbandonato: "Abbandonato",
};

type SortMode = "alfabetico" | "aggiunta" | "completamento" | "valutazione";

const SORT_LABEL: Record<SortMode, string> = {
  alfabetico: "A-Z",
  aggiunta: "Aggiunti di recente",
  completamento: "Completati di recente",
  valutazione: "Voto più alto",
};

/** Ordina una copia dell'elenco secondo il criterio scelto — non muta mai `block.items`
 * (l'ordine di salvataggio resta quello di inserimento, l'ordinamento è solo di
 * visualizzazione). Le voci senza il dato richiesto (nessuna data di completamento, nessun
 * voto) finiscono sempre in fondo, non mescolate a caso tra quelle valorizzate. */
function sortItems(items: LibraryItem[], sort: SortMode): LibraryItem[] {
  const arr = [...items];
  arr.sort((a, b) => {
    switch (sort) {
      case "alfabetico":
        return a.title.localeCompare(b.title, "it");
      case "aggiunta":
        return b.createdAt.localeCompare(a.createdAt);
      case "completamento": {
        if (!a.completedDate && !b.completedDate) return 0;
        if (!a.completedDate) return 1;
        if (!b.completedDate) return -1;
        return b.completedDate.localeCompare(a.completedDate);
      }
      case "valutazione": {
        const ra = a.rating ?? -1;
        const rb = b.rating ?? -1;
        return rb - ra;
      }
    }
  });
  return arr;
}

function CoverThumb({ photoKey }: { photoKey?: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) return <div className="aspect-[2/3] w-full rounded-xl2 bg-white/[0.05]" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="aspect-[2/3] w-full rounded-xl2 object-cover" />;
}

export function LibraryBlockView({ hobbyId, block }: { hobbyId: string; block: LibraryBlock }) {
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("alfabetico");

  const completedCount = block.items.filter((i) => i.status === "completato").length;
  const detailItem = block.items.find((i) => i.id === detailId);
  const sorted = useMemo(() => sortItems(block.items, sort), [block.items, sort]);

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
        <>
          <div className="no-scrollbar mb-3 flex gap-1.5 overflow-x-auto">
            {(Object.keys(SORT_LABEL) as SortMode[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`focus-ring shrink-0 rounded-full border px-2.5 py-1 text-[10px] transition ${
                  sort === s ? "border-aura-cyan/60 bg-aura-cyan/15 text-ink-100" : "border-white/10 text-ink-800"
                }`}
              >
                {SORT_LABEL[s]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {sorted.map((item) => (
              <button key={item.id} onClick={() => setDetailId(item.id)} className="text-left">
                <CoverThumb photoKey={item.photoKey} />
                <p className="mt-1 truncate text-[11px] text-ink-100">{item.title}</p>
                <p className="text-[10px] text-ink-600">{STATUS_LABEL[item.status]}</p>
                {item.rating && <StarDisplay value={item.rating} size={9} />}
              </button>
            ))}
          </div>
        </>
      )}

      {addOpen && <LibraryItemModal hobbyId={hobbyId} blockId={block.id} onClose={() => setAddOpen(false)} />}
      {detailItem && (
        <LibraryItemDetail hobbyId={hobbyId} blockId={block.id} item={detailItem} onClose={() => setDetailId(null)} />
      )}
    </GlassCard>
  );
}
