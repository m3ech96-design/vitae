"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Package, Check, Trash2, AlertTriangle, ShoppingCart } from "lucide-react";
import { useFood } from "@/lib/food-context";
import { useNotes } from "@/lib/notes-context";
import { pantryEntryStatuses, PantryEntryStatus } from "@/lib/pantry";
import { generateShoppingList, formatShoppingListItem } from "@/lib/shopping-list";
import { formatDateShort, todayIso } from "@/lib/date-format";
import { GlassCard } from "@/components/ui/GlassCard";
import { AddPantryEntryModal } from "@/components/food/AddPantryEntryModal";

const SHOPPING_LIST_TITLE = "Lista della spesa";

function statusLabel(s: PantryEntryStatus): string {
  if (s.status === "scaduto") return `Scaduto da ${Math.abs(s.daysRemaining)} ${Math.abs(s.daysRemaining) === 1 ? "giorno" : "giorni"}`;
  if (s.daysRemaining === 0) return "Scade oggi";
  return `Scade tra ${s.daysRemaining} ${s.daysRemaining === 1 ? "giorno" : "giorni"}`;
}

function PantryRow({ status, onConsume, onRemove }: { status: PantryEntryStatus; onConsume: () => void; onRemove: () => void }) {
  const ingredient = status.entry;
  const color = status.status === "scaduto" ? "text-aura-pink" : status.status === "in-scadenza" ? "text-aura-amber" : "text-ink-600";
  return (
    <div className="flex items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm text-ink-100">{status.ingredientName}</p>
        <p className={`mt-0.5 text-[11px] ${color}`}>
          {statusLabel(status)} · {formatDateShort(status.estimatedExpiryDate)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button onClick={onConsume} className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-aura-emerald/50" aria-label="Segna come consumato">
          <Check size={13} />
        </button>
        <button onClick={onRemove} className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-ink-800 hover:border-aura-pink/50 hover:text-aura-pink" aria-label="Rimuovi">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default function DispensaPage() {
  const router = useRouter();
  const { hydrated, entries, ingredients, pantryEntries, markPantryEntryConsumed, removePantryEntry } = useFood();
  const { mergeShoppingListItems } = useNotes();
  const [adding, setAdding] = useState(false);
  const today = todayIso();

  const statuses = useMemo(() => pantryEntryStatuses(pantryEntries, ingredients, today), [pantryEntries, ingredients, today]);
  const expiringOrOverdue = statuses.filter((s) => s.status !== "fresco");
  const fresh = statuses.filter((s) => s.status === "fresco");

  const generateList = () => {
    const items = generateShoppingList(entries, ingredients, pantryEntries, today);
    const listId = mergeShoppingListItems(SHOPPING_LIST_TITLE, items.map(formatShoppingListItem));
    router.push(`/liste-note/${listId}`);
  };

  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="focus-ring flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-200">
          <ArrowLeft size={15} /> Indietro
        </button>
        <button
          onClick={() => setAdding(true)}
          className="focus-ring flex items-center gap-1.5 rounded-full bg-aura-gradient px-3.5 py-2 text-[11px] font-display text-void-950 shadow-glow"
        >
          <Plus size={13} /> Acquisto
        </button>
      </div>

      <p className="mt-4 font-display text-xs uppercase tracking-[0.28em] text-ink-600">Alimentazione</p>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Dispensa</h1>
      <p className="mt-2 text-xs leading-relaxed text-ink-600">
        Segna solo cosa hai comprato e quando — la scadenza è stimata da sola in base alla categoria dell&apos;ingrediente.
      </p>

      <button
        onClick={generateList}
        className="focus-ring mt-4 flex w-full items-center justify-center gap-2 rounded-xl2 border border-aura-cyan/30 bg-aura-cyan/[0.06] py-3 text-sm text-ink-100 transition hover:border-aura-cyan/60"
      >
        <ShoppingCart size={15} className="text-aura-cyan" /> Genera lista della spesa dal menù
      </button>
      <p className="mt-1.5 text-[11px] text-ink-800">
        Guarda i prossimi 7 giorni di menù pianificato e aggiorna la lista in Liste e note — quello che hai già spuntato resta.
      </p>

      {statuses.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-2 rounded-xl2 border border-dashed border-white/10 py-14 text-center">
          <Package size={20} className="text-ink-800" />
          <p className="text-sm text-ink-600">Nessun acquisto ancora registrato.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {expiringOrOverdue.length > 0 && (
            <div>
              <p className="mb-2.5 flex items-center gap-1.5 font-display text-sm text-ink-100">
                <AlertTriangle size={14} className="text-aura-amber" /> In scadenza
              </p>
              <div className="space-y-1.5">
                {expiringOrOverdue.map((s) => (
                  <PantryRow
                    key={s.entry.id}
                    status={s}
                    onConsume={() => markPantryEntryConsumed(s.entry.id, today)}
                    onRemove={() => removePantryEntry(s.entry.id)}
                  />
                ))}
              </div>
            </div>
          )}
          {fresh.length > 0 && (
            <div>
              <p className="mb-2.5 font-display text-sm text-ink-100">Ancora fresco</p>
              <div className="space-y-1.5">
                {fresh.map((s) => (
                  <PantryRow
                    key={s.entry.id}
                    status={s}
                    onConsume={() => markPantryEntryConsumed(s.entry.id, today)}
                    onRemove={() => removePantryEntry(s.entry.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {adding && <AddPantryEntryModal onClose={() => setAdding(false)} />}
    </div>
  );
}
