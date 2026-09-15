"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Package, Check, Trash2, AlertTriangle, ShoppingCart, Pencil } from "lucide-react";
import { useFood } from "@/lib/food-context";
import { useNotes } from "@/lib/notes-context";
import { pantryEntryStatuses, PantryEntryStatus } from "@/lib/pantry";
import { generateShoppingList, formatShoppingListItem } from "@/lib/shopping-list";
import { formatDateShort, todayIso } from "@/lib/date-format";
import { Ingredient } from "@/lib/food-types";
import { newId } from "@/lib/id";
import { GlassCard } from "@/components/ui/GlassCard";
import { AddPantryEntryModal } from "@/components/food/AddPantryEntryModal";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { NewTaskModal } from "@/components/task/NewTaskModal";
import { StickyNote, ListChecks } from "lucide-react";

const SHOPPING_LIST_TITLE = "Lista della spesa";

function statusLabel(s: PantryEntryStatus): string {
  if (s.status === "senza-scadenza") return "Nessuna scadenza registrata";
  if (s.status === "scaduto") return `Scaduto da ${Math.abs(s.daysRemaining!)} ${Math.abs(s.daysRemaining!) === 1 ? "giorno" : "giorni"}`;
  if (s.daysRemaining === 0) return "Scade oggi";
  return `Scade tra ${s.daysRemaining} ${s.daysRemaining === 1 ? "giorno" : "giorni"}`;
}

/** Correzione manuale del residuo — "ho versato via mezzo litro per sbaglio" (vedi
 * adjustPantryQuantity in food-context.tsx). Solo per entry con tracking quantità attivo. */
function AdjustQuantitySheet({
  unitLabel,
  current,
  onSave,
  onClose,
}: {
  unitLabel: string;
  current: number;
  onSave: (value: number) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(String(current));
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center" onClick={onClose}>
      <div className="glass-strong w-full max-w-sm rounded-t-xl3 p-6 pb-[max(env(safe-area-inset-bottom),24px)] sm:rounded-xl3" onClick={(e) => e.stopPropagation()}>
        <p className="mb-4 font-display text-lg text-ink-100">Correggi quantità residua</p>
        <TextField label={`Residuo (${unitLabel})`} type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
        <Button
          className="mt-4 w-full justify-center"
          onClick={() => {
            const n = parseFloat(value.replace(",", "."));
            if (!Number.isNaN(n)) onSave(Math.max(0, n));
            onClose();
          }}
        >
          Salva
        </Button>
      </div>
    </div>
  );
}

