"use client";
import { useState } from "react";
import { useHousehold } from "@/lib/household-context";
import { LibraryItem } from "@/lib/hobby-types";
import { formatDateShort } from "@/lib/date-format";
import { ItemDetailSheet, DetailField } from "../ui/ItemDetailSheet";
import { StarDisplay } from "./StarRating";
import { LibraryItemModal } from "./LibraryItemModal";

const STATUS_LABEL: Record<string, string> = {
  "da-provare": "Da provare",
  "in-corso": "In corso",
  completato: "Completato",
  abbandonato: "Abbandonato",
};

/**
 * Corretto secondo le istruzioni: il tocco su una voce della Libreria apriva direttamente il
 * wizard di modifica (LibraryItemModal) — niente modo di limitarsi a guardare la copertina o
 * rileggere la recensione senza finire dentro un modulo di campi editabili, e la recensione
 * comunque non era mai leggibile per intero lì dentro (un `<textarea>` di poche righe). Ora il
 * tocco apre questa vetrina: la copertina mostrata per intero (mai ritagliata, `PhotoGallery`
 * con `object-contain`), i campi sotto in sola lettura, la recensione per intero senza alcun
 * taglio, e la matita in alto per chi vuole davvero modificare.
 *
 * Lo stato "sto modificando" vive QUI, non nel genitore (LibraryBlockView) — stesso principio
 * già in uso in WishlistItemSheet/PlaceWindow/TaskWindow: chiudere il wizard deve riportare a
 * questa vetrina (ormai aggiornata), non scaraventare l'utente indietro alla griglia. Se lo
 * stato vivesse nel genitore, chiudere il wizard significherebbe perdere anche la vetrina.
 */
export function LibraryItemDetail({
  hobbyId,
  blockId,
  item,
  onClose,
}: {
  hobbyId: string;
  blockId: string;
  item: LibraryItem;
  onClose: () => void;
}) {
  const { people } = useHousehold();
  const [editing, setEditing] = useState(false);
  const recommendedBy = item.recommendedByPersonId ? people.find((p) => p.id === item.recommendedByPersonId) : undefined;

  if (editing) {
    return <LibraryItemModal hobbyId={hobbyId} blockId={blockId} item={item} onClose={() => setEditing(false)} />;
  }

  return (
    <ItemDetailSheet title={item.title} photoKeys={item.photoKey ? [item.photoKey] : []} onEdit={() => setEditing(true)} onClose={onClose}>
      <DetailField label="Stato" value={STATUS_LABEL[item.status]} />
      <div className="grid grid-cols-2 gap-3">
        <DetailField label="Autore/creatore" value={item.creator} />
        <DetailField label="Genere" value={item.genre} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DetailField label="Iniziato il" value={item.startedDate ? formatDateShort(item.startedDate) : undefined} />
        <DetailField label="Completato il" value={item.completedDate ? formatDateShort(item.completedDate) : undefined} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DetailField label="Lunghezza" value={item.length} />
        <DetailField label="Volte riletto/riguardato" value={item.rewatchCount > 0 ? item.rewatchCount : undefined} />
      </div>
      {item.rating && <DetailField label="Voto" value={<StarDisplay value={item.rating} size={15} />} />}
      <DetailField label="Consigliato da" value={recommendedBy ? `${recommendedBy.firstName} ${recommendedBy.lastName}`.trim() : undefined} />
      {item.review && (
        <DetailField
          label="Recensione"
          value={<p className="whitespace-pre-wrap break-words">{item.review}</p>}
        />
      )}
    </ItemDetailSheet>
  );
}
