"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Search, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useFood } from "@/lib/food-context";
import { Ingredient } from "@/lib/food-types";
import { foodCategoryOf } from "@/lib/food-category-catalog";
import { todayIso } from "@/lib/date-format";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";

/**
 * Registrare un acquisto è deliberatamente più leggero di registrare un pasto: solo
 * ingrediente e data (default oggi) — nessuna quantità obbligatoria, perché lo scopo qui
 * non è il conteggio calorico ma solo stimare quando quella confezione scadrà (vedi
 * lib/pantry.ts). Aggiungere più attrito di questo avrebbe vanificato lo scopo del punto 1:
 * una scadenza automatica non deve costare più della singola scelta dell'ingrediente.
 */
export function AddPantryEntryModal({ onClose }: { onClose: () => void }) {
  const { ingredients, addPantryEntry } = useFood();
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [query, setQuery] = useState("");
  const [purchasedDate, setPurchasedDate] = useState(todayIso());
  const [quantity, setQuantity] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return ingredients.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 12);
  }, [ingredients, query]);

  const submit = () => {
    if (!selected) return;
    const initialQuantity = quantity.trim() ? Math.max(0, parseFloat(quantity.replace(",", "."))) : undefined;
    addPantryEntry({ ingredientId: selected.id, purchasedDate, initialQuantity });
    onClose();
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[85dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">Nuovo acquisto</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {selected ? (
            <div className="flex items-center justify-between rounded-xl2 border border-aura-emerald/30 bg-aura-emerald/[0.06] px-4 py-3">
              <div>
                <p className="text-sm text-ink-100">{selected.name}</p>
                <p className="mt-0.5 text-[11px] text-ink-800">
                  {selected.categoryId
                    ? `${foodCategoryOf(selected.categoryId).label} · ~${foodCategoryOf(selected.categoryId).typicalShelfLifeDays}gg`
                    : "Nessuna categoria — scadenza stimata su un default generico"}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label="Cambia ingrediente">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div>
              <TextField
                label="Ingrediente"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cerca per nome..."
                autoFocus
              />
              {results.length > 0 && (
                <div className="mt-2 space-y-1 rounded-xl2 border border-white/10 bg-white/[0.02] p-1.5">
                  {results.map((ing) => (
                    <button
                      key={ing.id}
                      onClick={() => {
                        setSelected(ing);
                        setQuery("");
                      }}
                      className="focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-200 hover:bg-white/[0.05]"
                    >
                      <Search size={12} className="shrink-0 text-ink-800" /> {ing.name}
                    </button>
                  ))}
                </div>
              )}
              {query.trim() && results.length === 0 && (
                <p className="mt-2 text-xs text-ink-800">Nessun ingrediente trovato con questo nome.</p>
              )}
            </div>
          )}

          <TextField label="Comprato il" type="date" value={purchasedDate} onChange={(e) => setPurchasedDate(e.target.value)} />

          {selected && (
            <TextField
              label={`Quantità (${selected.unit === "altro" ? selected.unitLabel ?? "unità" : selected.unit}) — facoltativa`}
              type="number"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Lascia vuoto per non tracciare il residuo"
            />
          )}
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <Button className="w-full justify-center" onClick={submit} disabled={!selected}>
            <Package size={14} /> Aggiungi in dispensa
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
