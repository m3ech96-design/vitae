"use client";
import { useState } from "react";
import { Repeat } from "lucide-react";
import { InventoryItem } from "@/lib/hobby-types";
import { formatDateShort } from "@/lib/date-format";
import { ItemDetailSheet, DetailField } from "../ui/ItemDetailSheet";
import { PhotoThumb } from "../ui/PhotoThumb";
import { InventoryItemModal } from "./InventoryItemModal";

/**
 * Stesso principio di LibraryItemDetail, applicato a un pezzo di Inventario — anche qui il
 * tocco apriva direttamente il wizard di modifica. Le foto (fronte/retro/dettagli, un array
 * anche di più immagini) vanno tutte nell'header come galleria scorrevole, mai una sola
 * ritagliata a caso. Lo stato di modifica vive qui (non nel genitore): chiudere il wizard
 * riporta a questa vetrina aggiornata, come fanno già Wishlist/Mappa/Task.
 */
export function InventoryItemDetail({
  hobbyId,
  blockId,
  item,
  onClose,
}: {
  hobbyId: string;
  blockId: string;
  item: InventoryItem;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <InventoryItemModal hobbyId={hobbyId} blockId={blockId} item={item} onClose={() => setEditing(false)} />;
  }

  return (
    <ItemDetailSheet title={item.name} photoKeys={item.photoKeys} onEdit={() => setEditing(true)} onClose={onClose}>
      {item.forTrade && (
        <p className="flex items-center gap-1.5 text-xs text-aura-cyan">
          <Repeat size={12} /> In scambio
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <DetailField label="Categoria" value={item.category} />
        <DetailField label="Quantità" value={item.quantity > 1 ? `×${item.quantity}` : undefined} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DetailField label="Data acquisizione" value={item.acquiredDate ? formatDateShort(item.acquiredDate) : undefined} />
        <DetailField label="Provenienza" value={item.source} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DetailField label="Prezzo pagato" value={item.pricePaid !== undefined ? `${item.pricePaid}€` : undefined} />
        <DetailField label="Valore stimato oggi" value={item.estimatedValue !== undefined ? `${item.estimatedValue}€` : undefined} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DetailField label="Condizione" value={item.condition} />
        <DetailField label="Numero di catalogo" value={item.catalogNumber} />
      </div>
      {item.details.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-600">Altri dettagli</p>
          {item.details.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.015] px-3.5 py-2">
              {d.thumbnailUrl && <PhotoThumb photoKey={d.thumbnailUrl} size="sm" />}
              <div className="min-w-0">
                <p className="text-[11px] text-ink-600">{d.label}</p>
                <p className="text-sm text-ink-100">{d.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ItemDetailSheet>
  );
}
