"use client";
import { useState } from "react";
import { useHousehold } from "@/lib/household-context";
import { usePlaces } from "@/lib/places-context";
import { ChecklistItem } from "@/lib/hobby-types";
import { formatDateShort, formatMinutesDuration } from "@/lib/date-format";
import { ItemDetailSheet, DetailField } from "../ui/ItemDetailSheet";
import { StarDisplay } from "./StarRating";
import { ChecklistItemModal } from "./ChecklistItemModal";

const STATUS_LABEL: Record<string, string> = {
  "da-fare": "Da fare",
  "in-corso": "In corso",
  fatta: "Fatta",
};
const PRIORITY_LABEL: Record<string, string> = { bassa: "Bassa", media: "Media", alta: "Alta" };

/** Stesso principio degli altri blocchi Hobby, applicato a una voce di Checklist — il tocco
 * apriva direttamente il wizard di modifica, con le foto e le note tagliate a poche righe.
 * Lo stato di modifica vive qui, non nel genitore: chiudere il wizard riporta a questa
 * vetrina aggiornata. */
export function ChecklistItemDetail({
  hobbyId,
  blockId,
  item,
  onClose,
}: {
  hobbyId: string;
  blockId: string;
  item: ChecklistItem;
  onClose: () => void;
}) {
  const { people } = useHousehold();
  const { places } = usePlaces();
  const [editing, setEditing] = useState(false);
  const place = item.placeId ? places.find((p) => p.id === item.placeId) : undefined;
  const withPeople = item.personIds
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => `${p.firstName} ${p.lastName}`.trim())
    .join(", ");

  if (editing) {
    return <ChecklistItemModal hobbyId={hobbyId} blockId={blockId} item={item} onClose={() => setEditing(false)} />;
  }

  return (
    <ItemDetailSheet title={item.title} photoKeys={item.photoKeys} onEdit={() => setEditing(true)} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <DetailField label="Stato" value={STATUS_LABEL[item.status]} />
        <DetailField label="Priorità" value={item.priority ? PRIORITY_LABEL[item.priority] : undefined} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DetailField label="Prevista per" value={item.dueDate ? formatDateShort(item.dueDate) : undefined} />
        <DetailField label="Completata il" value={item.completedDate ? formatDateShort(item.completedDate) : undefined} />
      </div>
      <DetailField label="Durata" value={item.durationMinutes ? formatMinutesDuration(item.durationMinutes) : undefined} />
      <div className="grid grid-cols-2 gap-3">
        {item.difficulty && <DetailField label="Difficoltà" value={<StarDisplay value={item.difficulty} size={15} />} />}
        {item.satisfaction && <DetailField label="Soddisfazione" value={<StarDisplay value={item.satisfaction} size={15} />} />}
      </div>
      <DetailField label="Luogo" value={place?.name} />
      <DetailField label="Con chi" value={withPeople || undefined} />
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((t) => (
            <span key={t} className="rounded-full bg-white/[0.05] px-2 py-1 text-[11px] text-ink-300">{t}</span>
          ))}
        </div>
      )}
      {item.note && <DetailField label="Note" value={<p className="whitespace-pre-wrap break-words">{item.note}</p>} />}
    </ItemDetailSheet>
  );
}
