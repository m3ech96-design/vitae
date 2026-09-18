"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { WishlistItem } from "@/lib/wishlist-types";
import { useMood } from "@/lib/mood-context";
import { PersonalCardSheet } from "@/components/home/PersonalCardSheet";
import { Button } from "@/components/ui/Button";

interface UpdateOutcome {
  itemId: string;
  itemName: string;
  status: "ok" | "unchanged" | "error";
  detail?: string;
}

/** Una pausa breve tra una richiesta e l'altra — non per prestazioni nostre, ma per non
 * mandare una raffica di richieste ravvicinate a più domini esterni diversi tutte insieme:
 * un aggiornamento in blocco resta comunque un tocco solo per l'utente, ma verso i siti di
 * destinazione si comporta come tante visite umane scaglionate, non un attacco. */
const DELAY_BETWEEN_REQUESTS_MS = 600;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * "Aggiorna prezzo ora" esteso a tutti gli articoli con un URL insieme — stessa lettura
 * server-side per ciascuno (vedi app/api/wishlist-price/route.ts), ma in sequenza, non in
 * parallelo: oltre alla cortesia verso i siti esterni (vedi DELAY_BETWEEN_REQUESTS_MS),
 * mostrare un progresso reale ("3 di 12") richiede comunque di sapere quale richiesta è
 * finita quando, cosa che un Promise.all non darebbe altrettanto naturalmente.
 *
 * I fallimenti parziali sono la norma, non l'eccezione, quando si controllano più siti
 * diversi in una volta sola — un sito lento o con un formato di prezzo diverso non deve
 * fermare gli altri, e alla fine l'utente vede esattamente quanti sono andati a buon fine,
 * quanti sono rimasti invariati e quanti hanno fallito, non un "fatto" generico che
 * nasconde la differenza.
 */
export function BulkPriceCheckSheet({
  items,
  onItemUpdated,
  onClose,
}: {
  items: WishlistItem[];
  onItemUpdated: (id: string, price: number, history: { price: number; date: string }[]) => void;
  onClose: () => void;
}) {
  const eligible = items.filter((i) => i.siteUrl);
  const [running, setRunning] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [outcomes, setOutcomes] = useState<UpdateOutcome[]>([]);
  const [finished, setFinished] = useState(false);
  const { fireTrigger } = useMood();

  const start = async () => {
    setRunning(true);
    setFinished(false);
    setOutcomes([]);
    setDoneCount(0);

    for (let i = 0; i < eligible.length; i++) {
      const item = eligible[i];
      try {
        const res = await fetch(`/api/wishlist-price?url=${encodeURIComponent(item.siteUrl!)}`);
        const data = await res.json();
        if (!res.ok || typeof data.price !== "number") {
          setOutcomes((prev) => [...prev, { itemId: item.id, itemName: item.name, status: "error", detail: data.error }]);
        } else if (item.price !== null && Math.abs(data.price - item.price) < 0.01) {
          setOutcomes((prev) => [...prev, { itemId: item.id, itemName: item.name, status: "unchanged" }]);
        } else {
          const entry = { price: data.price, date: new Date().toISOString() };
          onItemUpdated(item.id, data.price, [...(item.priceHistory ?? []), entry]);
          setOutcomes((prev) => [...prev, { itemId: item.id, itemName: item.name, status: "ok" }]);
          // Stessa soglia di WishlistPriceHistorySection.tsx (il controllo singolo) — "parecchio"
          // vuol dire almeno il 10% in meno, non una qualunque oscillazione di prezzo.
          if (item.price !== null && data.price <= item.price * 0.9) fireTrigger("wishlist:prezzo-sceso");
        }
      } catch {
        setOutcomes((prev) => [...prev, { itemId: item.id, itemName: item.name, status: "error", detail: "Errore di rete" }]);
      }
      setDoneCount(i + 1);
      if (i < eligible.length - 1) await delay(DELAY_BETWEEN_REQUESTS_MS);
    }

    setRunning(false);
    setFinished(true);
  };

  const okCount = outcomes.filter((o) => o.status === "ok").length;
  const errorCount = outcomes.filter((o) => o.status === "error").length;
  const unchangedCount = outcomes.filter((o) => o.status === "unchanged").length;

  return (
    <PersonalCardSheet title="Aggiorna tutti i prezzi" onClose={onClose}>
      <div className="space-y-4">
        {eligible.length === 0 ? (
          <p className="text-sm text-ink-600">Nessun articolo con un link al sito da controllare.</p>
        ) : !running && !finished ? (
          <>
            <p className="text-sm text-ink-300">
              Controlla il prezzo aggiornato di {eligible.length} articol{eligible.length === 1 ? "o" : "i"} con un link
              al sito, uno alla volta.
            </p>
            <Button className="w-full justify-center" onClick={start}>
              <RefreshCw size={14} /> Avvia il controllo
            </Button>
          </>
        ) : running ? (
          <div className="space-y-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-aura-cyan transition-all"
                style={{ width: `${(doneCount / eligible.length) * 100}%` }}
              />
            </div>
            <p className="text-center text-xs text-ink-600">
              Controllati {doneCount} di {eligible.length}...
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl2 border border-white/[0.06] bg-white/[0.02] py-2.5">
                <p className="font-display text-lg text-aura-emerald">{okCount}</p>
                <p className="text-[10px] text-ink-800">Aggiornati</p>
              </div>
              <div className="rounded-xl2 border border-white/[0.06] bg-white/[0.02] py-2.5">
                <p className="font-display text-lg text-ink-400">{unchangedCount}</p>
                <p className="text-[10px] text-ink-800">Invariati</p>
              </div>
              <div className="rounded-xl2 border border-white/[0.06] bg-white/[0.02] py-2.5">
                <p className="font-display text-lg text-aura-pink">{errorCount}</p>
                <p className="text-[10px] text-ink-800">Falliti</p>
              </div>
            </div>
            {errorCount > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink-600">Non riusciti</p>
                {outcomes
                  .filter((o) => o.status === "error")
                  .map((o) => (
                    <div key={o.itemId} className="flex items-center justify-between text-xs">
                      <span className="text-ink-300">{o.itemName}</span>
                      <span className="text-ink-800">{o.detail || "Errore"}</span>
                    </div>
                  ))}
              </div>
            )}
            <Button variant="outline" className="w-full justify-center" onClick={start}>
              <RefreshCw size={14} /> Ripeti
            </Button>
          </>
        )}
      </div>
    </PersonalCardSheet>
  );
}
