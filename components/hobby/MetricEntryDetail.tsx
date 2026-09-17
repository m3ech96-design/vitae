"use client";
import { useState } from "react";
import { usePlaces } from "@/lib/places-context";
import { MetricBlock, MetricEntry } from "@/lib/hobby-types";
import { formatDateShort, formatMinutesDuration } from "@/lib/date-format";
import { ItemDetailSheet, DetailField } from "../ui/ItemDetailSheet";
import { MetricEntryModal } from "./MetricEntryModal";

/** Stesso principio degli altri blocchi Hobby, applicato a una voce di Metrica — il tocco
 * su una pillola apriva direttamente il wizard di modifica, con la foto ed eventuale nota
 * mai consultabili se non dentro il modulo di modifica. Lo stato di modifica vive qui, non
 * nel genitore: chiudere il wizard riporta a questa vetrina aggiornata. */
export function MetricEntryDetail({
  hobbyId,
  hobbyName,
  block,
  entry,
  onClose,
}: {
  hobbyId: string;
  hobbyName: string;
  block: MetricBlock;
  entry: MetricEntry;
  onClose: () => void;
}) {
  const { places } = usePlaces();
  const [editing, setEditing] = useState(false);
  const place = entry.placeId ? places.find((p) => p.id === entry.placeId) : undefined;
  const valueLabel = block.isTimeBased ? formatMinutesDuration(entry.value) : `${entry.value} ${block.unit}`;

  if (editing) {
    return <MetricEntryModal hobbyId={hobbyId} hobbyName={hobbyName} block={block} entry={entry} onClose={() => setEditing(false)} />;
  }

  return (
    <ItemDetailSheet
      title={`${valueLabel} · ${formatDateShort(entry.date)}`}
      photoKeys={entry.photoKey ? [entry.photoKey] : []}
      onEdit={() => setEditing(true)}
      onClose={onClose}
    >
      <div className="grid grid-cols-2 gap-3">
        <DetailField label="Valore" value={valueLabel} />
        <DetailField label="Data" value={formatDateShort(entry.date)} />
      </div>
      <DetailField label="Luogo" value={place?.name} />
      {entry.note && <DetailField label="Nota" value={<p className="whitespace-pre-wrap break-words">{entry.note}</p>} />}
    </ItemDetailSheet>
  );
}
