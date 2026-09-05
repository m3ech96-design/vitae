"use client";
import { Heart, PiggyBank, Target, Tag } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-context";
import { useFinance } from "@/lib/finance-context";
import { savingsPct, isFulfilled } from "@/lib/wishlist-types";
import { WidgetStat, WidgetEmpty, WidgetRing } from "../primitives";
import { WidgetSize } from "@/lib/widgets/types";

export function LastWishlistItemWidget({ size }: { size: WidgetSize }) {
  const { items } = useWishlist();
  if (items.length === 0) return <WidgetEmpty icon={Heart} label="Wishlist vuota" />;
  const last = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return <WidgetStat icon={Heart} value={last.name} label={last.price !== null ? `${last.price}€` : "Prezzo non impostato"} color="#FF6B9D" />;
}

/**
 * Corretto secondo le istruzioni: prima sommava `i.savedAmount` di OGNI articolo — ma più
 * articoli possono condividere la stessa destinazione (salvadanaio generale o un obiettivo,
 * vedi il commento su `linkedTo` in lib/wishlist-types.ts) mostrando deliberatamente lo
 * stesso saldo, ciascuno col proprio tetto individuale (mai un riparto tra loro). Sommare
 * quei numeri contava più volte lo STESSO denaro reale — con tre articoli collegati allo
 * stesso salvadanaio da 600€, il totale usciva gonfiato (fino a 1800€) invece dei 600€ che
 * esistono davvero. Ora ogni destinazione condivisa entra nel totale una sola volta (il suo
 * saldo reale, mai la somma delle viste che ne danno gli articoli), mentre un articolo non
 * collegato — o già esaudito, la cui quota non è più "nella destinazione" ma un fatto
 * concluso — resta sommato per il suo proprio contatore isolato, che nessun altro condivide.
 */
export function WishlistSavedTotalWidget({ size }: { size: WidgetSize }) {
  const { items } = useWishlist();
  const { savingsGoals, savingsEntries } = useFinance();
  const generalBalance = savingsEntries.reduce((s, e) => s + e.amount, 0);

  let sharedGeneralCounted = false;
  const countedGoalIds = new Set<string>();
  let total = 0;

  items.forEach((item) => {
    if (isFulfilled(item) || !item.linkedTo) {
      total += item.savedAmount;
      return;
    }
    if (item.linkedTo.kind === "general") {
      if (!sharedGeneralCounted) {
        total += generalBalance;
        sharedGeneralCounted = true;
      }
      return;
    }
    const goalId = item.linkedTo.goalId;
    if (!countedGoalIds.has(goalId)) {
      const goal = savingsGoals.find((g) => g.id === goalId);
      if (goal) total += goal.currentAmount;
      countedGoalIds.add(goalId);
    }
  });

  return <WidgetStat icon={PiggyBank} value={`${Math.round(total)}€`} label="Risparmiato in totale" color="#34D399" />;
}

/** Il "più vicino" tra quelli ancora da raggiungere — un articolo già esaudito è un
 * traguardo concluso, non qualcosa verso cui "essere vicini": mostrarlo qui (sempre al
 * 100%, per costruzione) renderebbe il widget un promemoria inutile di ciò che è già stato
 * comprato invece che di ciò per cui continuare a risparmiare. */
export function ClosestToGoalWidget({ size }: { size: WidgetSize }) {
  const { items } = useWishlist();
  const withPrice = items.filter((i) => i.price && i.price > 0 && !isFulfilled(i));
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
