"use client";
import { useState } from "react";
import { Check, ChevronDown, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useHobby } from "@/lib/hobby-context";
import { ConfirmDialog } from "../ui/ConfirmDialog";

export function BlockHeader({
  hobbyId,
  blockId,
  title,
  subtitle,
  extra,
  collapsed,
  onToggleCollapsed,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: {
  hobbyId: string;
  blockId: string;
  title: string;
  subtitle?: string;
  /** Un'azione in più a destra, specifica del tipo di blocco (es. "+" per una nuova voce). */
  extra?: React.ReactNode;
  /** A tendina: se il blocco è chiuso o aperto adesso — chi possiede lo stato vero è
   * HobbyBlockCard (il genitore comune a tutti i tipi di blocco), qui arriva solo per
   * disegnare la freccina nel verso giusto. */
  collapsed: boolean;
  onToggleCollapsed: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { renameBlock, removeBlock } = useHobby();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = () => {
    if (draft.trim()) renameBlock(hobbyId, blockId, draft.trim());
    setEditing(false);
  };

  return (
    <div className="mb-3 flex items-start justify-between gap-2">
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="focus-ring rounded-lg border border-aura-violet/40 bg-white/[0.05] px-2 py-1 text-sm text-ink-100"
          />
          <button onClick={save} className="focus-ring text-aura-emerald" aria-label="Conferma">
            <Check size={14} />
          </button>
        </div>
      ) : (
        // A tendina: l'intera zona titolo/sottotitolo apre e chiude il blocco, non solo la
        // freccina — un bersaglio piccolo da solo sarebbe scomodo da toccare con precisione.
        <button onClick={onToggleCollapsed} className="focus-ring flex min-w-0 items-start gap-1.5 text-left">
          <ChevronDown size={14} className={`mt-0.5 shrink-0 text-ink-800 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
          <div className="min-w-0">
            <p className="truncate font-display text-sm text-ink-100">{title}</p>
            {subtitle && <p className="text-[11px] text-ink-600">{subtitle}</p>}
          </div>
        </button>
      )}
      <div className="flex shrink-0 items-center gap-2">
        {extra}
        {!editing && (
          <>
            <button onClick={onMoveUp} disabled={!canMoveUp} className="focus-ring text-ink-800 hover:text-ink-200 disabled:opacity-25" aria-label="Sposta su">
              <ArrowUp size={13} />
            </button>
            <button onClick={onMoveDown} disabled={!canMoveDown} className="focus-ring text-ink-800 hover:text-ink-200 disabled:opacity-25" aria-label="Sposta giù">
              <ArrowDown size={13} />
            </button>
            <button
              onClick={() => {
                setDraft(title);
                setEditing(true);
              }}
              className="focus-ring text-ink-800 hover:text-ink-200"
              aria-label="Rinomina blocco"
            >
              <Pencil size={13} />
            </button>
          </>
        )}
        <button onClick={() => setConfirmDelete(true)} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label="Elimina blocco">
          <Trash2 size={13} />
        </button>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminare questo blocco?"
          description="Tutti i suoi contenuti andranno persi. L'azione non si può annullare."
          onConfirm={() => {
            removeBlock(hobbyId, blockId);
            setConfirmDelete(false);
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