function PantryRow({
  status,
  ingredient,
  onConsume,
  onRemove,
  onAdjust,
}: {
  status: PantryEntryStatus;
  ingredient?: Ingredient;
  onConsume: () => void;
  onRemove: () => void;
  onAdjust: (value: number) => void;
}) {
  const entry = status.entry;
  const color = status.status === "scaduto" ? "text-aura-pink" : status.status === "in-scadenza" ? "text-aura-amber" : "text-ink-600";
  const hasQuantity = entry.initialQuantity !== undefined && entry.remainingQuantity !== undefined;
  const unitLabel = ingredient?.unit === "altro" ? ingredient.unitLabel ?? "unità" : ingredient?.unit ?? "";
  const pct = hasQuantity ? Math.min(100, Math.round((entry.remainingQuantity! / entry.initialQuantity!) * 100)) : null;
  const [adjusting, setAdjusting] = useState(false);

  return (
    <div className="rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm text-ink-100">{status.ingredientName}</p>
          <p className={`mt-0.5 text-[11px] ${color}`}>
            {statusLabel(status)}
            {status.expiryDate && ` · ${formatDateShort(status.expiryDate)}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {hasQuantity && (
            <button onClick={() => setAdjusting(true)} className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-ink-400 hover:border-aura-cyan/50" aria-label="Correggi quantità">
              <Pencil size={12} />
            </button>
          )}
          <button onClick={onConsume} className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-aura-emerald/50" aria-label="Segna come consumato">
            <Check size={13} />
          </button>
          <button onClick={onRemove} className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-ink-800 hover:border-aura-pink/50 hover:text-aura-pink" aria-label="Rimuovi">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {hasQuantity && pct !== null && (
        <div className="mt-2.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: pct <= 20 ? "#FF6B9D" : "#7C5CFF" }}
            />
          </div>
          <p className="mt-1 text-[10px] text-ink-800">
            {entry.remainingQuantity} / {entry.initialQuantity} {unitLabel} residui
          </p>
        </div>
      )}

      {adjusting && (
        <AdjustQuantitySheet
          unitLabel={unitLabel}
          current={entry.remainingQuantity!}
          onSave={onAdjust}
          onClose={() => setAdjusting(false)}
        />
      )}
    </div>
  );
}

export default function DispensaPage() {
  const router = useRouter();
  const { hydrated, entries, ingredients, pantryEntries, markPantryEntryConsumed, removePantryEntry, adjustPantryQuantity } = useFood();
  const { mergeShoppingListItems } = useNotes();
  const [adding, setAdding] = useState(false);
  const [choosingListDestination, setChoosingListDestination] = useState(false);
  const [creatingShoppingTask, setCreatingShoppingTask] = useState(false);
  const today = todayIso();

  const statuses = useMemo(() => pantryEntryStatuses(pantryEntries, ingredients, today), [pantryEntries, ingredients, today]);
  const expiringOrOverdue = statuses.filter((s) => s.status === "in-scadenza" || s.status === "scaduto");
  const fresh = statuses.filter((s) => s.status === "fresco");
  const withoutExpiry = statuses.filter((s) => s.status === "senza-scadenza");

  const computedItems = useMemo(() => generateShoppingList(entries, ingredients, pantryEntries, today), [entries, ingredients, pantryEntries, today]);

  const sendToNotes = () => {
    const listId = mergeShoppingListItems(SHOPPING_LIST_TITLE, computedItems.map(formatShoppingListItem));
    setChoosingListDestination(false);
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
        Segna cosa hai comprato e quando — scrivi anche la scadenza stampata sulla confezione
        per essere avvisato quando si avvicina.
      </p>

      <button
        onClick={() => setChoosingListDestination(true)}
        className="focus-ring mt-4 flex w-full items-center justify-center gap-2 rounded-xl2 border border-aura-cyan/30 bg-aura-cyan/[0.06] py-3 text-sm text-ink-100 transition hover:border-aura-cyan/60"
      >
        <ShoppingCart size={15} className="text-aura-cyan" /> Genera lista della spesa dal menù
      </button>
      <p className="mt-1.5 text-[11px] text-ink-800">
        Guarda i 7 giorni di menù passati e i 7 successivi rispetto a oggi.
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
                    ingredient={ingredients.find((i) => i.id === s.entry.ingredientId)}
                    onConsume={() => markPantryEntryConsumed(s.entry.id, today)}
                    onRemove={() => removePantryEntry(s.entry.id)}
                    onAdjust={(value) => adjustPantryQuantity(s.entry.id, value)}
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
                    ingredient={ingredients.find((i) => i.id === s.entry.ingredientId)}
                    onConsume={() => markPantryEntryConsumed(s.entry.id, today)}
                    onRemove={() => removePantryEntry(s.entry.id)}
                    onAdjust={(value) => adjustPantryQuantity(s.entry.id, value)}
                  />
                ))}
              </div>
            </div>
          )}
          {withoutExpiry.length > 0 && (
            <div>
              <p className="mb-2.5 font-display text-sm text-ink-100">Senza scadenza registrata</p>
              <div className="space-y-1.5">
                {withoutExpiry.map((s) => (
                  <PantryRow
                    key={s.entry.id}
                    status={s}
                    ingredient={ingredients.find((i) => i.id === s.entry.ingredientId)}
                    onConsume={() => markPantryEntryConsumed(s.entry.id, today)}
                    onRemove={() => removePantryEntry(s.entry.id)}
                    onAdjust={(value) => adjustPantryQuantity(s.entry.id, value)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {adding && <AddPantryEntryModal onClose={() => setAdding(false)} />}

      {choosingListDestination && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center" onClick={() => setChoosingListDestination(false)}>
          <div
            className="glass-strong w-full max-w-sm rounded-t-xl3 p-6 pb-[max(env(safe-area-inset-bottom),24px)] sm:rounded-xl3"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1 font-display text-lg text-ink-100">Dove vuoi la lista?</p>
            <p className="mb-5 text-xs text-ink-600">
              {computedItems.length} {computedItems.length === 1 ? "articolo" : "articoli"} calcolati dal menù degli ultimi e prossimi 7 giorni.
            </p>
            <div className="space-y-2.5">
              <button
                onClick={sendToNotes}
                className="focus-ring flex w-full items-center gap-3 rounded-xl2 border border-white/10 bg-white/[0.02] px-4 py-3.5 text-left transition hover:border-aura-cyan/50"
              >
                <StickyNote size={18} className="text-aura-cyan" />
                <span>
                  <span className="block text-sm text-ink-100">Lista in &quot;Liste e note&quot;</span>
                  <span className="block text-[11px] text-ink-800">Si aggiorna, quello già spuntato resta</span>
                </span>
              </button>
              <button
                onClick={() => {
                  setChoosingListDestination(false);
                  setCreatingShoppingTask(true);
                }}
                className="focus-ring flex w-full items-center gap-3 rounded-xl2 border border-white/10 bg-white/[0.02] px-4 py-3.5 text-left transition hover:border-aura-violet/50"
              >
                <ListChecks size={18} className="text-aura-violet" />
                <span>
                  <span className="block text-sm text-ink-100">Nuova task &quot;Spesa&quot;</span>
                  <span className="block text-[11px] text-ink-800">Scegli solo nome e quando — la lista è già pronta</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {creatingShoppingTask && (
        <NewTaskModal
          onClose={() => setCreatingShoppingTask(false)}
          initialDraft={{
            title: "Spesa",
            type: "spesa",
            shoppingList: computedItems.map((item) => ({ id: newId(), label: formatShoppingListItem(item), done: false })),
          }}
        />
      )}
    </div>
  );
}
