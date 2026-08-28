"use client";
import { Place } from "@/lib/types";
import { PLACE_TYPE_META } from "@/lib/places-meta";

export function PlaceIconBadge({ place, size = 72 }: { place: Place | null; size?: number }) {
  if (!place) return null;
  const meta = PLACE_TYPE_META[place.type];
  const Icon = meta.icon;
  const badgeSize = Math.max(18, Math.round(size * 0.32));

  return (
    <span
      className="absolute z-10 flex items-center justify-center rounded-full border-2 border-void-950"
      style={{
        top: -2,
        right: -2,
        width: badgeSize,
        height: badgeSize,
        background: meta.color,
        boxShadow: `0 0 8px ${meta.color}aa`,
      }}
      title={`Sei A ${place.name}`}
    >
      <Icon size={Math.round(badgeSize * 0.56)} className="text-void-950" strokeWidth={2.6} />
    </span>
  );
}
