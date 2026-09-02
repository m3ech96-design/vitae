"use client";
import { useState } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";
import { useHobby } from "@/lib/hobby-context";
import { ConfirmDialog } from "../ui/ConfirmDialog";

export function BlockHeader({
  hobbyId,
  blockId,
  title,
  subtitle,
  extra,
}: {
  hobbyId: string;
  blockId: string;
  title: string;
  subtitle?: string;
  /** Un'azione in più a destra, specifica del tipo di blocco (es. "+" per una nuova voce). */
  extra?: React.ReactNode;
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
        <div className="min-w-0">
          <p className="truncate font-display text-sm text-ink-100">{title}</p>
          {subtitle && <p className="text-[11px] text-ink-600">{subtitle}</p>}
        </div>
      )}
      <div className="flex shrink-0 items-center gap-2">
        {extra}
        {!editing && (
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
