"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, ChefHat, Pencil, Trash2, Plus } from "lucide-react";
import { useFood } from "@/lib/food-context";
import { Ingredient } from "@/lib/food-types";
import { GlassCard } from "@/components/ui/GlassCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AddIngredientModal } from "@/components/food/AddIngredientModal";

/** "125 kcal /100g" per g/ml; per "altro" mostra anche il peso di 1 unità — stessa
 * etichetta già usata in EntryModal, ripetuta qui per non introdurre una seconda copia
 * leggermente diversa della stessa informazione. */
function ingredientSummary(ing: Ingredient): string {
  const base = ing.unit === "ml" ? "100 ml" : "100 g";
  if (ing.unit === "altro") {
    return `${ing.kcal} kcal/${base} · 1 ${ing.unitLabel} = ${ing.gramsPerUnit} g`;
  }
  return `${ing.kcal} kcal / ${base}`;
}

/**
 * Elenco completo — alfabetico — di tutto ciò che l'utente ha creato nella scheda
 * Alimentazione: ingredienti singoli e ricette insieme, dato che una Ricetta è a tutti gli
 * effetti un ingrediente con una composizione dietro (vedi Ingredient.recipe in
 * food-types.ts). Da qui si può modificare o eliminare ciascuna voce, senza dover passare
 * per il menù di una giornata specifica dove quella voce magari non compare nemmeno.
 */
export default function IngredientiPage() {
  const router = useRouter();
  const { hydrated, ingredients, entries, removeIngredient } = useFood();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [deleting, setDeleting] = useState<Ingredient | null>(null);
  const [creating, setCreating] = useState(false);

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...ingredients]
      .filter((i) => !q || i.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, "it", { sensitivity: "base" }));
  }, [ingredients, query]);

  // Quante voci di menù (in qualunque giorno) usano questo ingrediente — mostrato solo
  // nella conferma di eliminazione, per non far scoprire all'utente solo dopo aver
  // confermato che stava per svuotare anche dei pasti già registrati.
  const usageCount = (id: string) => entries.filter((e) => e.ingredientId === id).length;

  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <button
        onClick={() => router.back()}
        className="focus-ring flex items-center gap-1.5 text-xs text-ink-600 hover:text-ink-200"
      >
        <ArrowLeft size={14} /> Indietro
      </button>

      <p className="mt-4 font-display text-xs uppercase tracking-[0.28em] text-ink-600">Alimentazione</p>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Ingredienti e ricette</h1>
      <p className="mt-1 text-sm text-ink-600">
        {ingredients.length === 0
          ? "Non hai ancora creato nulla."
          : `${ingredients.length} ${ingredients.length === 1 ? "voce" : "voci"} in ordine alfabetico`}
      </p>

      <div className="relative mt-5">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-800" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca un ingrediente o una ricetta..."
          className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-4 text-sm text-ink-100 placeholder:text-ink-800"
        />
      </div>

      <button
        onClick={() => setCreating(true)}
        className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-3 text-sm text-ink-400 transition hover:border-aura-emerald/50 hover:text-ink-100"
      >
        <Plus size={15} /> Nuovo ingrediente o ricetta
      </button>

      <div className="mt-5 space-y-2">
        {sorted.length === 0 && ingredients.length > 0 && (
          <p className="py-6 text-center text-sm text-ink-800">Nessun risultato per &quot;{query.trim()}&quot;.</p>
        )}
        {sorted.map((ing) => (
          <GlassCard key={ing.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {ing.recipe && <ChefHat size={13} className="shrink-0 text-aura-emerald" />}
                <p className="truncate text-sm text-ink-100">{ing.name}</p>
              </div>
              <p className="mt-0.5 truncate text-xs text-ink-600">{ingredientSummary(ing)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => setEditing(ing)}
                className="focus-ring flex h-8 w-8 items-center justify-center rounded-full text-ink-600 transition hover:bg-white/5 hover:text-ink-100"
                aria-label={`Modifica ${ing.name}`}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setDeleting(ing)}
                className="focus-ring flex h-8 w-8 items-center justify-center rounded-full text-ink-600 transition hover:bg-aura-pink/10 hover:text-aura-pink"
                aria-label={`Elimina ${ing.name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {editing && <AddIngredientModal initial={editing} onClose={() => setEditing(null)} />}
      {creating && <AddIngredientModal onClose={() => setCreating(false)} />}

      {deleting && (
        <ConfirmDialog
          title={`Eliminare "${deleting.name}"?`}
          description={
            usageCount(deleting.id) > 0
              ? `Questo ${deleting.recipe ? "ricetta" : "ingrediente"} compare in ${usageCount(deleting.id)} ${
                  usageCount(deleting.id) === 1 ? "voce di menù" : "voci di menù"
                }: verranno rimosse anche quelle.`
              : undefined
          }
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            removeIngredient(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
