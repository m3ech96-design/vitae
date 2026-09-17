"use client";
import { useState } from "react";
import { Project } from "@/lib/hobby-types";
import { formatDateShort, formatMinutesDuration } from "@/lib/date-format";
import { ItemDetailSheet, DetailField } from "../ui/ItemDetailSheet";
import { StarDisplay } from "./StarRating";
import { ProjectModal } from "./ProjectModal";

const STATUS_LABEL: Record<string, string> = {
  idea: "Idea",
  "in-corso": "In corso",
  "in-pausa": "In pausa",
  finito: "Finito",
  abbandonato: "Abbandonato",
};
const DESTINATION_LABEL: Record<string, string> = {
  "per-te": "Per te",
  regalo: "Regalo",
  "in-vendita": "In vendita",
};

/** Stesso principio di LibraryItemDetail/InventoryItemDetail, applicato a un Progetto — il
 * tocco apriva direttamente il wizard di modifica, con le foto prima/durante/dopo ritagliate
 * a un quadratino e le note/riflessioni tagliate a poche righe. Lo stato di modifica vive
 * qui, non nel genitore: chiudere il wizard riporta a questa vetrina aggiornata. */
export function ProjectDetail({
  hobbyId,
  blockId,
  project,
  onClose,
}: {
  hobbyId: string;
  blockId: string;
  project: Project;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const totalCost = project.materials.reduce((s, m) => s + m.cost, 0);

  if (editing) {
    return <ProjectModal hobbyId={hobbyId} blockId={blockId} project={project} onClose={() => setEditing(false)} />;
  }

  return (
    <ItemDetailSheet title={project.name} photoKeys={project.photoKeys} onEdit={() => setEditing(true)} onClose={onClose}>
      <DetailField label="Stato" value={STATUS_LABEL[project.status]} />
      <div className="grid grid-cols-2 gap-3">
        <DetailField label="Iniziato il" value={project.startedDate ? formatDateShort(project.startedDate) : undefined} />
        <DetailField label="Finito il" value={project.finishedDate ? formatDateShort(project.finishedDate) : undefined} />
      </div>
      <DetailField label="Tempo impiegato" value={project.timeSpentMinutes ? formatMinutesDuration(project.timeSpentMinutes) : undefined} />

      {project.materials.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-600">
            Materiali {totalCost > 0 && <span className="text-ink-800">· {totalCost.toLocaleString("it-IT")}€ totale</span>}
          </p>
          {project.materials.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.015] px-3.5 py-2 text-sm">
              <span className="text-ink-100">{m.name}</span>
              <span className="text-ink-600">{m.cost}€</span>
            </div>
          ))}
        </div>
      )}

      {project.difficulty && <DetailField label="Difficoltà" value={<StarDisplay value={project.difficulty} size={15} />} />}
      {project.inspirationUrl && (
        <DetailField
          label="Fonte/ispirazione"
          value={
            <a href={project.inspirationUrl} target="_blank" rel="noreferrer" className="break-all text-aura-cyan hover:underline">
              {project.inspirationUrl}
            </a>
          }
        />
      )}
      <DetailField label="Destinazione" value={project.destination ? DESTINATION_LABEL[project.destination] : undefined} />
      {project.rating && <DetailField label="Voto sul risultato" value={<StarDisplay value={project.rating} size={15} />} />}
      {project.note && <DetailField label="Note/riflessioni" value={<p className="whitespace-pre-wrap break-words">{project.note}</p>} />}
    </ItemDetailSheet>
  );
}
