"use client";
import { useState } from "react";
import { useHousehold } from "@/lib/household-context";
import { usePlaces } from "@/lib/places-context";
import { Match } from "@/lib/hobby-types";
import { formatDateShort, formatMinutesDuration } from "@/lib/date-format";
import { ItemDetailSheet, DetailField } from "../ui/ItemDetailSheet";
import { MatchModal } from "./MatchModal";

const RESULT_LABEL: Record<string, string> = { vittoria: "Vittoria", sconfitta: "Sconfitta", pareggio: "Pareggio" };
const RESULT_COLOR: Record<string, string> = { vittoria: "#34D399", sconfitta: "#FF6B9D", pareggio: "#FFB454" };

/** Stesso principio degli altri blocchi Hobby, applicato a una Partita — anche qui il tocco
 * apriva direttamente il wizard di modifica, con la foto/screenshot e le note tattiche mai
 * consultabili senza finire in un modulo di campi editabili. Lo stato di modifica vive qui,
 * non nel genitore: chiudere il wizard riporta a questa vetrina aggiornata. */
export function MatchDetail({
  hobbyId,
  blockId,
  match,
  onClose,
}: {
  hobbyId: string;
  blockId: string;
  match: Match;
  onClose: () => void;
}) {
  const { people } = useHousehold();
  const { places } = usePlaces();
  const [editing, setEditing] = useState(false);
  const opponentPerson = match.opponentPersonId ? people.find((p) => p.id === match.opponentPersonId) : undefined;
  const place = match.placeId ? places.find((pl) => pl.id === match.placeId) : undefined;
  const title = match.opponent || match.competition || formatDateShort(match.date);

  if (editing) {
    return <MatchModal hobbyId={hobbyId} blockId={blockId} match={match} onClose={() => setEditing(false)} />;
  }

  return (
    <ItemDetailSheet title={title} photoKeys={match.photoKey ? [match.photoKey] : []} onEdit={() => setEditing(true)} onClose={onClose}>
      <DetailField
        label="Risultato"
        value={<span style={{ color: RESULT_COLOR[match.result] }}>{RESULT_LABEL[match.result]}</span>}
      />
      <div className="grid grid-cols-2 gap-3">
        <DetailField label="Data" value={formatDateShort(match.date)} />
        <DetailField label="Punteggio" value={match.score} />
      </div>
      <DetailField label="Avversario" value={opponentPerson ? `${opponentPerson.firstName} ${opponentPerson.lastName}`.trim() : match.opponent} />
      <DetailField label="Torneo/competizione" value={match.competition} />
      <DetailField label="Luogo" value={place?.name} />
      <div className="grid grid-cols-2 gap-3">
        <DetailField label="Ruolo" value={match.role} />
        <DetailField label="Durata" value={match.durationMinutes ? formatMinutesDuration(match.durationMinutes) : undefined} />
      </div>
      {match.note && <DetailField label="Note tattiche" value={<p className="whitespace-pre-wrap break-words">{match.note}</p>} />}
    </ItemDetailSheet>
  );
}
