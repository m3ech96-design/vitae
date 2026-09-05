"use client";
import { useEffect, useState } from "react";
import { Plus, LayoutGrid, GalleryVertical } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-context";
import { useFinance } from "@/lib/finance-context";
import { WishlistCard } from "@/components/wishlist/WishlistCard";
import { WishlistShortView } from "@/components/wishlist/WishlistShortView";
import { WishlistItemSheet } from "@/components/wishlist/WishlistItemSheet";
import { AddWishlistItemModal } from "@/components/wishlist/AddWishlistItemModal";

type ViewMode = "griglia" | "verticale";

export default function WishlistPage() {
  const { hydrated, items, setSavedAmount } = useWishlist();
  const { savingsGoals } = useFinance();
  const [view, setView] = useState<ViewMode>("griglia");
  const [addOpen, setAddOpen] = useState(false);
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  /**
   * Tenere `item.savedAmount` allineato al `currentAmount` dell'obiettivo collegato — non
   * solo quando si apre il dettaglio (WishlistItemSheet), ma ovunque un articolo sia
   * visibile: la card in griglia e la vista verticale leggono entrambe `savingsPct(item)`,
   * quindi `item.savedAmount`, non l'obiettivo direttamente (vedi wishlist-types.ts — quella
   * funzione resta apposta ignorante di SavingsGoal). Un contributo fatto dalla scheda
   * Finanze (`contributeSavingsGoal`, in SavingsSection.tsx) altrimenti non si vedrebbe qui
   * finché l'utente non riapre il dettaglio dell'articolo — non "sempre aggiornata" come
   * richiesto. Confronta prima di scrivere (evita un giro di persistenza a vuoto a ogni
   * render quando è già allineato).
   */
  useEffect(() => {
    items.forEach((item) => {
      if (!item.linkedSavingsGoalId) return;
      const goal = savingsGoals.find((g) => g.id === item.linkedSavingsGoalId);
      if (goal && goal.currentAmount !== item.savedAmount) setSavedAmount(item.id, goal.currentAmount);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, savingsGoals]);

  const openItem = items.find((i) => i.id === openItemId) ?? null;
  const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Wishlist</p>
          <h1 className="mt-1 font-display text-2xl text-ink-100">Cosa vuoi, e per quando</h1>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-full bg-aura-gradient text-void-950 shadow-glow"
          aria-label="Aggiungi articolo"
        >
          <Plus size={18} />
        </button>
      </div>

      {sorted.length > 0 && (
        <div className="mt-5 flex gap-1.5">
          <button
            onClick={() => setView("griglia")}
            className={`focus-ring flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition ${
              view === "griglia" ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-600"
            }`}
          >
            <LayoutGrid size={13} /> Griglia
          </button>
          <button
            onClick={() => setView("verticale")}
            className={`focus-ring flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition ${
              view === "verticale" ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100" : "border-white/10 text-ink-600"
            }`}
          >
            <GalleryVertical size={13} /> Verticale
          </button>
        </div>
      )}

      <div className="mt-5">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl2 border border-dashed border-white/10 py-14 text-center">
            <Plus size={20} className="text-ink-800" />
            <p className="text-sm text-ink-600">Ancora nessun articolo. Aggiungi il primo.</p>
          </div>
        ) : view === "griglia" ? (
          <div className="grid grid-cols-2 gap-3">
            {sorted.map((item) => (
              <WishlistCard key={item.id} item={item} onOpen={() => setOpenItemId(item.id)} />
            ))}
          </div>
        ) : (
          <WishlistShortView items={sorted} onOpen={(item) => setOpenItemId(item.id)} />
        )}
      </div>

      {addOpen && <AddWishlistItemModal onClose={() => setAddOpen(false)} />}
      {openItem && <WishlistItemSheet item={openItem} onClose={() => setOpenItemId(null)} />}
    </div>
  );
}
