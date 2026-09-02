"use client";
import { useState } from "react";
import { ExternalLink, MapPin, Pencil, Trash2 } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-context";
import { usePlaces } from "@/lib/places-context";
import { WishlistItem } from "@/lib/wishlist-types";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { PersonalCardSheet } from "../home/PersonalCardSheet";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { SavingsRing } from "./SavingsRing";
import { AddWishlistItemModal } from "./AddWishlistItemModal";

function DetailPhoto({ photoKey }: { photoKey?: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="mb-4 aspect-video w-full rounded-xl2 object-cover" />;
}

export function WishlistItemSheet({ item, onClose }: { item: WishlistItem; onClose: () => void }) {
  const { removeItem, addFunds, removeFunds } = useWishlist();
  const { places } = usePlaces();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const place = item.linkedPlaceId ? places.find((p) => p.id === item.linkedPlaceId) : undefined;
  const positionBits = [
    item.row && `Fila ${item.row}`,
    item.aisle && `Corsia ${item.aisle}`,
    item.shelfNumber && `Numero ${item.shelfNumber}`,
    item.shelf && `Scaffale ${item.shelf}`,
  ].filter(Boolean) as string[];

  return (
    <PersonalCardSheet
      title={
        <div className="flex items-center gap-2">
          <span>{item.name}</span>
          <button onClick={() => setEditing(true)} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Modifica">
            <Pencil size={14} />
          </button>
        </div>
      }
      onClose={onClose}
    >
      <DetailPhoto photoKey={item.photoKey} />

      <div className="space-y-5">
        <SavingsRing item={item} onAddFunds={(a) => addFunds(item.id, a)} onRemoveFunds={(a) => removeFunds(item.id, a)} />

        {(item.siteName || item.siteUrl) && (
          <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-600">Dove acquistarlo</p>
            {item.siteUrl ? (
              <a
                href={item.siteUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 flex items-center gap-1.5 text-sm text-aura-cyan hover:underline"
              >
                {item.siteName || item.siteUrl} <ExternalLink size={12} />
              </a>
            ) : (
              <p className="mt-1 text-sm text-ink-100">{item.siteName}</p>
            )}
          </div>
        )}

        {(place || positionBits.length > 0) && (
          <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-600">
              <MapPin size={12} /> Dove si trova
            </p>
            {place && <p className="mt-1 text-sm text-ink-100">{place.name}</p>}
            {positionBits.length > 0 && <p className="mt-1 text-xs text-ink-600">{positionBits.join(" · ")}</p>}
          </div>
        )}

        {item.estimatedPeriod && (
          <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-600">Periodo stimato</p>
            <p className="mt-1 text-sm text-ink-100">{item.estimatedPeriod}</p>
          </div>
        )}

        {item.details.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-600">Altri dettagli</p>
            {item.details.map((d) => (
              <div key={d.id} className="rounded-xl2 border border-white/[0.06] bg-white/[0.015] px-3.5 py-2">
                <p className="text-[11px] text-ink-600">{d.label}</p>
                <p className="text-sm text-ink-100">{d.value}</p>
              </div>
            ))}
          </div>
        )}

        <Button variant="danger" className="w-full justify-center" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={14} /> Rimuovi dalla wishlist
        </Button>
      </div>

      {editing && <AddWishlistItemModal item={item} onClose={() => setEditing(false)} />}
      {confirmDelete && (
        <ConfirmDialog
          title="Rimuovere questo articolo?"
          description="L'azione non si può annullare."
          onConfirm={() => {
            removeItem(item.id);
            setConfirmDelete(false);
            onClose();
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </PersonalCardSheet>
  );
}
