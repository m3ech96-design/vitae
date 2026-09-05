"use client";
import { useState } from "react";
import { ExternalLink, MapPin, Pencil, Trash2 } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-context";
import { usePlaces } from "@/lib/places-context";
import { useFinance } from "@/lib/finance-context";
import { WishlistItem } from "@/lib/wishlist-types";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { PersonalCardSheet } from "../home/PersonalCardSheet";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { SavingsRing } from "./SavingsRing";
import { AddWishlistItemModal } from "./AddWishlistItemModal";

function DetailPhoto({ photoKey }: { photoKey?: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="mb-4 aspect-video w-full rounded-xl2 object-cover" />;
}

/**
 * Il ponte tra Wishlist e Finanze — vive qui, non in nessuno dei due contesti, perché
 * `WishlistProvider` è più esterno di `FinanceProvider` nell'albero (vedi app/layout.tsx) e
 * quindi non può vedere `useFinance()` da solo; questo componente sì, essendo dentro
 * entrambi. Vedi il commento su `linkedTo` in lib/wishlist-types.ts per il significato dei
 * vari stati — in breve: il flusso versa/preleva va sempre e solo Finanze → Wishlist, mai il
 * contrario, quindi ogni movimento reale (versare, prelevare, esaudire) avviene qui tramite
 * le funzioni di FinanceContext, mai tramite un pulsante manuale sull'articolo.
 */
export function WishlistItemSheet({ item, onClose }: { item: WishlistItem; onClose: () => void }) {
  const { removeItem, setLinkedTo, fulfillItem, unfulfillItem } = useWishlist();
  const { places } = usePlaces();
  const { savingsGoals, contributeSavingsGoal, addSavingsEntry } = useFinance();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const place = item.linkedPlaceId ? places.find((p) => p.id === item.linkedPlaceId) : undefined;
  const linkedTo = item.linkedTo;
  const linkedGoal = linkedTo?.kind === "goal" ? savingsGoals.find((g) => g.id === linkedTo.goalId) : undefined;
  const positionBits = [
    item.row && `Fila ${item.row}`,
    item.aisle && `Corsia ${item.aisle}`,
    item.shelfNumber && `Numero ${item.shelfNumber}`,
    item.shelf && `Scaffale ${item.shelf}`,
  ].filter(Boolean) as string[];

  // Collegare: i fondi già accantonati sull'articolo (se ce n'erano, es. arrivando da un
  // collegamento precedente scollegato di recente) si spostano dentro la nuova destinazione
  // — altrimenti sparirebbero dalla vista, non più mostrati né qui né lì. L'articolo passa a
  // seguire dal vivo quella destinazione: da qui in poi la sua quota è la sua, mai più un
  // numero suo indipendente.
  const handleLink = (linkedTo: NonNullable<WishlistItem["linkedTo"]>) => {
    if (item.savedAmount > 0) {
      if (linkedTo.kind === "general") addSavingsEntry(item.savedAmount, `Wishlist — ${item.name}`);
      else contributeSavingsGoal(linkedTo.goalId, item.savedAmount);
    }
    setLinkedTo(item.id, linkedTo);
  };

  // Scollegare: il numero che l'articolo stava già mostrando resta quello che era — non
  // serve alcuna scrittura esplicita, perché una volta rimosso `linkedTo` l'effect di
  // sincronizzazione (vedi app/wishlist/page.tsx) smette di toccare `savedAmount`, che
  // resta fermo all'ultimo valore con cui era stato allineato (il tetto individuale
  // dell'articolo, mai il saldo intero della destinazione se condivisa con altri —
  // vedi il commento sul tetto in app/wishlist/page.tsx). Scollegare non è un prelievo: i
  // soldi restano nella destinazione, solo la sincronia finisce qui.
  const handleUnlink = () => setLinkedTo(item.id, undefined);

  // "Esaudisci" — SOLO quando l'articolo è già al 100% (garantito dalla UI, vedi
  // SavingsRing: il pulsante compare solo con `pct >= 1`; la guardia qui sotto è una difesa
  // in profondità, non un doppione decorativo). Essendo saturo, `item.savedAmount` coincide
  // per costruzione con `item.price` — mai di più, anche quando altri articoli condividono
  // la stessa destinazione (vedi il commento in SavingsRing.tsx sul perché più articoli
  // possono mostrare lo stesso saldo senza un riparto tra loro): prelevare esattamente
  // `item.savedAmount` non tocca mai più di quanto spettava a QUESTO articolo, indipendente
  // da quanti altri condividono la stessa destinazione. Genera la voce di cronologia
  // corrispondente, e fissa quell'importo per sempre su `fulfilledAmount` — da qui in poi
  // la quota dell'articolo non segue più la destinazione, che può continuare a muoversi per
  // altri motivi senza più riflettersi su un articolo già chiuso.
  const handleFulfill = () => {
    if (!item.price || item.price <= 0 || item.savedAmount < item.price) return;
    const amount = item.savedAmount;
    if (linkedTo?.kind === "general") addSavingsEntry(-amount, `Esaudito: ${item.name}`);
    else if (linkedTo?.kind === "goal") contributeSavingsGoal(linkedTo.goalId, -amount);
    fulfillItem(item.id, amount);
  };

  // Riaprire: la quota torna a seguire la destinazione (se ancora collegata) — i soldi
  // prelevati con "Esaudisci" NON tornano da soli (sarebbe un rimborso implicito, mai
  // richiesto): se l'utente vuole continuare ad accantonare, verserà di nuovo lui stesso da
  // Finanze.
  const handleUnfulfill = () => unfulfillItem(item.id);

  return (
    <PersonalCardSheet
      title={
        <div className="flex items-center gap-2">
          <span>{item.name}</span>
          <button onClick={() => setEditing(true)} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Modifica">
            <Pencil size={14} />
          </button>
        </div>
      }
      onClose={onClose}
    >
      <DetailPhoto photoKey={item.photoKey} />

      <div className="space-y-5">
        <SavingsRing
          item={item}
          linkedGoal={linkedGoal}
          allGoals={savingsGoals}
          onLink={handleLink}
          onUnlink={handleUnlink}
          onFulfill={handleFulfill}
          onUnfulfill={handleUnfulfill}
        />

        {(item.siteName || item.siteUrl) && (
          <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-600">Dove acquistarlo</p>
            {item.siteUrl ? (
              <a
                href={item.siteUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 flex items-center gap-1.5 text-sm text-aura-cyan hover:underline"
              >
                {item.siteName || item.siteUrl} <ExternalLink size={12} />
              </a>
            ) : (
              <p className="mt-1 text-sm text-ink-100">{item.siteName}</p>
            )}
          </div>
        )}

        {(place || positionBits.length > 0) && (
          <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-600">
              <MapPin size={12} /> Dove si trova
            </p>
            {place && <p className="mt-1 text-sm text-ink-100">{place.name}</p>}
            {positionBits.length > 0 && <p className="mt-1 text-xs text-ink-600">{positionBits.join(" · ")}</p>}
          </div>
        )}

        {item.estimatedPeriod && (
          <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-600">Periodo stimato</p>
            <p className="mt-1 text-sm text-ink-100">{item.estimatedPeriod}</p>
          </div>
        )}

        {item.details.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-600">Altri dettagli</p>
            {item.details.map((d) => (
              <div key={d.id} className="rounded-xl2 border border-white/[0.06] bg-white/[0.015] px-3.5 py-2">
                <p className="text-[11px] text-ink-600">{d.label}</p>
                <p className="text-sm text-ink-100">{d.value}</p>
              </div>
            ))}
          </div>
        )}

        <Button variant="danger" className="w-full justify-center" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={14} /> Rimuovi dalla wishlist
        </Button>
      </div>

      {editing && <AddWishlistItemModal item={item} onClose={() => setEditing(false)} />}
      {confirmDelete && (
        <ConfirmDialog
          title="Rimuovere questo articolo?"
          description="L'azione non si può annullare."
          onConfirm={() => {
            removeItem(item.id);
            setConfirmDelete(false);
            onClose();
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </PersonalCardSheet>
  );
}
