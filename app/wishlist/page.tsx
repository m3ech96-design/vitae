"use client";
import { useEffect, useState } from "react";
import { Plus, LayoutGrid, GalleryVertical } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-context";
import { isFulfilled } from "@/lib/wishlist-types";
import { useFinance } from "@/lib/finance-context";
import { WishlistCard } from "@/components/wishlist/WishlistCard";
import { WishlistShortView } from "@/components/wishlist/WishlistShortView";
import { WishlistItemSheet } from "@/components/wishlist/WishlistItemSheet";
import { AddWishlistItemModal } from "@/components/wishlist/AddWishlistItemModal";

type ViewMode = "griglia" | "verticale";

export default function WishlistPage() {
  const { hydrated, items, setSavedAmount } = useWishlist();
  const { savingsGoals, savingsEntries } = useFinance();
  const [view, setView] = useState<ViewMode>("griglia");
  const [addOpen, setAddOpen] = useState(false);
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  /**
   * Tenere `item.savedAmount` allineato al saldo reale della destinazione collegata — non
   * solo quando si apre il dettaglio (WishlistItemSheet), ma ovunque un articolo sia
   * visibile: la card in griglia e la vista verticale leggono entrambe `savingsPct(item)`,
   * quindi `item.savedAmount`, non la destinazione direttamente (vedi wishlist-types.ts —
   * quella funzione resta apposta ignorante di SavingsGoal/salvadanaio). Un versamento fatto
   * dalla scheda Finanze (SavingsSection.tsx, sia al salvadanaio generale sia a un
   * obiettivo) altrimenti non si vedrebbe qui finché l'utente non riapre il dettaglio
   * dell'articolo — non "sempre aggiornata" come richiesto. Un articolo già esaudito NON
   * segue più la destinazione (la sua quota è ormai fissa su `fulfilledAmount`, vedi
   * isFulfilled) — altrimenti un versamento successivo alla stessa destinazione, fatto per
   * un motivo del tutto scollegato da questo articolo, gli si rifletterebbe sopra per
   * errore.
   *
   * Corretto secondo le istruzioni: più articoli possono condividere la stessa
   * destinazione, ciascuno mostra semplicemente il suo saldo — MAI oltre il proprio prezzo
   * (mai un riparto tra loro, vedi il commento in SavingsRing.tsx). Prima questo effect
   * scriveva il saldo intero della destinazione dentro `savedAmount` senza applicare
   * questo tetto: un articolo da 200€ collegato a un salvadanaio con 600€ dentro si
   * ritrovava `savedAmount = 600`, non 200 — un numero mostrato sbagliato (la sola barra
   * percentuale restava corretta grazie al clamp in `savingsPct`, ma l'euro mostrato
   * nell'anello no) che rendeva anche "Esaudisci" capace di prelevare più del dovuto per
   * quell'articolo. Il tetto va applicato qui, dove il valore viene scritto — non lasciato
   * a ogni lettore, che altrimenti dovrebbe ricordarselo ogni volta.
   *
   * Confronta prima di scrivere (evita un giro di persistenza a vuoto a ogni render quando
   * è già allineato).
   */
  const generalBalance = savingsEntries.reduce((s, e) => s + e.amount, 0);
  useEffect(() => {
    items.forEach((item) => {
      const linkedTo = item.linkedTo;
      if (!linkedTo || isFulfilled(item)) return;
      const balance = linkedTo.kind === "general" ? generalBalance : savingsGoals.find((g) => g.id === linkedTo.goalId)?.currentAmount;
      if (balance === undefined) return;
      const capped = item.price && item.price > 0 ? Math.min(balance, item.price) : balance;
      if (capped !== item.savedAmount) setSavedAmount(item.id, capped);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, savingsGoals, generalBalance]);

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
