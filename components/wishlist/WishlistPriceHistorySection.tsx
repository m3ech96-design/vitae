"use client";
import { useState } from "react";
import { RefreshCw, TrendingDown, TrendingUp, History } from "lucide-react";
import { WishlistItem } from "@/lib/wishlist-types";
import { formatDateShort } from "@/lib/date-format";

/**
 * "Aggiorna prezzo ora" invece di un tracciamento automatico in background: l'app è una
 * PWA solo-locale, non ha un server proprio che gira ad app chiusa per controllare i
 * prezzi da sé (vedi app/api/wishlist-price/route.ts per il perché la lettura vera e
 * propria della pagina deve comunque passare dal server di Next.js, solo non schedulata).
 * Un tocco quando apri la scheda è comunque molto più veloce che scrivere il prezzo a
 * mano ogni volta, e resta l'unica cosa onestamente costruibile in questa architettura.
 */
export function WishlistPriceHistorySection({
  item,
  onPriceUpdated,
}: {
  item: WishlistItem;
  onPriceUpdated: (price: number, history: { price: number; date: string }[]) => void;
}) {
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const history = item.priceHistory ?? [];
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  const previous = sorted[0];

  const checkPrice = async () => {
    if (!item.siteUrl) return;
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(`/api/wishlist-price?url=${encodeURIComponent(item.siteUrl)}`);
      const data = await res.json();
      if (!res.ok || typeof data.price !== "number") {
        setError(data.error || "Prezzo non trovato su questa pagina.");
        return;
      }
      const entry = { price: data.price, date: new Date().toISOString() };
      onPriceUpdated(data.price, [...history, entry]);
    } catch {
      setError("Impossibile leggere la pagina in questo momento.");
    } finally {
      setChecking(false);
    }
  };

  if (!item.siteUrl) return null;

  const delta = previous && item.price !== null ? item.price - previous.price : null;

  return (
    <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3.5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-600">
          <History size={12} /> Storico prezzi
        </p>
        <button
          onClick={checkPrice}
          disabled={checking}
          className="focus-ring flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1.5 text-[11px] text-aura-cyan transition hover:border-aura-cyan/50 disabled:opacity-50"
        >
          <RefreshCw size={11} className={checking ? "animate-spin" : ""} /> {checking ? "Controllo..." : "Aggiorna prezzo ora"}
        </button>
      </div>

      {error && <p className="mt-2 text-[11px] text-aura-pink">{error}</p>}

      {sorted.length === 0 ? (
        <p className="mt-2 text-[11px] text-ink-800">Nessun controllo ancora effettuato.</p>
      ) : (
        <>
          {delta !== null && delta !== 0 && (
            <p className={`mt-2 flex items-center gap-1 text-xs ${delta < 0 ? "text-aura-emerald" : "text-aura-pink"}`}>
              {delta < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
              {delta < 0 ? "Sceso" : "Salito"} di {Math.abs(delta).toFixed(2)}€ dall'ultimo controllo
            </p>
          )}
          <div className="mt-2.5 space-y-1.5">
            {sorted.slice(0, 5).map((h, i) => (
              <div key={`${h.date}-${i}`} className="flex items-center justify-between text-xs">
                <span className="text-ink-300">{h.price.toFixed(2)}€</span>
                <span className="text-ink-800">{formatDateShort(h.date.slice(0, 10))}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
