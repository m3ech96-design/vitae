"use client";
import { MapPin, Star, Wallet } from "lucide-react";
import { usePlaces } from "@/lib/places-context";
import { WidgetStat, WidgetEmpty } from "../primitives";
import { WidgetSize } from "@/lib/widgets/types";

export function MostVisitedPlaceWidget({ size }: { size: WidgetSize }) {
  const { places } = usePlaces();
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthAgoIso = monthAgo.toISOString().slice(0, 10);
  const counted = places.map((p) => ({ name: p.name, count: p.visitsHistory.filter((v) => v.date >= monthAgoIso).length }));
  const top = [...counted].sort((a, b) => b.count - a.count)[0];
  if (!top || top.count === 0) return <WidgetEmpty icon={MapPin} label="Nessuna visita questo mese" />;
  return <WidgetStat icon={MapPin} value={top.name} label={`${top.count} visite questo mese`} color="#7C5CFF" />;
}

export function LastVisitWidget({ size }: { size: WidgetSize }) {
  const { places } = usePlaces();
  const lastPerPlace = places
    .map((p) => {
      const sorted = [...p.visitsHistory].sort((a, b) => b.date.localeCompare(a.date));
      return sorted[0] ? { name: p.name, date: sorted[0].date } : null;
    })
    .filter((x): x is { name: string; date: string } => x !== null);
  const last = [...lastPerPlace].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!last) return <WidgetEmpty icon={MapPin} label="Nessuna visita registrata" />;
  return <WidgetStat icon={MapPin} value={last.name} label="Ultima visita" color="#00E5C7" />;
}

export function FavoritePlaceSpendingWidget({ size }: { size: WidgetSize }) {
  const { places } = usePlaces();
  const rated = places.filter((p) => p.rating !== null).sort((a, b) => (b.rating as number) - (a.rating as number));
  const favorite = rated[0];
  if (!favorite) return <WidgetEmpty icon={Star} label="Nessun luogo valutato" />;
  const total = favorite.visitsHistory.reduce((s, v) => s + (v.spentAmount ?? 0), 0);
  return <WidgetStat icon={Wallet} value={`${Math.round(total)}€`} label={`Speso in ${favorite.name}`} color="#FFB454" />;
}
