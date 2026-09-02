"use client";
import { MapPin } from "lucide-react";
import { WishlistItem, savingsPct } from "@/lib/wishlist-types";
import { useResolvedImage } from "@/lib/use-resolved-image";

function ShortPhoto({ photoKey }: { photoKey?: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white/[0.03] text-ink-800">
        <MapPin size={28} />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-full w-full object-cover" />;
}

function ShortCard({ item, onOpen }: { item: WishlistItem; onOpen: () => void }) {
  const pct = savingsPct(item);
  return (
    <button
      onClick={onOpen}
      className="focus-ring relative block h-[70vh] w-full shrink-0 snap-start overflow-hidden rounded-xl3 text-left"
    >
      <ShortPhoto photoKey={item.photoKey} />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void-950 via-void-950/70 to-transparent p-5 pt-16">
        <p className="font-display text-lg text-ink-100">{item.name}</p>
        <div className="mt-1 flex items-center gap-3">
          {item.price !== null && <span className="text-sm text-ink-300">{item.price.toLocaleString("it-IT")}€</span>}
          {item.price !== null && item.price > 0 && (
            <span className="text-sm" style={{ color: pct >= 1 ? "#34D399" : "#00E5C7" }}>
              {Math.round(pct * 100)}% risparmiato
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/** Scroll verticale con "effetto magnetico" tra una scheda e l'altra: CSS scroll-snap
 * nativo (snap-y mandatory + snap-start su ogni scheda), non una libreria — ogni scheda si
 * riposiziona da sola a schermo appena lo scroll si ferma, come richiesto. */
export function WishlistShortView({ items, onOpen }: { items: WishlistItem[]; onOpen: (item: WishlistItem) => void }) {
  return (
    <div className="flex max-h-[70vh] snap-y snap-mandatory flex-col gap-4 overflow-y-auto pb-2">
      {items.map((item) => (
        <ShortCard key={item.id} item={item} onOpen={() => onOpen(item)} />
      ))}
    </div>
  );
}
