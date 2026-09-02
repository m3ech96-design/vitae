"use client";
import { useState } from "react";
import { Plus, Pencil, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { Person } from "@/lib/types";
import { useHousehold } from "@/lib/household-context";
import { FoodProduct, isLowStock, matchesScope, remainingPct, remainingUnitsDisplay, useAnimalFood } from "@/lib/animal-food-context";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { FoodProductModal } from "./FoodProductModal";

function ProductPhoto({ imageKey }: { imageKey?: string }) {
  const url = useResolvedImage(imageKey);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-full w-full object-cover" />;
}

function scopeLabel(product: FoodProduct, animals: Person[]): string {
  // Alias in una costante locale: la narrowing su un accesso a proprietà (product.scope.type)
  // non sopravvive dentro una closure (l'arrow function di .find/.map qui sotto) — su una
  // variabile locale semplice sì, per come funziona il flow analysis di TypeScript.
  const scope = product.scope;
  if (scope.type === "animal") {
    const a = animals.find((x) => x.id === scope.animalId);
    return a ? `Solo per ${a.firstName}` : "Un animale";
  }
  if (scope.type === "animals") {
    const names = scope.animalIds.map((id) => animals.find((a) => a.id === id)?.firstName).filter(Boolean);
    return names.length > 0 ? `Per ${names.join(", ")}` : "Più animali";
  }
  return scope.species === "cane" ? "Per tutti i cani" : "Per tutti i gatti";
}

function ProductRow({ product, animals, onEdit }: { product: FoodProduct; animals: Person[]; onEdit: () => void }) {
  const { removeProduct, markRepurchased, setRemainingPortions } = useAnimalFood();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pct = Math.round(remainingPct(product) * 100);
  const low = isLowStock(product);

  return (
    <div
      className={`rounded-xl2 border p-3 transition ${
        product.exhausted ? "border-white/[0.06] bg-white/[0.01] opacity-50" : "border-white/[0.08] bg-white/[0.02]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl2 border border-white/10 bg-white/[0.03]">
          <ProductPhoto imageKey={product.imageKey} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-ink-100">{product.name}</p>
          <p className="truncate text-[11px] text-ink-600">
            {[product.brand, product.quantity].filter(Boolean).join(" · ") || scopeLabel(product, animals)}
          </p>
        </div>
        <button onClick={onEdit} className="focus-ring shrink-0 text-ink-600 hover:text-ink-200" aria-label="Modifica prodotto">
          <Pencil size={13} />
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          className="focus-ring shrink-0 text-ink-600 hover:text-aura-pink"
          aria-label="Elimina prodotto"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: product.exhausted ? "#565B77" : low ? "#FFB454" : "#00E5C7" }}
          />
        </div>
        <span className="shrink-0 text-[11px] text-ink-600">
          {product.exhausted ? "Esaurito" : `${pct}% · ${remainingUnitsDisplay(product)} rimaste`}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] text-ink-800">{scopeLabel(product, animals)}</p>
        <div className="flex items-center gap-2">
          {low && !product.exhausted && (
            <span className="flex items-center gap-1 text-[10px] text-aura-amber">
              <AlertTriangle size={10} /> In esaurimento
            </span>
          )}
          {product.exhausted ? (
            <button
              onClick={() => markRepurchased(product.id)}
              className="focus-ring flex items-center gap-1 rounded-full border border-aura-cyan/40 px-2.5 py-1 text-[10px] text-aura-cyan hover:bg-aura-cyan/10"
            >
              <RotateCcw size={10} /> Riacquistato
            </button>
          ) : (
            <button
              onClick={() => {
                const input = window.prompt("Quante porzioni restano?", String(product.portionsRemaining));
                if (input === null) return;
                const n = Number(input.replace(",", "."));
                if (!Number.isNaN(n)) setRemainingPortions(product.id, n);
              }}
              className="focus-ring rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-ink-600 hover:border-white/25 hover:text-ink-200"
            >
              Correggi porzioni
            </button>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={`Eliminare ${product.name}?`}
          description="L'azione non si può annullare."
          onConfirm={() => {
            removeProduct(product.id);
            setConfirmDelete(false);
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

/** I prodotti assegnati a questo animale (per id, per gruppo, o per specie) — non filtrati
 * per esaurito, a differenza della lista che compare quando ha fame (HungryBadge.tsx): qui
 * deve restare visibile anche un prodotto esaurito, per poterlo segnare riacquistato. */
export function AnimalFoodSection({ animal }: { animal: Person }) {
  const { products } = useAnimalFood();
  const { people } = useHousehold();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FoodProduct | null>(null);

  const assigned = products.filter((p) => matchesScope(p, animal));

  return (
    <div className="space-y-3">
      {assigned.length === 0 && <p className="text-xs text-ink-800">Nessun prodotto assegnato ancora.</p>}
      {assigned.map((p) => (
        <ProductRow key={p.id} product={p} animals={people} onEdit={() => setEditing(p)} />
      ))}

      <button
        onClick={() => setModalOpen(true)}
        className="focus-ring flex w-full items-center justify-center gap-1.5 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-ink-600 transition hover:border-aura-cyan/50 hover:text-ink-200"
      >
        <Plus size={13} /> Aggiungi prodotto
      </button>

      {modalOpen && <FoodProductModal defaultAnimalId={animal.id} onClose={() => setModalOpen(false)} />}
      {editing && <FoodProductModal product={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
