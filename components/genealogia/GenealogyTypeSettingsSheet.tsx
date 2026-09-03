"use client";
import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { useGenealogy } from "@/lib/genealogy-context";
import { GenealogyLayoutRole, GenealogyRelationshipType } from "@/lib/genealogy-relationship-types";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { PersonalCardSheet } from "../home/PersonalCardSheet";

const ROLE_LABELS: Record<GenealogyLayoutRole, string> = {
  ascendant: "Ascendente (sopra)",
  descendant: "Discendente (sotto)",
  sibling: "Fratello (di fianco)",
  partner: "Partner (di fianco)",
  other: "Altro (vicino, non espanso)",
};

function TypeEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: { label: string; layoutRole: GenealogyLayoutRole; visualEmphasis?: "adoptive" };
  onSave: (v: { label: string; layoutRole: GenealogyLayoutRole; visualEmphasis?: "adoptive" }) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [layoutRole, setLayoutRole] = useState<GenealogyLayoutRole>(initial?.layoutRole ?? "other");
  const [adoptive, setAdoptive] = useState(initial?.visualEmphasis === "adoptive");

  return (
    <div className="space-y-3 rounded-xl2 border border-white/10 bg-white/[0.03] p-3.5">
      <TextField label="Nome del tipo" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Es. Madrina" />
      <label className="block">
        <span className="mb-1.5 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">
          Dove disegnarlo nell&apos;albero
        </span>
        <select
          value={layoutRole}
          onChange={(e) => setLayoutRole(e.target.value as GenealogyLayoutRole)}
          className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100"
        >
          {(Object.keys(ROLE_LABELS) as GenealogyLayoutRole[]).map((r) => (
            <option key={r} value={r} className="bg-void-800">{ROLE_LABELS[r]}</option>
          ))}
        </select>
        <span className="mt-1.5 block text-[11px] text-ink-800">
          Decide solo dove appare il nodo nell&apos;albero — mai il testo di una relazione, che resta sempre quello scritto a mano.
        </span>
      </label>
      <label className="flex items-center justify-between rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3">
        <span className="text-sm text-ink-100">Disegna la linea tratteggiata (relazione adottiva)</span>
        <input type="checkbox" checked={adoptive} onChange={(e) => setAdoptive(e.target.checked)} className="h-4 w-4 accent-aura-cyan" />
      </label>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 justify-center" onClick={onCancel}>Annulla</Button>
        <Button
          className="flex-1 justify-center"
          disabled={!label.trim()}
          onClick={() => onSave({ label: label.trim(), layoutRole, visualEmphasis: adoptive ? "adoptive" : undefined })}
        >
          Salva
        </Button>
      </div>
    </div>
  );
}

function TypeRow({
  type,
  hidden,
  onToggleHidden,
  onEdit,
  onDelete,
}: {
  type: GenealogyRelationshipType;
  hidden: boolean;
  onToggleHidden?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 ${hidden ? "opacity-50" : ""}`}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink-100">{type.label}</p>
        <p className="truncate text-[10px] text-ink-800">{ROLE_LABELS[type.layoutRole]}</p>
      </div>
      {onEdit && (
        <button onClick={onEdit} className="focus-ring shrink-0 text-ink-600 hover:text-ink-200" aria-label="Modifica tipo">
          <Pencil size={13} />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="focus-ring shrink-0 text-ink-600 hover:text-aura-pink" aria-label="Elimina tipo">
          <Trash2 size={13} />
        </button>
      )}
      {onToggleHidden && (
        <button onClick={onToggleHidden} className="focus-ring shrink-0 text-ink-600 hover:text-ink-200" aria-label={hidden ? "Mostra tipo" : "Nascondi tipo"}>
          {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      )}
    </div>
  );
}

/**
 * Il catalogo dei tipi di parentela, gestibile dall'interfaccia — la parte "estendibile senza
 * riscrivere il database o la logica" richiesta: un nuovo tipo qui è solo un'aggiunta a un
 * elenco, mai una modifica al codice. I tipi di serie non si eliminano (romperebbe le
 * relazioni che li usano già) ma si possono nascondere dal selettore; un tipo personalizzato
 * si elimina per davvero, ma solo se nessuna relazione lo usa più.
 */
export function GenealogyTypeSettingsSheet({ onClose }: { onClose: () => void }) {
  const { allTypes, hiddenBuiltInIds, addCustomType, updateCustomType, removeCustomType, setBuiltInTypeHidden } = useGenealogy();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [blockedDeleteId, setBlockedDeleteId] = useState<string | null>(null);

  const builtIns = allTypes.filter((t) => t.builtIn);
  const customs = allTypes.filter((t) => !t.builtIn);

  return (
    <PersonalCardSheet title="Impostazioni albero" onClose={onClose}>
      <div className="space-y-6">
        <div>
          <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Tipi personalizzati</p>
          <div className="space-y-2">
            {customs.length === 0 && <p className="text-xs text-ink-800">Nessuno ancora.</p>}
            {customs.map((t) =>
              editingId === t.id ? (
                <TypeEditor
                  key={t.id}
                  initial={t}
                  onCancel={() => setEditingId(null)}
                  onSave={(v) => {
                    updateCustomType(t.id, v);
                    setEditingId(null);
                  }}
                />
              ) : (
                <TypeRow
                  key={t.id}
                  type={t}
                  hidden={false}
                  onEdit={() => setEditingId(t.id)}
                  onDelete={() => {
                    if (!removeCustomType(t.id)) setBlockedDeleteId(t.id);
                  }}
                />
              )
            )}
          </div>
          {blockedDeleteId && (
            <p className="mt-2 text-[11px] text-aura-amber">
              Questo tipo è usato in almeno una relazione — rimuovi prima quella relazione per poterlo eliminare.
            </p>
          )}

          {creating ? (
            <div className="mt-2">
              <TypeEditor
                onCancel={() => setCreating(false)}
                onSave={(v) => {
                  addCustomType(v);
                  setCreating(false);
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="focus-ring mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-aura-cyan hover:border-aura-cyan/50"
            >
              <Plus size={13} /> Crea un tipo personalizzato
            </button>
          )}
        </div>

        <div>
          <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Tipi di serie</p>
          <p className="mb-2 text-[11px] text-ink-800">
            Nascondine qualcuno se non ti serve mai — resta comunque leggibile in una relazione già salvata che lo usa.
          </p>
          <div className="space-y-2">
            {builtIns.map((t) => (
              <TypeRow
                key={t.id}
                type={t}
                hidden={hiddenBuiltInIds.includes(t.id)}
                onToggleHidden={() => setBuiltInTypeHidden(t.id, !hiddenBuiltInIds.includes(t.id))}
              />
            ))}
          </div>
        </div>
      </div>
    </PersonalCardSheet>
  );
}
