"use client";
import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useHobby } from "@/lib/hobby-context";
import { usePlaces } from "@/lib/places-context";
import { useHousehold } from "@/lib/household-context";
import { ChecklistItem, ChecklistStatus, Priority } from "@/lib/hobby-types";
import { todayIso } from "@/lib/date-format";
import { TextField, TextArea } from "../ui/TextField";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { TagListField } from "../wizard/TagListField";
import { MultiPhotoPicker } from "./MultiPhotoPicker";
import { StarRating } from "./StarRating";
import { MultiPersonPicker } from "../ui/MultiPersonPicker";

const STATUS_OPTIONS: { id: ChecklistStatus; label: string }[] = [
  { id: "da-fare", label: "Da fare" },
  { id: "in-corso", label: "In corso" },
  { id: "fatta", label: "Fatta" },
];
const PRIORITY_OPTIONS: { id: Priority; label: string }[] = [
  { id: "bassa", label: "Bassa" },
  { id: "media", label: "Media" },
  { id: "alta", label: "Alta" },
];

export function ChecklistItemModal({
  hobbyId,
  blockId,
  item,
  onClose,
}: {
  hobbyId: string;
  blockId: string;
  item?: ChecklistItem;
  onClose: () => void;
}) {
  const { addChecklistItem, updateChecklistItem, removeChecklistItem } = useHobby();
  const { places } = usePlaces();
  const { people } = useHousehold();

  const [title, setTitle] = useState(item?.title ?? "");
  const [status, setStatus] = useState<ChecklistStatus>(item?.status ?? "da-fare");
  const [priority, setPriority] = useState<Priority | undefined>(item?.priority);
  const [dueDate, setDueDate] = useState(item?.dueDate ?? "");
  const [completedDate, setCompletedDate] = useState(item?.completedDate ?? "");
  const [durationMinutes, setDurationMinutes] = useState(item?.durationMinutes ? String(item.durationMinutes) : "");
  const [difficulty, setDifficulty] = useState<number | undefined>(item?.difficulty);
  const [satisfaction, setSatisfaction] = useState<number | undefined>(item?.satisfaction);
  const [note, setNote] = useState(item?.note ?? "");
  const [photoKeys, setPhotoKeys] = useState<string[]>(item?.photoKeys ?? []);
  const [placeId, setPlaceId] = useState(item?.placeId ?? "");
  const [personIds, setPersonIds] = useState<string[]>(item?.personIds ?? []);
  const [tags, setTags] = useState<string[]>(item?.tags ?? []);

  const canSave = title.trim().length > 0;

  const onStatusChange = (s: ChecklistStatus) => {
    setStatus(s);
    if (s === "fatta" && !completedDate) setCompletedDate(todayIso());
  };

  const submit = () => {
    if (!canSave) return;
    const payload = {
      title: title.trim(),
      status,
      priority,
      dueDate: dueDate || undefined,
      completedDate: completedDate || undefined,
      durationMinutes: durationMinutes ? Math.max(0, parseInt(durationMinutes, 10)) : undefined,
      difficulty,
      satisfaction,
      note: note.trim() || undefined,
      photoKeys,
      placeId: placeId || undefined,
      personIds,
      tags,
    };
    if (item) updateChecklistItem(hobbyId, blockId, item.id, payload);
    else addChecklistItem(hobbyId, blockId, payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[92vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">{item ? "Modifica attività" : "Nuova attività"}</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <TextField label="Titolo" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Cosa vuoi fare" />

          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Stato</p>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((o) => (
                <Chip key={o.id} label={o.label} selected={status === o.id} onClick={() => onStatusChange(o.id)} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Priorità</p>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((o) => (
                <Chip key={o.id} label={o.label} selected={priority === o.id} onClick={() => setPriority(priority === o.id ? undefined : o.id)} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Prevista per" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <TextField label="Completata il" type="date" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} />
          </div>

          <TextField label="Durata (minuti)" type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />

          <div className="grid grid-cols-2 gap-4">
            <StarRating label="Difficoltà" value={difficulty} onChange={setDifficulty} />
            <StarRating label="Soddisfazione" value={satisfaction} onChange={setSatisfaction} />
          </div>

          <TextArea label="Note" value={note} onChange={(e) => setNote(e.target.value)} />

          <MultiPhotoPicker label="Foto" photoKeys={photoKeys} onChange={setPhotoKeys} />

          <label className="block">
            <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">Luogo</span>
            <select
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100"
            >
              <option value="" className="bg-void-800">Nessuno</option>
              {places.map((p) => (
                <option key={p.id} value={p.id} className="bg-void-800">{p.name}</option>
              ))}
            </select>
          </label>

          <MultiPersonPicker label="Con chi" values={personIds} options={people} onChange={setPersonIds} />

          <TagListField label="Tag" tags={tags} onChange={setTags} placeholder="Aggiungi..." />
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <div className="flex gap-2">
            {item && (
              <Button
                variant="danger"
                onClick={() => {
                  removeChecklistItem(hobbyId, blockId, item.id);
                  onClose();
                }}
                aria-label="Elimina"
              >
                <Trash2 size={16} />
              </Button>
            )}
            <Button className="flex-1 justify-center" onClick={submit} disabled={!canSave}>
              {item ? "Salva modifiche" : "Aggiungi"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
