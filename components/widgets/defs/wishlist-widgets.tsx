"use client";
import { Heart, PiggyBank, Target, Tag } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-context";
import { savingsPct } from "@/lib/wishlist-types";
import { WidgetStat, WidgetEmpty, WidgetRing } from "../primitives";
import { WidgetSize } from "@/lib/widgets/types";

export function LastWishlistItemWidget({ size }: { size: WidgetSize }) {
  const { items } = useWishlist();
  if (items.length === 0) return <WidgetEmpty icon={Heart} label="Wishlist vuota" />;
  const last = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return <WidgetStat icon={Heart} value={last.name} label={last.price !== null ? `${last.price}€` : "Prezzo non impostato"} color="#FF6B9D" />;
}

export function WishlistSavedTotalWidget({ size }: { size: WidgetSize }) {
  const { items } = useWishlist();
  const total = items.reduce((s, i) => s + i.savedAmount, 0);
  return <WidgetStat icon={PiggyBank} value={`${Math.round(total)}€`} label="Risparmiato in totale" color="#34D399" />;
}

export function ClosestToGoalWidget({ size }: { size: WidgetSize }) {
  const { items } = useWishlist();
  const withPrice = items.filter((i) => i.price && i.price > 0);
  if (withPrice.length === 0) return <WidgetEmpty icon={Target} label="Nessun articolo con prezzo" />;
  const closest = [...withPrice].sort((a, b) => savingsPct(b) - savingsPct(a))[0];
  return <WidgetRing pct={savingsPct(closest)} color="#7C5CFF" label={closest.name} centerValue={`${Math.round(savingsPct(closest) * 100)}%`} />;
}

export function CheapestRemainingWidget({ size }: { size: WidgetSize }) {
  const { items } = useWishlist();
  const remaining = items.filter((i) => i.price && i.price > 0 && savingsPct(i) < 1).sort((a, b) => (a.price as number) - (b.price as number));
  const cheapest = remaining[0];
  if (!cheapest) return <WidgetEmpty icon={Tag} label="Niente ancora da comprare" />;
  return <WidgetStat icon={Tag} value={`${cheapest.price}€`} label={cheapest.name} color="#FFB454" />;
}
