"use client";
import { MapPin } from "lucide-react";
import { WishlistItem, savingsPct } from "@/lib/wishlist-types";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { GlassCard } from "../ui/GlassCard";

function CardPhoto({ photoKey }: { photoKey?: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl2 bg-white/[0.03] text-ink-800">
        <MapPin size={20} />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="aspect-square w-full rounded-xl2 object-cover" />;
}

export function WishlistCard({ item, onOpen }: { item: WishlistItem; onOpen: () => void }) {
  const pct = savingsPct(item);
  return (
    <button onClick={onOpen} className="text-left">
      <GlassCard className="overflow-hidden p-2.5 transition hover:border-white/20">
        <CardPhoto photoKey={item.photoKey} />
        <p className="mt-2 truncate font-display text-sm text-ink-100">{item.name}</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-ink-600">{item.price !== null ? `${item.price.toLocaleString("it-IT")}€` : "—"}</span>
          {item.price !== null && item.price > 0 && (
            <span className="text-[11px] text-aura-emerald">{Math.round(pct * 100)}%</span>
          )}
        </div>
        {item.price !== null && item.price > 0 && (
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-aura-gradient transition-all" style={{ width: `${pct * 100}%` }} />
          </div>
        )}
      </GlassCard>
    </button>
  );
}
