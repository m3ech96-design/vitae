"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useNotes } from "@/lib/notes-context";
import { formatExactMoment } from "@/lib/date-format";
import { TextArea } from "@/components/ui/TextField";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { NoteListItemRow } from "@/components/notes/NoteListItemRow";

export default function NoteEntryDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const {
    hydrated,
    entries,
    renameEntry,
    removeEntry,
    updateNoteBody,
    addListItem,
    updateListItem,
    removeListItem,
    moveListItem,
  } = useNotes();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  const entry = entries.find((e) => e.id === params.id);

  // Il testo della nota si scrive in un <textarea> non controllato da un draft separato: la
  // stessa istanza del componente resta montata per tutta l'apertura della pagina, quindi
  // basta uno stato locale inizializzato una volta sola (vedi useEffect qui sotto) invece di
  // salvare a ogni tasto — un salvataggio a ogni carattere sovraccaricherebbe localStorage
  // inutilmente, un debounce basta e avanza per una nota personale.
  const [bodyDraft, setBodyDraft] = useState("");
  useEffect(() => {
    if (entry?.kind === "note") setBodyDraft(entry.body);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.id]);

  useEffect(() => {
    if (entry?.kind !== "note") return;
    const id = setTimeout(() => {
      if (bodyDraft !== entry.body) updateNoteBody(entry.id, bodyDraft);
    }, 500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyDraft, entry?.id]);

  if (!hydrated) return null;

  if (!entry) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-ink-600">Questo elemento non esiste più.</p>
        <button onClick={() => router.push("/liste-note")} className="focus-ring mt-4 text-sm text-aura-cyan">
          Torna a Liste e note
        </button>
      </div>
    );
  }

  const saveTitle = () => {
    if (titleDraft.trim()) renameEntry(entry.id, titleDraft.trim());
    setEditingTitle(false);
  };

  const submitNewItem = () => {
    if (!newItemText.trim() || entry.kind !== "list") return;
    addListItem(entry.id, newItemText.trim());
    setNewItemText("");
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/liste-note")}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-aura-violet/50"
          aria-label="Torna a Liste e note"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          {!editingTitle && (
            <button
              onClick={() => {
                setTitleDraft(entry.title);
                setEditingTitle(true);
              }}
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-aura-violet/50"
              aria-label="Rinomina"
            >
              <Pencil size={14} />
            </button>
          )}
          <button
            onClick={() => setConfirmDelete(true)}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-aura-pink/50"
            aria-label="Elimina"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {editingTitle ? (
        <div className="mt-4 flex items-center gap-1.5">
          <input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && saveTitle()}
            className="focus-ring min-w-0 flex-1 rounded-xl2 border border-aura-violet/40 bg-white/[0.05] px-3 py-2 font-display text-xl text-ink-100"
          />
          <button onClick={saveTitle} className="focus-ring text-aura-emerald" aria-label="Conferma">
            <Check size={18} />
          </button>
        </div>
      ) : (
        <h1 className="mt-4 font-display text-2xl text-ink-100">{entry.title}</h1>
      )}
      <p className="mt-1 text-xs text-ink-800">Aggiornato il {formatExactMoment(entry.updatedAt)}</p>

      {entry.kind === "note" ? (
        <div className="mt-6">
          <TextArea
            value={bodyDraft}
            onChange={(e) => setBodyDraft(e.target.value)}
            placeholder="Scrivi qui..."
            className="min-h-[50vh]"
          />
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex items-center gap-1.5">
            <input
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitNewItem()}
              placeholder="Aggiungi una voce..."
              className="focus-ring min-w-0 flex-1 rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-ink-100 placeholder:text-ink-800"
            />
            <button
              onClick={submitNewItem}
              className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-xl2 bg-aura-gradient text-void-950"
              aria-label="Aggiungi voce"
            >
              <Plus size={17} />
            </button>
          </div>

          {entry.items.length === 0 ? (
            <p className="mt-8 text-center text-sm text-ink-600">Nessuna voce ancora. Aggiungine una qui sopra.</p>
          ) : (
            <div className="mt-4 space-y-1.5">
              {entry.items.map((item, index) => (
                <NoteListItemRow
                  key={item.id}
                  item={item}
                  isFirst={index === 0}
                  isLast={index === entry.items.length - 1}
                  onToggle={() => updateListItem(entry.id, item.id, { done: !item.done })}
                  onMoveUp={() => moveListItem(entry.id, item.id, "up")}
                  onMoveDown={() => moveListItem(entry.id, item.id, "down")}
                  onRemove={() => removeListItem(entry.id, item.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={entry.kind === "list" ? "Eliminare questa lista?" : "Eliminare questa nota?"}
          description="L'azione non si può annullare."
          onConfirm={() => {
            removeEntry(entry.id);
            router.push("/liste-note");
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
